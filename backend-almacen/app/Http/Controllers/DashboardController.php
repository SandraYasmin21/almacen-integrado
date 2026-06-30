<?php
 
namespace App\Http\Controllers;
 
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;
use Barryvdh\DomPDF\Facade\Pdf;
use Maatwebsite\Excel\Facades\Excel;
use Carbon\Carbon;
use App\Exports\DashboardExport;
use App\Models\InventarioSerie;
 
class DashboardController extends Controller
{
    public function index()
    {
        return Inertia::render('Dashboard/Index');
    }
 
    public function informe()
    {
        return Inertia::render('Dashboard/Informe', ['data' => $this->getMetricasData()]);
    }
 
    public function metricas()
    {
        return response()->json($this->getMetricasData());
    }
 
    private function getMetricasData(): array
    {
        $ahora  = Carbon::now();
        $hace30 = $ahora->copy()->subDays(30);
        $articulosTieneActivo = Schema::hasColumn('catalogo_articulos', 'activo');
        $empleadosTieneActivo = Schema::hasColumn('empleados', 'activo');
        $movimientoTipoColumn = Schema::hasColumn('movimiento_inventario', 'tipo')
            ? 'tipo'
            : 'tipo_movimiento';
        $vehiculoRegresoColumn = Schema::hasColumn('bitacora_vehiculos', 'fecha_hora_regreso')
            ? 'fecha_hora_regreso'
            : 'fecha_regreso';
        $vehiculoMotivoColumn = Schema::hasColumn('bitacora_vehiculos', 'motivo_viaje')
            ? 'motivo_viaje'
            : 'motivo_uso';
 
        $totalConsumibles = (float) DB::table('stock_general')->whereNull('deleted_at')->sum('cantidad');
        $seriesPorEstado = DB::table('inventario_series')
            ->whereNull('deleted_at')
            ->select('estado', DB::raw('COUNT(*) as total'))
            ->groupBy('estado')
            ->pluck('total', 'estado');
        $totalSeries = (int) $seriesPorEstado->sum();
        $totalActivos = $totalConsumibles + $totalSeries;
 
        $vehiculosRuta = DB::table('bitacora_vehiculos')
            ->whereNull($vehiculoRegresoColumn)->count();
 
        $vehiculosTotal = DB::table('vehiculos_flotilla')
            ->whereIn('estado', ['ACTIVO', 'DISPONIBLE', 'ASIGNADO'])->count();
 
        $prestamosVencidos = DB::table('asignaciones_activos')
            ->whereNull('fecha_devolucion')
            ->where('fecha_entrega', '<', $ahora->copy()->subDays(30))
            ->count();
 
        $porReponer = DB::table('stock_general as sg')
            ->join('catalogo_articulos as ca', 'sg.articulo_id', '=', 'ca.id')
            ->whereRaw('sg.cantidad < ca.stock_minimo')
            ->when($articulosTieneActivo, fn ($query) => $query->where('ca.activo', true))
            ->count();
 
        $semaforo = DB::table('stock_general as sg')
            ->join('catalogo_articulos as ca', 'sg.articulo_id', '=', 'ca.id')
            ->when($articulosTieneActivo, fn ($query) => $query->where('ca.activo', true))
            ->whereRaw('sg.cantidad <= ca.stock_minimo * 1.5')
            ->select('ca.nombre', 'sg.cantidad as stock_actual', 'ca.stock_minimo', 'sg.ubicacion')
            ->orderByRaw('(sg.cantidad / NULLIF(ca.stock_minimo, 0)) ASC')
            ->limit(10)->get()
            ->map(fn($r) => [
                'nombre'       => $r->nombre,
                'ubicacion'    => $r->ubicacion,
                'stock_actual' => (float)$r->stock_actual,
                'stock_minimo' => (float)$r->stock_minimo,
            ]);
 
        $tecnicos = DB::table('empleados as e')
            ->leftJoin('bitacora_vehiculos as bv', function ($j) use ($vehiculoRegresoColumn) {
                $j->on('e.id', '=', 'bv.empleado_id')->whereNull("bv.{$vehiculoRegresoColumn}");
            })
            ->when($empleadosTieneActivo, fn ($query) => $query->where('e.activo', true))
            ->whereIn('e.departamento_area', ['Tecnico','Ingenieria','Mantenimiento','TI','Soporte','Sistemas','Infraestructura','Operaciones'])
            ->select(
                'e.id','e.nombre_completo','e.departamento_area',
                DB::raw("CASE WHEN bv.id IS NOT NULL THEN 'ocupado' ELSE 'disponible' END as estado"),
                DB::raw("bv.{$vehiculoMotivoColumn} as motivo_viaje")
            )
            ->limit(8)->get()
            ->map(fn($t) => [
                'id'           => $t->id,
                'nombre'       => $t->nombre_completo,
                'departamento' => $t->departamento_area,
                'iniciales'    => $this->iniciales($t->nombre_completo),
                'estado'       => $t->estado,
                'motivo_viaje' => $t->motivo_viaje,
            ]);
 
        $topArticulos = DB::table('detalle_movimiento as dm')
            ->join('movimiento_inventario as mi', 'dm.movimiento_id', '=', 'mi.id')
            ->join('catalogo_articulos as ca', 'dm.articulo_id', '=', 'ca.id')
            ->where("mi.{$movimientoTipoColumn}", Schema::hasColumn('movimiento_inventario', 'tipo') ? 'salida' : 'SALIDA')
            ->where('mi.fecha_hora', '>=', $hace30)
            ->whereNotNull('dm.articulo_id')
            ->groupBy('ca.id','ca.nombre')
            ->select('ca.nombre', DB::raw('SUM(dm.cantidad) as salidas'))
            ->orderByDesc('salidas')->limit(5)->get()
            ->map(fn($r) => ['nombre' => $r->nombre, 'salidas' => (int)$r->salidas]);
 
        $movimientos = DB::table('movimiento_inventario as mi')
            ->join('usuarios_sistema as u', 'mi.usuario_id', '=', 'u.id')
            ->leftJoin('detalle_movimiento as dm', 'mi.id', '=', 'dm.movimiento_id')
            ->leftJoin('catalogo_articulos as ca', 'dm.articulo_id', '=', 'ca.id')
            ->select(
                DB::raw("mi.{$movimientoTipoColumn} as tipo"),
                'mi.fecha_hora',
                'u.nombre_usuario as usuario',
                'ca.nombre as articulo',
                'dm.cantidad'
            )
            ->orderByDesc('mi.fecha_hora')->limit(10)->get()
            ->map(fn($m) => [
                'tipo'       => $m->tipo,
                'fecha_hora' => Carbon::parse($m->fecha_hora)->format('d/m H:i'),
                'usuario'    => $m->usuario,
                'articulo'   => $m->articulo ?? 'â€”',
                'cantidad'   => $m->cantidad ?? 'â€”',
            ]);
 
        return [
            'total_activos'         => (int)$totalActivos,
            'activos_disponibles'   => (int) ($seriesPorEstado[InventarioSerie::ESTADO_DISPONIBLE] ?? 0),
            'activos_asignados'     => (int) ($seriesPorEstado[InventarioSerie::ESTADO_ASIGNADO] ?? 0),
            'activos_reparacion'    => (int) ($seriesPorEstado[InventarioSerie::ESTADO_REPARACION] ?? 0),
            'activos_baja'          => (int) ($seriesPorEstado[InventarioSerie::ESTADO_BAJA] ?? 0),
            'materiales_disponibles'=> (float) $totalConsumibles,
            'vehiculos_ruta'        => $vehiculosRuta,
            'vehiculos_total'       => $vehiculosTotal,
            'prestamos_vencidos'    => $prestamosVencidos,
            'por_reponer'           => $porReponer,
            'semaforo'              => $semaforo,
            'tecnicos'              => $tecnicos,
            'top_articulos'         => $topArticulos,
            'movimientos_recientes' => $movimientos,
        ];
    }
 
    public function notifications()
    {
        return response()->json($this->cachedNotifications());
        /*
        $notifs = [];
 
        $criticos = DB::table('stock_general as sg')
            ->join('catalogo_articulos as ca', 'sg.articulo_id', '=', 'ca.id')
            ->whereRaw('sg.cantidad <= ca.stock_minimo * 0.2')
            ->where('ca.activo', true)
            ->select('ca.nombre','sg.cantidad','ca.stock_minimo')
            ->limit(5)->get();
 
        foreach ($criticos as $c) {
            $notifs[] = [
                'tipo'    => 'stock',
                'urgente' => true,
                'titulo'  => "Stock crÃ­tico: {$c->nombre}",
                'mensaje' => "Solo quedan {$c->cantidad} unidades (mÃ­nimo: {$c->stock_minimo})",
            ];
        }
 
        $vencidos = DB::table('asignaciones_activos as aa')
            ->join('empleados as e', 'aa.empleado_id', '=', 'e.id')
            ->join('inventario_series as is', 'aa.serie_id', '=', 'is.id')
            ->join('catalogo_articulos as ca', 'is.articulo_id', '=', 'ca.id')
            ->whereNull('aa.fecha_devolucion')
            ->where('aa.fecha_entrega', '<', Carbon::now()->subDays(30))
            ->select('e.nombre_completo','ca.nombre as articulo','aa.fecha_entrega')
            ->limit(3)->get();
 
        foreach ($vencidos as $v) {
            $dias = Carbon::parse($v->fecha_entrega)->diffInDays();
            $notifs[] = [
                'tipo'    => 'prestamo',
                'urgente' => $dias > 60,
                'titulo'  => "PrÃ©stamo vencido: {$v->articulo}",
                'mensaje' => "Asignado a {$v->nombre_completo} hace {$dias} dÃ­as",
            ];
        }
 
        return response()->json($notifs);
        */
    }

    private function cachedNotifications(): array
    {
        return Cache::remember('dashboard_notifications:v2', now()->addHour(), function () {
            $notifs = [];

            $criticos = DB::table('stock_general as sg')
                ->join('catalogo_articulos as ca', 'sg.articulo_id', '=', 'ca.id')
                ->whereRaw('sg.cantidad <= ca.stock_minimo * 0.2')
                ->whereNull('ca.deleted_at')
                ->select('ca.nombre', 'sg.cantidad', 'ca.stock_minimo')
                ->limit(5)
                ->get();

            foreach ($criticos as $c) {
                $notifs[] = [
                    'tipo' => 'stock',
                    'urgente' => true,
                    'titulo' => "Stock critico: {$c->nombre}",
                    'mensaje' => "Solo quedan {$c->cantidad} unidades (minimo: {$c->stock_minimo})",
                ];
            }

            $vencidos = DB::table('asignaciones_activos as aa')
                ->join('empleados as e', 'aa.empleado_id', '=', 'e.id')
                ->join('inventario_series as is', 'aa.serie_id', '=', 'is.id')
                ->join('catalogo_articulos as ca', 'is.articulo_id', '=', 'ca.id')
                ->whereNull('aa.fecha_devolucion')
                ->where('aa.fecha_entrega', '<', Carbon::now()->subDays(30))
                ->select('e.nombre_completo', 'ca.nombre as articulo', 'aa.fecha_entrega')
                ->limit(3)
                ->get();

            foreach ($vencidos as $v) {
                $dias = Carbon::parse($v->fecha_entrega)->diffInDays();
                $notifs[] = [
                    'tipo' => 'prestamo',
                    'urgente' => $dias > 60,
                    'titulo' => "Prestamo vencido: {$v->articulo}",
                    'mensaje' => "Asignado a {$v->nombre_completo} hace {$dias} dias",
                ];
            }

            $this->appendRepairAlerts($notifs);
            $this->appendWarrantyAlerts($notifs);
            $this->appendVehicleMaintenanceAlerts($notifs);

            return $notifs;
        });
    }

    private function appendRepairAlerts(array &$notifs): void
    {
        if (! Schema::hasColumn('inventario_series', 'estado')) {
            return;
        }

        $reparaciones = DB::table('inventario_series as is')
            ->join('catalogo_articulos as ca', 'is.articulo_id', '=', 'ca.id')
            ->where('is.estado', InventarioSerie::ESTADO_REPARACION)
            ->whereNull('is.deleted_at')
            ->where('is.updated_at', '<=', Carbon::now()->subDays(15))
            ->select('ca.nombre', 'is.codigo_interno_generado', 'is.updated_at')
            ->limit(5)
            ->get();

        foreach ($reparaciones as $r) {
            $dias = Carbon::parse($r->updated_at)->diffInDays();
            $notifs[] = [
                'tipo' => 'reparacion',
                'urgente' => $dias > 30,
                'titulo' => "Reparacion prolongada: {$r->nombre}",
                'mensaje' => "SKU {$r->codigo_interno_generado} lleva {$dias} dias en reparacion",
            ];
        }
    }

    private function appendWarrantyAlerts(array &$notifs): void
    {
        if (! Schema::hasColumn('inventario_series', 'fecha_vencimiento_garantia')) {
            return;
        }

        $garantias = DB::table('inventario_series as is')
            ->join('catalogo_articulos as ca', 'is.articulo_id', '=', 'ca.id')
            ->whereNull('is.deleted_at')
            ->whereNotNull('is.fecha_vencimiento_garantia')
            ->whereBetween('is.fecha_vencimiento_garantia', [Carbon::now()->toDateString(), Carbon::now()->addDays(30)->toDateString()])
            ->select('ca.nombre', 'is.codigo_interno_generado', 'is.fecha_vencimiento_garantia')
            ->limit(5)
            ->get();

        foreach ($garantias as $g) {
            $vence = Carbon::parse($g->fecha_vencimiento_garantia);
            $notifs[] = [
                'tipo' => 'garantia',
                'urgente' => $vence->lte(Carbon::now()->addDays(7)),
                'titulo' => "Garantia por vencer: {$g->nombre}",
                'mensaje' => "SKU {$g->codigo_interno_generado} vence el ".$vence->format('d/m/Y'),
            ];
        }
    }

    private function appendVehicleMaintenanceAlerts(array &$notifs): void
    {
        if (! Schema::hasTable('vehiculos_flotilla') || ! Schema::hasTable('registros_vehiculares')) {
            return;
        }

        $vehiculos = DB::table('vehiculos_flotilla')
            ->whereIn('estado', ['ACTIVO', 'DISPONIBLE', 'ASIGNADO', 'EN_MANTENIMIENTO'])
            ->whereNull('deleted_at')
            ->limit(100)
            ->get();

        foreach ($vehiculos as $vehiculo) {
            // ── 1. Seguro por vencer ─────────────────────────────────────
            if (Schema::hasColumn('vehiculos_flotilla', 'vencimiento_seguro') && $vehiculo->vencimiento_seguro) {
                $venceSeg = Carbon::parse($vehiculo->vencimiento_seguro);
                $diasSeguro = (int) Carbon::now()->diffInDays($venceSeg, false);
                if ($diasSeguro <= 30) {
                    $notifs[] = [
                        'tipo'    => 'seguro_vehiculo',
                        'urgente' => $diasSeguro <= 7,
                        'titulo'  => "Seguro por vencer: {$vehiculo->nombre}",
                        'mensaje' => $diasSeguro <= 0
                            ? "El seguro VENCIÓ el {$venceSeg->format('d/m/Y')}."
                            : "El seguro vence en {$diasSeguro} días ({$venceSeg->format('d/m/Y')}).",
                    ];
                }
            }

            // ── 2. GPS no funcional ──────────────────────────────────────
            if (Schema::hasColumn('vehiculos_flotilla', 'gps_activo')) {
                $gpsOk = (bool) $vehiculo->gps_activo;
                $estadoGps = $vehiculo->estado_gps ?? null;
                if (! $gpsOk || (is_string($estadoGps) && ! in_array(strtoupper($estadoGps), ['OK', 'ACTIVO', 'FUNCIONAL']))) {
                    $notifs[] = [
                        'tipo'    => 'gps_vehiculo',
                        'urgente' => true,
                        'titulo'  => "GPS no funcional: {$vehiculo->nombre}",
                        'mensaje' => "Estado GPS: " . ($estadoGps ?? 'Sin información') . ". Verifica el dispositivo.",
                    ];
                }
            }

            // ── 3. Sin KM actualizado (> 15 días sin actualizar) ─────────
            if (Schema::hasColumn('vehiculos_flotilla', 'ultima_actualizacion_km') && $vehiculo->ultima_actualizacion_km) {
                $diasSinKm = Carbon::parse($vehiculo->ultima_actualizacion_km)->diffInDays();
                if ($diasSinKm > 15 && $vehiculo->estado !== 'EN_MANTENIMIENTO') {
                    $notifs[] = [
                        'tipo'    => 'km_vehiculo',
                        'urgente' => $diasSinKm > 30,
                        'titulo'  => "Sin km actualizado: {$vehiculo->nombre}",
                        'mensaje' => "Han pasado {$diasSinKm} días sin actualizar el kilometraje.",
                    ];
                }
            }

            // ── 4. En mantenimiento prolongado por estatus ───────────────
            if ($vehiculo->estado === 'EN_MANTENIMIENTO') {
                // Buscar el último registro de mantenimiento correctivo
                $ultimoCorrectivo = DB::table('registros_vehiculares')
                    ->where('vehiculo_id', $vehiculo->id)
                    ->whereIn('tipo', ['correctivo', 'reparacion', 'correctivo_mayor'])
                    ->whereNull('deleted_at')
                    ->orderByDesc('fecha')
                    ->first(['fecha', 'tipo']);

                $diasEnMant = $ultimoCorrectivo
                    ? Carbon::parse($ultimoCorrectivo->fecha)->diffInDays()
                    : null;

                // También revisamos el updated_at del vehículo si no hay registro
                if (is_null($diasEnMant)) {
                    $diasEnMant = Carbon::parse($vehiculo->updated_at)->diffInDays();
                }

                if ($diasEnMant > 30) {
                    $notifs[] = [
                        'tipo'    => 'mantenimiento_prolongado',
                        'urgente' => $diasEnMant > 60,
                        'titulo'  => "Mantenimiento prolongado: {$vehiculo->nombre}",
                        'mensaje' => "Lleva {$diasEnMant} días en estatus EN_MANTENIMIENTO.",
                    ];
                }

                continue; // No evaluar preventivos para vehículos en taller
            }

            // ── 5. Mantenimiento preventivo próximo ─────────────────────
            $maxKm = (float) DB::table('registros_vehiculares')
                ->where('vehiculo_id', $vehiculo->id)
                ->whereNull('deleted_at')
                ->max('kilometraje');

            $ultimoPreventivo = DB::table('registros_vehiculares')
                ->where('vehiculo_id', $vehiculo->id)
                ->where('tipo', 'preventivo')
                ->whereNull('deleted_at')
                ->orderByDesc('fecha')
                ->orderByDesc('kilometraje')
                ->first(['fecha', 'kilometraje']);

            if (! $ultimoPreventivo) {
                $notifs[] = [
                    'tipo'    => 'vehiculo',
                    'urgente' => false,
                    'titulo'  => "Vehiculo sin preventivo: {$vehiculo->nombre}",
                    'mensaje' => 'No hay mantenimiento preventivo registrado.',
                ];
                continue;
            }

            $kmRestantes         = ((float) $ultimoPreventivo->kilometraje + 10000) - $maxKm;
            $diasDesdePreventivo = Carbon::parse($ultimoPreventivo->fecha)->diffInDays();

            if ($kmRestantes <= 500 || $diasDesdePreventivo >= 180) {
                $notifs[] = [
                    'tipo'    => 'vehiculo',
                    'urgente' => $kmRestantes <= 0 || $diasDesdePreventivo >= 210,
                    'titulo'  => "Mantenimiento proximo: {$vehiculo->nombre}",
                    'mensaje' => "Restan {$kmRestantes} km o han pasado {$diasDesdePreventivo} dias desde el ultimo preventivo.",
                ];
            }
        }
    }
 
    public function search(Request $request)
    {
        $q = $request->input('q', '');
        if (strlen($q) < 2) return response()->json([]);
 
        $results = [];
 
        DB::table('catalogo_articulos')->whereNull('deleted_at')
            ->where(fn($query) => $query->where('nombre','like',"%{$q}%")->orWhere('modelo','like',"%{$q}%"))
            ->limit(4)->get()
            ->each(fn($a) => $results[] = ['type'=>'articulo','label'=>$a->nombre,'sub'=>$a->modelo,'url'=>"/almacen/articulo/{$a->id}"]);
 
        DB::table('empleados')->where('activo', true)
            ->where(fn($q2) => $q2->where('nombre_completo','like',"%{$q}%")->orWhere('numero_gafete','like',"%{$q}%"))
            ->limit(3)->get()
            ->each(fn($e) => $results[] = ['type'=>'empleado','label'=>$e->nombre_completo,'sub'=>$e->departamento_area,'url'=>"/empleados/{$e->id}"]);
 
        DB::table('inventario_series')
            ->where(fn($q3) => $q3->where('numero_serie_fabricante','like',"%{$q}%")->orWhere('codigo_interno_generado','like',"%{$q}%"))
            ->limit(3)->get()
            ->each(fn($s) => $results[] = ['type'=>'serie','label'=>$s->codigo_interno_generado,'sub'=>$s->numero_serie_fabricante,'url'=>"/almacen/serie/{$s->id}"]);
 
        return response()->json(array_slice($results, 0, 10));
    }
 
    public function syncSheets(Request $request)
    {
        $sheetId = config('services.google_sheets.sheet_id');
        if (!$sheetId) return response()->json(['success'=>false,'message'=>'Google Sheets no configurado en .env']);
 
        try {
            $inventario = DB::table('stock_general as sg')
                ->join('catalogo_articulos as ca','sg.articulo_id','=','ca.id')
                ->leftJoin('subcategorias as sc','ca.subcategoria_id','=','sc.id')
                ->where('ca.activo', true)
                ->select('ca.nombre','ca.modelo','sc.nombre as subcategoria','ca.unidad_medida',
                    'sg.cantidad','ca.stock_minimo','sg.ubicacion',
                    DB::raw("CASE WHEN sg.cantidad <= ca.stock_minimo*0.2 THEN 'CRÃTICO' WHEN sg.cantidad <= ca.stock_minimo THEN 'BAJO' ELSE 'NORMAL' END as estado"))
                ->get();
 
            $rows = [['ArtÃ­culo','Modelo','SubcategorÃ­a','Unidad','Stock','MÃ­nimo','UbicaciÃ³n','Estado','Actualizado']];
            foreach ($inventario as $item) {
                $rows[] = [$item->nombre,$item->modelo??'',$item->subcategoria??'',$item->unidad_medida,
                    $item->cantidad,$item->stock_minimo,$item->ubicacion,$item->estado,Carbon::now()->format('d/m/Y H:i')];
            }
 
            $token = $this->getGoogleToken();
            Http::withToken($token)->put(
                "https://sheets.googleapis.com/v4/spreadsheets/{$sheetId}/values/Inventario!A1",
                ['valueInputOption'=>'RAW','values'=>$rows]
            );
 
            return response()->json(['success'=>true,'rows'=>count($rows)-1]);
        } catch (\Exception $e) {
            return response()->json(['success'=>false,'message'=>$e->getMessage()]);
        }
    }
 
    private function getGoogleToken(): string
    {
        return cache()->remember('google_access_token', 3500, function () {
            $creds = json_decode(file_get_contents(config('services.google_sheets.credentials_file')), true);
            $now = time();
            $header  = rtrim(strtr(base64_encode(json_encode(['alg'=>'RS256','typ'=>'JWT'])),'+/','-_'),'=');
            $payload = rtrim(strtr(base64_encode(json_encode([
                'iss'=>$creds['client_email'],
                'scope'=>'https://www.googleapis.com/auth/spreadsheets',
                'aud'=>'https://oauth2.googleapis.com/token',
                'exp'=>$now+3600,'iat'=>$now,
            ])),'+/','-_'),'=');
            $data = $header.'.'.$payload;
            openssl_sign($data, $sig, $creds['private_key'], 'SHA256');
            $jwt = $data.'.'.rtrim(strtr(base64_encode($sig),'+/','-_'),'=');
            $r = Http::asForm()->post('https://oauth2.googleapis.com/token',
                ['grant_type'=>'urn:ietf:params:oauth:grant-type:jwt-bearer','assertion'=>$jwt]);
            return $r->json('access_token');
        });
    }
 
    public function exportExcel(Request $request)
    {
        $data = $this->getMetricasData();
        $filename = "dashboard_export_".Carbon::now()->format('Ymd_His').'.xlsx';
        
        return Excel::download(new DashboardExport($data), $filename);
    }
 
    public function exportPDF(Request $request)
    {
        $data = $this->getMetricasData();

        $pdf = Pdf::loadView('pdf.dashboard',[
            'data'         => $data,
            'fecha'        => Carbon::now()->format('d/m/Y H:i'),
            'generado_por' => auth()->user()->nombre_usuario ?? 'Sistema',
        ]);
        $pdf->setPaper('a4');
        return $pdf->download('dashboard_export_'.Carbon::now()->format('Ymd').'.pdf');
    }
 
    private function iniciales(string $nombre): string
    {
        $p = explode(' ', trim($nombre));
        return strtoupper(substr($p[0]??'',0,1).substr($p[1]??'',0,1));
    }

}
