<?php

namespace App\Http\Controllers;

use App\Models\ReportePolicySubject;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class ReporteBasicoController extends Controller
{
    public function index(): JsonResponse
    {
        $this->authorize('viewAny', ReportePolicySubject::class);

        return response()->json([
            'reportes' => [
                'activos-registrados',
                'activos-estado',
                'activos-ubicacion',
                'activos-responsable',
                'activos-proyecto',
                'materiales-consumibles',
                'vehiculos',
                'movimientos',
                'activos-categoria',
            ],
        ]);
    }

    public function export(Request $request, string $tipo)
    {
        $this->authorize('viewAny', ReportePolicySubject::class);
        $request->merge(['export' => true]);

        $data = match ($tipo) {
            'activos-registrados' => $this->activosRegistrados($request),
            'activos-estado' => $this->activosEstado(),
            'activos-ubicacion' => $this->activosUbicacion(),
            'activos-responsable' => $this->activosResponsable(),
            'activos-proyecto' => $this->activosProyecto(),
            'materiales-consumibles' => $this->materialesConsumibles(),
            'vehiculos' => $this->vehiculos(),
            'movimientos' => $this->movimientos($request),
            'activos-categoria' => $this->activosCategoria(),
            default => abort(404, 'Reporte no encontrado'),
        };

        $format = $request->query('format', 'excel');
        $exportData = [];
        $headings = [];
        
        if (count($data) > 0) {
            $first = (array) $data[0];
            $headings = array_keys($first);
            foreach ($data as $row) {
                $exportData[] = (array) $row;
            }
        }
        
        $filename = 'reporte-' . $tipo . '-' . date('Y-m-d');
        
        if ($format === 'pdf') {
            $html = view('exports.generic', [
                'title' => 'Reporte: ' . $tipo,
                'date' => date('d/m/Y H:i'),
                'headings' => $headings,
                'data' => $exportData
            ])->render();
            return \Barryvdh\DomPDF\Facade\Pdf::loadHTML($html)->setPaper('a4', 'landscape')->download($filename . '.pdf');
        }
        
        return \Maatwebsite\Excel\Facades\Excel::download(new \App\Exports\GenericExport($exportData, $headings), $filename . '.xlsx');
    }

    public function show(Request $request, string $tipo): JsonResponse
    {
        $this->authorize('viewAny', ReportePolicySubject::class);

        $data = match ($tipo) {
            'activos-registrados' => $this->activosRegistrados($request),
            'activos-estado' => $this->activosEstado(),
            'activos-ubicacion' => $this->activosUbicacion(),
            'activos-responsable' => $this->activosResponsable(),
            'activos-proyecto' => $this->activosProyecto(),
            'materiales-consumibles' => $this->materialesConsumibles(),
            'vehiculos' => $this->vehiculos(),
            'movimientos' => $this->movimientos($request),
            'activos-categoria' => $this->activosCategoria(),
            default => abort(404, 'Reporte no encontrado'),
        };

        return response()->json([
            'tipo' => $tipo,
            'data' => $data,
        ]);
    }

    private function activosRegistrados(Request $request)
    {
        $marca = Schema::hasColumn('catalogo_articulos', 'marca_fabricante')
            ? 'COALESCE(ca.marca_fabricante, ca.marca)'
            : 'ca.marca';

        $query = DB::table('catalogo_articulos as ca')
            ->leftJoin('subcategorias as sc', 'ca.subcategoria_id', '=', 'sc.id')
            ->leftJoin('categorias as c', 'sc.categoria_id', '=', 'c.id')
            ->whereNull('ca.deleted_at')
            ->select(
                'ca.id',
                'ca.sku_maestro',
                'ca.nombre',
                DB::raw("$marca as marca"),
                'ca.modelo',
                'ca.tipo_control',
                'ca.unidad_medida',
                'ca.stock_minimo',
                'c.nombre as categoria'
            )
            ->orderBy('ca.nombre');
            
        return $request->boolean('export') ? $query->get() : $query->paginate($request->integer('per_page', 50));
    }

    private function activosEstado()
    {
        return DB::table('inventario_series')
            ->whereNull('deleted_at')
            ->select('estado', DB::raw('COUNT(*) as total'))
            ->groupBy('estado')
            ->orderBy('estado')
            ->get();
    }

    private function activosUbicacion()
    {
        return DB::table('inventario_series as is')
            ->leftJoin('ubicaciones as u', 'is.ubicacion_id', '=', 'u.id')
            ->whereNull('is.deleted_at')
            ->select(DB::raw('COALESCE(u.nombre, is.ubicacion, \'Sin ubicación\') as ubicacion'), DB::raw('COUNT(*) as total'))
            ->groupBy(DB::raw('COALESCE(u.nombre, is.ubicacion, \'Sin ubicación\')'))
            ->orderBy('ubicacion')
            ->get();
    }

    private function activosResponsable()
    {
        return DB::table('asignaciones_activos as aa')
            ->join('empleados as e', 'aa.empleado_id', '=', 'e.id')
            ->whereNull('aa.fecha_devolucion')
            ->whereNull('aa.deleted_at')
            ->select('e.id as responsable_id', 'e.nombre_completo as responsable', DB::raw('COUNT(*) as total'))
            ->groupBy('e.id', 'e.nombre_completo')
            ->orderBy('responsable')
            ->get();
    }

    private function activosProyecto()
    {
        return DB::table('proyecto_recursos as pr')
            ->join('proyectos_presupuestos as pp', 'pr.proyecto_id', '=', 'pp.id')
            ->whereNull('pr.fecha_retiro')
            ->whereNull('pr.deleted_at')
            ->select('pp.id as proyecto_id', 'pp.nombre as proyecto', DB::raw('COUNT(*) as recursos'), DB::raw('SUM(pr.cantidad) as cantidad_total'))
            ->groupBy('pp.id', 'pp.nombre')
            ->orderBy('pp.nombre')
            ->get();
    }

    private function materialesConsumibles()
    {
        return DB::table('stock_general as sg')
            ->join('catalogo_articulos as ca', 'sg.articulo_id', '=', 'ca.id')
            ->leftJoin('ubicaciones as u', 'sg.ubicacion_id', '=', 'u.id')
            ->leftJoin('subcategorias as sc', 'ca.subcategoria_id', '=', 'sc.id')
            ->leftJoin('categorias as c', 'sc.categoria_id', '=', 'c.id')
            ->whereNull('sg.deleted_at')
            ->select('ca.nombre', 'ca.unidad_medida', 'c.nombre as categoria', DB::raw('COALESCE(u.nombre, sg.ubicacion, \'Sin ubicación\') as ubicacion'), DB::raw('SUM(sg.cantidad) as existencia'))
            ->groupBy('ca.nombre', 'ca.unidad_medida', 'c.nombre', DB::raw('COALESCE(u.nombre, sg.ubicacion, \'Sin ubicación\')'))
            ->orderBy('ca.nombre')
            ->get();
    }

    private function vehiculos()
    {
        return DB::table('vehiculos_flotilla as v')
            ->leftJoin('empleados as e', 'v.responsable_id', '=', 'e.id')
            ->leftJoin('ubicaciones as u', 'v.ubicacion_id', '=', 'u.id')
            ->whereNull('v.deleted_at')
            ->select(
                'v.codigo_vehiculo',
                'v.nombre',
                'v.marca',
                'v.modelo',
                'v.anio',
                DB::raw("COALESCE(v.placa, v.placas, '') as placa"),
                'v.niv',
                'v.estado',
                'v.kilometraje_actual',
                'e.nombre_completo as responsable',
                'u.nombre as ubicacion'
            )
            ->orderBy('v.nombre')
            ->get();
    }

    private function movimientos(Request $request)
    {
        $tipoColumn = Schema::hasColumn('movimiento_inventario', 'tipo') ? 'tipo' : 'tipo_movimiento';

        $query = DB::table('movimiento_inventario as mi')
            ->leftJoin('usuarios_sistema as u', 'mi.usuario_id', '=', 'u.id')
            ->whereNull('mi.deleted_at')
            ->when($request->filled('fecha_desde'), fn ($q) => $q->whereDate('mi.fecha_hora', '>=', $request->input('fecha_desde')))
            ->when($request->filled('fecha_hasta'), fn ($q) => $q->whereDate('mi.fecha_hora', '<=', $request->input('fecha_hasta')))
            ->select('mi.id', 'mi.folio', DB::raw("mi.$tipoColumn as tipo"), 'mi.fecha_hora', 'mi.motivo', 'mi.notas', 'u.nombre_usuario as usuario')
            ->orderByDesc('mi.fecha_hora');
            
        return $request->boolean('export') ? $query->get() : $query->paginate($request->integer('per_page', 50));
    }

    private function activosCategoria()
    {
        return DB::table('catalogo_articulos as ca')
            ->leftJoin('subcategorias as sc', 'ca.subcategoria_id', '=', 'sc.id')
            ->leftJoin('categorias as c', 'sc.categoria_id', '=', 'c.id')
            ->whereNull('ca.deleted_at')
            ->select(DB::raw('COALESCE(c.nombre, \'Sin categoría\') as categoria'), DB::raw('COUNT(*) as total'))
            ->groupBy(DB::raw('COALESCE(c.nombre, \'Sin categoría\')'))
            ->orderBy('categoria')
            ->get();
    }
}
