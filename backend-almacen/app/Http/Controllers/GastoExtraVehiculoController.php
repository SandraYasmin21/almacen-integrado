<?php

namespace App\Http\Controllers;

use App\Models\GastoExtraVehiculo;
use App\Models\VehiculoFlotilla;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class GastoExtraVehiculoController extends Controller
{
    /**
     * 1. Listar todos los gastos extra.
     * GET /api/flotilla/gastos-extra
     */
    public function index(Request $request): JsonResponse
    {
        $query = GastoExtraVehiculo::with('vehiculo:id,nombre,placa,numero')
            ->orderBy('fecha', 'desc');

        // Filtro opcional por vehículo
        if ($request->filled('vehiculo_id')) {
            $query->where('vehiculo_id', (int) $request->vehiculo_id);
        }

        return response()->json($query->get());
    }

    /**
     * 2. Registrar un gasto extra.
     * POST /api/flotilla/gastos-extra
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'vehiculo_id'   => 'required|integer|exists:vehiculos_flotilla,id',
            'fecha'         => 'required|date',
            'tipo'          => 'required|string|max:260',
            'costo'         => 'required|numeric|min:0',
            'observaciones' => 'nullable|string',
        ]);

        // Sanitizar campos de texto libre
        $validated['tipo'] = strip_tags(trim($validated['tipo']));
        if (isset($validated['observaciones'])) {
            $validated['observaciones'] = strip_tags(trim($validated['observaciones']));
        }

        $gasto = GastoExtraVehiculo::create($validated);

        return response()->json([
            'mensaje' => 'Gasto extra registrado exitosamente',
            'gasto'   => $gasto->load('vehiculo:id,nombre,placa'),
        ], 201);
    }

    /**
     * 3. Ver detalle de un gasto extra.
     * GET /api/flotilla/gastos-extra/{id}
     */
    public function show(int $id): JsonResponse
    {
        $gasto = GastoExtraVehiculo::with('vehiculo')->findOrFail($id);
        return response()->json($gasto);
    }

    /**
     * 4. Actualizar un gasto extra.
     * PUT /api/flotilla/gastos-extra/{id}
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $gasto = GastoExtraVehiculo::findOrFail($id);

        $validated = $request->validate([
            'fecha'         => 'sometimes|date',
            'tipo'          => 'sometimes|string|max:260',
            'costo'         => 'sometimes|numeric|min:0',
            'observaciones' => 'nullable|string',
        ]);

        // Sanitizar campos de texto libre
        foreach (['tipo', 'observaciones'] as $campo) {
            if (isset($validated[$campo])) {
                $validated[$campo] = strip_tags(trim($validated[$campo]));
            }
        }

        $gasto->update($validated);

        return response()->json([
            'mensaje' => 'Gasto extra actualizado',
            'gasto'   => $gasto,
        ]);
    }

    /**
     * 5. Eliminar un gasto extra.
     * DELETE /api/flotilla/gastos-extra/{id}
     */
    public function destroy(int $id): JsonResponse
    {
        $gasto = GastoExtraVehiculo::findOrFail($id);
        $gasto->delete();

        return response()->json([
            'mensaje' => 'Gasto extra eliminado',
        ]);
    }
}
