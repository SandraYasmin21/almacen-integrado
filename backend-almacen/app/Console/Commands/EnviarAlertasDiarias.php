<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use App\Mail\AlertasDiariasMail;
use Carbon\Carbon;

class EnviarAlertasDiarias extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'alertas:diarias';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Envía por correo el resumen de alertas diarias del sistema (stock crítico, mantenimientos, etc.)';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Recopilando alertas...');

        // 1. Stock crítico
        $stockCritico = DB::table('catalogo_articulos as ca')
            ->leftJoin('stock_general as sg', 'ca.id', '=', 'sg.articulo_id')
            ->whereNull('ca.deleted_at')
            ->where('ca.es_consumible', true)
            ->where('ca.stock_minimo', '>', 0)
            ->select('ca.nombre', 'ca.stock_minimo', DB::raw('COALESCE(sg.cantidad, 0) as cantidad_actual'))
            ->get()
            ->filter(fn($item) => $item->cantidad_actual <= $item->stock_minimo)
            ->values();

        // 2. Préstamos vencidos
        $prestamosVencidos = DB::table('asignaciones_activos as aa')
            ->join('inventario_series as s', 'aa.serie_id', '=', 's.id')
            ->join('catalogo_articulos as ca', 's.articulo_id', '=', 'ca.id')
            ->join('empleados as e', 'aa.empleado_id', '=', 'e.id')
            ->whereNull('aa.fecha_devolucion')
            ->where('aa.fecha_entrega', '<', Carbon::now()->subDays(30)) // Préstamos mayores a 30 días
            ->select('ca.nombre as articulo', 's.numero_serie_fabricante', 'e.nombre_completo as empleado', 'aa.fecha_entrega')
            ->get();

        // 3. Mantenimientos vencidos / próximos (Vehículos)
        // Vehículos con póliza por vencer en 30 días o menos
        $vehiculosPoliza = DB::table('vehiculos_flotilla')
            ->whereNotNull('fecha_vencimiento_poliza')
            ->whereBetween('fecha_vencimiento_poliza', [Carbon::now(), Carbon::now()->addDays(30)])
            ->select('placa', 'nombre', 'fecha_vencimiento_poliza')
            ->get();

        $hayAlertas = $stockCritico->count() > 0 || $prestamosVencidos->count() > 0 || $vehiculosPoliza->count() > 0;

        if (!$hayAlertas) {
            $this->info('No hay alertas para enviar hoy.');
            return;
        }

        $data = [
            'stockCritico' => $stockCritico,
            'prestamosVencidos' => $prestamosVencidos,
            'vehiculosPoliza' => $vehiculosPoliza,
            'fecha' => Carbon::now()->format('d/m/Y')
        ];

        // Obtener administradores a los cuales enviar correos
        $admins = DB::table('usuarios_sistema')->where('rol', 'Admin')->where('activo', true)->pluck('email')->filter();

        if ($admins->isEmpty()) {
            $this->error('No hay administradores configurados con correo electrónico.');
            return;
        }

        foreach ($admins as $email) {
            if (filter_var($email, FILTER_VALIDATE_EMAIL)) {
                Mail::to($email)->send(new AlertasDiariasMail($data));
            }
        }

        $this->info('Alertas enviadas exitosamente a ' . $admins->count() . ' administradores.');
    }
}
