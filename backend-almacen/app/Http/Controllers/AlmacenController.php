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

    private function incrementStock(int $articuloId, float $delta, ?string $ubicacion = null): void
    {
        $stock = DB::table('stock_general')->where('articulo_id', $articuloId)->lockForUpdate()->first();
        $cantidad = $stock ? (float) $stock->cantidad + $delta : $delta;

        if ($cantidad < 0) {
            abort(response()->json([
                'success' => false,
                'message' => 'No hay suficiente stock para completar la operación.',
            ], 422));
        }

        if ($stock) {
            $update = ['cantidad' => $cantidad];
            if ($ubicacion !== null && Schema::hasColumn('stock_general', 'ubicacion')) {
                $update['ubicacion'] = $ubicacion;
            }
            if (Schema::hasColumn('stock_general', 'updated_at')) {
                $update['updated_at'] = Carbon::now();
            }
            DB::table('stock_general')->where('articulo_id', $articuloId)->update($update);
            return;
        }

        $payload = ['articulo_id' => $articuloId, 'cantidad' => max(0, $cantidad), 'ubicacion' => $ubicacion];
        if (Schema::hasColumn('stock_general', 'created_at')) {
            $payload['created_at'] = Carbon::now();
            $payload['updated_at'] = Carbon::now();
        }
        DB::table('stock_general')->insert($payload);
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
                'ca.id', 'ca.nombre', 'ca.modelo', 'ca.unidad_medida',
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

    public function registrarEntrada(Request $request)
    {
        $validated = $request->validate([
            'articulo_id'    => 'required|integer|exists:catalogo_articulos,id',
            'modelo'         => 'nullable|string|max:150',
            'tipo_articulo'  => 'nullable|in:venta,herramienta,mixto',
            'proveedor_id'   => 'nullable|integer|exists:proveedores,id',
            'cantidad'       => 'required|integer|min:1|max:500',
            'ubicacion'      => 'nullable|string|max:50',
            'notas'          => 'nullable|string|max:500',
            'orden_compra_id'=> 'nullable|integer|exists:ordenes_compra,id',
        ]);

        $data = DB::transaction(function () use ($validated) {
            $articulo = DB::table('catalogo_articulos')->where('id', $validated['articulo_id'])->lockForUpdate()->first();

            $articuloUpdate = [];
            if (!empty($validated['modelo'])) {
                $articuloUpdate['modelo'] = trim($validated['modelo']);
            }
            if (!empty($validated['tipo_articulo']) && Schema::hasColumn('catalogo_articulos', 'tipo_articulo')) {
                $articuloUpdate['tipo_articulo'] = $validated['tipo_articulo'];
            }
            if ($articuloUpdate) {
                if (Schema::hasColumn('catalogo_articulos', 'updated_at')) {
                    $articuloUpdate['updated_at'] = Carbon::now();
                }
                DB::table('catalogo_articulos')->where('id', $validated['articulo_id'])->update($articuloUpdate);
            }

            $movId = $this->insertMovimiento('entrada', [
                'proveedor_id' => $validated['proveedor_id'] ?? null,
                'notas' => $validated['notas'] ?? null,
            ]);

            $this->insertDetalle($movId, [
                'articulo_id' => $validated['articulo_id'],
                'cantidad' => $validated['cantidad'],
            ]);

            $this->incrementStock($validated['articulo_id'], (float) $validated['cantidad'], $validated['ubicacion'] ?? null);

            $tipoArticulo = $validated['tipo_articulo'] ?? ($articulo->tipo_articulo ?? 'herramienta');
            $esConsumible = (bool) ($articulo->es_consumible ?? false);
            $skus = [];

            if (!$esConsumible) {
                $masterSku = Schema::hasColumn('catalogo_articulos', 'sku_maestro')
                    ? ($articulo->sku_maestro ?? null)
                    : null;

                $masterSku = $masterSku ?: $this->generateSku((int) $validated['articulo_id'], 0);
                $conteoActual = DB::table('inventario_series')
                    ->where('articulo_id', $validated['articulo_id'])
                    ->count();

                for ($i = 1; $i <= (int) $validated['cantidad']; $i++) {
                    $sku = $this->generateChildSku($masterSku, $conteoActual + $i);
                    $payload = [
                        'articulo_id' => $validated['articulo_id'],
                        'proveedor_id' => $validated['proveedor_id'] ?? null,
                        'codigo_interno_generado' => $sku,
                        'estado' => 'DISPONIBLE',
                        'ubicacion' => $validated['ubicacion'] ?? null,
                    ];
                    if (Schema::hasColumn('inventario_series', 'created_at')) {
                        $payload['created_at'] = Carbon::now();
                        $payload['updated_at'] = Carbon::now();
                    }
                    DB::table('inventario_series')->insert($payload);
                    $skus[] = $sku;
                }
            }

            // Si viene vinculado a una OC, actualizar cantidades recibidas y estado
            if (!empty($validated['orden_compra_id'])) {
                OrdenCompraController::registrarRecepcion(
                    (int) $validated['orden_compra_id'],
                    (int) $validated['articulo_id'],
                    (int) $validated['cantidad']
                );
            }

            return [
                'movimiento_id' => $movId,
                'tipo'          => $esConsumible ? 'consumible' : 'series',
                'articulo'      => [
                    'id'           => $articulo->id,
                    'nombre'       => $articulo->nombre,
                    'modelo'       => $validated['modelo'] ?? $articulo->modelo,
                    'tipo_articulo'=> $tipoArticulo,
                    'es_consumible'=> $esConsumible,
                    'sku_maestro'  => $articulo->sku_maestro ?? null,
                ],
                'skus'           => $skus,
                'skus_generados' => $skus,
                'cantidad'       => (int) $validated['cantidad'],
                'orden_compra_id'=> $validated['orden_compra_id'] ?? null,
            ];
        });

        return response()->json([
            'success' => true,
            'message' => $data['tipo'] === 'consumible'
                ? 'Entrada de consumible registrada correctamente.'
                : 'Series generadas correctamente.',
            'data' => $data,
        ]);
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
        $validated = $request->validate([
            'codigo_sku' => 'nullable|string|max:100',
            'serie_id' => 'nullable|integer',
            'articulo_id' => 'required_without_all:codigo_sku,serie_id|nullable|integer|exists:catalogo_articulos,id',
            'empleado_id' => 'nullable|integer|exists:empleados,id',
            'cantidad' => 'nullable|numeric|min:0.01',
            'notas' => 'nullable|string|max:500',
        ]);

        $data = DB::transaction(function () use ($validated) {
            $serie = null;
            $articuloMaster = null;
            if (!empty($validated['codigo_sku'])) {
                $codigo = strtoupper(trim($validated['codigo_sku']));
                $serieId = DB::table('inventario_series')->whereRaw('UPPER(codigo_interno_generado) = ?', [$codigo])->value('id');
                if ($serieId) {
                    $serie = $this->serieDisponible((int) $serieId);
                } elseif (Schema::hasColumn('catalogo_articulos', 'sku_maestro')) {
                    $articuloMaster = DB::table('catalogo_articulos')
                        ->whereRaw('UPPER(sku_maestro) = ?', [$codigo])
                        ->where('es_consumible', true)
                        ->whereNull('deleted_at')
                        ->lockForUpdate()
                        ->first();
                }

                if (!$serie && !$articuloMaster) {
                    abort(response()->json(['success' => false, 'message' => 'SKU no encontrado o requiere serie individual.'], 404));
                }
            } elseif (!empty($validated['serie_id'])) {
                $serie = $this->serieDisponible((int) $validated['serie_id']);
            }

            $articuloId = $serie
                ? (int) $serie->articulo_id
                : (int) ($articuloMaster->id ?? $validated['articulo_id']);
            $cantidad = $serie ? 1 : (float) ($validated['cantidad'] ?? 1);

            $this->incrementStock($articuloId, -$cantidad);

            $movId = $this->insertMovimiento('salida', [
                'empleado_id' => $validated['empleado_id'] ?? null,
                'notas' => $validated['notas'] ?? null,
            ]);
            $this->insertDetalle($movId, [
                'articulo_id' => $articuloId,
                'serie_id' => $serie->id ?? null,
                'cantidad' => $cantidad,
            ]);

            if ($serie) {
                $this->updateSerieEstado((int) $serie->id, 'VENDIDO');
            }

            return ['movimiento_id' => $movId];
        });

        return response()->json(['success' => true, 'message' => 'Salida registrada correctamente.', 'data' => $data]);
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
