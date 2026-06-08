<?php

namespace App\Http\Controllers;

use App\Models\BitacoraVehiculo;
use App\Models\RegistroVehicular;
use App\Models\VehiculoFlotilla;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class BitacoraViajeController extends Controller
{
    /**
     * 1. Listar todos los viajes registrados.
     * GET /api/flotilla/bitacora-viajes
     */
    public function index(Request $request): JsonResponse
    {
        $query = BitacoraVehiculo::with([
            'vehiculo:id,nombre,placa,numero',
            'empleado:id,numero_gafete,nombre_completo',
        ])->orderBy('fecha_hora_salida', 'desc');

        // Filtro opcional por vehículo
        if ($request->filled('vehiculo_id')) {
            $query->where('vehiculo_id', (int) $request->vehiculo_id);
        }

        // Filtro opcional por empleado
        if ($request->filled('empleado_id')) {
            $query->where('empleado_id', (int) $request->empleado_id);
        }

        return response()->json($query->get());
    }

    /**
     * 2. Registrar una nueva salida de vehículo.
     * El km_inicial se auto-rellena del último viaje del vehículo si no se envía.
     * POST /api/flotilla/bitacora-viajes
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'vehiculo_id'       => 'required|integer|exists:vehiculos_flotilla,id',
            'empleado_id'       => 'required|integer',
            'fecha_hora_salida' => 'required|date',
            'km_inicial'        => 'nullable|numeric|min:0',
            'motivo_viaje'      => 'required|string',
        ]);

        // Sanitizar texto libre
        $validated['motivo_viaje'] = strip_tags(trim($validated['motivo_viaje']));

        // Auto-rellenar km_inicial con la siguiente prioridad:
        // 1. km_final del último viaje completado del mismo vehículo
        // 2. kilometraje del último mantenimiento tipo 'preventivo' o 'lectura'
        // 3. 0 (vehículo sin historial)
        if (empty($validated['km_inicial'])) {
            $validated['km_inicial'] = $this->resolverKmInicial($validated['vehiculo_id']);
        }

        $viaje = BitacoraVehiculo::create($validated);

        return response()->json([
            'mensaje' => 'Salida de vehículo registrada',
            'viaje'   => $viaje->load([
                'vehiculo:id,nombre,placa',
                'empleado:id,numero_gafete,nombre_completo',
            ]),
        ], 201);
    }

    /**
     * 3. Ver detalle de un viaje.
     * GET /api/flotilla/bitacora-viajes/{id}
     */
    public function show(int $id): JsonResponse
    {
        $viaje = BitacoraVehiculo::with([
            'vehiculo',
            'empleado:id,numero_gafete,nombre_completo,departamento_area',
        ])->findOrFail($id);

        return response()->json($viaje);
    }

    /**
     * 4. Registrar el regreso del vehículo (actualizar km_final y observaciones).
     * PUT /api/flotilla/bitacora-viajes/{id}
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $viaje = BitacoraVehiculo::findOrFail($id);

        $validated = $request->validate([
            'fecha_hora_regreso'   => 'nullable|date|after:fecha_hora_salida',
            'km_final'             => 'nullable|numeric|min:0',
            'observaciones_retorno' => 'nullable|string',
            'motivo_viaje'         => 'nullable|string',
        ]);

        // Sanitizar texto libre
        foreach (['observaciones_retorno', 'motivo_viaje'] as $campo) {
            if (isset($validated[$campo])) {
                $validated[$campo] = strip_tags(trim($validated[$campo]));
            }
        }

        // Validación de negocio: el km_final no puede ser menor que km_inicial
        if (isset($validated['km_final']) && $validated['km_final'] < $viaje->km_inicial) {
            return response()->json([
                'mensaje' => 'El kilometraje final no puede ser menor al kilometraje inicial (' . $viaje->km_inicial . ' km)',
            ], 422);
        }

        $viaje->update($validated);

        return response()->json([
            'mensaje' => 'Regreso del vehículo registrado',
            'viaje'   => $viaje,
        ]);
    }

    /**
     * 5. Obtener el kilometraje inicial sugerido para un vehículo.
     * Se usa para pre-rellenar el formulario de salida.
     * GET /api/flotilla/bitacora-viajes/km-sugerido/{vehiculo_id}
     */
    public function kmSugerido(int $vehiculoId): JsonResponse
    {
        VehiculoFlotilla::findOrFail($vehiculoId);

        $kmSugerido = $this->resolverKmInicial($vehiculoId);

        return response()->json([
            'vehiculo_id' => $vehiculoId,
            'km_sugerido' => $kmSugerido,
            'fuente'      => $this->fuenteKm($vehiculoId), // indica de dónde viene el dato
        ]);
    }

    // =========================================================================
    // Métodos privados de soporte
    // =========================================================================

    /**
     * Resuelve el km inicial con 3 niveles de fallback:
     *   1. km_final del último viaje completado
     *   2. kilometraje del último mantenimiento preventivo o lectura
     *   3. 0 (sin historial)
     */
    private function resolverKmInicial(int $vehiculoId): float
    {
        // Nivel 1: km_final del último viaje completado
        $ultimoKmViaje = BitacoraVehiculo::where('vehiculo_id', $vehiculoId)
            ->whereNotNull('km_final')
            ->orderBy('fecha_hora_salida', 'desc')
            ->value('km_final');

        if ($ultimoKmViaje !== null) {
            return (float) $ultimoKmViaje;
        }

        // Nivel 2: kilometraje del último mantenimiento preventivo o lectura
        $ultimoKmMantenimiento = RegistroVehicular::where('vehiculo_id', $vehiculoId)
            ->whereIn('tipo', ['preventivo', 'lectura'])
            ->orderBy('fecha', 'desc')
            ->orderBy('kilometraje', 'desc')
            ->value('kilometraje');

        if ($ultimoKmMantenimiento !== null) {
            return (float) $ultimoKmMantenimiento;
        }

        // Nivel 3: sin historial
        return 0.0;
    }

    /**
     * Devuelve una cadena que indica de dónde viene el km sugerido.
     * Útil para que el frontend muestre un mensaje informativo al usuario.
     */
    private function fuenteKm(int $vehiculoId): string
    {
        $tieneViaje = BitacoraVehiculo::where('vehiculo_id', $vehiculoId)
            ->whereNotNull('km_final')
            ->exists();

        if ($tieneViaje) {
            return 'ultimo_viaje';
        }

        $tieneMantenimiento = RegistroVehicular::where('vehiculo_id', $vehiculoId)
            ->whereIn('tipo', ['preventivo', 'lectura'])
            ->exists();

        if ($tieneMantenimiento) {
            return 'ultimo_mantenimiento';
        }

        return 'sin_historial';
    }
}
