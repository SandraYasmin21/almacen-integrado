<?php
 
namespace App\Http\Controllers;
 
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Inertia\Inertia;
use Maatwebsite\Excel\Facades\Excel;
use App\Exports\InventarioExport;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\Carbon;
 
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
 
        $totalActivos = DB::table('stock_general')->sum('cantidad');
 
        $vehiculosRuta = DB::table('bitacora_vehiculos')
            ->whereNull('fecha_hora_regreso')->count();
 
        $vehiculosTotal = DB::table('vehiculos_flotilla')
            ->where('estado', 'ACTIVO')->count();
 
        $prestamosVencidos = DB::table('asignaciones_activos')
            ->whereNull('fecha_devolucion')
            ->where('fecha_entrega', '<', $ahora->copy()->subDays(30))
            ->count();
 
        $porReponer = DB::table('stock_general as sg')
            ->join('catalogo_articulos as ca', 'sg.articulo_id', '=', 'ca.id')
            ->whereRaw('sg.cantidad < ca.stock_minimo')
            ->where('ca.activo', true)->count();
 
        $semaforo = DB::table('stock_general as sg')
            ->join('catalogo_articulos as ca', 'sg.articulo_id', '=', 'ca.id')
            ->where('ca.activo', true)
            ->whereRaw('sg.cantidad <= ca.stock_minimo * 1.5')
            ->select('ca.nombre', 'sg.cantidad as stock_actual', 'ca.stock_minimo', 'sg.ubicacion')
            ->orderByRaw('(sg.cantidad / NULLIF(ca.stock_minimo, 0)) ASC')
            ->limit(10)->get()
            ->map(fn($r) => [
                'nombre'       => $r->nombre,
                'stock_actual' => (float)$r->stock_actual,
                'stock_minimo' => (float)$r->stock_minimo,
            ]);
 
        $tecnicos = DB::table('empleados as e')
            ->leftJoin('bitacora_vehiculos as bv', function ($j) {
                $j->on('e.id', '=', 'bv.empleado_id')->whereNull('bv.fecha_hora_regreso');
            })
            ->where('e.activo', true)
            ->whereIn('e.departamento_area', ['Técnico','Ingeniería','Mantenimiento','TI','Soporte'])
            ->select(
                'e.id','e.nombre_completo','e.departamento_area',
                DB::raw("CASE WHEN bv.id IS NOT NULL THEN 'ocupado' ELSE 'disponible' END as estado"),
                'bv.motivo_viaje'
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
            ->where('mi.tipo', 'salida')
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
            ->select('mi.tipo','mi.fecha_hora','u.nombre_usuario as usuario','ca.nombre as articulo','dm.cantidad')
            ->orderByDesc('mi.fecha_hora')->limit(10)->get()
            ->map(fn($m) => [
                'tipo'       => $m->tipo,
                'fecha_hora' => Carbon::parse($m->fecha_hora)->format('d/m H:i'),
                'usuario'    => $m->usuario,
                'articulo'   => $m->articulo ?? '—',
                'cantidad'   => $m->cantidad ?? '—',
            ]);
 
        return [
            'total_activos'         => (int)$totalActivos,
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
                'titulo'  => "Stock crítico: {$c->nombre}",
                'mensaje' => "Solo quedan {$c->cantidad} unidades (mínimo: {$c->stock_minimo})",
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
                'titulo'  => "Préstamo vencido: {$v->articulo}",
                'mensaje' => "Asignado a {$v->nombre_completo} hace {$dias} días",
            ];
        }
 
        return response()->json($notifs);
    }
 
    public function search(Request $request)
    {
        $q = $request->input('q', '');
        if (strlen($q) < 2) return response()->json([]);
 
        $results = [];
 
        DB::table('catalogo_articulos')->where('activo', true)
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
                    DB::raw("CASE WHEN sg.cantidad <= ca.stock_minimo*0.2 THEN 'CRÍTICO' WHEN sg.cantidad <= ca.stock_minimo THEN 'BAJO' ELSE 'NORMAL' END as estado"))
                ->get();
 
            $rows = [['Artículo','Modelo','Subcategoría','Unidad','Stock','Mínimo','Ubicación','Estado','Actualizado']];
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
        $section  = $request->input('section','inventario');
        $filename = "almacen_{$section}_".Carbon::now()->format('Ymd_His').'.xlsx';
        return Excel::download(new InventarioExport($section), $filename);
    }
 
    public function exportPDF(Request $request)
    {
        $inventario = DB::table('stock_general as sg')
            ->join('catalogo_articulos as ca','sg.articulo_id','=','ca.id')
            ->leftJoin('subcategorias as sc','ca.subcategoria_id','=','sc.id')
            ->where('ca.activo',true)
            ->select('ca.nombre','ca.modelo','sc.nombre as subcategoria','sg.cantidad','ca.stock_minimo','sg.ubicacion')
            ->orderBy('ca.nombre')->get();
 
        $pdf = Pdf::loadView('pdf.inventario',[
            'inventario'   => $inventario,
            'fecha'        => Carbon::now()->format('d/m/Y H:i'),
            'generado_por' => auth()->user()->nombre_usuario ?? 'Sistema',
        ]);
        $pdf->setPaper('a4','landscape');
        return $pdf->download('inventario_'.Carbon::now()->format('Ymd').'.pdf');
    }
 
    private function iniciales(string $nombre): string
    {
        $p = explode(' ', trim($nombre));
        return strtoupper(substr($p[0]??'',0,1).substr($p[1]??'',0,1));
    }

}
