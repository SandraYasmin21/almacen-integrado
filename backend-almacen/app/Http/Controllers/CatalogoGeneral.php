<?php

namespace App\Http\Controllers;

use smartlynk\Core\Models\CatalogoArticulo;
use smartlynk\Core\Models\Categoria;
use smartlynk\Core\Models\Subcategoria;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CatalogoGeneral extends Controller
{

    // -- ARTICULOS --

    // Método para mostrar la página del catálogo con los datos
    public function showCatalogo()
    {
        $cantidad = CatalogoArticulo::count();
        $articulos = CatalogoArticulo::with('subcategoria')->get();
        $categorias = Categoria::all();
        $subcategorias = Subcategoria::all();
        $medidas = CatalogoArticulo::select('unidad_medida')->distinct()->get();

        return Inertia::render('CatalogoArticulosPage', [
            'cantidad' => $cantidad,
            'articulos' => $articulos,
            'categorias' => $categorias,
            'subcategorias' => $subcategorias,
            'medidas' => $medidas,
        ]);
    }

    // funcion para agregar un articulo al sistema
     public function createArticulo(Request $request){
        try {
            $validated = $request->validate([
                'nombre' => 'required|string|max:150',
                'modelo' => 'nullable|string|max:150',
                'subcategoria_id' => 'required|exists:subcategorias,id',
                'requiere_serie' => 'boolean',
                'es_consumible' => 'boolean',
                'unidad_medida' => 'string|max:20',
                'stock_minimo' => 'numeric'
            ]);

            // instancia de objeto
            $articulo = new CatalogoArticulo();

            $articulo->nombre         = $validated['nombre'];
            $articulo->modelo         = $validated['modelo'] ?? null;
            $articulo->subcategoria_id = $validated['subcategoria_id'];
            $articulo->requiere_serie = $validated['requiere_serie'] ?? false;
            $articulo->es_consumible  = $validated['es_consumible'] ?? false;
            $articulo->unidad_medida  = $validated['unidad_medida'] ?? 'pza';
            $articulo->stock_minimo   = $validated['stock_minimo'] ?? 0;
            $articulo->save();

            // Redirigir a la página de catálogo para refrescar la vista
            return redirect()->route('articulos.index')->with('success','Articulo creado con exito.');
        } catch (\Exception $e) {
            return redirect()->back()->withErrors(['error' => $e->getMessage()]);
        }
     }

     // funcion para modificar un articulo

     public function updateArticulo(Request $request, $id){

        $validated = $request->validate([
            'nombre' => 'required|string|max:150',
            'modelo' => 'nullable|string|max:150',
            'subcategoria_id' => 'required|exists:subcategorias,id',
            'requiere_serie' => 'boolean',
            'es_consumible' => 'boolean',
            'unidad_medida' => 'string|max:20',
            'stock_minimo' => 'numeric',
        ]);

        // verifica que el id exista
        $articulo = CatalogoArticulo::findOrFail($id);

        // actualiza y guarda
        $articulo->update($validated);

        // redirecciona con mensaje
        return redirect()->route('articulos.index')->with('success','Articulo modificado con exito.');
     }

     // funcion para eliminar (soft delete un articulo)
     public function deleteArticulo(Request $request, $id){

        $articulo = CatalogoArticulo::findOrFail($id);

        // ejecucion de delete, se realiza soft delete (necesario especificar en migraciones y modelo)
        $articulo->delete();

        return redirect()->route('articulos.index')->with('success','Articulo borrado con exito.');
     }

     public function getCantidadArticulos(){
        $cantidad = CatalogoArticulo::count();
        return response()->json(['cantidad' => $cantidad]);
     }

}
