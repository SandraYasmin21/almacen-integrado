<?php

namespace App\Exports;

use Illuminate\Support\Facades\DB;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithColumnWidths;
use Maatwebsite\Excel\Concerns\WithTitle;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Style\Color;
use Carbon\Carbon;

class InventarioExport implements FromCollection, WithHeadings, WithStyles, WithColumnWidths, WithTitle
{
    public function __construct(private string $section = 'inventario') {}

    public function title(): string
    {
        return match($this->section) {
            'movimientos' => 'Movimientos',
            'prestamos'   => 'Préstamos',
            'series'      => 'Inventario Series',
            default       => 'Inventario General',
        };
    }

    public function collection()
    {
        return match($this->section) {
            'movimientos' => $this->getMovimientos(),
            'prestamos'   => $this->getPrestamos(),
            'series'      => $this->getSeries(),
            default       => $this->getInventario(),
        };
    }

    public function headings(): array
    {
        return match($this->section) {
            'movimientos' => ['Fecha', 'Tipo', 'Artículo', 'Cantidad', 'Usuario', 'Empleado', 'Proveedor', 'Notas'],
            'prestamos'   => ['Empleado', 'Artículo', 'Serie', 'Fecha Entrega', 'Días', 'Estado'],
            'series'      => ['Artículo', 'Serie Fab.', 'Código Interno', 'Proveedor', 'Estado', 'Ubicación', 'Propósito'],
            default       => ['Artículo', 'Modelo', 'Subcategoría', 'Unidad', 'Stock Actual', 'Stock Mínimo', 'Ubicación', 'Estado', 'Última actualización'],
        };
    }

    public function styles(Worksheet $sheet)
    {
        $lastRow = $sheet->getHighestRow();
        $lastCol = $sheet->getHighestColumn();

        // Header row styling
        $sheet->getStyle("A1:{$lastCol}1")->applyFromArray([
            'font' => [
                'bold' => true,
                'color' => ['argb' => 'FFFFFFFF'],
                'size' => 11,
            ],
            'fill' => [
                'fillType' => Fill::FILL_SOLID,
                'startColor' => ['argb' => 'FF2540B0'],
            ],
        ]);

        // Zebra striping
        for ($row = 2; $row <= $lastRow; $row++) {
            if ($row % 2 === 0) {
                $sheet->getStyle("A{$row}:{$lastCol}{$row}")->applyFromArray([
                    'fill' => [
                        'fillType' => Fill::FILL_SOLID,
                        'startColor' => ['argb' => 'FFF8F9FC'],
                    ],
                ]);
            }
        }

        // Freeze header
        $sheet->freezePane('A2');

        // Auto-filter
        $sheet->setAutoFilter("A1:{$lastCol}1");

        // Conditional coloring for "Estado" column (inventario)
        if ($this->section === 'inventario') {
            $estCol = 'H';
            for ($row = 2; $row <= $lastRow; $row++) {
                $val = $sheet->getCell("{$estCol}{$row}")->getValue();
                $color = match($val) {
                    'CRÍTICO' => 'FFFEE2E2',
                    'BAJO'    => 'FFFEF3C7',
                    default   => 'FFF0FDF4',
                };
                $sheet->getStyle("{$estCol}{$row}")->getFill()
                    ->setFillType(Fill::FILL_SOLID)
                    ->getStartColor()->setARGB($color);
            }
        }

        // Add metadata sheet info in cell beyond data
        $sheet->getCell('A' . ($lastRow + 2))->setValue('Generado: ' . Carbon::now()->format('d/m/Y H:i:s'));
        $sheet->getStyle('A' . ($lastRow + 2))->getFont()->setItalic(true)->setColor(new Color('FF888888'));

        return [];
    }

    public function columnWidths(): array
    {
        return ['A' => 35, 'B' => 20, 'C' => 20, 'D' => 12, 'E' => 12, 'F' => 12, 'G' => 18, 'H' => 12, 'I' => 22];
    }

    // ─── Queries ───────────────────────────────────────

    private function getInventario()
    {
        return DB::table('stock_general as sg')
            ->join('catalogo_articulos as ca', 'sg.articulo_id', '=', 'ca.id')
            ->leftJoin('subcategorias as sc', 'ca.subcategoria_id', '=', 'sc.id')
            ->whereNull('ca.deleted_at')
            ->select(
                'ca.nombre',
                'ca.modelo',
                'sc.nombre as subcategoria',
                'ca.unidad_medida',
                'sg.cantidad',
                'ca.stock_minimo',
                'sg.ubicacion',
                DB::raw("CASE WHEN sg.cantidad <= ca.stock_minimo * 0.2 THEN 'CRÍTICO' WHEN sg.cantidad <= ca.stock_minimo THEN 'BAJO' ELSE 'NORMAL' END as estado"),
                DB::raw("NOW() as actualizado")
            )
            ->orderBy('ca.nombre')
            ->get();
    }

    private function getMovimientos()
    {
        return DB::table('movimiento_inventario as mi')
            ->join('usuarios_sistema as u', 'mi.usuario_id', '=', 'u.id')
            ->leftJoin('empleados as e', 'mi.empleado_id', '=', 'e.id')
            ->leftJoin('proveedores as p', 'mi.proveedor_id', '=', 'p.id')
            ->leftJoin('detalle_movimiento as dm', 'mi.id', '=', 'dm.movimiento_id')
            ->leftJoin('catalogo_articulos as ca', 'dm.articulo_id', '=', 'ca.id')
            ->select(
                DB::raw("TO_CHAR(mi.fecha_hora, 'DD/MM/YYYY HH24:MI') as fecha"),
                'mi.tipo', 'ca.nombre as articulo', 'dm.cantidad',
                'u.nombre_usuario', 'e.nombre_completo as empleado',
                'p.nombre_empresa as proveedor', 'mi.notas'
            )
            ->orderByDesc('mi.fecha_hora')
            ->get();
    }

    private function getPrestamos()
    {
        return DB::table('asignaciones_activos as aa')
            ->join('empleados as e', 'aa.empleado_id', '=', 'e.id')
            ->join('inventario_series as is', 'aa.serie_id', '=', 'is.id')
            ->join('catalogo_articulos as ca', 'is.articulo_id', '=', 'ca.id')
            ->select(
                'e.nombre_completo as empleado',
                'ca.nombre as articulo',
                'is.codigo_interno_generado as serie',
                DB::raw("TO_CHAR(aa.fecha_entrega, 'DD/MM/YYYY') as fecha_entrega"),
                DB::raw("EXTRACT(DAY FROM NOW() - aa.fecha_entrega)::int as dias"),
                DB::raw("CASE WHEN aa.fecha_devolucion IS NULL THEN 'ACTIVO' ELSE 'DEVUELTO' END as estado")
            )
            ->whereNull('aa.fecha_devolucion')
            ->orderByDesc('aa.fecha_entrega')
            ->get();
    }

    private function getSeries()
    {
        return DB::table('inventario_series as is')
            ->join('catalogo_articulos as ca', 'is.articulo_id', '=', 'ca.id')
            ->leftJoin('proveedores as p', 'is.proveedor_id', '=', 'p.id')
            ->select(
                'ca.nombre as articulo',
                'is.numero_serie_fabricante',
                'is.codigo_interno_generado',
                'p.nombre_empresa as proveedor',
                'is.estado',
                'is.ubicacion',
                'is.proposito_uso'
            )
            ->orderBy('ca.nombre')
            ->get();
    }
}
