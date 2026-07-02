<?php

namespace App\Http\Controllers;

use App\Models\VehiculoFlotilla;
use App\Models\RegistroVehicular;
use App\Models\BitacoraVehiculo;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class FlotillaKilometrajeController extends Controller
{
    /**
     * Tabla de kilometraje por vehículo.
     *
     * Devuelve por cada vehículo:
     *   - max_kilometraje: el kilómetro más alto registrado en registros_vehiculares
     *   - km_ultimo_correctivo: kilometraje en el que se hizo el último correctivo
     *   - km_ultimo_preventivo: kilometraje en el que se hizo el último preventivo
     *   - total_km_bitacora: suma total de km recorridos en bitácora de viajes
     *   - proximo_mantenimiento_km: km_ultimo_preventivo + 10,000
     *   - requiere_mantenimiento: true si max_kilometraje >= proximo_mantenimiento_km
     *   - revisar_kilometraje: true si no tiene registro de preventivo (nunca ha tenido)
     *
     * GET /api/flotilla/kilometraje
     */
    public function index(): JsonResponse
    {
        $vehiculos = VehiculoFlotilla::whereIn('estado', ['ACTIVO', 'DISPONIBLE', 'ASIGNADO', 'EN_MANTENIMIENTO'])->get();

        $resultado = $vehiculos->map(function (VehiculoFlotilla $v) {

            // ── Máximo kilometraje registrado en cualquier tipo de evento ──
            $maxKm = max(
                (float) ($v->kilometraje_actual ?? 0),
                (float) (RegistroVehicular::where('vehiculo_id', $v->id)->max('kilometraje') ?? 0)
            );

            // ── Último correctivo ─────────────────────────────────────────
            $ultimoCorrectivo = RegistroVehicular::where('vehiculo_id', $v->id)
                ->where('tipo', 'correctivo')
                ->orderBy('fecha', 'desc')
                ->orderBy('kilometraje', 'desc')
                ->first(['kilometraje', 'fecha']);

            // ── Último preventivo ─────────────────────────────────────────
            $ultimoPreventivo = RegistroVehicular::where('vehiculo_id', $v->id)
                ->where('tipo', 'preventivo')
                ->orderBy('fecha', 'desc')
                ->orderBy('kilometraje', 'desc')
                ->first(['kilometraje', 'fecha']);

            // ── Kilómetros totales recorridos según bitácora de viajes ────
            $totalKmBitacora = BitacoraVehiculo::where('vehiculo_id', $v->id)
                ->whereNotNull('km_final')
                ->whereNotNull('km_inicial')
                ->select(DB::raw('SUM(km_final - km_inicial) as total'))
                ->value('total') ?? 0;

            // ── Próximo mantenimiento: último preventivo + 10,000 km ──────
            $proximoMantenimientoKm = $ultimoPreventivo
                ? ($ultimoPreventivo->kilometraje + 10000)
                : null;

            // ── Alertas ───────────────────────────────────────────────────
            $requiereMantenimiento = $proximoMantenimientoKm !== null
                && $maxKm >= $proximoMantenimientoKm;

            // Sin historial de preventivo → se debe revisar el kilometraje
            $revisarKilometraje = $ultimoPreventivo === null;

            return [
                'vehiculo_id'              => $v->id,
                'nombre'                   => $v->nombre,
                'placa'                    => $v->placa,
                'numero'                   => $v->numero,
                'max_kilometraje'          => (float) $maxKm,
                'km_ultimo_correctivo'     => $ultimoCorrectivo
                    ? ['km' => (float) $ultimoCorrectivo->kilometraje, 'fecha' => $ultimoCorrectivo->fecha]
                    : null,
                'km_ultimo_preventivo'     => $ultimoPreventivo
                    ? ['km' => (float) $ultimoPreventivo->kilometraje, 'fecha' => $ultimoPreventivo->fecha]
                    : null,
                'total_km_bitacora'        => (float) $totalKmBitacora,
                'proximo_mantenimiento_km' => $proximoMantenimientoKm,
                'requiere_mantenimiento'   => $requiereMantenimiento,
                'revisar_kilometraje'      => $revisarKilometraje,
            ];
        });

        // Ordenar: primero los que requieren mantenimiento
        $ordenado = $resultado->sortByDesc('requiere_mantenimiento')->values();

        return response()->json([
            'total_vehiculos' => $vehiculos->count(),
            'vehiculos'       => $ordenado,
        ]);
    }
}
