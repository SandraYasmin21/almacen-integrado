<?php

namespace App\Services;

use App\Models\MovimientoInventario;
use App\Models\PeriodoOperativo;
use App\Models\Usuario;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Database\Eloquent\Model;

class PeriodoOperativoService
{
    public function assertMovimientoEditable(MovimientoInventario|Model $movimiento, Usuario $usuario): void
    {
        $fecha = $movimiento->fecha_hora ?? $movimiento->created_at;
        if (! $fecha) {
            return;
        }

        $periodoCerrado = PeriodoOperativo::query()
            ->where('estatus', PeriodoOperativo::ESTATUS_CERRADO)
            ->whereDate('fecha_inicio', '<=', $fecha)
            ->whereDate('fecha_fin', '>=', $fecha)
            ->exists();

        if ($periodoCerrado) {
            throw new AuthorizationException('El movimiento pertenece a un periodo cerrado.');
        }

        if ($fecha->lt(now()->subDays(30)) && ! $usuario->isAdmin()) {
            throw new AuthorizationException('Los movimientos mayores a 30 dias solo pueden modificarse por Admin.');
        }
    }
}
