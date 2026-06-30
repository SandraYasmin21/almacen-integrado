<?php

namespace App\Http\Controllers;

use App\Models\RegistroVehicular;
use App\Models\VehiculoFlotilla;
use App\Models\GastoExtraVehiculo;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class FlotillaDashboardController extends Controller
{
    /**
     * Dashboard principal del módulo de flotilla.
     * Devuelve estadísticas generales con filtro opcional por fecha.
     *
     * GET /api/flotilla/dashboard
     * Query params opcionales: anio, mes, dia
     */
    public function index(Request $request): JsonResponse
    {
        $request->validate([
            'fecha_inicio' => 'nullable|date',
            'fecha_fin'    => 'nullable|date|after_or_equal:fecha_inicio',
        ]);

        $fechaInicio = $request->input('fecha_inicio');
        $fechaFin    = $request->input('fecha_fin');

        // ── Filtro de rango de fecha para registros ──────────────────────
        $registrosQuery = RegistroVehicular::query();
        $gastosQuery    = GastoExtraVehiculo::query();

        if ($fechaInicio && $fechaFin) {
            $registrosQuery->whereBetween('fecha', [$fechaInicio, $fechaFin]);
            $gastosQuery->whereBetween('fecha', [$fechaInicio, $fechaFin]);
        } elseif ($fechaInicio) {
            $registrosQuery->where('fecha', '>=', $fechaInicio);
            $gastosQuery->where('fecha', '>=', $fechaInicio);
        } elseif ($fechaFin) {
            $registrosQuery->where('fecha', '<=', $fechaFin);
            $gastosQuery->where('fecha', '<=', $fechaFin);
        }

        // ── 1. Total de vehículos activos ─────────────────────────────────
        $totalVehiculosActivos = VehiculoFlotilla::whereIn('estado', ['ACTIVO', 'DISPONIBLE', 'ASIGNADO'])->count();

        // ── 2. Total de mantenimientos en el período ──────────────────────
        $totalMantenimientos = (clone $registrosQuery)->count();

        // ── 3. Costo total de mantenimientos ──────────────────────────────
        $costoTotalMantenimientos = (clone $registrosQuery)->sum('costo');

        // ── 4. Costo total de gastos extra ────────────────────────────────
        $costoTotalGastosExtra = (clone $gastosQuery)->sum('costo');

        // ── 5. Vehículos con más mantenimientos PREVENTIVOS ───────────────
        $masPreventivos = (clone $registrosQuery)
            ->select('vehiculo_id', DB::raw('COUNT(*) as total'))
            ->where('tipo', 'preventivo')
            ->groupBy('vehiculo_id')
            ->orderByDesc('total')
            ->take(5)
            ->with('vehiculo:id,nombre,placa,numero')
            ->get()
            ->map(fn ($r) => [
                'vehiculo_id'   => $r->vehiculo_id,
                'nombre'        => $r->vehiculo?->nombre,
                'placa'         => $r->vehiculo?->placa,
                'numero'        => $r->vehiculo?->numero,
                'total_preventivos' => $r->total,
            ]);

        // ── 6. Vehículos con más mantenimientos CORRECTIVOS ───────────────
        $masCorrectivos = (clone $registrosQuery)
            ->select('vehiculo_id', DB::raw('COUNT(*) as total'))
            ->where('tipo', 'correctivo')
            ->groupBy('vehiculo_id')
            ->orderByDesc('total')
            ->take(5)
            ->with('vehiculo:id,nombre,placa,numero')
            ->get()
            ->map(fn ($r) => [
                'vehiculo_id'   => $r->vehiculo_id,
                'nombre'        => $r->vehiculo?->nombre,
                'placa'         => $r->vehiculo?->placa,
                'numero'        => $r->vehiculo?->numero,
                'total_correctivos' => $r->total,
            ]);

        // ── 7. Desglose de mantenimientos por tipo ─────────────────────
        $porTipo = (clone $registrosQuery)
            ->select('tipo', DB::raw('COUNT(*) as total'), DB::raw('SUM(costo) as costo_total'))
            ->groupBy('tipo')
            ->get();

        $costoPorVehiculo = VehiculoFlotilla::query()
            ->whereIn('estado', ['ACTIVO', 'DISPONIBLE', 'ASIGNADO', 'EN_MANTENIMIENTO'])
            ->get(['id', 'nombre', 'placa', 'placas', 'numero'])
            ->map(function (VehiculoFlotilla $vehiculo) use ($anio, $mes, $dia) {
                $mantenimientos = RegistroVehicular::where('vehiculo_id', $vehiculo->id);
                $gastos = GastoExtraVehiculo::where('vehiculo_id', $vehiculo->id);

                if ($anio) {
                    $mantenimientos->whereYear('fecha', $anio);
                    $gastos->whereYear('fecha', $anio);
                }
                if ($mes) {
                    $mantenimientos->whereMonth('fecha', $mes);
                    $gastos->whereMonth('fecha', $mes);
                }
                if ($dia) {
                    $mantenimientos->whereDay('fecha', $dia);
                    $gastos->whereDay('fecha', $dia);
                }

                $costoMantenimientos = (float) $mantenimientos->sum('costo');
                $costoGastosExtra = (float) $gastos->sum('costo');

                return [
                    'vehiculo_id' => $vehiculo->id,
                    'nombre' => $vehiculo->nombre,
                    'placas' => $vehiculo->placas ?? $vehiculo->placa,
                    'numero' => $vehiculo->numero,
                    'costo_mantenimientos' => round($costoMantenimientos, 2),
                    'costo_gastos_extra' => round($costoGastosExtra, 2),
                    'costo_total' => round($costoMantenimientos + $costoGastosExtra, 2),
                ];
            })
            ->sortByDesc('costo_total')
            ->values();

        return response()->json([
            'filtro_aplicado' => [
                'anio' => $anio,
                'mes'  => $mes,
                'dia'  => $dia,
            ],
            'resumen' => [
                'total_vehiculos_activos'    => $totalVehiculosActivos,
                'total_mantenimientos'       => $totalMantenimientos,
                'costo_total_mantenimientos' => round($costoTotalMantenimientos, 2),
                'costo_total_gastos_extra'   => round($costoTotalGastosExtra, 2),
                'gasto_total_general'        => round($costoTotalMantenimientos + $costoTotalGastosExtra, 2),
            ],
            'mantenimientos_por_tipo'              => $porTipo,
            'vehiculos_mas_mantenimientos_preventivos'  => $masPreventivos,
            'vehiculos_mas_mantenimientos_correctivos'  => $masCorrectivos,
            'costo_por_vehiculo' => $costoPorVehiculo,
        ]);
    }
}
