<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;
use Carbon\Carbon;
use Maatwebsite\Excel\Facades\Excel;
use Barryvdh\DomPDF\Facade\Pdf;
use App\Exports\InventarioExport;
use App\Http\Controllers\OrdenCompraController;

class AlmacenController extends Controller
{
    private function column(string $table, string $preferred, ?string $fallback = null): string
    {
        return Schema::hasColumn($table, $preferred) ? $preferred : ($fallback ?? $preferred);
    }

    private function tipoColumn(): string
    {
        return $this->column('movimiento_inventario', 'tipo', 'tipo_movimiento');
    }

    private function insertMovimiento(string $tipo, array $data = []): int
    {
        $tipoColumn = $this->tipoColumn();
        $payload = [
            'fecha_hora'   => Carbon::now(),
            $tipoColumn    => Schema::hasColumn('movimiento_inventario', 'tipo') ? strtolower($tipo) : strtoupper($tipo),
            'usuario_id'   => auth()->id(),
            'proveedor_id' => $data['proveedor_id'] ?? null,
            'empleado_id'  => $data['empleado_id'] ?? null,
            'notas'        => $data['notas'] ?? null,
        ];

        if (Schema::hasColumn('movimiento_inventario', 'created_at')) {
            $payload['created_at'] = Carbon::now();
            $payload['updated_at'] = Carbon::now();
        }

        return DB::table('movimiento_inventario')->insertGetId($payload);
    }

    private function insertDetalle(int $movimientoId, array $data): void
    {
        $payload = [
            'movimiento_id' => $movimientoId,
            'articulo_id'   => $data['articulo_id'] ?? null,
            'serie_id'      => $data['serie_id'] ?? null,
            'cantidad'      => $data['cantidad'] ?? null,
        ];

        if (Schema::hasColumn('detalle_movimiento', 'created_at')) {
            $payload['created_at'] = Carbon::now();
            $payload['updated_at'] = Carbon::now();
        }

        DB::table('detalle_movimiento')->insert($payload);
    }

    private function incrementStock(int $articuloId, float $cantidad, ?string $ubicacion = null)
    {
        // Buscamos si ya existe un registro de stock ACTIVO para este artículo y ubicación
        $stockExistente = DB::table('stock_general')
            ->where('articulo_id', $articuloId)
            ->where('ubicacion', $ubicacion)
            ->whereNull('deleted_at') // <-- CRÍTICO: Ignora el stock viejo que fue eliminado
            ->first();

        if ($stockExistente) {
            // Si existe activo, se le suma la nueva cantidad
            DB::table('stock_general')
                ->where('id', $stockExistente->id)
                ->increment('cantidad', $cantidad);
        } else {
            // Si no existe (o el que había estaba "soft-deleted"), creamos uno totalmente nuevo y limpio
            DB::table('stock_general')->insert([
                'articulo_id' => $articuloId,
                'cantidad' => $cantidad,
                'ubicacion' => $ubicacion,
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ]);
        }
    }

    private function generateSku(int $articuloId, int $index): string
    {
        do {
            $sku = 'SLK-' . str_pad((string) $articuloId, 5, '0', STR_PAD_LEFT) . '-' . now()->format('ymdHis') . '-' . str_pad((string) $index, 3, '0', STR_PAD_LEFT) . '-' . strtoupper(substr(bin2hex(random_bytes(2)), 0, 4));
        } while (DB::table('inventario_series')->where('codigo_interno_generado', $sku)->exists());

        return $sku;
    }

    private function generateChildSku(string $masterSku, int $sequence): string
    {
        $base = strtoupper(trim($masterSku));

        if ($base === '') {
            $base = 'SLK-GEN';
        }

        do {
            $sku = sprintf('%s-%03d', $base, $sequence);
            $sequence++;
        } while (DB::table('inventario_series')->where('codigo_interno_generado', $sku)->exists());

        return $sku;
    }

    private function serieDisponible(int $serieId)
    {
        $serie = DB::table('inventario_series as is')
            ->join('catalogo_articulos as ca', 'is.articulo_id', '=', 'ca.id')
            ->leftJoin('stock_general as sg', 'ca.id', '=', 'sg.articulo_id')
            ->where('is.id', $serieId)
            ->select('is.*', 'ca.nombre as articulo_nombre', 'ca.modelo', 'ca.unidad_medida', DB::raw('COALESCE(sg.cantidad, 0) as stock'))
            ->lockForUpdate()
            ->first();

        if (!$serie) {
            abort(response()->json(['success' => false, 'message' => 'SKU no encontrado.'], 404));
        }

        if (strtoupper((string) $serie->estado) !== 'DISPONIBLE') {
            abort(response()->json(['success' => false, 'message' => 'El SKU no está disponible.'], 422));
        }

        return $serie;
    }

    private function updateSerieEstado(int $serieId, string $estado): void
    {
        $payload = ['estado' => $estado];
        if (Schema::hasColumn('inventario_series', 'updated_at')) {
            $payload['updated_at'] = Carbon::now();
        }
        DB::table('inventario_series')->where('id', $serieId)->update($payload);
    }

    public function index()
    {
        $articulos = DB::table('catalogo_articulos as ca')
            ->leftJoin('stock_general as sg', 'ca.id', '=', 'sg.articulo_id')
            ->leftJoin('subcategorias as sc', 'ca.subcategoria_id', '=', 'sc.id')
            ->leftJoin('categorias as cat', 'sc.categoria_id', '=', 'cat.id')
            ->where('ca.activo', true)
            ->select(
                'ca.id', 
                'ca.nombre', 
                'ca.modelo', 'ca.unidad_medida',
                'ca.stock_minimo', 'ca.requiere_serie', 'ca.es_consumible',
                'sc.nombre as subcategoria_nombre',
                'cat.id as categoria_id', 'cat.nombre as categoria_nombre',
                DB::raw('COALESCE(sg.cantidad, 0) as cantidad'),
                'sg.ubicacion'
            )
            ->orderBy('ca.nombre')
            ->get();

        $categorias = DB::table('categorias')->where('activo', true)->orderBy('nombre')->get();

        $empleados = DB::table('empleados')->where('activo', true)->orderBy('nombre_completo')
            ->select('id', 'nombre_completo', 'departamento_area')->get();

        $ubicaciones = DB::table('stock_general')
            ->select('ubicacion', DB::raw('COUNT(*) as total_articulos'), DB::raw('SUM(cantidad) as total_unidades'))
            ->whereNotNull('ubicacion')
            ->groupBy('ubicacion')
            ->orderBy('ubicacion')
            ->get();

        return Inertia::render('Almacen/Index', compact('articulos', 'categorias', 'empleados', 'ubicaciones'));
    }

    public function entradaForm()
    {
        $articulos = DB::table('catalogo_articulos as ca')
            ->leftJoin('subcategorias as sc', 'ca.subcategoria_id', '=', 'sc.id')
            ->leftJoin('categorias as cat', 'sc.categoria_id', '=', 'cat.id')
            ->where('ca.activo', true)
            ->select(
                'ca.*',
                'sc.nombre as subcategoria_nombre',
                'cat.nombre as categoria_nombre'
            )
            ->orderBy('ca.nombre')
            ->get();
            
        $proveedores = DB::table('proveedores')->where('activo', true)->orderBy('nombre_empresa')->get();
        return Inertia::render('Almacen/Entrada', compact('articulos', 'proveedores'));
    }

    public function salidaForm()
    {
        $articulos = DB::table('catalogo_articulos as ca')
            ->join('stock_general as sg', 'ca.id', '=', 'sg.articulo_id')
            ->where('ca.activo', true)->where('sg.cantidad', '>', 0)
            ->select('ca.*', 'sg.cantidad as stock')->orderBy('ca.nombre')->get();
        $empleados = DB::table('empleados')->where('activo', true)->orderBy('nombre_completo')
            ->select('id', 'nombre_completo', 'departamento_area')->get();
        return Inertia::render('Almacen/Salida', compact('articulos', 'empleados'));
    }

    public function prestamoForm(Request $request)
    {
        $series = DB::table('inventario_series as is')
            ->join('catalogo_articulos as ca', 'is.articulo_id', '=', 'ca.id')
            ->where('is.estado', 'disponible')
            ->select('is.*', 'ca.nombre as articulo_nombre')->orderBy('ca.nombre')->get();
        $empleados = DB::table('empleados')->where('activo', true)->orderBy('nombre_completo')
            ->select('id', 'nombre_completo', 'departamento_area')->get();
        $empleadoId = $request->input('empleado_id');
        return Inertia::render('Almacen/Prestamo', compact('series', 'empleados', 'empleadoId'));
    }

    public function movimientosView()
    {
        return Inertia::render('Almacen/Movimientos');
    }


    public function export(Request $request, $format)
    {
        if ($format === 'excel') {
            $filename = "inventario_almacen_".Carbon::now()->format('Ymd_His').'.xlsx';
            return Excel::download(new InventarioExport('inventario'), $filename, \Maatwebsite\Excel\Excel::XLSX);
        }

        if ($format === 'pdf') {
            $inventario = $this->getInventarioQuery()->get();
            $pdf = Pdf::loadView('pdf.inventario', [
                'inventario'   => $inventario,
                'fecha'        => Carbon::now()->format('d/m/Y H:i'),
                'generado_por' => auth()->user()->nombre_usuario ?? 'Sistema',
            ]);
            $pdf->setPaper('a4', 'landscape');
            return $pdf->download('inventario_almacen_'.Carbon::now()->format('Ymd').'.pdf');
        }

        return response()->json(['error' => 'Format not supported'], 400);
    }

    public function articuloDetalle(int $id)
    {
        $articulo = DB::table('catalogo_articulos as ca')
            ->leftJoin('stock_general as sg', 'ca.id', '=', 'sg.articulo_id')
            ->leftJoin('subcategorias as sc', 'ca.subcategoria_id', '=', 'sc.id')
            ->where('ca.id', $id)
            ->select('ca.*', 'sc.nombre as subcategoria_nombre',
                DB::raw('COALESCE(sg.cantidad,0) as cantidad'), 'sg.ubicacion')
            ->first();
        abort_if(!$articulo, 404);

        $movimientos = DB::table('movimiento_inventario as mi')
            ->join('detalle_movimiento as dm', 'mi.id', '=', 'dm.movimiento_id')
            ->join('usuarios_sistema as u', 'mi.usuario_id', '=', 'u.id')
            ->leftJoin('empleados as e', 'mi.empleado_id', '=', 'e.id')
            ->where('dm.articulo_id', $id)
            ->select('mi.tipo', 'mi.fecha_hora', 'u.nombre_usuario', 'e.nombre_completo as empleado', 'dm.cantidad')
            ->orderByDesc('mi.fecha_hora')->limit(20)->get();

        $series = DB::table('inventario_series')->where('articulo_id', $id)->orderBy('codigo_interno_generado')->get();

        return Inertia::render('Almacen/Articulo', compact('articulo', 'movimientos', 'series'));
    }

    public function serieDetalle(int $id)
    {
        $serie = DB::table('inventario_series as is')
            ->join('catalogo_articulos as ca', 'is.articulo_id', '=', 'ca.id')
            ->leftJoin('proveedores as p', 'is.proveedor_id', '=', 'p.id')
            ->where('is.id', $id)
            ->select('is.*', 'ca.nombre as articulo_nombre', 'p.nombre_empresa as proveedor_nombre')
            ->first();
        abort_if(!$serie, 404);

        $asignaciones = DB::table('asignaciones_activos as aa')
            ->join('empleados as e', 'aa.empleado_id', '=', 'e.id')
            ->where('aa.serie_id', $id)
            ->orderByDesc('aa.fecha_entrega')
            ->select('aa.*', 'e.nombre_completo')->get();

        return Inertia::render('Almacen/Serie', compact('serie', 'asignaciones'));
    }

    public function ubicacionDetalle(string $ubicacion)
    {
        $articulos = DB::table('stock_general as sg')
            ->join('catalogo_articulos as ca', 'sg.articulo_id', '=', 'ca.id')
            ->where('sg.ubicacion', $ubicacion)
            ->select('ca.*', 'sg.cantidad', 'sg.ubicacion')->get();
        return Inertia::render('Almacen/Ubicacion', compact('articulos', 'ubicacion'));
    }

    // ── API ───────────────────────────────────────────────

    public function inventarioApi(Request $request)
    {
        $query = DB::table('catalogo_articulos as ca')
            ->leftJoin('stock_general as sg', 'ca.id', '=', 'sg.articulo_id')
            ->leftJoin('subcategorias as sc', 'ca.subcategoria_id', '=', 'sc.id')
            ->leftJoin('categorias as cat', 'sc.categoria_id', '=', 'cat.id');

        if (Schema::hasColumn('catalogo_articulos', 'activo')) {
            $query->where('ca.activo', true);
        }

        if ($request->filled('categoria_id')) {
            $query->where('sc.categoria_id', $request->categoria_id);
        }
        if ($request->filled('estado')) {
            match ($request->estado) {
                'critico' => $query->whereRaw('COALESCE(sg.cantidad,0) <= ca.stock_minimo * 0.2'),
                'bajo'    => $query->whereRaw('COALESCE(sg.cantidad,0) <= ca.stock_minimo'),
                'ok'      => $query->whereRaw('COALESCE(sg.cantidad,0) > ca.stock_minimo'),
                default   => null,
            };
        }

        $select = [
            'ca.id',
            'ca.nombre',
            'ca.modelo',
            'ca.unidad_medida',
            'ca.stock_minimo',
            'sc.nombre as subcategoria',
            'sc.nombre as subcategoria_nombre',
            'cat.id as categoria_id',
            'cat.nombre as categoria_nombre',
            DB::raw('COALESCE(sg.cantidad,0) as cantidad'),
            DB::raw('COALESCE(sg.cantidad,0) as stock'),
            'sg.ubicacion',
        ];

        $select[] = Schema::hasColumn('catalogo_articulos', 'tipo_articulo')
            ? 'ca.tipo_articulo'
            : DB::raw("'herramienta' as tipo_articulo");

        return response()->json([
            'success' => true,
            'data' => $query->select($select)->orderBy('ca.nombre')->get(),
        ]);
    }

    public function exportarInventarioDetallado(Request $request)
    {
        $formato = $request->input('formato', 'excel');
        $tipoFiltro = $request->input('tipo', 'todos'); // todos, consumibles, series
        $categoriaId = $request->input('categoria_id');
        $ubicacion = $request->input('ubicacion');
        $fechaInicio = $request->input('fecha_inicio');
        $fechaFin = $request->input('fecha_fin');

        $modeloConsumible = Schema::hasColumn('catalogo_articulos', 'sku_maestro')
            ? 'ca.sku_maestro' : 'NULL';

        // 1. Consulta para Consumibles
        $qConsumibles = DB::table('catalogo_articulos as ca')
            ->join('stock_general as sg', 'ca.id', '=', 'sg.articulo_id')
            ->leftJoin('subcategorias as sc', 'ca.subcategoria_id', '=', 'sc.id')
            ->leftJoin('categorias as cat', 'sc.categoria_id', '=', 'cat.id')
            ->where(function ($q) {
                $q->where('ca.es_consumible', true)->orWhere('ca.requiere_serie', false);
            })
            ->where('sg.cantidad', '>', 0)
            ->whereNull('sg.deleted_at')
            ->whereNull('ca.deleted_at')
            ->select(
                DB::raw("'Consumible' as tipo_registro"),
                'ca.nombre',
                'ca.marca',
                'ca.modelo',
                DB::raw("{$modeloConsumible} as sku_serie"),
                'sc.nombre as subcategoria',
                'cat.nombre as categoria',
                'sg.ubicacion',
                'sg.cantidad',
                'ca.unidad_medida',
                DB::raw("NULL as fecha_adquisicion"),
                DB::raw("NULL as estado"),
                DB::raw("NULL as notas")
            );

        // 2. Consulta para Series
        $qSeries = DB::table('inventario_series as invs')
            ->join('catalogo_articulos as ca', 'invs.articulo_id', '=', 'ca.id')
            ->leftJoin('subcategorias as sc', 'ca.subcategoria_id', '=', 'sc.id')
            ->leftJoin('categorias as cat', 'sc.categoria_id', '=', 'cat.id')
            ->where('ca.requiere_serie', true)
            ->whereNull('invs.deleted_at')
            ->select(
                DB::raw("'Serie' as tipo_registro"),
                'ca.nombre',
                'ca.marca',
                'ca.modelo',
                'invs.numero_serie_fabricante as sku_serie',
                'sc.nombre as subcategoria',
                'cat.nombre as categoria',
                'invs.ubicacion',
                DB::raw("1 as cantidad"),
                'ca.unidad_medida',
                'invs.fecha_adquisicion', // Ya no forzamos el CAST, Laravel lo lee nativo
                'invs.estado',
                'invs.notas'
            );

        // Aplicación de Filtros Dinámicos
        if ($categoriaId) {
            $qConsumibles->where('cat.id', $categoriaId);
            $qSeries->where('cat.id', $categoriaId);
        }

        if ($ubicacion) {
            $qConsumibles->where('sg.ubicacion', 'LIKE', "%{$ubicacion}%");
            $qSeries->where('invs.ubicacion', 'LIKE', "%{$ubicacion}%");
        }

        // Si hay fechas, solo filtramos las series, pero anulamos consumibles.
        if ($fechaInicio && $fechaFin) {
            $qSeries->whereBetween('invs.fecha_adquisicion', [$fechaInicio, $fechaFin]);
            $qConsumibles->whereRaw('1 = 0'); 
        }

        // SOLUCIÓN: Usamos colecciones de Laravel (concat) en lugar de SQL UNION.
        // Esto evita que SQL trunque los textos o las fechas de la segunda tabla.
        if ($tipoFiltro === 'consumibles') {
            $data = $qConsumibles->get();
        } elseif ($tipoFiltro === 'series') {
            $data = $qSeries->get();
        } else {
            $data = $qConsumibles->get()->concat($qSeries->get());
        }

        // Formateo para Exportación
        $exportData = [];
        $headings = ['Tipo', 'Artículo', 'Marca', 'Modelo', 'SKU / Serie', 'Categoría', 'Subcategoría', 'Ubicación', 'Cantidad', 'Unidad', 'Fecha Adquisición', 'Notas'];

        foreach ($data as $row) {
            $exportData[] = [
                $row->tipo_registro,
                $row->nombre,
                $row->marca ?? 'N/A',
                $row->modelo ?? 'N/A',
                $row->sku_serie ?? 'N/A',
                $row->categoria ?? 'N/A',
                $row->subcategoria ?? 'N/A',
                $row->ubicacion ?? 'Sin asignar',
                $row->cantidad,
                $row->unidad_medida,
                $row->fecha_adquisicion ?? 'N/A',
                //$row->estado ?? 'N/A',
                $row->notas ?? 'Ninguna',
            ];
        }

        $filename = "Inventario_Detallado_" . Carbon::now()->format('Ymd_His');

        if ($formato === 'pdf') {
            $html = view('pdf.inventario-detallado', [
                'rows' => $exportData,
                'headings' => $headings,
                'fecha' => Carbon::now()->format('d/m/Y H:i'),
            ])->render();
            return Pdf::loadHTML($html)->setPaper('a4', 'landscape')->download($filename . '.pdf');
        }

        return Excel::download(new \App\Exports\GenericExport($exportData, $headings), $filename . '.xlsx');
    }
    
    public function inventarioDetalladoApi(Request $request)
    {
        // Determinamos si la tabla tiene sku_maestro para enviarlo como 'modelo' en los consumibles
        $modeloConsumible = Schema::hasColumn('catalogo_articulos', 'sku_maestro') 
            ? 'ca.sku_maestro as modelo' 
            : DB::raw('NULL as modelo');
        
        $fechaConsumible = Schema::hasColumn('catalogo_articulos', 'fecha_adquisicion') 
            ? 'ca.fecha_adquisicion' 
            : DB::raw('NULL as fecha_adquisicion');

        // 1. Consulta de Consumibles / Generales
        $consumibles = DB::table('catalogo_articulos as ca')
            ->join('stock_general as sg', 'ca.id', '=', 'sg.articulo_id')
            ->leftJoin('subcategorias as sc', 'ca.subcategoria_id', '=', 'sc.id')
            ->leftJoin('categorias as cat', 'sc.categoria_id', '=', 'cat.id')
            ->where(function ($q) {
                $q->where('ca.es_consumible', true)
                  ->orWhere('ca.requiere_serie', false);
            })
            ->where('sg.cantidad', '>', 0)
            ->whereNull('sg.deleted_at') 
            ->whereNull('ca.deleted_at') 
            ->select(
                DB::raw("'consumible' as row_type"),
                'ca.id as articulo_id',
                DB::raw('NULL as serie_id'), 
                'ca.nombre',
                'ca.marca',                    // Añadimos Marca
                'ca.modelo as modeloarticulo', // Renombramos el modelo del artículo
                $modeloConsumible,             // Mantener alineado el SKU en la columna "modelo"
                $fechaConsumible,              // Fecha de consumo para consumibles, NULL para generales
                'ca.unidad_medida',
                'sc.nombre as subcategoria_nombre',
                'cat.id as categoria_id',
                'cat.nombre as categoria_nombre',
                'sg.cantidad',
                'ca.stock_minimo',
                'sg.ubicacion',
                DB::raw('0 as requiere_serie'),
                DB::raw('NULL as numero_serie_fabricante'),
                DB::raw("'N/A' as estado"),
                DB::raw("NULL as notas")
            );
        
        // 2. Consulta de Series Individuales
        $series = DB::table('inventario_series as invs')
            ->join('catalogo_articulos as ca', 'invs.articulo_id', '=', 'ca.id')
            ->leftJoin('subcategorias as sc', 'ca.subcategoria_id', '=', 'sc.id')
            ->leftJoin('categorias as cat', 'sc.categoria_id', '=', 'cat.id')
            ->where('ca.requiere_serie', true)
            ->whereRaw("UPPER(invs.estado) = 'DISPONIBLE'") 
            ->whereNull('invs.deleted_at') 
            ->select(
                DB::raw("'serie' as row_type"),
                'ca.id as articulo_id',
                'invs.id as serie_id',
                'ca.nombre',
                'ca.marca',                                // Añadimos Marca
                'ca.modelo as modeloarticulo',             // Renombramos el modelo del artículo
                'invs.codigo_interno_generado as modelo',  // Aquí la columna "modelo" lleva el SKU de la serie
                'invs.fecha_adquisicion',                   // Fecha de adquisición para series, NULL para consumibles
                'ca.unidad_medida',
                'sc.nombre as subcategoria_nombre',
                'cat.id as categoria_id',
                'cat.nombre as categoria_nombre',
                DB::raw('1.0 as cantidad'), 
                'ca.stock_minimo',
                'invs.ubicacion',
                DB::raw('1 as requiere_serie'),
                'invs.numero_serie_fabricante',
                'invs.estado',
                'invs.notas'
            );

        // ¡Como ahora ambas tienen exactamente las mismas columnas y en el mismo orden, el UNION funciona perfecto!
        $data = $consumibles->union($series)->get();

        return response()->json([
            'success' => true,
            'data' => $data,
        ]);
    }

    public function dashboardStats()
    {
        // 1. KPIs Básicos
        $totalCatalogo = DB::table('catalogo_articulos')->whereNull('deleted_at')->count();
        $totalConsumibles = DB::table('stock_general')->whereNull('deleted_at')->sum('cantidad');
        $totalSeries = DB::table('inventario_series')->where('estado', 'DISPONIBLE')->whereNull('deleted_at')->count();
        $totalFisico = $totalConsumibles + $totalSeries;

        // 2. Alertas de Bajo Stock (Calculado en tiempo real)
        $bajoStock = DB::table('catalogo_articulos as ca')
            ->whereNull('ca.deleted_at')
            ->where('ca.stock_minimo', '>', 0)
            ->select('ca.id', 'ca.nombre', 'ca.stock_minimo', 'ca.unidad_medida', 'ca.es_consumible')
            ->get()
            ->map(function ($item) {
                // Obtenemos el stock real dependiendo de qué tipo de artículo es
                $stock = $item->es_consumible 
                    ? DB::table('stock_general')->where('articulo_id', $item->id)->whereNull('deleted_at')->sum('cantidad')
                    : DB::table('inventario_series')->where('articulo_id', $item->id)->where('estado', 'DISPONIBLE')->whereNull('deleted_at')->count();
                
                $item->stock_actual = $stock;
                return $item;
            })
            ->filter(function ($item) {
                return $item->stock_actual <= $item->stock_minimo;
            })
            ->values();

        // 3. Distribución por Categoría
        $categorias = DB::table('catalogo_articulos as ca')
            ->join('subcategorias as sc', 'ca.subcategoria_id', '=', 'sc.id')
            ->join('categorias as c', 'sc.categoria_id', '=', 'c.id')
            ->whereNull('ca.deleted_at')
            ->select('c.nombre', DB::raw('COUNT(ca.id) as total_articulos'))
            ->groupBy('c.nombre')
            ->orderByDesc('total_articulos')
            ->get();

        // 4. Últimos Movimientos (Entradas / Salidas)
        $tipoColumn = Schema::hasColumn('movimiento_inventario', 'tipo') ? 'tipo' : 'tipo_movimiento';
        
        $columnaNombreUsuario = 'u.nombre'; // valor por defecto
            if (Schema::hasColumn('usuarios_sistema', 'nombre_usuario')) {
                $columnaNombreUsuario = 'u.nombre_usuario';
            } elseif (Schema::hasColumn('usuarios_sistema', 'name')) {
                $columnaNombreUsuario = 'u.name';
            }

        $movimientos = DB::table('movimiento_inventario as mi')
            ->leftJoin('usuarios_sistema as u', 'mi.usuario_id', '=', 'u.id') // <-- Corregido a usuarios_sistema
            ->whereNull('mi.deleted_at') 
            ->select(
                'mi.id', 
                'mi.tipo_movimiento as tipo', // <-- Corregido a tipo_movimiento
                'mi.fecha_hora', 
                DB::raw("$columnaNombreUsuario as usuario"), 
                'mi.notas'
            )
            ->orderBy('mi.fecha_hora', 'desc')
            ->take(5)
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'kpis' => [
                    'total_catalogo' => $totalCatalogo,
                    'total_fisico' => $totalFisico,
                    'total_consumibles' => $totalConsumibles,
                    'total_series' => $totalSeries,
                    'total_alertas' => $bajoStock->count(),
                ],
                'bajo_stock' => $bajoStock->take(6), // Solo mandamos los peores 6 al dashboard
                'categorias' => $categorias,
                'movimientos_recientes' => $movimientos
            ]
        ]);
    }

    public function importarCSV(Request $request)
    {
        // 1. Validación básica para asegurarnos de que la petición tiene el formato correcto
        $request->validate([
            'lineas' => 'required|array|min:1',
            'lineas.*.nombre' => 'required|string',
            'proveedor_id' => 'nullable|integer',
            'notas' => 'nullable|string',
        ]);

        $lineas = $request->input('lineas');

        DB::beginTransaction();
        try {
            // 2. Crear el registro maestro de "Entrada" en la tabla de movimientos
            $movimientoId = $this->insertMovimiento('entrada', [
                'proveedor_id' => $request->input('proveedor_id'),
                'notas' => $request->input('notas') ?? 'Ingreso masivo por plantilla CSV',
            ]);

            $indexSerie = 1;

            foreach ($lineas as $linea) {
                // 3. Extraer y limpiar datos de cada fila del Excel (CSV)
                $nombre = trim($linea['nombre']);
                $marca = !empty($linea['marca']) ? trim($linea['marca']) : null;
                $modelo = !empty($linea['modelo']) ? trim($linea['modelo']) : null; // Este es el modelo físico real
                $serieFisica = !empty($linea['serie']) ? trim($linea['serie']) : null;
                $subcategoriaNombre = !empty($linea['subcategoria']) ? trim($linea['subcategoria']) : null;
                $ubicacion = !empty($linea['ubicacion']) ? trim($linea['ubicacion']) : null;
                $cantidad = (float) ($linea['cantidad'] ?? 1);
                $notasLinea = !empty($linea['notas']) ? trim($linea['notas']) : null;

                $requiereSerie = $serieFisica !== null;

                // 4. Resolver Subcategoría
                $subcategoriaId = null;
                if ($subcategoriaNombre) {
                    $sub = DB::table('subcategorias')->where('nombre', $subcategoriaNombre)->first();
                    if ($sub) {
                        $subcategoriaId = $sub->id;
                    }
                }
                
                if (!$subcategoriaId) {
                    $subDefault = DB::table('subcategorias')->first();
                    $subcategoriaId = $subDefault ? $subDefault->id : 1; 
                }

                // 5. Buscar o Crear el Artículo en el Catálogo Maestro (Ignorando los eliminados)
                $articulo = DB::table('catalogo_articulos')
                    ->whereNull('deleted_at') // <-- FIJA ESTA LÍNEA AQUÍ (Ignora los borrados en pruebas)
                    ->where('nombre', $nombre)
                    ->where(function ($q) use ($marca) {
                        $marca === null ? $q->whereNull('marca') : $q->where('marca', $marca);
                    })
                    ->where(function ($q) use ($modelo) {
                        $modelo === null ? $q->whereNull('modelo') : $q->where('modelo', $modelo);
                    })
                    ->first();

                if (!$articulo) {
                    // NO EXISTE (o el que existía estaba eliminado): Crear nuevo artículo
                    $articuloId = DB::table('catalogo_articulos')->insertGetId([
                        'subcategoria_id' => $subcategoriaId,
                        'nombre' => $nombre,
                        'marca' => $marca,
                        'modelo' => $modelo, 
                        'requiere_serie' => $requiereSerie,
                        'es_consumible' => !$requiereSerie,
                        'unidad_medida' => 'PZA',
                        'stock_minimo' => 0,
                        'created_at' => Carbon::now(),
                        'updated_at' => Carbon::now(),
                    ]);

                    $prefijo = strtoupper(substr(preg_replace('/[^A-Za-z0-9]/', '', $nombre), 0, 3));
                    $skuGeneral = 'SM-' . str_pad($prefijo, 3, 'X') . '-' . str_pad($articuloId, 5, '0', STR_PAD_LEFT);

                    DB::table('catalogo_articulos')
                        ->where('id', $articuloId)
                        ->update(['sku_maestro' => $skuGeneral]);

                } else {
                    // YA EXISTÍA ACTIVO: Extraer ID
                    $articuloId = $articulo->id;
                }

                // 6. Ingresar al Inventario Físico y Registrar el Detalle del Movimiento
                if ($requiereSerie) {
                    // Generar código interno único (SKU Master / SLA)
                    $articulo = DB::table('catalogo_articulos')->where('id', $articuloId)->first();
                    $skuMaestro = $articulo->sku_maestro;
                    if ($indexSerie === 1) { // Solo calcular una vez por artículo en el lote
                        $secuencial = $this->nextSequence($articuloId);
                    }
                    $skuGenerado = $this->generateChildSku($skuMaestro, $secuencial++);

                    // Inserción a Inventario_Series
                    $serieId = DB::table('inventario_series')->insertGetId([
                        'articulo_id' => $articuloId,
                        'numero_serie_fabricante' => $serieFisica,
                        'codigo_interno_generado' => $skuGenerado,
                        'estado' => 'DISPONIBLE',
                        'ubicacion' => $ubicacion,
                        'fecha_adquisicion' => Carbon::now()->toDateString(),
                        'notas' => $notasLinea,
                        'created_at' => Carbon::now(),
                        'updated_at' => Carbon::now(),
                    ]);

                    // Historial del Movimiento (Cantidad forzada a 1 por ser unidad única)
                    $this->insertDetalle($movimientoId, [
                        'articulo_id' => $articuloId,
                        'serie_id' => $serieId,
                        'cantidad' => 1,
                    ]);

                } else {
                    // Inserción a Stock General (Consumible/Mixto sin serie)
                    $this->incrementStock($articuloId, $cantidad, $ubicacion);
                    
                    // Historial del Movimiento (Cantidades en volumen)
                    $this->insertDetalle($movimientoId, [
                        'articulo_id' => $articuloId,
                        'serie_id' => null, 
                        'cantidad' => $cantidad,
                    ]);
                }
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'El inventario se ha ingresado correctamente desde la plantilla CSV.',
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Ocurrió un error en el servidor al guardar los datos: ' . $e->getMessage()
            ], 500);
        }
    }
    /**
     * Catálogo completo de artículos activos para el formulario de entrada.
     * Devuelve requiere_serie y es_consumible reales del catálogo,
     * sin filtrar por stock existente.
     */
    public function catalogoEntradaApi(Request $request)
    {
        $query = DB::table('catalogo_articulos as ca')
            ->leftJoin('stock_general as sg', 'ca.id', '=', 'sg.articulo_id')
            ->leftJoin('subcategorias as sc', 'ca.subcategoria_id', '=', 'sc.id')
            ->leftJoin('categorias as cat', 'sc.categoria_id', '=', 'cat.id');

        if (Schema::hasColumn('catalogo_articulos', 'activo')) {
            $query->where('ca.activo', true);
        }

        $select = [
            'ca.id',
            'ca.nombre',
            'ca.modelo',
            'ca.unidad_medida',
            'ca.stock_minimo',
            'ca.requiere_serie',
            'ca.es_consumible',
            'sc.nombre as subcategoria_nombre',
            'cat.id as categoria_id',
            'cat.nombre as categoria_nombre',
            DB::raw('COALESCE(sg.cantidad, 0) as cantidad'),
            DB::raw('COALESCE(sg.cantidad, 0) as stock'),
            'sg.ubicacion',
        ];

        $select[] = Schema::hasColumn('catalogo_articulos', 'tipo_articulo')
            ? 'ca.tipo_articulo'
            : DB::raw("'herramienta' as tipo_articulo");

        return response()->json([
            'success' => true,
            'data'    => $query->select($select)->orderBy('ca.nombre')->get(),
        ]);
    }

    public function registrarEntrada(Request $request)
    {
        $request->validate([
            'proveedor_id'    => 'nullable|integer',
            'orden_venta_id' => 'nullable|integer',
            'notas'           => 'nullable|string',
            'detalles'        => 'required|array|min:1',
            'detalles.*.articulo_id' => 'required|integer',
            'detalles.*.cantidad'    => 'required|numeric|min:1',
            'detalles.*.ubicacion'   => 'nullable|string',
            'detalles.*.numero_serie_fabricante' => 'nullable|string',
        ]);

        try {
            DB::beginTransaction();

            // 1. Crear el movimiento maestro
            $movimientoId = DB::table('movimiento_inventario')->insertGetId([
                'fecha_hora'      => Carbon::now(),
                'tipo_movimiento' => 'ENTRADA',
                'usuario_id'      => auth()->id(),
                'proveedor_id'    => $request->proveedor_id,
                'orden_venta_id' => $request->orden_venta_id,
                'notas'           => $request->notas,
                'created_at'      => Carbon::now(),
                'updated_at'      => Carbon::now(),
            ]);

            $skusGenerados = [];

            // 2. Procesar cada artículo del carrito
            foreach ($request->detalles as $det) {
                $articulo = DB::table('catalogo_articulos')
                ->where('id', $det['articulo_id'])
                ->whereNull('deleted_at') // <-- Ignorar artículos eliminados
                ->first();

                if ($articulo->requiere_serie) {
                    // Obtener o generar el sku_maestro del artículo
                    $skuMaestro = $articulo->sku_maestro ?? null;
                    if (empty($skuMaestro)) {
                        $prefijo = strtoupper(substr(preg_replace('/[^A-Za-z0-9]/', '', $articulo->nombre ?? ''), 0, 3));
                        $prefijo = str_pad($prefijo, 3, 'X');
                        $skuMaestro = 'SM-' . $prefijo . '-' . str_pad((string) $articulo->id, 5, '0', STR_PAD_LEFT);
                        DB::table('catalogo_articulos')
                            ->where('id', $det['articulo_id'])
                            ->update(['sku_maestro' => $skuMaestro, 'updated_at' => Carbon::now()]);
                    }

                    // Secuencial global por artículo (no por lote)
                    $secuencial = $this->nextSequence((int) $det['articulo_id']);

                    for ($i = 0; $i < $det['cantidad']; $i++) {
                        $codigoInterno = $this->generateChildSku($skuMaestro, $secuencial++);

                        $serieId = DB::table('inventario_series')->insertGetId([
                            'articulo_id'             => $det['articulo_id'],
                            'numero_serie_fabricante' => $det['numero_serie_fabricante'] ?? null,
                            'codigo_interno_generado' => $codigoInterno,
                            'estado'                  => 'DISPONIBLE',
                            'ubicacion'               => $det['ubicacion'] ?? null,
                            'fecha_adquisicion'       => Carbon::now()->toDateString(),
                            'notas'                   => $det['notas'] ?? 'Nuevo',
                            'created_at'              => Carbon::now(),
                            'updated_at'              => Carbon::now(),
                        ]);

                        DB::table('detalle_movimiento')->insert([
                            'movimiento_id' => $movimientoId,
                            'articulo_id'   => $det['articulo_id'],
                            'cantidad'      => 1,
                            'serie_id'      => $serieId,
                            'created_at'    => Carbon::now(),
                            'updated_at'    => Carbon::now(),
                        ]);

                        $skusGenerados[] = [
                            'nombre' => $articulo->nombre,
                            'sku'    => $codigoInterno,
                            'serie'  => $det['numero_serie_fabricante'] ?? null,
                        ];
                    }
                } else {
                    // Si es general/consumible
                    $stock = DB::table('stock_general')->where('articulo_id', $det['articulo_id'])->first();

                    if ($stock) {
                        DB::table('stock_general')
                            ->where('articulo_id', $det['articulo_id'])
                            ->increment('cantidad', $det['cantidad']);
                    } else {
                        DB::table('stock_general')->insert([
                            'articulo_id' => $det['articulo_id'],
                            'cantidad'    => $det['cantidad'],
                            'ubicacion'   => $det['ubicacion'] ?? null,
                            'created_at'  => Carbon::now(),
                            'updated_at'  => Carbon::now(),
                        ]);
                    }

                    DB::table('detalle_movimiento')->insert([
                        'movimiento_id' => $movimientoId,
                        'articulo_id'   => $det['articulo_id'],
                        'cantidad'      => $det['cantidad'],
                        'created_at'    => Carbon::now(),
                        'updated_at'    => Carbon::now(),
                    ]);
                }
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Entrada de inventario registrada con éxito.',
                'skus_generados' => $skusGenerados // Se devuelve para el modal de códigos de barras
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['success' => false, 'message' => 'Error al registrar: ' . $e->getMessage()], 500);
        }
    }

    public function actualizarNotaSerie(Request $request, $id)
    {
        $request->validate(['notas' => 'nullable|string']);

        try {
            DB::table('inventario_series')
                ->where('id', $id)
                ->update(['notas' => $request->notas, 'updated_at' => Carbon::now()]);

            return response()->json(['success' => true, 'message' => 'Nota actualizada correctamente.']);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => 'Error al actualizar: ' . $e->getMessage()], 500);
        }
    }

    public function seriesDisponiblesPorArticulo(int $id)
    {
        $series = DB::table('inventario_series')
            ->where('articulo_id', $id)
            ->whereRaw("UPPER(estado) = 'DISPONIBLE'")
            ->select('id', 'articulo_id', 'numero_serie_fabricante', 'codigo_interno_generado', 'estado', 'ubicacion')
            ->orderBy('codigo_interno_generado')
            ->get();

        return response()->json(['success' => true, 'data' => $series]);
    }

    public function buscarSku(string $codigo)

    {
        $codigo = strtoupper(trim($codigo));
        $serie = DB::table('inventario_series as is')
            ->join('catalogo_articulos as ca', 'is.articulo_id', '=', 'ca.id')
            ->leftJoin('stock_general as sg', 'ca.id', '=', 'sg.articulo_id')
            ->whereRaw('UPPER(is.codigo_interno_generado) = ?', [$codigo])
            ->select(
                'is.id as serie_id',
                'is.codigo_interno_generado as sku',
                DB::raw("'serie' as tipo_codigo"),
                'is.estado',
                'is.ubicacion',
                'ca.id as articulo_id',
                'ca.nombre as articulo',
                'ca.modelo',
                'ca.unidad_medida',
                'ca.es_consumible',
                DB::raw('COALESCE(sg.cantidad, 0) as stock')
            )
            ->first();

        if ($serie) {
            return response()->json(['success' => true, 'data' => $serie]);
        }

        if (Schema::hasColumn('catalogo_articulos', 'sku_maestro')) {
            $articulo = DB::table('catalogo_articulos as ca')
                ->leftJoin('stock_general as sg', 'ca.id', '=', 'sg.articulo_id')
                ->whereRaw('UPPER(ca.sku_maestro) = ?', [$codigo])
                ->whereNull('ca.deleted_at')
                ->select(
                    'ca.id as articulo_id',
                    'ca.sku_maestro as sku',
                    DB::raw("'maestro' as tipo_codigo"),
                    DB::raw("'DISPONIBLE' as estado"),
                    'ca.nombre as articulo',
                    'ca.modelo',
                    'ca.unidad_medida',
                    'ca.es_consumible',
                    DB::raw($this->articleTypeSelect() . ' as tipo_articulo'),
                    DB::raw('COALESCE(sg.cantidad, 0) as stock')
                )
                ->first();

            if ($articulo && (bool) $articulo->es_consumible) {
                return response()->json(['success' => true, 'data' => $articulo]);
            }

            if ($articulo) {
                return response()->json([
                    'success' => false,
                    'message' => 'Este SKU maestro requiere escanear una serie individual.',
                ], 422);
            }
        }

        return response()->json(['success' => false, 'message' => 'SKU no encontrado.'], 404);
    }

    public function registrarSalida(Request $request)
    {
        // Validamos los datos permitiendo ambos formatos (Individual o Array de detalles)
        $request->validate([
            'empleado_id'  => 'nullable|integer',
            'proveedor_id' => 'nullable|integer',
            'notas'        => 'nullable|string',
            'detalles'     => 'nullable|array', // Para Salida.jsx
            // Los siguientes son para mantener compatible la Salida Rápida:
            'articulo_id'  => 'nullable|integer',
            'cantidad'     => 'nullable|numeric|min:1',
            'serie_id'     => 'nullable|integer',
        ]);

        try {
            DB::beginTransaction();

            // 1. Crear el movimiento principal
            $movimientoId = DB::table('movimiento_inventario')->insertGetId([
                'fecha_hora'      => Carbon::now(),
                'tipo_movimiento' => 'SALIDA',
                'usuario_id'      => auth()->id(),
                'empleado_id'     => $request->empleado_id,  // Ahora sí se guardan
                'proveedor_id'    => $request->proveedor_id, // Ahora sí se guardan
                'orden_venta_id'  => null, // Mantenemos null como solicitaste
                'notas'           => $request->notas,
                'created_at'      => Carbon::now(),
                'updated_at'      => Carbon::now(),
            ]);

            // 2. Normalizar los datos: Convertimos a Array sea de donde venga
            $detalles = $request->has('detalles') && is_array($request->detalles) 
                ? $request->detalles 
                : [[
                    'articulo_id' => $request->articulo_id,
                    'cantidad'    => $request->cantidad,
                    'serie_id'    => $request->serie_id,
                ]];

            // 3. Procesar cada artículo en el carrito
            foreach ($detalles as $det) {
                DB::table('detalle_movimiento')->insert([
                    'movimiento_id'     => $movimientoId,
                    'articulo_id'       => $det['articulo_id'],
                    'cantidad'          => $det['cantidad'],
                    'serie_id'          => $det['serie_id'] ?? null,
                    'estado_devolucion' => null,
                    'created_at'        => Carbon::now(),
                    'updated_at'        => Carbon::now(),
                ]);

                // Actualizar Stock o Aplicar Soft Delete
                if (!empty($det['serie_id'])) {
                    DB::table('inventario_series')
                        ->where('id', $det['serie_id'])
                        ->update(['deleted_at' => Carbon::now()]);
                } else {
                    $stock = DB::table('stock_general')
                        ->where('articulo_id', $det['articulo_id'])
                        ->first();

                    if (!$stock || $stock->cantidad < $det['cantidad']) {
                        DB::rollBack();
                        return response()->json(['success' => false, 'message' => 'Stock insuficiente en uno de los artículos.'], 400);
                    }

                    DB::table('stock_general')
                        ->where('articulo_id', $det['articulo_id'])
                        ->decrement('cantidad', $det['cantidad']);
                }
            }

            DB::commit();
            return response()->json(['success' => true, 'message' => 'Salida registrada correctamente.']);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['success' => false, 'message' => 'Error: ' . $e->getMessage()], 500);
        }
    }

    public function registrarPrestamo(Request $request)
    {
        $validated = $request->validate([
            'empleado_id' => 'required|integer|exists:empleados,id',
            'items' => 'required|array|min:1|max:100',
            'items.*.codigo_sku' => 'nullable|string|max:100',
            'items.*.serie_id' => 'nullable|integer',
            'items.*.articulo_id' => 'nullable|integer|exists:catalogo_articulos,id',
            'items.*.cantidad' => 'nullable|numeric|min:0.01',
            'notas' => 'nullable|string|max:500',
        ]);

        $data = DB::transaction(function () use ($validated) {
            $movId = $this->insertMovimiento('prestamo', [
                'empleado_id' => $validated['empleado_id'],
                'notas' => $validated['notas'] ?? null,
            ]);

            $registrados = [];
            foreach ($validated['items'] as $item) {
                $serie = null;
                if (!empty($item['codigo_sku'])) {
                    $serieId = DB::table('inventario_series')->whereRaw('UPPER(codigo_interno_generado) = ?', [strtoupper(trim($item['codigo_sku']))])->value('id');
                    if (!$serieId) {
                        abort(response()->json(['success' => false, 'message' => "SKU {$item['codigo_sku']} no encontrado."], 404));
                    }
                    $serie = $this->serieDisponible((int) $serieId);
                } elseif (!empty($item['serie_id'])) {
                    $serie = $this->serieDisponible((int) $item['serie_id']);
                }

                $articuloId = $serie ? (int) $serie->articulo_id : (int) ($item['articulo_id'] ?? 0);
                $cantidad = $serie ? 1 : (float) ($item['cantidad'] ?? 1);
                if (!$articuloId) {
                    abort(response()->json(['success' => false, 'message' => 'Cada fila debe tener un SKU o artículo válido.'], 422));
                }

                $this->incrementStock($articuloId, -$cantidad);
                $this->insertDetalle($movId, [
                    'articulo_id' => $articuloId,
                    'serie_id' => $serie->id ?? null,
                    'cantidad' => $cantidad,
                ]);

                if ($serie) {
                    $this->updateSerieEstado((int) $serie->id, 'ASIGNADO');
                    $asignacion = [
                        'empleado_id' => $validated['empleado_id'],
                        'serie_id' => $serie->id,
                        'fecha_entrega' => Carbon::now(),
                        'notas_estado_fisico' => $validated['notas'] ?? '',
                    ];
                    if (Schema::hasColumn('asignaciones_activos', 'created_at')) {
                        $asignacion['created_at'] = Carbon::now();
                        $asignacion['updated_at'] = Carbon::now();
                    }
                    DB::table('asignaciones_activos')->insert($asignacion);
                }

                $registrados[] = [
                    'articulo_id' => $articuloId,
                    'serie_id' => $serie->id ?? null,
                    'sku' => $serie->codigo_interno_generado ?? null,
                    'cantidad' => $cantidad,
                ];
            }

            return ['movimiento_id' => $movId, 'items' => $registrados];
        });

        return response()->json(['success' => true, 'message' => 'Préstamo registrado correctamente.', 'data' => $data]);
    }

    public function registrarDevolucion(Request $request)
    {
        $validated = $request->validate([
            'items' => 'required|array|min:1|max:100',
            'items.*.codigo_sku' => 'nullable|string|max:100',
            'items.*.serie_id' => 'nullable|integer',
            'notas' => 'nullable|string|max:500',
        ]);

        $data = DB::transaction(function () use ($validated) {
            $movId = $this->insertMovimiento('devolucion', ['notas' => $validated['notas'] ?? null]);
            foreach ($validated['items'] as $item) {
                $serieId = $item['serie_id'] ?? null;
                if (!$serieId && !empty($item['codigo_sku'])) {
                    $serieId = DB::table('inventario_series')->whereRaw('UPPER(codigo_interno_generado) = ?', [strtoupper(trim($item['codigo_sku']))])->value('id');
                }
                if (!$serieId) {
                    abort(response()->json(['success' => false, 'message' => 'SKU no encontrado.'], 404));
                }

                $serie = DB::table('inventario_series')->where('id', $serieId)->lockForUpdate()->first();
                $this->insertDetalle($movId, ['articulo_id' => $serie->articulo_id, 'serie_id' => $serie->id, 'cantidad' => 1]);
                $this->incrementStock((int) $serie->articulo_id, 1);
                $this->updateSerieEstado((int) $serie->id, 'DISPONIBLE');
                DB::table('asignaciones_activos')->where('serie_id', $serie->id)->whereNull('fecha_devolucion')->update(['fecha_devolucion' => Carbon::now()]);
            }

            return ['movimiento_id' => $movId];
        });

        return response()->json(['success' => true, 'message' => 'Devolución registrada correctamente.', 'data' => $data]);
    }

    public function registrarMovimiento(Request $request)
    {
        return match ($request->input('tipo')) {
            'entrada' => $this->registrarEntrada($request),
            'salida' => $this->registrarSalida($request),
            'prestamo' => $this->registrarPrestamo(new Request([
                'empleado_id' => $request->input('empleado_id'),
                'notas' => $request->input('notas'),
                'items' => [[
                    'serie_id' => $request->input('serie_id'),
                    'articulo_id' => $request->input('articulo_id'),
                    'cantidad' => $request->input('cantidad', 1),
                ]],
            ])),
            'devolucion' => $this->registrarDevolucion(new Request([
                'notas' => $request->input('notas'),
                'items' => [['serie_id' => $request->input('serie_id')]],
            ])),
            default => response()->json(['success' => false, 'message' => 'Tipo de movimiento inválido.'], 422),
        };
    }

    private function nextSequence(int $articuloId): int
    {
        $ultimo = DB::table('inventario_series')
            ->where('articulo_id', $articuloId)
            ->whereNotNull('codigo_interno_generado')
            ->whereNull('deleted_at')
            ->max(DB::raw("CAST(SPLIT_PART(codigo_interno_generado, '-', -1) AS INTEGER)"));
        // Para MySQL en lugar de SPLIT_PART:
        // ->max(DB::raw("CAST(SUBSTRING_INDEX(codigo_interno_generado, '-', -1) AS UNSIGNED)"));

        return ($ultimo ?? 0) + 1;
    }

    private function movimientosBase()
    {
        $tipoColumn = $this->tipoColumn();
        $query = DB::table('movimiento_inventario as mi')
            ->join('usuarios_sistema as u', 'mi.usuario_id', '=', 'u.id')
            ->leftJoin('empleados as e', 'mi.empleado_id', '=', 'e.id')
            ->leftJoin('detalle_movimiento as dm', 'mi.id', '=', 'dm.movimiento_id')
            ->leftJoin('catalogo_articulos as ca', 'dm.articulo_id', '=', 'ca.id')
            ->leftJoin('inventario_series as is', 'dm.serie_id', '=', 'is.id');

        if (Schema::hasColumn('movimiento_inventario', 'deleted_at')) {
            $query->whereNull('mi.deleted_at');
        }

        return $query->select(
            'mi.id',
            DB::raw("LOWER(CAST(mi.{$tipoColumn} AS TEXT)) as tipo"),
            'mi.fecha_hora',
            'mi.notas',
            'u.nombre_usuario',
            'e.nombre_completo as empleado',
            'ca.nombre as articulo',
            'ca.modelo',
            'dm.id as detalle_id',
            'dm.cantidad',
            'dm.serie_id',
            'is.codigo_interno_generado as sku'
        );
    }

    public function movimientosApi(Request $request)
    {
        $tipoColumn = $this->tipoColumn();
        $movs = $this->movimientosBase()
            ->when($request->filled('tipo'), function ($query) use ($request, $tipoColumn) {
                $value = Schema::hasColumn('movimiento_inventario', 'tipo') ? strtolower($request->tipo) : strtoupper($request->tipo);
                $query->where("mi.{$tipoColumn}", $value);
            })
            ->orderByDesc('mi.fecha_hora')
            ->paginate(20);

        return response()->json($movs);
    }

    public function movimientoDetalle(int $id)
    {
        $movimiento = $this->movimientosBase()->where('mi.id', $id)->first();
        if (!$movimiento) {
            return response()->json(['success' => false, 'message' => 'Movimiento no encontrado.'], 404);
        }

        return response()->json(['success' => true, 'data' => $movimiento]);
    }

    public function actualizarMovimiento(Request $request, int $id)
    {
        $validated = $request->validate([
            'notas' => 'nullable|string|max:500',
            'empleado_id' => 'nullable|integer|exists:empleados,id',
        ]);

        $payload = [];
        if (array_key_exists('notas', $validated)) {
            $payload['notas'] = $validated['notas'];
        }
        if (array_key_exists('empleado_id', $validated)) {
            $payload['empleado_id'] = $validated['empleado_id'];
        }
        if (Schema::hasColumn('movimiento_inventario', 'updated_at')) {
            $payload['updated_at'] = Carbon::now();
        }

        DB::table('movimiento_inventario')->where('id', $id)->update($payload);

        return response()->json(['success' => true, 'message' => 'Movimiento actualizado correctamente.']);
    }

    public function eliminarMovimiento(int $id)
    {
        DB::transaction(function () use ($id) {
            $tipoColumn = $this->tipoColumn();
            $mov = DB::table('movimiento_inventario')->where('id', $id)->lockForUpdate()->first();
            if (!$mov) {
                abort(response()->json(['success' => false, 'message' => 'Movimiento no encontrado.'], 404));
            }

            $tipo = strtolower((string) $mov->{$tipoColumn});
            $detalles = DB::table('detalle_movimiento')->where('movimiento_id', $id)->get();

            foreach ($detalles as $detalle) {
                if ($detalle->serie_id) {
                    $later = DB::table('detalle_movimiento as dm')
                        ->join('movimiento_inventario as mi', 'dm.movimiento_id', '=', 'mi.id')
                        ->where('dm.serie_id', $detalle->serie_id)
                        ->where('mi.fecha_hora', '>', $mov->fecha_hora);
                    if (Schema::hasColumn('movimiento_inventario', 'deleted_at')) {
                        $later->whereNull('mi.deleted_at');
                    }
                    if ($later->exists()) {
                        abort(response()->json([
                            'success' => false,
                            'message' => 'No se puede eliminar: el SKU tiene movimientos posteriores.',
                        ], 409));
                    }
                }

                $cantidad = (float) ($detalle->cantidad ?? 1);
                if ($detalle->articulo_id) {
                    $delta = match ($tipo) {
                        'entrada' => -$cantidad,
                        'salida', 'prestamo' => $cantidad,
                        'devolucion' => -$cantidad,
                        default => 0,
                    };
                    if ($delta !== 0) {
                        $this->incrementStock((int) $detalle->articulo_id, $delta);
                    }
                }

                if ($detalle->serie_id) {
                    $estado = match ($tipo) {
                        'salida', 'prestamo' => 'DISPONIBLE',
                        'devolucion' => 'ASIGNADO',
                        default => null,
                    };
                    if ($estado) {
                        $this->updateSerieEstado((int) $detalle->serie_id, $estado);
                    }
                }
            }

            $payload = ['notas' => trim(($mov->notas ?? '') . "\nMovimiento cancelado desde sistema.")];
            if (Schema::hasColumn('movimiento_inventario', 'deleted_at')) {
                $payload['deleted_at'] = Carbon::now();
            }
            if (Schema::hasColumn('movimiento_inventario', 'updated_at')) {
                $payload['updated_at'] = Carbon::now();
            }
            DB::table('movimiento_inventario')->where('id', $id)->update($payload);
        });

        return response()->json(['success' => true, 'message' => 'Movimiento eliminado correctamente.']);
    }

    private function articleTypeSelect(): string
    {
        if (Schema::hasColumn('catalogo_articulos', 'tipo_articulo')) {
            return 'ca.tipo_articulo';
        }

        return "CASE WHEN ca.es_consumible THEN 'venta' ELSE 'herramienta' END";
    }
}
