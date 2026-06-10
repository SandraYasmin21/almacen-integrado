<?php

namespace App\Http\Controllers;

use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Maatwebsite\Excel\Facades\Excel;
use Barryvdh\DomPDF\Facade\Pdf;

class OrdenCompraController extends Controller
{
    // ──────────────────────────────────────────────────────────
    // HELPERS
    // ──────────────────────────────────────────────────────────

    private function generarFolio(): string
    {
        $year = Carbon::now()->year;
        $count = DB::table('ordenes_compra')
            ->whereYear('created_at', $year)
            ->count();
        return 'OC-' . $year . '-' . str_pad($count + 1, 3, '0', STR_PAD_LEFT);
    }

    private function recalcularEstado(int $ordenId): void
    {
        $detalles = DB::table('detalle_orden_compra')
            ->where('orden_compra_id', $ordenId)
            ->get();

        if ($detalles->isEmpty()) return;

        $totalSolicitado = $detalles->sum('cantidad_solicitada');
        $totalRecibido   = $detalles->sum('cantidad_recibida');

        if ($totalRecibido <= 0) {
            // Nada recibido aun, no cambiar estado (puede estar en borrador/enviada)
            return;
        }

        $nuevoEstado = ($totalRecibido >= $totalSolicitado)
            ? 'completada'
            : 'recibida_parcialmente';

        DB::table('ordenes_compra')
            ->where('id', $ordenId)
            ->update(['estado' => $nuevoEstado, 'updated_at' => Carbon::now()]);
    }

    // ──────────────────────────────────────────────────────────
    // INDEX – Listado de OCs
    // ──────────────────────────────────────────────────────────

    public function index(Request $request)
    {
        $query = DB::table('ordenes_compra as oc')
            ->leftJoin('proveedores as p', 'oc.proveedor_id', '=', 'p.id')
            ->leftJoin('usuarios_sistema as u', 'oc.usuario_id', '=', 'u.id')
            ->whereNull('oc.deleted_at')
            ->select(
                'oc.id',
                'oc.folio',
                'oc.estado',
                'oc.notas',
                'oc.fecha_esperada',
                'oc.created_at',
                'oc.updated_at',
                'p.nombre_empresa as proveedor',
                'u.nombre_usuario as creado_por'
            )
            ->orderBy('oc.created_at', 'desc');

        if ($request->filled('estado')) {
            $query->where('oc.estado', $request->estado);
        }

        $ordenes = $query->get()->map(function ($oc) {
            // Total de la orden (suma de precio_unitario * cantidad_solicitada)
            $total = DB::table('detalle_orden_compra as doc')
                ->where('doc.orden_compra_id', $oc->id)
                ->sum(DB::raw('COALESCE(doc.precio_unitario, 0) * doc.cantidad_solicitada'));

            $oc->total = (float) $total;

            $oc->detalles = DB::table('detalle_orden_compra as doc')
                ->join('catalogo_articulos as ca', 'doc.articulo_id', '=', 'ca.id')
                ->where('doc.orden_compra_id', $oc->id)
                ->select(
                    'doc.id',
                    'doc.articulo_id',
                    'doc.cantidad_solicitada',
                    'doc.cantidad_recibida',
                    'doc.precio_unitario',
                    'ca.nombre as articulo_nombre',
                    'ca.modelo',
                    'ca.unidad_medida'
                )
                ->get();

            return $oc;
        });

        // Stats por estado
        $stats = [
            'borrador'             => $ordenes->where('estado', 'borrador')->count(),
            'enviada'              => $ordenes->where('estado', 'enviada')->count(),
            'recibida_parcialmente'=> $ordenes->where('estado', 'recibida_parcialmente')->count(),
            'completada'           => $ordenes->where('estado', 'completada')->count(),
        ];

        return response()->json([
            'success' => true,
            'data'    => $ordenes,
            'stats'   => $stats,
        ]);
    }

    // ──────────────────────────────────────────────────────────
    // SHOW – Detalle de una OC
    // ──────────────────────────────────────────────────────────

    public function show($id)
    {
        $oc = DB::table('ordenes_compra as oc')
            ->leftJoin('proveedores as p', 'oc.proveedor_id', '=', 'p.id')
            ->leftJoin('usuarios_sistema as u', 'oc.usuario_id', '=', 'u.id')
            ->where('oc.id', $id)
            ->whereNull('oc.deleted_at')
            ->select('oc.*', 'p.nombre_empresa as proveedor', 'u.nombre_usuario as creado_por')
            ->first();

        if (!$oc) {
            return response()->json(['success' => false, 'message' => 'Orden no encontrada.'], 404);
        }

        $oc->detalles = DB::table('detalle_orden_compra as doc')
            ->join('catalogo_articulos as ca', 'doc.articulo_id', '=', 'ca.id')
            ->where('doc.orden_compra_id', $id)
            ->select(
                'doc.id',
                'doc.articulo_id',
                'doc.cantidad_solicitada',
                'doc.cantidad_recibida',
                'doc.precio_unitario',
                'ca.nombre as articulo_nombre',
                'ca.modelo',
                'ca.unidad_medida'
            )
            ->get();

        return response()->json(['success' => true, 'data' => $oc]);
    }

    // ──────────────────────────────────────────────────────────
    // STORE – Crear nueva OC
    // ──────────────────────────────────────────────────────────

    public function store(Request $request)
    {
        $validated = $request->validate([
            'proveedor_id'           => 'nullable|integer|exists:proveedores,id',
            'notas'                  => 'nullable|string|max:1000',
            'fecha_esperada'         => 'nullable|date',
            'articulos'              => 'required|array|min:1',
            'articulos.*.articulo_id'=> 'required|integer|exists:catalogo_articulos,id',
            'articulos.*.cantidad'   => 'required|integer|min:1',
            'articulos.*.precio'     => 'nullable|numeric|min:0',
        ]);

        $data = DB::transaction(function () use ($validated) {
            $folio  = $this->generarFolio();
            $userId = Auth::id() ?? DB::table('usuarios_sistema')->value('id');

            $ordenId = DB::table('ordenes_compra')->insertGetId([
                'folio'          => $folio,
                'proveedor_id'   => $validated['proveedor_id'] ?? null,
                'usuario_id'     => $userId,
                'estado'         => 'borrador',
                'notas'          => $validated['notas'] ?? null,
                'fecha_esperada' => $validated['fecha_esperada'] ?? null,
                'created_at'     => Carbon::now(),
                'updated_at'     => Carbon::now(),
            ]);

            foreach ($validated['articulos'] as $art) {
                DB::table('detalle_orden_compra')->insert([
                    'orden_compra_id'   => $ordenId,
                    'articulo_id'       => $art['articulo_id'],
                    'cantidad_solicitada'=> (int) $art['cantidad'],
                    'cantidad_recibida' => 0,
                    'precio_unitario'   => $art['precio'] ?? null,
                    'created_at'        => Carbon::now(),
                    'updated_at'        => Carbon::now(),
                ]);
            }

            return ['id' => $ordenId, 'folio' => $folio];
        });

        return response()->json([
            'success' => true,
            'message' => "Orden {$data['folio']} creada en estado Borrador.",
            'data'    => $data,
        ], 201);
    }

    // ──────────────────────────────────────────────────────────
    // UPDATE ESTADO – Cambiar estado de la OC
    // ──────────────────────────────────────────────────────────

    public function updateEstado(Request $request, $id)
    {
        $validated = $request->validate([
            'estado' => 'required|in:borrador,enviada,recibida_parcialmente,completada',
        ]);

        $oc = DB::table('ordenes_compra')->where('id', $id)->whereNull('deleted_at')->first();
        if (!$oc) {
            return response()->json(['success' => false, 'message' => 'Orden no encontrada.'], 404);
        }

        DB::table('ordenes_compra')
            ->where('id', $id)
            ->update(['estado' => $validated['estado'], 'updated_at' => Carbon::now()]);

        return response()->json([
            'success' => true,
            'message' => "Estado actualizado a '{$validated['estado']}'.",
        ]);
    }

    // ──────────────────────────────────────────────────────────
    // RECIBIR – Actualizar cantidades recibidas de una OC
    // Llamado desde AlmacenController::registrarEntrada cuando hay orden_compra_id
    // ──────────────────────────────────────────────────────────

    public static function registrarRecepcion(int $ordenId, int $articuloId, int $cantidadRecibida): void
    {
        $detalle = DB::table('detalle_orden_compra')
            ->where('orden_compra_id', $ordenId)
            ->where('articulo_id', $articuloId)
            ->first();

        if (!$detalle) return;

        $nuevaCantidad = min(
            $detalle->cantidad_recibida + $cantidadRecibida,
            $detalle->cantidad_solicitada
        );

        DB::table('detalle_orden_compra')
            ->where('id', $detalle->id)
            ->update(['cantidad_recibida' => $nuevaCantidad, 'updated_at' => Carbon::now()]);

        // Recalcular estado de la OC
        $ctrl = new self();
        $ctrl->recalcularEstado($ordenId);
    }

    // ──────────────────────────────────────────────────────────
    // REQUISICIONES – Artículos con stock = 0
    // ──────────────────────────────────────────────────────────

    public function requisiciones()
    {
        $agotados = DB::table('catalogo_articulos as ca')
            ->leftJoin('stock_general as sg', 'ca.id', '=', 'sg.articulo_id')
            ->leftJoin('subcategorias as sc', 'ca.subcategoria_id', '=', 'sc.id')
            ->leftJoin('categorias as cat', 'sc.categoria_id', '=', 'cat.id')
            ->where('ca.activo', true)
            ->where(function ($q) {
                $q->whereNull('sg.cantidad')
                  ->orWhere('sg.cantidad', '<=', 0);
            })
            ->select(
                'ca.id',
                'ca.nombre',
                'ca.modelo',
                'ca.unidad_medida',
                'ca.stock_minimo',
                'cat.nombre as categoria_nombre',
                'sc.nombre as subcategoria_nombre',
                DB::raw('COALESCE(sg.cantidad, 0) as stock_actual')
            )
            ->orderBy('ca.nombre')
            ->get();

        return response()->json([
            'success' => true,
            'data'    => $agotados,
            'total'   => $agotados->count(),
        ]);
    }

    // ──────────────────────────────────────────────────────────
    // EXPORT EXCEL – Listado general de OCs
    // ──────────────────────────────────────────────────────────

    public function exportExcel()
    {
        $ordenes = DB::table('ordenes_compra as oc')
            ->leftJoin('proveedores as p', 'oc.proveedor_id', '=', 'p.id')
            ->whereNull('oc.deleted_at')
            ->select('oc.folio', 'p.nombre_empresa as proveedor', 'oc.estado', 'oc.created_at', 'oc.fecha_esperada')
            ->orderBy('oc.created_at', 'desc')
            ->get()
            ->map(fn ($r) => [
                'Folio'          => $r->folio,
                'Proveedor'      => $r->proveedor ?? 'Sin proveedor',
                'Estado'         => ucfirst(str_replace('_', ' ', $r->estado)),
                'Fecha'          => Carbon::parse($r->created_at)->format('d/m/Y'),
                'Fecha Esperada' => $r->fecha_esperada ? Carbon::parse($r->fecha_esperada)->format('d/m/Y') : '—',
            ])
            ->toArray();

        // Export usando array simple con PhpSpreadsheet (disponible vía Maatwebsite)
        return Excel::download(
            new class($ordenes) implements \Maatwebsite\Excel\Concerns\FromCollection,
                                           \Maatwebsite\Excel\Concerns\WithHeadings,
                                           \Maatwebsite\Excel\Concerns\WithStyles,
                                           \Maatwebsite\Excel\Concerns\WithColumnWidths {
                public function __construct(private array $rows) {}
                public function collection() { return collect($this->rows); }
                public function headings(): array { return array_keys($this->rows[0] ?? ['Folio','Proveedor','Estado','Fecha','Fecha Esperada']); }
                public function styles(\PhpOffice\PhpSpreadsheet\Worksheet\Worksheet $sheet) {
                    return [1 => ['font' => ['bold' => true, 'size' => 11]]];
                }
                public function columnWidths(): array { return ['A'=>18,'B'=>30,'C'=>22,'D'=>15,'E'=>15]; }
            },
            'ordenes_compra.xlsx',
            \Maatwebsite\Excel\Excel::XLSX
        );
    }

    // ──────────────────────────────────────────────────────────
    // EXPORT PDF – Listado general de OCs
    // ──────────────────────────────────────────────────────────

    public function exportPdf()
    {
        $ordenes = DB::table('ordenes_compra as oc')
            ->leftJoin('proveedores as p', 'oc.proveedor_id', '=', 'p.id')
            ->whereNull('oc.deleted_at')
            ->select('oc.folio', 'p.nombre_empresa as proveedor', 'oc.estado', 'oc.created_at', 'oc.fecha_esperada')
            ->orderBy('oc.created_at', 'desc')
            ->get();

        $pdf = Pdf::loadView('pdf.ordenes-compra', ['ordenes' => $ordenes])
            ->setPaper('letter', 'landscape');

        return $pdf->download('ordenes_compra.pdf');
    }
}
