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
            'anio' => 'nullable|integer|min:2000|max:2099',
            'mes'  => 'nullable|integer|min:1|max:12',
            'dia'  => 'nullable|integer|min:1|max:31',
        ]);

        $anio = $request->filled('anio') ? (int) $request->anio : null;
        $mes  = $request->filled('mes')  ? (int) $request->mes  : null;
        $dia  = $request->filled('dia')  ? (int) $request->dia  : null;

        // ── Filtro de rango de fecha para registros ──────────────────────
        $registrosQuery = RegistroVehicular::query();
        $gastosQuery    = GastoExtraVehiculo::query();

        if ($anio) {
            $registrosQuery->whereYear('fecha', $anio);
            $gastosQuery->whereYear('fecha', $anio);
        }
        if ($mes) {
            $registrosQuery->whereMonth('fecha', $mes);
            $gastosQuery->whereMonth('fecha', $mes);
        }
        if ($dia) {
            $registrosQuery->whereDay('fecha', $dia);
            $gastosQuery->whereDay('fecha', $dia);
        }

        // ── 1. Total de vehículos activos ─────────────────────────────────
        $totalVehiculosActivos = VehiculoFlotilla::where('estado', 'ACTIVO')->count();

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
        ]);
    }
}
