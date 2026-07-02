<?php

namespace App\Http\Controllers;

use App\Models\GastoExtraVehiculo;
use App\Models\RegistroVehicular;
use App\Models\VehiculoFlotilla;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class FlotillaDashboardController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $request->validate([
            'fecha_inicio' => 'nullable|date',
            'fecha_fin'    => 'nullable|date|after_or_equal:fecha_inicio',
        ]);

        $fechaInicio = $request->input('fecha_inicio');
        $fechaFin = $request->input('fecha_fin');

        $registrosQuery = RegistroVehicular::query();
        $gastosQuery = GastoExtraVehiculo::query();

        $this->aplicarRango($registrosQuery, $fechaInicio, $fechaFin);
        $this->aplicarRango($gastosQuery, $fechaInicio, $fechaFin);

        $totalVehiculos = VehiculoFlotilla::count();
        $vehiculosDisponibles = VehiculoFlotilla::whereIn('estado', ['ACTIVO', 'DISPONIBLE'])->count();
        $vehiculosAsignados = VehiculoFlotilla::where('estado', 'ASIGNADO')->count();
        $vehiculosMantenimiento = VehiculoFlotilla::where('estado', 'EN_MANTENIMIENTO')->count();

        $totalMantenimientos = (clone $registrosQuery)->count();
        $preventivos = (clone $registrosQuery)->where('tipo', 'preventivo')->count();
        $correctivos = (clone $registrosQuery)->whereIn('tipo', ['correctivo', 'correctivo_mayor', 'reparacion'])->count();
        $lecturas = (clone $registrosQuery)->where('tipo', 'lectura')->count();
        $costoTotalMantenimientos = (float) (clone $registrosQuery)->sum('costo');
        $costoTotalGastosExtra = (float) (clone $gastosQuery)->sum('costo');

        $porTipo = (clone $registrosQuery)
            ->select('tipo', DB::raw('COUNT(*) as total'), DB::raw('COALESCE(SUM(costo), 0) as costo_total'))
            ->groupBy('tipo')
            ->orderBy('tipo')
            ->get();

        $masPreventivos = $this->topMantenimientosPorTipo($fechaInicio, $fechaFin, ['preventivo'], 'total_preventivos');
        $masCorrectivos = $this->topMantenimientosPorTipo($fechaInicio, $fechaFin, ['correctivo', 'correctivo_mayor', 'reparacion'], 'total_correctivos');

        $costoPorVehiculo = VehiculoFlotilla::query()
            ->with(['registrosVehiculares' => fn ($query) => $query->latest('fecha')->limit(1)])
            ->get(['id', 'codigo_vehiculo', 'nombre', 'placa', 'placas', 'numero', 'estado', 'kilometraje_actual'])
            ->map(function (VehiculoFlotilla $vehiculo) use ($fechaInicio, $fechaFin) {
                $mantenimientos = RegistroVehicular::where('vehiculo_id', $vehiculo->id);
                $gastos = GastoExtraVehiculo::where('vehiculo_id', $vehiculo->id);
                $this->aplicarRango($mantenimientos, $fechaInicio, $fechaFin);
                $this->aplicarRango($gastos, $fechaInicio, $fechaFin);

                $costoMantenimientos = (float) $mantenimientos->sum('costo');
                $costoGastosExtra = (float) $gastos->sum('costo');
                $ultimoMantenimiento = RegistroVehicular::where('vehiculo_id', $vehiculo->id)
                    ->latest('fecha')
                    ->first(['fecha', 'tipo', 'kilometraje']);

                return [
                    'vehiculo_id' => $vehiculo->id,
                    'codigo_vehiculo' => $vehiculo->codigo_vehiculo,
                    'nombre' => $vehiculo->nombre,
                    'placas' => $vehiculo->placas ?? $vehiculo->placa,
                    'numero' => $vehiculo->numero,
                    'estado' => $vehiculo->estado,
                    'kilometraje_actual' => (float) ($vehiculo->kilometraje_actual ?? 0),
                    'ultimo_mantenimiento' => $ultimoMantenimiento?->fecha,
                    'ultimo_mantenimiento_tipo' => $ultimoMantenimiento?->tipo,
                    'ultimo_kilometraje_registrado' => $ultimoMantenimiento ? (float) $ultimoMantenimiento->kilometraje : (float) ($vehiculo->kilometraje_actual ?? 0),
                    'costo_mantenimientos' => round($costoMantenimientos, 2),
                    'costo_gastos_extra' => round($costoGastosExtra, 2),
                    'costo_total' => round($costoMantenimientos + $costoGastosExtra, 2),
                ];
            })
            ->sortByDesc('costo_total')
            ->values();

        return response()->json([
            'filtro_aplicado' => [
                'fecha_inicio' => $fechaInicio,
                'fecha_fin' => $fechaFin,
            ],
            'resumen' => [
                'total_vehiculos' => $totalVehiculos,
                'vehiculos_disponibles' => $vehiculosDisponibles,
                'vehiculos_asignados' => $vehiculosAsignados,
                'vehiculos_en_mantenimiento' => $vehiculosMantenimiento,
                'total_vehiculos_activos' => $vehiculosDisponibles + $vehiculosAsignados,
                'total_mantenimientos' => $totalMantenimientos,
                'mantenimientos_preventivos' => $preventivos,
                'mantenimientos_correctivos' => $correctivos,
                'lecturas_kilometraje' => $lecturas,
                'costo_total_mantenimientos' => round($costoTotalMantenimientos, 2),
                'costo_total_gastos_extra' => round($costoTotalGastosExtra, 2),
                'gasto_total_general' => round($costoTotalMantenimientos + $costoTotalGastosExtra, 2),
            ],
            'mantenimientos_por_tipo' => $porTipo,
            'vehiculos_mas_mantenimientos_preventivos' => $masPreventivos,
            'vehiculos_mas_mantenimientos_correctivos' => $masCorrectivos,
            'costo_por_vehiculo' => $costoPorVehiculo,
        ]);
    }

    private function aplicarRango($query, ?string $fechaInicio, ?string $fechaFin): void
    {
        if ($fechaInicio && $fechaFin) {
            $query->whereBetween('fecha', [$fechaInicio, $fechaFin]);
            return;
        }

        if ($fechaInicio) {
            $query->where('fecha', '>=', $fechaInicio);
        }

        if ($fechaFin) {
            $query->where('fecha', '<=', $fechaFin);
        }
    }

    private function topMantenimientosPorTipo(?string $fechaInicio, ?string $fechaFin, array $tipos, string $alias)
    {
        $query = RegistroVehicular::query()
            ->select('vehiculo_id', DB::raw('COUNT(*) as total'))
            ->whereIn('tipo', $tipos)
            ->groupBy('vehiculo_id')
            ->orderByDesc('total')
            ->take(5)
            ->with('vehiculo:id,nombre,placa,placas,numero');

        $this->aplicarRango($query, $fechaInicio, $fechaFin);

        return $query->get()->map(fn ($registro) => [
            'vehiculo_id' => $registro->vehiculo_id,
            'nombre' => $registro->vehiculo?->nombre,
            'placa' => $registro->vehiculo?->placas ?? $registro->vehiculo?->placa,
            'numero' => $registro->vehiculo?->numero,
            $alias => (int) $registro->total,
        ]);
    }
}
