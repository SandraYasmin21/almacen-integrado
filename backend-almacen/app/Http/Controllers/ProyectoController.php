<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreProyectoRequest;
use App\Models\ProyectoPresupuesto;
use App\Models\ProyectoRecurso;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProyectoController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', ProyectoPresupuesto::class);

        $proyectos = ProyectoPresupuesto::query()
            ->with('responsable:id,nombre_completo,puesto_cargo')
            ->when($request->filled('estatus'), fn ($q) => $q->where('estatus', $request->input('estatus')))
            ->orderByDesc('id')
            ->paginate($request->integer('per_page', 25));

        return response()->json($proyectos);
    }

    public function store(StoreProyectoRequest $request): JsonResponse
    {
        $this->authorize('create', ProyectoPresupuesto::class);

        $proyecto = ProyectoPresupuesto::create($request->validated() + ['estatus' => $request->input('estatus', 'ACTIVO')]);

        return response()->json($proyecto, 201);
    }

    public function show(ProyectoPresupuesto $proyecto): JsonResponse
    {
        $this->authorize('view', $proyecto);

        return response()->json($proyecto->load([
            'responsable', 
            'recursos.articulo:id,nombre,codigo_interno_generado', 
            'recursos.serie:id,numero_serie_fabricante', 
            'recursos.vehiculo:id,nombre,numero'
        ]));
    }

    public function update(StoreProyectoRequest $request, ProyectoPresupuesto $proyecto): JsonResponse
    {
        $this->authorize('update', $proyecto);

        $proyecto->update($request->validated());

        return response()->json($proyecto->fresh(['responsable']));
    }

    public function asignarRecurso(Request $request, ProyectoPresupuesto $proyecto): JsonResponse
    {
        $this->authorize('update', $proyecto);

        $data = $request->validate([
            'articulo_id' => ['nullable', 'exists:catalogo_articulos,id'],
            'serie_id' => ['nullable', 'exists:inventario_series,id'],
            'vehiculo_id' => ['nullable', 'exists:vehiculos_flotilla,id'],
            'cantidad' => ['nullable', 'numeric', 'min:0.01'],
            'notas' => ['nullable', 'string', 'max:1000'],
        ]);

        $recurso = ProyectoRecurso::create($data + [
            'proyecto_id' => $proyecto->id,
            'fecha_asignacion' => now(),
            'asignado_por_id' => $request->user()->id,
        ]);

        return response()->json($recurso, 201);
    }

    public function retirarRecurso(Request $request, ProyectoPresupuesto $proyecto, ProyectoRecurso $recurso): JsonResponse
    {
        $this->authorize('update', $proyecto);

        abort_unless((int) $recurso->proyecto_id === (int) $proyecto->id, 404);

        $recurso->update([
            'fecha_retiro' => now(),
            'retirado_por_id' => $request->user()->id,
            'notas' => $request->input('notas', $recurso->notas),
        ]);

        return response()->json($recurso->fresh());
    }
}
