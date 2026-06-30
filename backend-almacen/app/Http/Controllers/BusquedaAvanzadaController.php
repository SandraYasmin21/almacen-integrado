<?php

namespace App\Http\Controllers;

use App\Models\CatalogoArticulo;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class BusquedaAvanzadaController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        $this->authorize('viewAny', CatalogoArticulo::class);

        $term = $request->filled('q') ? '%' . $request->string('q')->toString() . '%' : null;
        $marcaExpression = Schema::hasColumn('catalogo_articulos', 'marca_fabricante')
            ? 'COALESCE(ca.marca_fabricante, ca.marca)'
            : 'ca.marca';

        $query = DB::table('catalogo_articulos as ca')
            ->leftJoin('subcategorias as sc', 'ca.subcategoria_id', '=', 'sc.id')
            ->leftJoin('categorias as c', 'sc.categoria_id', '=', 'c.id')
            ->leftJoin('inventario_series as is', 'ca.id', '=', 'is.articulo_id')
            ->leftJoin('stock_general as sg', 'ca.id', '=', 'sg.articulo_id')
            ->leftJoin('ubicaciones as u', function ($join) {
                $join->on('is.ubicacion_id', '=', 'u.id')
                    ->orOn('sg.ubicacion_id', '=', 'u.id');
            })
            ->leftJoin('asignaciones_activos as aa', function ($join) {
                $join->on('is.id', '=', 'aa.serie_id')->whereNull('aa.fecha_devolucion');
            })
            ->leftJoin('empleados as e', 'aa.empleado_id', '=', 'e.id')
            ->leftJoin('proyecto_recursos as pr', function ($join) {
                $join->on('ca.id', '=', 'pr.articulo_id')->whereNull('pr.fecha_retiro');
            })
            ->leftJoin('proyectos_presupuestos as pp', 'pr.proyecto_id', '=', 'pp.id')
            ->whereNull('ca.deleted_at')
            ->when($term, function ($q) use ($term) {
                $q->where(function ($inner) use ($term) {
                    $inner->where('ca.nombre', 'ilike', $term)
                        ->orWhere('ca.sku_maestro', 'ilike', $term)
                        ->orWhereRaw("$marcaExpression ILIKE ?", [$term])
                        ->orWhere('ca.modelo', 'ilike', $term)
                        ->orWhere('is.codigo_interno_generado', 'ilike', $term)
                        ->orWhere('is.numero_serie_fabricante', 'ilike', $term);
                });
            })
            ->when($request->filled('categoria_id'), fn ($q) => $q->where('c.id', $request->integer('categoria_id')))
            ->when($request->filled('marca'), fn ($q) => $q->whereRaw("$marcaExpression ILIKE ?", ['%' . $request->input('marca') . '%']))
            ->when($request->filled('modelo'), fn ($q) => $q->where('ca.modelo', 'ilike', '%' . $request->input('modelo') . '%'))
            ->when($request->filled('serie'), fn ($q) => $q->where('is.numero_serie_fabricante', 'ilike', '%' . $request->input('serie') . '%'))
            ->when($request->filled('responsable_id'), fn ($q) => $q->where('e.id', $request->integer('responsable_id')))
            ->when($request->filled('ubicacion_id'), fn ($q) => $q->where('u.id', $request->integer('ubicacion_id')))
            ->when($request->filled('proyecto_id'), fn ($q) => $q->where('pp.id', $request->integer('proyecto_id')))
            ->when($request->filled('estado'), fn ($q) => $q->where('is.estado', $request->input('estado')))
            ->when($request->filled('tipo_control'), fn ($q) => $q->where('ca.tipo_control', $request->input('tipo_control')))
            ->select([
                'ca.id as articulo_id',
                'ca.sku_maestro',
                'ca.nombre',
                DB::raw("$marcaExpression as marca"),
                'ca.modelo',
                'ca.tipo_control',
                'c.nombre as categoria',
                'is.id as serie_id',
                'is.codigo_interno_generado',
                'is.numero_serie_fabricante',
                'is.estado',
                'sg.cantidad',
                'u.nombre as ubicacion',
                'e.nombre_completo as responsable',
                'pp.nombre as proyecto',
            ])
            ->distinct()
            ->orderBy('ca.nombre');

        return response()->json($query->paginate($request->integer('per_page', 25)));
    }
}
