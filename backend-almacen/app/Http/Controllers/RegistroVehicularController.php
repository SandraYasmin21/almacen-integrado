<?php

namespace App\Http\Controllers;

use App\Models\RegistroVehicular;
use App\Models\VehiculoFlotilla;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;

class RegistroVehicularController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = RegistroVehicular::with([
                'vehiculo:id,nombre,placas,placa,numero,codigo_vehiculo',
                'usuario:id,nombre_usuario',
            ])
            ->orderByDesc('fecha');

        if ($request->filled('vehiculo_id')) {
            $query->where('vehiculo_id', (int) $request->vehiculo_id);
        }

        if ($request->filled('tipo')) {
            $query->where('tipo', $request->tipo);
        }

        return response()->json($query->get());
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'vehiculo_id'        => 'required|integer|exists:vehiculos_flotilla,id',
            'niv'                => 'nullable|string|max:100',
            'placas'             => 'nullable|string|max:30',
            'fecha'              => 'required|date',
            'tipo'               => 'required|in:preventivo,correctivo,lectura,correctivo_mayor,reparacion',
            'detalle_falla'      => 'required|string',
            'notas'              => 'nullable|string',
            'evidencia_path'     => 'nullable|string|max:255',
            'kilometraje'        => 'required|numeric|min:0',
            'costo'              => 'required|numeric|min:0',
            'tipo_mantenimiento' => 'nullable|string|max:150',
            'taller'             => 'nullable|string|max:150',
            'fecha_inicio_reparacion' => 'nullable|date',
        ]);

        foreach (['detalle_falla', 'notas', 'tipo_mantenimiento', 'taller'] as $campo) {
            if (isset($validated[$campo])) {
                $validated[$campo] = strip_tags(trim((string) $validated[$campo]));
            }
        }

        $vehiculo = VehiculoFlotilla::findOrFail($validated['vehiculo_id']);
        $validated['nombre_vehiculo'] = $vehiculo->nombre;
        $validated['placas'] = $validated['placas'] ?: ($vehiculo->placa ?? $vehiculo->placas);
        $validated['niv'] = $validated['niv'] ?: ($vehiculo->niv ?? $vehiculo->numero_serie);

        if (Schema::hasColumn('registros_vehiculares', 'usuario_id')) {
            $validated['usuario_id'] = $request->user()?->id;
        }

        $registro = RegistroVehicular::create($validated);
        $this->actualizarVehiculoDesdeRegistro($vehiculo, $validated);

        return response()->json([
            'mensaje'  => 'Registro vehicular guardado exitosamente',
            'registro' => $registro->load(['vehiculo:id,nombre,placa,placas,codigo_vehiculo', 'usuario:id,nombre_usuario']),
        ], 201);
    }

    public function show(int $id): JsonResponse
    {
        $registro = RegistroVehicular::with(['vehiculo', 'usuario:id,nombre_usuario'])->findOrFail($id);
        return response()->json($registro);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $registro = RegistroVehicular::with('vehiculo')->findOrFail($id);

        $validated = $request->validate([
            'fecha'              => 'sometimes|date',
            'tipo'               => 'sometimes|in:preventivo,correctivo,lectura,correctivo_mayor,reparacion',
            'detalle_falla'      => 'sometimes|string',
            'notas'              => 'nullable|string',
            'evidencia_path'     => 'nullable|string|max:255',
            'kilometraje'        => 'sometimes|numeric|min:0',
            'costo'              => 'sometimes|numeric|min:0',
            'tipo_mantenimiento' => 'nullable|string|max:150',
            'taller'             => 'nullable|string|max:150',
            'fecha_inicio_reparacion' => 'nullable|date',
        ]);

        foreach (['detalle_falla', 'notas', 'tipo_mantenimiento', 'taller', 'evidencia_path'] as $campo) {
            if (isset($validated[$campo])) {
                $validated[$campo] = strip_tags(trim((string) $validated[$campo]));
            }
        }

        $registro->update($validated);

        if ($registro->vehiculo && array_key_exists('kilometraje', $validated)) {
            $this->actualizarVehiculoDesdeRegistro($registro->vehiculo, [
                'kilometraje' => $validated['kilometraje'],
                'tipo' => $validated['tipo'] ?? $registro->tipo,
            ]);
        }

        return response()->json([
            'mensaje'  => 'Registro vehicular actualizado',
            'registro' => $registro->fresh(['vehiculo:id,nombre,placa,placas,codigo_vehiculo', 'usuario:id,nombre_usuario']),
        ]);
    }

    public function destroy(int $id): JsonResponse
    {
        $registro = RegistroVehicular::findOrFail($id);
        $registro->delete();

        return response()->json([
            'mensaje' => 'Registro vehicular eliminado',
        ]);
    }

    private function actualizarVehiculoDesdeRegistro(VehiculoFlotilla $vehiculo, array $registro): void
    {
        $updates = [];

        if (Schema::hasColumn('vehiculos_flotilla', 'kilometraje_actual')) {
            $updates['kilometraje_actual'] = max((float) ($vehiculo->kilometraje_actual ?? 0), (float) ($registro['kilometraje'] ?? 0));
        }

        if (Schema::hasColumn('vehiculos_flotilla', 'ultima_actualizacion_km')) {
            $updates['ultima_actualizacion_km'] = now();
        }

        if (in_array($registro['tipo'] ?? null, ['correctivo', 'correctivo_mayor', 'reparacion'], true)) {
            $updates['estado'] = 'EN_MANTENIMIENTO';
        }

        if ($updates) {
            $vehiculo->update($updates);
        }
    }
}
