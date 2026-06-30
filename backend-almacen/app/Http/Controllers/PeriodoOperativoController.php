<?php

namespace App\Http\Controllers;

use App\Models\PeriodoOperativo;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PeriodoOperativoController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', \App\Models\MovimientoInventario::class);

        return response()->json(
            PeriodoOperativo::query()
                ->orderByDesc('fecha_inicio')
                ->paginate($request->integer('per_page', 25))
        );
    }

    public function store(Request $request): JsonResponse
    {
        $this->authorize('create', \App\Models\MovimientoInventario::class);

        $data = $request->validate([
            'fecha_inicio' => ['required', 'date'],
            'fecha_fin' => ['required', 'date', 'after_or_equal:fecha_inicio'],
            'observaciones' => ['nullable', 'string', 'max:1000'],
        ]);

        $periodo = PeriodoOperativo::create($data + ['estatus' => PeriodoOperativo::ESTATUS_ABIERTO]);

        return response()->json($periodo, 201);
    }

    public function cerrar(Request $request, PeriodoOperativo $periodo): JsonResponse
    {
        $this->authorize('delete', \App\Models\MovimientoInventario::class);

        $data = $request->validate([
            'observaciones' => ['nullable', 'string', 'max:1000'],
        ]);

        $periodo->update([
            'estatus' => PeriodoOperativo::ESTATUS_CERRADO,
            'cerrado_por_id' => $request->user()->id,
            'fecha_cierre' => now(),
            'observaciones' => $data['observaciones'] ?? $periodo->observaciones,
        ]);

        return response()->json($periodo->fresh());
    }
}
