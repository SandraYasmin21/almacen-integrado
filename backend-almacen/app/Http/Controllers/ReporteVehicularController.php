<?php

namespace App\Http\Controllers;

use App\Models\ReportePolicySubject;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ReporteVehicularController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', ReportePolicySubject::class);

        $mantenimientos = DB::table('registros_vehiculares')
            ->whereNull('deleted_at')
            ->select('vehiculo_id', DB::raw('SUM(costo) as costo_mantenimientos'), DB::raw('MAX(kilometraje) as kilometraje_actual'))
            ->groupBy('vehiculo_id');

        $gastos = DB::table('gastos_extra_vehiculos')
            ->whereNull('deleted_at')
            ->select('vehiculo_id', DB::raw('SUM(costo) as costo_gastos_extra'))
            ->groupBy('vehiculo_id');

        $vehiculos = DB::table('vehiculos_flotilla as v')
            ->leftJoinSub($mantenimientos, 'm', 'v.id', '=', 'm.vehiculo_id')
            ->leftJoinSub($gastos, 'g', 'v.id', '=', 'g.vehiculo_id')
            ->whereNull('v.deleted_at')
            ->select(
                'v.id',
                'v.nombre',
                'v.modelo',
                DB::raw("COALESCE(v.placa, v.placas, '') as placa"),
                'v.estado',
                DB::raw('COALESCE(m.costo_mantenimientos, 0) as costo_mantenimientos'),
                DB::raw('COALESCE(g.costo_gastos_extra, 0) as costo_gastos_extra'),
                DB::raw('COALESCE(m.kilometraje_actual, 0) as kilometraje_actual')
            )
            ->orderBy('v.nombre')
            ->get()
            ->map(function ($row) {
                $row->costo_total = (float) $row->costo_mantenimientos + (float) $row->costo_gastos_extra;
                return $row;
            });

        $mantenimientosPorTipo = DB::table('registros_vehiculares')
            ->whereNull('deleted_at')
            ->select(DB::raw("COALESCE(tipo_mantenimiento, tipo) as tipo_mantenimiento"), DB::raw('COUNT(*) as total'), DB::raw('SUM(costo) as costo_total'))
            ->groupBy(DB::raw("COALESCE(tipo_mantenimiento, tipo)"))
            ->orderBy('tipo_mantenimiento')
            ->get();

        return response()->json([
            'catalogo' => $vehiculos,
            'mantenimientos_por_tipo' => $mantenimientosPorTipo,
            'totales' => [
                'vehiculos' => $vehiculos->count(),
                'costo_total' => $vehiculos->sum('costo_total'),
                'costo_mantenimientos' => $vehiculos->sum('costo_mantenimientos'),
                'costo_gastos_extra' => $vehiculos->sum('costo_gastos_extra'),
            ],
        ]);
    }

    public function historial(int $vehiculoId): JsonResponse
    {
        $this->authorize('viewAny', ReportePolicySubject::class);

        return response()->json([
            'mantenimientos' => DB::table('registros_vehiculares')->where('vehiculo_id', $vehiculoId)->whereNull('deleted_at')->orderByDesc('fecha')->get(),
            'gastos_extra' => DB::table('gastos_extra_vehiculos')->where('vehiculo_id', $vehiculoId)->whereNull('deleted_at')->orderByDesc('fecha')->get(),
            'viajes' => DB::table('bitacora_vehiculos')->where('vehiculo_id', $vehiculoId)->whereNull('deleted_at')->orderByDesc('fecha_hora_salida')->get(),
        ]);
    }
}
