<?php

namespace App\Http\Controllers;

use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * KioscoOperacionesController — Operaciones reales desde el Kiosco
 *
 * Todas las rutas requieren middleware 'kiosco.auth'
 *
 * POST  /api/kiosco/salida-prestamo  → Registrar préstamo
 * POST  /api/kiosco/devolucion       → Devolver préstamo
 * POST  /api/kiosco/resguardo        → Asignación con firma digital
 * POST  /api/kiosco/salida-vehiculo  → Salida de vehículo en bitácora
 * POST  /api/kiosco/regreso-vehiculo → Regreso de vehículo en bitácora
 * GET   /api/kiosco/mis-prestamos    → Préstamos activos del empleado
 */
class KioscoOperacionesController extends Controller
{
    public function miVehiculo(Request $request): JsonResponse
    {
        $empleado = $request->attributes->get('kiosco_empleado');

        $bitacoraActiva = DB::table('bitacora_vehiculos as b')
            ->join('vehiculos_flotilla as v', 'b.vehiculo_id', '=', 'v.id')
            ->where('b.empleado_id', $empleado->id)
            ->whereNull('b.fecha_hora_regreso')
            ->whereNull('b.deleted_at')
            ->whereNull('v.deleted_at')
            ->select(
                'v.id',
                'v.codigo_vehiculo',
                'v.nombre',
                'v.marca',
                'v.modelo',
                'v.anio',
                'v.placa',
                'v.placas',
                'v.kilometraje_actual',
                'v.estado',
                'b.id as bitacora_id',
                'b.km_inicial',
                'b.fecha_hora_salida'
            )
            ->orderByDesc('b.id')
            ->first();

        if ($bitacoraActiva) {
            return response()->json([
                'vehiculo' => $bitacoraActiva,
                'estado_operacion' => 'en_ruta',
            ]);
        }

        $vehiculo = DB::table('vehiculos_flotilla')
            ->where('responsable_id', $empleado->id)
            ->whereNull('deleted_at')
            ->select('id', 'codigo_vehiculo', 'nombre', 'marca', 'modelo', 'anio', 'placa', 'placas', 'kilometraje_actual', 'estado')
            ->orderBy('nombre')
            ->first();

        if (! $vehiculo) {
            return response()->json([
                'vehiculo' => null,
                'estado_operacion' => 'sin_asignacion',
                'mensaje' => 'No tienes un vehiculo asignado.',
            ]);
        }

        return response()->json([
            'vehiculo' => $vehiculo,
            'estado_operacion' => 'disponible',
        ]);
    }

    public function buscarSku(string $codigo): JsonResponse
    {
        $codigo = strtoupper(trim($codigo));

        $serie = DB::table('inventario_series as s')
            ->join('catalogo_articulos as ca', 's.articulo_id', '=', 'ca.id')
            ->leftJoin('stock_general as sg', 'ca.id', '=', 'sg.articulo_id')
            ->whereRaw('UPPER(s.codigo_interno_generado) = ?', [$codigo])
            ->whereNull('s.deleted_at')
            ->whereNull('ca.deleted_at')
            ->select(
                'ca.id as articulo_id',
                'ca.nombre as articulo',
                'ca.modelo',
                'ca.unidad_medida',
                'ca.es_consumible',
                's.id as serie_id',
                's.codigo_interno_generado as sku',
                's.numero_serie_fabricante',
                's.estado',
                DB::raw("'serie' as tipo_codigo"),
                DB::raw('COALESCE(sg.cantidad, 0) as stock')
            )
            ->first();

        if ($serie) {
            if (strtoupper((string) $serie->estado) !== 'DISPONIBLE') {
                return response()->json(['error' => 'La serie no esta disponible.'], 422);
            }

            return response()->json(['data' => $serie]);
        }

        if (Schema::hasColumn('catalogo_articulos', 'sku_maestro')) {
            $articulo = DB::table('catalogo_articulos as ca')
                ->leftJoin('stock_general as sg', 'ca.id', '=', 'sg.articulo_id')
                ->whereRaw('UPPER(ca.sku_maestro) = ?', [$codigo])
                ->whereNull('ca.deleted_at')
                ->select(
                    'ca.id as articulo_id',
                    'ca.sku_maestro as sku',
                    'ca.nombre as articulo',
                    'ca.modelo',
                    'ca.unidad_medida',
                    'ca.es_consumible',
                    DB::raw("'maestro' as tipo_codigo"),
                    DB::raw('COALESCE(sg.cantidad, 0) as stock')
                )
                ->first();

            if ($articulo && (bool) $articulo->es_consumible) {
                if ((float) $articulo->stock <= 0) {
                    return response()->json(['error' => 'No hay stock disponible.'], 422);
                }

                return response()->json(['data' => $articulo]);
            }
        }

        return response()->json(['error' => 'SKU no encontrado.'], 404);
    }

    /**
     * POST /api/kiosco/salida-prestamo
     * Registra salida tipo préstamo desde el kiosco.
     */
    public function registrarSalidaPrestamo(Request $request): JsonResponse
    {
        $request->validate([
            'articulo_id' => 'required|integer|exists:catalogo_articulos,id',
            'cantidad'    => 'required|integer|min:1',
            'serie_id'    => 'nullable|integer|exists:inventario_series,id',
        ]);

        $empleado = $request->attributes->get('kiosco_empleado');

        $ahora = Carbon::now();

        $movimientoId = DB::table('movimiento_inventario')->insertGetId([
            'tipo_movimiento' => 'prestamo',
            'tipo'            => 'prestamo',
            'empleado_id'     => $empleado->id,
            'notas'           => 'Registrado desde Kiosco',
            'fecha_hora'      => $ahora,
            'created_at'      => $ahora,
            'updated_at'      => $ahora,
        ]);

        DB::table('detalle_movimiento')->insert([
            'movimiento_id' => $movimientoId,
            'articulo_id'   => $request->articulo_id,
            'serie_id'      => $request->serie_id,
            'cantidad'      => $request->cantidad,
            'created_at'    => $ahora,
            'updated_at'    => $ahora,
        ]);

        // Si viene con serie_id, registrar asignación
        if ($request->filled('serie_id')) {
            DB::table('asignaciones_activos')->insert([
                'empleado_id'     => $empleado->id,
                'serie_id'        => $request->serie_id,
                'fecha_entrega'   => $ahora,
                'notas_estado_fisico' => 'Entregado via Kiosco',
                'created_at'      => $ahora,
                'updated_at'      => $ahora,
            ]);

            // Actualizar estado de la serie
            DB::table('inventario_series')
                ->where('id', $request->serie_id)
                ->update(['estado' => 'ASIGNADO', 'updated_at' => $ahora]);
        } else {
            // Consumible: descontar de stock
            DB::table('stock_general')
                ->where('articulo_id', $request->articulo_id)
                ->decrement('cantidad', $request->cantidad);
        }

        return response()->json([
            'mensaje'       => 'Préstamo registrado exitosamente',
            'movimiento_id' => $movimientoId,
        ], 201);
    }

    /**
     * POST /api/kiosco/devolucion
     * Devuelve una serie asignada al empleado.
     */
    public function registrarDevolucionPrestamo(Request $request): JsonResponse
    {
        $request->validate([
            'asignacion_id'  => 'required|integer|exists:asignaciones_activos,id',
            'condicion'      => 'nullable|string|max:60',
            'observaciones'  => 'nullable|string|max:500',
        ]);

        $empleado = $request->attributes->get('kiosco_empleado');

        $asignacion = DB::table('asignaciones_activos')
            ->where('id', $request->asignacion_id)
            ->where('empleado_id', $empleado->id)
            ->whereNull('fecha_devolucion')
            ->first();

        if (! $asignacion) {
            return response()->json([
                'error' => 'Asignación no encontrada o ya devuelta.',
            ], 404);
        }

        $ahora = Carbon::now();

        DB::table('asignaciones_activos')
            ->where('id', $asignacion->id)
            ->update([
                'fecha_devolucion'     => $ahora,
                'condicion_devolucion' => strip_tags(trim($request->condicion ?? 'bueno')),
                'notas_estado_fisico'  => strip_tags(trim($request->observaciones ?? '')),
                'updated_at'           => $ahora,
            ]);

        // Retornar serie a DISPONIBLE
        if ($asignacion->serie_id) {
            DB::table('inventario_series')
                ->where('id', $asignacion->serie_id)
                ->update(['estado' => 'DISPONIBLE', 'updated_at' => $ahora]);
        }

        // Registrar movimiento de devolución
        $movimientoId = DB::table('movimiento_inventario')->insertGetId([
            'tipo_movimiento' => 'devolucion',
            'tipo'            => 'devolucion',
            'empleado_id'     => $empleado->id,
            'notas'           => strip_tags(trim($request->observaciones ?? 'Devuelto via Kiosco')),
            'fecha_hora'      => $ahora,
            'created_at'      => $ahora,
            'updated_at'      => $ahora,
        ]);

        DB::table('detalle_movimiento')->insert([
            'movimiento_id'      => $movimientoId,
            'articulo_id'        => DB::table('inventario_series')
                ->where('id', $asignacion->serie_id)
                ->value('articulo_id'),
            'serie_id'           => $asignacion->serie_id,
            'cantidad'           => 1,
            'estado_devolucion'  => $request->condicion ?? 'bueno',
            'created_at'         => $ahora,
            'updated_at'         => $ahora,
        ]);

        return response()->json([
            'mensaje'       => 'Devolución registrada exitosamente',
            'movimiento_id' => $movimientoId,
        ]);
    }

    /**
     * POST /api/kiosco/resguardo
     * Asignación formal con firma digital (base64 canvas).
     */
    public function registrarResguardoFirma(Request $request): JsonResponse
    {
        $request->validate([
            'serie_id'      => 'required|integer|exists:inventario_series,id',
            'firma_digital' => 'required|string',     // Base64 PNG del canvas
            'condicion'     => 'nullable|string|max:60',
            'observaciones' => 'nullable|string|max:500',
        ]);

        $empleado = $request->attributes->get('kiosco_empleado');

        // Verificar que la serie esté disponible
        $serie = DB::table('inventario_series')
            ->where('id', $request->serie_id)
            ->where('estado', 'DISPONIBLE')
            ->first();

        if (! $serie) {
            return response()->json([
                'error' => 'La serie no está disponible para asignación.',
            ], 422);
        }

        $ahora = Carbon::now();

        // Verificar tamaño razonable de firma (max 2MB en base64 ≈ 2.7M chars)
        if (strlen($request->firma_digital) > 2_800_000) {
            return response()->json(['error' => 'La firma digital es demasiado grande.'], 422);
        }

        $folioAsignacion = sprintf('ASG-%06d-%s', $empleado->id, now()->format('YmdHis'));

        DB::table('asignaciones_activos')->insert([
            'folio'               => $folioAsignacion,
            'empleado_id'         => $empleado->id,
            'serie_id'            => $request->serie_id,
            'fecha_entrega'       => $ahora,
            'notas_estado_fisico' => strip_tags(trim($request->observaciones ?? '')),
            'firma_digital'       => $request->firma_digital,
            'condicion_entrega'   => strip_tags(trim($request->condicion ?? 'bueno')),
            'created_at'          => $ahora,
            'updated_at'          => $ahora,
        ]);

        // Cambiar estado a ASIGNADO
        DB::table('inventario_series')
            ->where('id', $request->serie_id)
            ->update(['estado' => 'ASIGNADO', 'updated_at' => $ahora]);

        return response()->json([
            'mensaje' => 'Resguardo con firma digital registrado exitosamente',
            'folio'   => $folioAsignacion,
        ], 201);
    }

    /**
     * POST /api/kiosco/salida-vehiculo
     * Registra salida de vehículo en bitácora real.
     */
    public function salidaVehiculo(Request $request): JsonResponse
    {
        $request->validate([
            'vehiculo_id'        => 'required|integer|exists:vehiculos_flotilla,id',
            'km_inicial'         => 'required|numeric|min:0',
            'motivo_viaje'       => 'nullable|string|max:255',
        ]);

        $empleado = $request->attributes->get('kiosco_empleado');
        $ahora    = Carbon::now();

        // Verificar que el vehículo no tenga una salida sin regreso
        $enRuta = DB::table('bitacora_vehiculos')
            ->where('vehiculo_id', $request->vehiculo_id)
            ->whereNull('fecha_hora_regreso')
            ->exists();

        if ($enRuta) {
            return response()->json([
                'error' => 'Este vehículo ya tiene una salida registrada sin regreso.',
            ], 422);
        }

        $bitacoraId = DB::table('bitacora_vehiculos')->insertGetId([
            'vehiculo_id'       => $request->vehiculo_id,
            'empleado_id'       => $empleado->id,
            'fecha_hora_salida' => $ahora,
            'fecha_salida'      => $ahora,
            'km_inicial'        => $request->km_inicial,
            'motivo_viaje'      => strip_tags(trim($request->motivo_viaje ?? 'Uso operativo')),
            'motivo_uso'        => strip_tags(trim($request->motivo_viaje ?? 'Uso operativo')),
            'created_at'        => $ahora,
            'updated_at'        => $ahora,
        ]);

        // Actualizar estado y kilometraje del vehículo
        DB::table('vehiculos_flotilla')
            ->where('id', $request->vehiculo_id)
            ->update([
                'estado'                  => 'ASIGNADO',
                'kilometraje_actual'      => $request->km_inicial,
                'ultima_actualizacion_km' => $ahora,
                'updated_at'              => $ahora,
            ]);

        return response()->json([
            'mensaje'      => 'Salida de vehículo registrada exitosamente',
            'bitacora_id'  => $bitacoraId,
        ], 201);
    }

    /**
     * POST /api/kiosco/regreso-vehiculo
     * Registra regreso de vehículo en bitácora real.
     */
    public function regresoVehiculo(Request $request): JsonResponse
    {
        $request->validate([
            'vehiculo_id'           => 'required|integer|exists:vehiculos_flotilla,id',
            'km_final'              => 'required|numeric|min:0',
            'observaciones_retorno' => 'nullable|string|max:500',
        ]);

        $empleado = $request->attributes->get('kiosco_empleado');
        $ahora    = Carbon::now();

        // Buscar la bitácora de salida activa
        $bitacora = DB::table('bitacora_vehiculos')
            ->where('vehiculo_id', $request->vehiculo_id)
            ->where('empleado_id', $empleado->id)
            ->whereNull('fecha_hora_regreso')
            ->orderByDesc('id')
            ->first();

        if (! $bitacora) {
            return response()->json([
                'error' => 'No se encontró una salida activa para este vehículo y empleado.',
            ], 404);
        }

        if ($request->km_final < $bitacora->km_inicial) {
            return response()->json([
                'error' => "El KM final ({$request->km_final}) no puede ser menor al KM inicial ({$bitacora->km_inicial}).",
            ], 422);
        }

        DB::table('bitacora_vehiculos')
            ->where('id', $bitacora->id)
            ->update([
                'fecha_hora_regreso'    => $ahora,
                'fecha_regreso'         => $ahora,
                'km_final'              => $request->km_final,
                'observaciones_retorno' => strip_tags(trim($request->observaciones_retorno ?? '')),
                'updated_at'            => $ahora,
            ]);

        // Actualizar vehículo: estado DISPONIBLE + km actualizados
        DB::table('vehiculos_flotilla')
            ->where('id', $request->vehiculo_id)
            ->update([
                'estado'                  => 'DISPONIBLE',
                'kilometraje_actual'      => $request->km_final,
                'ultima_actualizacion_km' => $ahora,
                'updated_at'              => $ahora,
            ]);

        $kmRecorridos = $request->km_final - $bitacora->km_inicial;

        return response()->json([
            'mensaje'       => 'Regreso de vehículo registrado exitosamente',
            'km_recorridos' => $kmRecorridos,
        ]);
    }

    /**
     * GET /api/kiosco/mis-prestamos
     * Lista los préstamos activos (sin devolución) del empleado autenticado.
     */
    public function misPrestamos(Request $request): JsonResponse
    {
        $empleado = $request->attributes->get('kiosco_empleado');

        $prestamos = DB::table('asignaciones_activos as aa')
            ->join('inventario_series as s', 'aa.serie_id', '=', 's.id')
            ->join('catalogo_articulos as ca', 's.articulo_id', '=', 'ca.id')
            ->where('aa.empleado_id', $empleado->id)
            ->whereNull('aa.fecha_devolucion')
            ->whereNull('aa.deleted_at')
            ->select(
                'aa.id as asignacion_id',
                'aa.folio',
                'aa.fecha_entrega',
                'aa.condicion_entrega',
                'ca.nombre as articulo',
                's.codigo_interno_generado as codigo_serie',
                's.numero_serie_fabricante as serie_fabricante',
            )
            ->orderByDesc('aa.fecha_entrega')
            ->get();

        return response()->json([
            'empleado'  => $empleado->nombre_completo ?? $empleado->nombre,
            'prestamos' => $prestamos,
            'total'     => $prestamos->count(),
        ]);
    }
}
