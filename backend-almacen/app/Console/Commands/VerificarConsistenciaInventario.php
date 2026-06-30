<?php

namespace App\Console\Commands;

use App\Services\AuditoriaService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class VerificarConsistenciaInventario extends Command
{
    protected $signature = 'inventario:verificar-consistencia';

    protected $description = 'Recalcula stock desde movimientos y alerta diferencias contra stock_general.';

    public function handle(AuditoriaService $auditoria): int
    {
        $tipoColumn = DB::getSchemaBuilder()->hasColumn('movimiento_inventario', 'tipo')
            ? 'tipo'
            : 'tipo_movimiento';

        $calculado = DB::table('detalle_movimiento as dm')
            ->join('movimiento_inventario as mi', 'dm.movimiento_id', '=', 'mi.id')
            ->whereNull('mi.deleted_at')
            ->select(
                'dm.articulo_id',
                DB::raw("SUM(CASE
                    WHEN UPPER(CAST(mi.$tipoColumn AS TEXT)) IN ('ENTRADA', 'DEVOLUCION', 'RETORNO_REPARACION') THEN dm.cantidad
                    WHEN UPPER(CAST(mi.$tipoColumn AS TEXT)) IN ('SALIDA', 'PRESTAMO', 'BAJA_LOGICA') THEN -dm.cantidad
                    ELSE 0
                END) as cantidad_calculada")
            )
            ->groupBy('dm.articulo_id')
            ->pluck('cantidad_calculada', 'articulo_id');

        $stock = DB::table('stock_general')
            ->whereNull('deleted_at')
            ->select('articulo_id', DB::raw('SUM(cantidad) as cantidad_actual'))
            ->groupBy('articulo_id')
            ->pluck('cantidad_actual', 'articulo_id');

        $articulos = $calculado->keys()->merge($stock->keys())->unique();
        $diferencias = [];

        foreach ($articulos as $articuloId) {
            $esperado = (float) ($calculado[$articuloId] ?? 0);
            $actual = (float) ($stock[$articuloId] ?? 0);

            if (abs($esperado - $actual) > 0.001) {
                $diferencias[] = [
                    'articulo_id' => (int) $articuloId,
                    'stock_actual' => $actual,
                    'stock_calculado' => $esperado,
                    'diferencia' => $actual - $esperado,
                ];
            }
        }

        if ($diferencias !== []) {
            DB::table('alertas_sistema')->insert([
                'tipo' => 'INCONSISTENCIA_STOCK',
                'titulo' => 'Inconsistencia en inventario',
                'mensaje' => 'El sanity check semanal detecto diferencias entre movimientos y stock_general.',
                'severidad' => 'critical',
                'metadata' => json_encode(['diferencias' => $diferencias]),
                'resuelta' => false,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            $auditoria->registrar('stock_general', null, 'SANITY_CHECK_FAILED', null, null, ['diferencias' => $diferencias]);
            $this->warn('Diferencias detectadas: ' . count($diferencias));

            return self::FAILURE;
        }

        $auditoria->registrar('stock_general', null, 'SANITY_CHECK_OK');
        $this->info('Stock consistente.');

        return self::SUCCESS;
    }
}
