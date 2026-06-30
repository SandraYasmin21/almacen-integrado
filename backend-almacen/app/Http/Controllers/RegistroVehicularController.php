<?php

namespace App\Http\Controllers;

use App\Models\RegistroVehicular;
use App\Models\VehiculoFlotilla;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Schema;

class RegistroVehicularController extends Controller
{
    /**
     * 1. Listar todos los registros (con datos del vehículo).
     * GET /api/flotilla/registros
     */
    public function index(Request $request): JsonResponse
    {
        $query = RegistroVehicular::with('vehiculo:id,nombre,placas,placa,numero')
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
            'vehiculo_id'        => 'required|integer|exists:vehiculos_flotilla,id',
            'niv'                => 'nullable|string|max:100',
            'placas'             => 'nullable|string|max:30',
            'fecha'              => 'required|date',
            'tipo'               => 'required|in:preventivo,correctivo,lectura,correctivo_mayor,reparacion',
            'detalle_falla'      => 'nullable|string',
            'notas'              => 'nullable|string',
            'evidencia_path'     => 'nullable|string|max:255',
            'kilometraje'        => 'required|numeric|min:0',
            'costo'              => 'nullable|numeric|min:0',
            'tipo_mantenimiento' => 'nullable|string|max:150',
            'taller'             => 'nullable|string|max:150',
            'fecha_inicio_reparacion' => 'nullable|date',
        ]);

        // Evidencia obligatoria para correctivos y reparaciones
        if (in_array($validated['tipo'], ['correctivo', 'correctivo_mayor', 'reparacion'])) {
            if (empty($validated['evidencia_path'])) {
                return response()->json([
                    'mensaje' => 'La evidencia es obligatoria para registros de tipo correctivo o reparación.',
                    'campo'   => 'evidencia_path',
                ], 422);
            }
        }

        // Sanitizar campos de texto libre
        foreach (['detalle_falla', 'notas', 'tipo_mantenimiento', 'taller'] as $campo) {
            if (isset($validated[$campo])) {
                $validated[$campo] = strip_tags(trim($validated[$campo]));
            }
        }

        // Autorellenar nombre del vehículo desde el catálogo
        $vehiculo = VehiculoFlotilla::findOrFail($validated['vehiculo_id']);
        $validated['nombre_vehiculo'] = $vehiculo->nombre;

        // Si no se proporcionaron placas, usar las del catálogo (compatibilidad placa/placas)
        if (empty($validated['placas'])) {
            $validated['placas'] = $vehiculo->placa ?? $vehiculo->placas;
        }

        // Si no se proporcionó NIV, usar el número de serie del catálogo
        if (empty($validated['niv'])) {
            $validated['niv'] = $vehiculo->numero_serie;
        }

        $validated['costo'] = $validated['costo'] ?? 0;
        if (Schema::hasColumn('registros_vehiculares', 'usuario_id')) {
            $validated['usuario_id'] = $request->user()?->id;
        }

        $registro = RegistroVehicular::create($validated);

        // Actualizar kilometraje y timestamp en el vehículo
        $updates = [];
        if (Schema::hasColumn('vehiculos_flotilla', 'kilometraje_actual')) {
            $updates['kilometraje_actual'] = max((float) $vehiculo->kilometraje_actual, (float) $validated['kilometraje']);
        }
        if (Schema::hasColumn('vehiculos_flotilla', 'ultima_actualizacion_km')) {
            $updates['ultima_actualizacion_km'] = now();
        }
        // Marcar vehículo EN_MANTENIMIENTO para correctivos
        if (in_array($validated['tipo'], ['correctivo', 'correctivo_mayor', 'reparacion'])) {
            $updates['estado'] = 'EN_MANTENIMIENTO';
        }
        if (! empty($updates)) {
            $vehiculo->update($updates);
        }

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
            'notas'              => 'nullable|string',
            'evidencia_path'     => 'nullable|string|max:255',
            'kilometraje'        => 'sometimes|numeric|min:0',
            'costo'              => 'nullable|numeric|min:0',
            'tipo_mantenimiento' => 'nullable|string|max:150',
        ]);

        // Sanitizar campos de texto libre
        foreach (['detalle_falla', 'notas', 'tipo_mantenimiento', 'evidencia_path'] as $campo) {
            if (isset($validated[$campo])) {
                $validated[$campo] = strip_tags(trim($validated[$campo]));
            }
        }

        $registro->update($validated);
        if (array_key_exists('kilometraje', $validated) && Schema::hasColumn('vehiculos_flotilla', 'kilometraje_actual')) {
            $registro->vehiculo?->update([
                'kilometraje_actual' => max((float) $registro->vehiculo->kilometraje_actual, (float) $validated['kilometraje']),
            ]);
        }

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
