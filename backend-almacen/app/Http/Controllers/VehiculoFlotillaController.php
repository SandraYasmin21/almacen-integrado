<?php

namespace App\Http\Controllers;

use App\Models\VehiculoFlotilla;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class VehiculoFlotillaController extends Controller
{
    /**
     * 1. Listar todos los vehículos (activos e inactivos).
     * GET /api/flotilla/vehiculos
     */
    public function index(): JsonResponse
    {
        $vehiculos = VehiculoFlotilla::orderBy('nombre')->get();
        return response()->json($vehiculos);
    }

    /**
     * 2. Listar solo vehículos activos (para dropdowns en otros módulos).
     * GET /api/flotilla/vehiculos/activos
     */
    public function activos(): JsonResponse
    {
        $vehiculos = VehiculoFlotilla::where('estado', 'ACTIVO')
            ->orderBy('nombre')
            ->get(['id', 'nombre', 'placa', 'modelo', 'numero']);
        return response()->json($vehiculos);
    }

    /**
     * 3. Crear un nuevo vehículo en el catálogo.
     * POST /api/flotilla/vehiculos
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'nombre'          => 'required|string|max:150',
            'modelo'          => 'required|string|max:100',
            'numero_serie'    => 'required|string|max:100',
            'tipo_vehiculo'   => 'nullable|string|max:100',
            'numero'          => 'nullable|string|max:50',
            'estado_gps'      => 'nullable|string|max:50',
            'placa'           => 'required|string|max:30|unique:vehiculos_flotilla,placa',
            'poliza_seguro'   => 'nullable|string|max:100',
            'grupo'           => 'nullable|string|max:100',
            'certificacion'   => 'nullable|string|max:100',
        ]);

        // Sanitizar inputs de texto libre
        $validated['nombre']        = strip_tags(trim($validated['nombre']));
        $validated['modelo']        = strip_tags(trim($validated['modelo']));
        $validated['numero_serie']  = strip_tags(trim($validated['numero_serie']));
        $validated['tipo_vehiculo'] = isset($validated['tipo_vehiculo']) ? strip_tags(trim($validated['tipo_vehiculo'])) : null;
        $validated['grupo']         = isset($validated['grupo']) ? strip_tags(trim($validated['grupo'])) : null;
        $validated['certificacion'] = isset($validated['certificacion']) ? strip_tags(trim($validated['certificacion'])) : null;
        $validated['estado']        = 'ACTIVO';

        $vehiculo = VehiculoFlotilla::create($validated);

        return response()->json([
            'mensaje'  => 'Vehículo registrado en el catálogo de flotilla',
            'vehiculo' => $vehiculo,
        ], 201);
    }

    /**
     * 4. Ver detalle de un vehículo con sus registros y gastos.
     * GET /api/flotilla/vehiculos/{id}
     */
    public function show(int $id): JsonResponse
    {
        $vehiculo = VehiculoFlotilla::with([
            'registrosVehiculares',
            'gastosExtra',
        ])->findOrFail($id);

        return response()->json($vehiculo);
    }

    /**
     * 5. Actualizar datos del vehículo (renovación de póliza, cambio de estado, etc.).
     * PUT /api/flotilla/vehiculos/{id}
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $vehiculo = VehiculoFlotilla::findOrFail($id);

        $validated = $request->validate([
            'nombre'        => 'sometimes|string|max:150',
            'modelo'        => 'sometimes|string|max:100',
            'numero_serie'  => 'sometimes|string|max:100',
            'tipo_vehiculo' => 'nullable|string|max:100',
            'numero'        => 'nullable|string|max:50',
            'estado_gps'    => 'nullable|string|max:50',
            'placa'         => 'sometimes|string|max:30|unique:vehiculos_flotilla,placa,' . $id,
            'poliza_seguro' => 'nullable|string|max:100',
            'grupo'         => 'nullable|string|max:100',
            'certificacion' => 'nullable|string|max:100',
            'estado'        => 'sometimes|in:ACTIVO,INACTIVO',
        ]);

        // Sanitizar campos de texto
        foreach (['nombre', 'modelo', 'numero_serie', 'tipo_vehiculo', 'grupo', 'certificacion'] as $campo) {
            if (isset($validated[$campo])) {
                $validated[$campo] = strip_tags(trim($validated[$campo]));
            }
        }

        $vehiculo->update($validated);

        return response()->json([
            'mensaje'  => 'Datos del vehículo actualizados',
            'vehiculo' => $vehiculo,
        ]);
    }

    /**
     * 6. Dar de baja un vehículo (no se elimina, se marca como INACTIVO).
     * DELETE /api/flotilla/vehiculos/{id}
     */
    public function destroy(int $id): JsonResponse
    {
        $vehiculo = VehiculoFlotilla::findOrFail($id);
        $vehiculo->update(['estado' => 'INACTIVO']);

        return response()->json([
            'mensaje' => 'Vehículo dado de baja de la flotilla',
        ]);
    }
}