<?php

namespace App\Http\Controllers;

use App\Models\CatalogoConfigurable;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class CatalogoConfigurableController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', CatalogoConfigurable::class);

        $query = CatalogoConfigurable::query()
            ->when($request->filled('tipo'), fn ($q) => $q->where('tipo', $request->input('tipo')))
            ->when($request->has('activo'), fn ($q) => $q->where('activo', $request->boolean('activo')))
            ->orderBy('tipo')
            ->orderBy('orden')
            ->orderBy('nombre');

        return response()->json($query->get()->groupBy('tipo'));
    }

    public function store(Request $request): JsonResponse
    {
        $this->authorize('create', CatalogoConfigurable::class);

        $data = $request->validate([
            'tipo' => ['required', 'string', 'max:80'],
            'clave' => ['required', 'string', 'max:120', Rule::unique('catalogos_configurables', 'clave')->where(fn ($q) => $q->where('tipo', $request->input('tipo')))],
            'nombre' => ['required', 'string', 'max:180'],
            'descripcion' => ['nullable', 'string', 'max:1000'],
            'activo' => ['nullable', 'boolean'],
            'orden' => ['nullable', 'integer', 'min:0'],
            'metadata' => ['nullable', 'array'],
        ]);

        $catalogo = CatalogoConfigurable::create($data + [
            'activo' => true,
            'orden' => 0,
        ]);

        return response()->json($catalogo, 201);
    }

    public function update(Request $request, CatalogoConfigurable $catalogo): JsonResponse
    {
        $this->authorize('update', $catalogo);

        $data = $request->validate([
            'tipo' => ['sometimes', 'required', 'string', 'max:80'],
            'clave' => ['sometimes', 'required', 'string', 'max:120'],
            'nombre' => ['sometimes', 'required', 'string', 'max:180'],
            'descripcion' => ['nullable', 'string', 'max:1000'],
            'activo' => ['nullable', 'boolean'],
            'orden' => ['nullable', 'integer', 'min:0'],
            'metadata' => ['nullable', 'array'],
        ]);

        $catalogo->update($data);

        return response()->json($catalogo->fresh());
    }

    public function destroy(CatalogoConfigurable $catalogo): JsonResponse
    {
        $this->authorize('delete', $catalogo);

        $catalogo->update(['activo' => false]);
        $catalogo->delete();

        return response()->json(['message' => 'Catalogo desactivado']);
    }
}
