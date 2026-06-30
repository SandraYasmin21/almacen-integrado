<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;
use Carbon\Carbon;

class EmpleadoController extends Controller
{
    public function apiIndex()
    {
        $empleadosQuery = DB::table('empleados')
            ->select('id', 'nombre_completo', 'departamento_area', 'numero_gafete')
            ->orderBy('nombre_completo');

        if (Schema::hasColumn('empleados', 'activo')) {
            $empleadosQuery->where('activo', true);
        }

        $empleados = $empleadosQuery->get();
        $empleadoIds = $empleados->pluck('id');

        $resguardos = DB::table('asignaciones_activos as aa')
            ->join('inventario_series as serie', 'aa.serie_id', '=', 'serie.id')
            ->join('catalogo_articulos as ca', 'serie.articulo_id', '=', 'ca.id')
            ->whereNull('aa.fecha_devolucion')
            ->whereIn('aa.empleado_id', $empleadoIds)
            ->select(
                'aa.empleado_id',
                'aa.fecha_entrega',
                'ca.nombre as articulo',
                'serie.codigo_interno_generado',
                Schema::hasColumn('inventario_series', 'proposito_uso')
                    ? 'serie.proposito_uso'
                    : DB::raw('null as proposito_uso')
            )
            ->orderByDesc('aa.fecha_entrega')
            ->get()
            ->groupBy('empleado_id');

        $tipoMovimientoColumn = Schema::hasColumn('movimiento_inventario', 'tipo')
            ? 'tipo'
            : 'tipo_movimiento';

        $prestamosHerramientas = DB::table('movimiento_inventario as mi')
            ->leftJoin('detalle_movimiento as dm', 'mi.id', '=', 'dm.movimiento_id')
            ->leftJoin('catalogo_articulos as ca', 'dm.articulo_id', '=', 'ca.id')
            ->leftJoin('inventario_series as serie', 'dm.serie_id', '=', 'serie.id')
            ->where(function ($query) use ($tipoMovimientoColumn) {
                $query->where("mi.{$tipoMovimientoColumn}", 'prestamo')
                    ->orWhere(function ($demoQuery) use ($tipoMovimientoColumn) {
                        $demoQuery->where("mi.{$tipoMovimientoColumn}", 'SALIDA')
                            ->where('mi.notas', 'like', '[DEMO_PRESTAMO]%');
                    });
            })
            ->whereIn('mi.empleado_id', $empleadoIds)
            ->select(
                'mi.empleado_id',
                'mi.fecha_hora',
                'mi.notas',
                DB::raw('COALESCE(ca.nombre, serie.codigo_interno_generado, \'Activo sin nombre\') as item')
            )
            ->orderByDesc('mi.fecha_hora')
            ->get()
            ->groupBy('empleado_id');

        $fechaSalidaVehiculoColumn = Schema::hasColumn('bitacora_vehiculos', 'fecha_hora_salida')
            ? 'fecha_hora_salida'
            : 'fecha_salida';
        $fechaRegresoVehiculoColumn = Schema::hasColumn('bitacora_vehiculos', 'fecha_hora_regreso')
            ? 'fecha_hora_regreso'
            : 'fecha_regreso';
        $motivoVehiculoColumn = Schema::hasColumn('bitacora_vehiculos', 'motivo_viaje')
            ? 'motivo_viaje'
            : 'motivo_uso';
        $placaVehiculoColumn = Schema::hasColumn('vehiculos_flotilla', 'placa')
            ? 'placa'
            : 'placas';

        $vehiculos = DB::table('bitacora_vehiculos as bv')
            ->join('vehiculos_flotilla as vf', 'bv.vehiculo_id', '=', 'vf.id')
            ->whereNull("bv.{$fechaRegresoVehiculoColumn}")
            ->whereIn('bv.empleado_id', $empleadoIds)
            ->select(
                'bv.empleado_id',
                DB::raw("bv.{$fechaSalidaVehiculoColumn} as fecha_hora_salida"),
                DB::raw("bv.{$motivoVehiculoColumn} as motivo_viaje"),
                'vf.nombre',
                DB::raw("vf.{$placaVehiculoColumn} as placa")
            )
            ->orderByDesc("bv.{$fechaSalidaVehiculoColumn}")
            ->get()
            ->groupBy('empleado_id');

        $data = $empleados->map(function ($empleado) use ($resguardos, $prestamosHerramientas, $vehiculos) {
            $fijos = $resguardos->get($empleado->id, collect())->values();
            $prestamos = $prestamosHerramientas->get($empleado->id, collect())->values();
            $vehiculosActivos = $vehiculos->get($empleado->id, collect())->values();
            $primerPendiente = $prestamos->first() ?: $vehiculosActivos->first();
            $fechaSalida = $primerPendiente->fecha_hora ?? $primerPendiente->fecha_hora_salida ?? null;
            $minutosPrestado = $fechaSalida ? Carbon::parse($fechaSalida)->diffInMinutes(now()) : null;

            return [
                'id' => $empleado->id,
                'nombre_completo' => $empleado->nombre_completo,
                'departamento_area' => $empleado->departamento_area,
                'numero_gafete' => $empleado->numero_gafete,
                'resguardos_fijos' => $fijos->map(fn ($item) => [
                    'articulo' => $item->articulo,
                    'codigo' => $item->codigo_interno_generado,
                    'proposito' => $item->proposito_uso,
                    'fecha_entrega' => $item->fecha_entrega,
                ]),
                'prestamos_operacion' => $prestamos->map(fn ($item) => [
                    'item' => $item->item,
                    'fecha_salida' => $item->fecha_hora,
                    'notas' => $item->notas,
                ]),
                'vehiculos_operacion' => $vehiculosActivos->map(fn ($item) => [
                    'nombre' => $item->nombre,
                    'placa' => $item->placa,
                    'fecha_salida' => $item->fecha_hora_salida,
                    'motivo' => $item->motivo_viaje,
                ]),
                'resguardos_fijos_count' => $fijos->count(),
                'prestamos_activos_count' => $prestamos->count() + $vehiculosActivos->count(),
                'hora_salida' => $fechaSalida,
                'tiempo_prestado_minutos' => $minutosPrestado,
                'pendiente_critico' => $minutosPrestado !== null && $minutosPrestado >= 1440,
            ];
        });

        return response()->json([
            'data' => $data,
            'stats' => [
                'total_empleados' => $data->count(),
                'con_resguardos_fijos' => $data->where('resguardos_fijos_count', '>', 0)->count(),
                'con_prestamos_activos' => $data->where('prestamos_activos_count', '>', 0)->count(),
            ],
        ]);
    }

    public function index()
    {
        $empleados = DB::table('empleados as e')
            ->leftJoin('bitacora_vehiculos as bv', function ($j) {
                $j->on('e.id', '=', 'bv.empleado_id')->whereNull('bv.fecha_hora_regreso');
            })
            ->leftJoin('asignaciones_activos as aa', function ($j) {
                $j->on('e.id', '=', 'aa.empleado_id')->whereNull('aa.fecha_devolucion');
            })
            ->where('e.activo', true)
            ->select(
                'e.id', 'e.nombre_completo', 'e.departamento_area', 'e.numero_gafete',
                DB::raw('CASE WHEN bv.id IS NOT NULL THEN \'ocupado\' ELSE \'disponible\' END as estado'),
                'bv.motivo_viaje',
                DB::raw('COUNT(DISTINCT aa.id) as articulos_asignados')
            )
            ->groupBy('e.id','e.nombre_completo','e.departamento_area','e.numero_gafete','bv.id','bv.motivo_viaje')
            ->orderBy('e.nombre_completo')
            ->get()
            ->map(fn($e) => [
                'id'                  => $e->id,
                'nombre_completo'     => $e->nombre_completo,
                'departamento_area'   => $e->departamento_area,
                'numero_gafete'       => $e->numero_gafete,
                'estado'              => $e->estado,
                'motivo_viaje'        => $e->motivo_viaje,
                'articulos_asignados' => (int)$e->articulos_asignados,
            ]);

        $disponibles = $empleados->where('estado', 'disponible')->count();
        $ocupados    = $empleados->where('estado', 'ocupado')->count();

        return Inertia::render('Empleados/Index', [
            'empleados'   => $empleados,
            'disponibles' => $disponibles,
            'ocupados'    => $ocupados,
        ]);
    }

    public function show(int $id)
    {
        $empleado = DB::table('empleados as e')
            ->leftJoin('usuarios_sistema as u', 'e.usuario_id', '=', 'u.id')
            ->where('e.id', $id)
            ->select('e.*', 'u.nombre_usuario', 'u.email', 'u.rol_acceso')
            ->first();

        abort_if(!$empleado, 404);

        $asignaciones = DB::table('asignaciones_activos as aa')
            ->join('inventario_series as is', 'aa.serie_id', '=', 'is.id')
            ->join('catalogo_articulos as ca', 'is.articulo_id', '=', 'ca.id')
            ->where('aa.empleado_id', $id)
            ->whereNull('aa.fecha_devolucion')
            ->select('aa.*', 'ca.nombre as articulo', 'is.codigo_interno_generado')
            ->orderByDesc('aa.fecha_entrega')
            ->get();

        $bitacora = DB::table('bitacora_vehiculos as bv')
            ->join('vehiculos_flotilla as vf', 'bv.vehiculo_id', '=', 'vf.id')
            ->where('bv.empleado_id', $id)
            ->select('bv.*', 'vf.nombre as vehiculo_nombre', DB::raw("COALESCE(vf.placa, vf.placas, '') as placa"))
            ->orderByDesc('bv.fecha_hora_salida')
            ->limit(10)
            ->get();

        return Inertia::render('Empleados/Show', compact('empleado', 'asignaciones', 'bitacora'));
    }

    public function create()
    {
        $usuarios = DB::table('usuarios_sistema')->where('activo', true)->get();
        return Inertia::render('Empleados/Form', ['usuario_options' => $usuarios]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'nombre_completo'  => 'required|string|max:255',
            'departamento_area'=> 'required|string|max:255',
            'numero_gafete'    => 'nullable|string|max:50|unique:empleados',
            'usuario_id'       => 'nullable|integer|exists:usuarios_sistema,id',
        ]);

        DB::table('empleados')->insert([
            'nombre_completo'   => $request->nombre_completo,
            'departamento_area' => $request->departamento_area,
            'numero_gafete'     => $request->numero_gafete,
            'usuario_id'        => $request->usuario_id,
            'activo'            => true,
        ]);

        return redirect()->route('empleados.index')->with('success', 'Empleado registrado');
    }

    public function edit(int $id)
    {
        $empleado = DB::table('empleados')->where('id', $id)->first();
        abort_if(!$empleado, 404);
        $usuarios = DB::table('usuarios_sistema')->where('activo', true)->get();
        return Inertia::render('Empleados/Form', ['empleado' => $empleado, 'usuario_options' => $usuarios]);
    }

    public function update(Request $request, int $id)
    {
        $request->validate([
            'nombre_completo'   => 'required|string|max:255',
            'departamento_area' => 'required|string|max:255',
        ]);

        DB::table('empleados')->where('id', $id)->update([
            'nombre_completo'   => $request->nombre_completo,
            'departamento_area' => $request->departamento_area,
            'numero_gafete'     => $request->numero_gafete,
            'activo'            => $request->boolean('activo', true),
        ]);

        return redirect()->route('empleados.index')->with('success', 'Empleado actualizado');
    }

    // API: estados en tiempo real (polling desde React)
    public function estadosApi()
    {
        $estados = DB::table('empleados as e')
            ->leftJoin('bitacora_vehiculos as bv', function ($j) {
                $j->on('e.id', '=', 'bv.empleado_id')->whereNull('bv.fecha_hora_regreso');
            })
            ->where('e.activo', true)
            ->select('e.id', DB::raw('CASE WHEN bv.id IS NOT NULL THEN \'ocupado\' ELSE \'disponible\' END as estado'))
            ->get();

        return response()->json($estados);
    }
}
