<?php

namespace App\Http\Controllers;

use App\Models\RegistroVehicular;
use App\Models\VehiculoFlotilla;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class RegistroVehicularController extends Controller
{
    /**
     * 1. Listar todos los registros (con datos del vehículo).
     * GET /api/flotilla/registros
     */
    public function index(Request $request): JsonResponse
    {
        $query = RegistroVehicular::with('vehiculo:id,nombre,placa,numero')
            ->orderBy('fecha', 'desc');

        // Filtro opcional por vehículo
        if ($request->filled('vehiculo_id')) {
            $query->where('vehiculo_id', (int) $request->vehiculo_id);
        }

        // Filtro opcional por tipo
        if ($request->filled('tipo')) {
            $query->where('tipo', $request->tipo);
        }

        return response()->json($query->get());
    }

    /**
     * 2. Registrar un nuevo mantenimiento o lectura.
     * POST /api/flotilla/registros
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'vehiculo_id'       => 'required|integer|exists:vehiculos_flotilla,id',
            'niv'               => 'nullable|string|max:100',
            'placas'            => 'nullable|string|max:30',
            'fecha'             => 'required|date',
            'tipo'              => 'required|in:preventivo,correctivo,lectura',
            'detalle_falla'     => 'nullable|string',
            'kilometraje'       => 'required|numeric|min:0',
            'costo'             => 'nullable|numeric|min:0',
            'tipo_mantenimiento' => 'nullable|string|max:150',
        ]);

        // Sanitizar campos de texto libre
        if (isset($validated['detalle_falla'])) {
            $validated['detalle_falla'] = strip_tags(trim($validated['detalle_falla']));
        }
        if (isset($validated['tipo_mantenimiento'])) {
            $validated['tipo_mantenimiento'] = strip_tags(trim($validated['tipo_mantenimiento']));
        }

        // Autorellenar nombre del vehículo desde el catálogo
        $vehiculo = VehiculoFlotilla::findOrFail($validated['vehiculo_id']);
        $validated['nombre_vehiculo'] = $vehiculo->nombre;

        // Si no se proporcionaron placas, usar las del catálogo
        if (empty($validated['placas'])) {
            $validated['placas'] = $vehiculo->placa;
        }

        // Si no se proporcionó NIV, usar el número de serie del catálogo
        if (empty($validated['niv'])) {
            $validated['niv'] = $vehiculo->numero_serie;
        }

        $validated['costo'] = $validated['costo'] ?? 0;

        $registro = RegistroVehicular::create($validated);

        return response()->json([
            'mensaje'  => 'Registro vehicular guardado exitosamente',
            'registro' => $registro->load('vehiculo:id,nombre,placa'),
        ], 201);
    }

    /**
     * 3. Ver detalle de un registro.
     * GET /api/flotilla/registros/{id}
     */
    public function show(int $id): JsonResponse
    {
        $registro = RegistroVehicular::with('vehiculo')->findOrFail($id);
        return response()->json($registro);
    }

    /**
     * 4. Actualizar un registro vehicular.
     * PUT /api/flotilla/registros/{id}
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $registro = RegistroVehicular::findOrFail($id);

        $validated = $request->validate([
            'fecha'              => 'sometimes|date',
            'tipo'               => 'sometimes|in:preventivo,correctivo,lectura',
            'detalle_falla'      => 'nullable|string',
            'kilometraje'        => 'sometimes|numeric|min:0',
            'costo'              => 'nullable|numeric|min:0',
            'tipo_mantenimiento' => 'nullable|string|max:150',
        ]);

        // Sanitizar campos de texto libre
        foreach (['detalle_falla', 'tipo_mantenimiento'] as $campo) {
            if (isset($validated[$campo])) {
                $validated[$campo] = strip_tags(trim($validated[$campo]));
            }
        }

        $registro->update($validated);

        return response()->json([
            'mensaje'  => 'Registro vehicular actualizado',
            'registro' => $registro,
        ]);
    }

    /**
     * 5. Eliminar un registro vehicular.
     * DELETE /api/flotilla/registros/{id}
     */
    public function destroy(int $id): JsonResponse
    {
        $registro = RegistroVehicular::findOrFail($id);
        $registro->delete();

        return response()->json([
            'mensaje' => 'Registro vehicular eliminado',
        ]);
    }
}
