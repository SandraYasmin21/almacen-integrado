<?php

namespace App\Http\Controllers;

use App\Models\Categoria;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class CategoriaController extends Controller
{
    /**
     * 1. Listar todas las categorías.
     * GET /api/categorias
     */
    public function index(): JsonResponse
    {
        $categorias = Categoria::orderBy('nombre')->get();
        return response()->json($categorias);
    }

    /**
     * 2. Crear una nueva categoría.
     * POST /api/categorias
     */
    public function store(Request $request): JsonResponse
    {
        // Validación estricta
        $validated = $request->validate([
            'nombre'      => 'required|string|max:100|unique:categorias,nombre',
            'descripcion' => 'nullable|string|max:500',
        ]);

        // Sanitización de inputs de texto libre
        $validated['nombre']      = strip_tags(trim($validated['nombre']));
        $validated['descripcion'] = isset($validated['descripcion'])
            ? strip_tags(trim($validated['descripcion']))
            : null;

        $categoria = Categoria::create($validated);

        return response()->json([
            'mensaje'   => 'Categoría creada con éxito',
            'categoria' => $categoria,
        ], 201);
    }

    /**
     * 3. Ver detalle de una categoría.
     * GET /api/categorias/{id}
     */
    public function show(int $id): JsonResponse
    {
        $categoria = Categoria::findOrFail($id);
        return response()->json($categoria);
    }

    /**
     * 4. Actualizar una categoría.
     * PUT /api/categorias/{id}
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $categoria = Categoria::findOrFail($id);

        $validated = $request->validate([
            'nombre'      => 'sometimes|string|max:100|unique:categorias,nombre,' . $id,
            'descripcion' => 'nullable|string|max:500',
        ]);

        // Sanitización de inputs de texto libre
        foreach (['nombre', 'descripcion'] as $campo) {
            if (isset($validated[$campo])) {
                $validated[$campo] = strip_tags(trim($validated[$campo]));
            }
        }

        $categoria->update($validated);

        return response()->json([
            'mensaje'   => 'Categoría actualizada',
            'categoria' => $categoria,
        ]);
    }

    /**
     * 5. Eliminar una categoría.
     * DELETE /api/categorias/{id}
     */
    public function destroy(int $id): JsonResponse
    {
        $categoria = Categoria::findOrFail($id);
        $categoria->delete();

        return response()->json([
            'mensaje' => 'Categoría eliminada',
        ]);
    }
}