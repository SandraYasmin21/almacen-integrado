<?php

namespace App\Http\Controllers;

use App\Models\VehiculoFlotilla;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class VehiculoFlotillaController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', VehiculoFlotilla::class);

        $vehiculos = VehiculoFlotilla::query()
            ->with([
                'registrosVehiculares' => fn ($query) => $query->latest('fecha')->limit(1),
                'gastosExtra',
            ])
            ->when($request->filled('q'), function ($query) use ($request) {
                $term = '%' . $request->string('q')->toString() . '%';
                $query->where(function ($inner) use ($term) {
                    $inner->where('codigo_vehiculo', 'ilike', $term)
                        ->orWhere('nombre', 'ilike', $term)
                        ->orWhere('placa', 'ilike', $term)
                        ->orWhere('placas', 'ilike', $term)
                        ->orWhere('estado', 'ilike', $term);
                });
            })
            ->when($request->filled('estatus'), fn ($query) => $query->where('estado', $request->input('estatus')))
            ->orderBy('nombre')
            ->get();

        return response()->json($vehiculos);
    }

    public function activos(): JsonResponse
    {
        $this->authorize('viewAny', VehiculoFlotilla::class);

        $vehiculos = VehiculoFlotilla::whereIn('estado', ['ACTIVO', 'DISPONIBLE'])
            ->orderBy('nombre')
            ->get(['id', 'codigo_vehiculo', 'nombre', 'placa', 'placas', 'modelo', 'numero', 'kilometraje_actual']);

        return response()->json($vehiculos);
    }

    public function store(Request $request): JsonResponse
    {
        $this->authorize('create', VehiculoFlotilla::class);

        $validated = $request->validate([
            'codigo_vehiculo' => 'nullable|string|max:40|unique:vehiculos_flotilla,codigo_vehiculo',
            'nombre' => 'required|string|max:150',
            'marca' => 'nullable|string|max:120',
            'modelo' => 'required|string|max:100',
            'anio' => 'nullable|integer|min:1950|max:2100',
            'numero_serie' => 'required|string|max:100',
            'niv' => 'nullable|string|max:120',
            'tipo_vehiculo' => 'nullable|string|max:100',
            'numero' => 'nullable|string|max:50',
            'estado_gps' => 'nullable|string|max:50',
            'placa' => 'required|string|max:30|unique:vehiculos_flotilla,placa',
            'poliza_seguro' => 'nullable|string|max:100',
            'grupo' => 'nullable|string|max:100',
            'certificacion' => 'nullable|string|max:100',
            'responsable_id' => 'nullable|integer|exists:empleados,id',
            'ubicacion_id' => 'nullable|integer|exists:ubicaciones,id',
            'kilometraje_actual' => 'nullable|numeric|min:0',
            'observaciones' => 'nullable|string',
        ]);

        $validated = $this->sanitize($validated);
        $validated['codigo_vehiculo'] = $validated['codigo_vehiculo'] ?? $this->generarCodigoVehiculo();
        $validated['niv'] = $validated['niv'] ?? $validated['numero_serie'];
        $validated['estado'] = 'DISPONIBLE';
        $validated['kilometraje_actual'] = $validated['kilometraje_actual'] ?? 0;
        $validated['placas'] = $validated['placa'];

        $vehiculo = VehiculoFlotilla::create($validated);

        return response()->json([
            'mensaje' => 'Vehiculo registrado en el catalogo de flotilla',
            'vehiculo' => $vehiculo,
        ], 201);
    }

    public function show(int $id): JsonResponse
    {
        $vehiculo = VehiculoFlotilla::with([
            'registrosVehiculares.usuario:id,nombre_usuario',
            'gastosExtra.usuario:id,nombre_usuario',
            'bitacoraViajes',
        ])->findOrFail($id);

        $this->authorize('view', $vehiculo);

        return response()->json($vehiculo);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $vehiculo = VehiculoFlotilla::findOrFail($id);
        $this->authorize('update', $vehiculo);

        $validated = $request->validate([
            'codigo_vehiculo' => 'sometimes|string|max:40|unique:vehiculos_flotilla,codigo_vehiculo,' . $id,
            'nombre' => 'sometimes|string|max:150',
            'marca' => 'nullable|string|max:120',
            'modelo' => 'sometimes|string|max:100',
            'anio' => 'nullable|integer|min:1950|max:2100',
            'numero_serie' => 'sometimes|string|max:100',
            'niv' => 'nullable|string|max:120',
            'tipo_vehiculo' => 'nullable|string|max:100',
            'numero' => 'nullable|string|max:50',
            'estado_gps' => 'nullable|string|max:50',
            'placa' => 'sometimes|string|max:30|unique:vehiculos_flotilla,placa,' . $id,
            'poliza_seguro' => 'nullable|string|max:100',
            'grupo' => 'nullable|string|max:100',
            'certificacion' => 'nullable|string|max:100',
            'estado' => 'sometimes|in:ACTIVO,INACTIVO,DISPONIBLE,ASIGNADO,EN_MANTENIMIENTO,BAJA,SINIESTRADO',
            'responsable_id' => 'nullable|integer|exists:empleados,id',
            'ubicacion_id' => 'nullable|integer|exists:ubicaciones,id',
            'kilometraje_actual' => 'nullable|numeric|min:0',
            'observaciones' => 'nullable|string',
        ]);

        $validated = $this->sanitize($validated);

        if (array_key_exists('placa', $validated)) {
            $validated['placas'] = $validated['placa'];
        }

        $vehiculo->update($validated);

        return response()->json([
            'mensaje' => 'Datos del vehiculo actualizados',
            'vehiculo' => $vehiculo->fresh(),
        ]);
    }

    public function destroy(int $id): JsonResponse
    {
        $vehiculo = VehiculoFlotilla::findOrFail($id);
        $this->authorize('delete', $vehiculo);

        $vehiculo->update(['estado' => 'BAJA']);

        return response()->json([
            'mensaje' => 'Vehiculo dado de baja de la flotilla',
        ]);
    }

    private function sanitize(array $data): array
    {
        foreach (['codigo_vehiculo', 'nombre', 'marca', 'modelo', 'numero_serie', 'niv', 'tipo_vehiculo', 'numero', 'estado_gps', 'placa', 'poliza_seguro', 'grupo', 'certificacion', 'observaciones'] as $field) {
            if (array_key_exists($field, $data) && $data[$field] !== null) {
                $data[$field] = strip_tags(trim((string) $data[$field]));
            }
        }

        return $data;
    }

    private function generarCodigoVehiculo(): string
    {
        do {
            $codigo = 'VEH-' . strtoupper(Str::random(6));
        } while (VehiculoFlotilla::where('codigo_vehiculo', $codigo)->exists());

        return $codigo;
    }
}
