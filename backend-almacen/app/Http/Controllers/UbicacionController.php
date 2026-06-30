<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreUbicacionRequest;
use App\Models\Ubicacion;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UbicacionController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Ubicacion::class);

        $query = Ubicacion::query()
            ->when($request->has('activo'), fn ($q) => $q->where('activo', $request->boolean('activo')))
            ->orderBy('nombre');

        return response()->json($query->paginate($request->integer('per_page', 50)));
    }

    public function store(StoreUbicacionRequest $request): JsonResponse
    {
        $this->authorize('create', Ubicacion::class);

        $ubicacion = Ubicacion::create($request->validated() + ['activo' => $request->boolean('activo', true)]);

        return response()->json($ubicacion, 201);
    }

    public function update(StoreUbicacionRequest $request, Ubicacion $ubicacion): JsonResponse
    {
        $this->authorize('update', $ubicacion);

        $ubicacion->update($request->validated());

        return response()->json($ubicacion->fresh());
    }

    public function destroy(Ubicacion $ubicacion): JsonResponse
    {
        $this->authorize('delete', $ubicacion);

        $ubicacion->update(['activo' => false]);
        $ubicacion->delete();

        return response()->json(['message' => 'Ubicacion desactivada']);
    }
}
