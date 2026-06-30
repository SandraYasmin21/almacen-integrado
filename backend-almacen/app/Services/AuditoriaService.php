<?php

namespace App\Services;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Request;

class AuditoriaService
{
    public function registrar(
        string $tabla,
        string|int|null $registroId,
        string $accion,
        ?string $campo = null,
        mixed $valorAnterior = null,
        mixed $valorNuevo = null,
        ?int $usuarioId = null
    ): void {
        DB::table('auditoria_sistema')->insert([
            'usuario_id' => $usuarioId ?? Auth::id(),
            'tabla' => $tabla,
            'registro_id' => $registroId ? (string) $registroId : null,
            'accion' => $accion,
            'campo' => $campo,
            'valor_anterior' => $valorAnterior === null ? null : json_encode($valorAnterior),
            'valor_nuevo' => $valorNuevo === null ? null : json_encode($valorNuevo),
            'ip' => Request::ip(),
            'user_agent' => substr((string) Request::userAgent(), 0, 500),
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    public function registrarModelo(Model $model, string $accion, ?array $original = null, ?array $nuevo = null): void
    {
        $this->registrar(
            $model->getTable(),
            $model->getKey(),
            $accion,
            null,
            $original,
            $nuevo
        );
    }
}
