<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class PerfilKiosco extends Model
{
    use SoftDeletes;

    protected $table = 'perfiles_kiosco';

    protected $fillable = [
        'empleado_id',
        'pin_hash',
        'estado',
        'kioscos_autorizados',
        'permisos',
        'intentos_fallidos',
        'bloqueado_hasta',
        'ultimo_acceso',
        'creado_por_id',
    ];

    protected $hidden = [
        'pin_hash',
    ];

    protected $casts = [
        'kioscos_autorizados' => 'array',
        'permisos'            => 'array',
        'ultimo_acceso'       => 'datetime',
        'bloqueado_hasta'     => 'datetime',
        'deleted_at'          => 'datetime',
    ];

    // ─── Constantes de estado ──────────────────────────────────────

    const ESTADO_ACTIVO    = 'activo';
    const ESTADO_SUSPENDIDO = 'suspendido';
    const ESTADO_BLOQUEADO = 'bloqueado';

    // Número de intentos fallidos antes de bloqueo temporal
    const MAX_INTENTOS = 5;

    // Minutos de bloqueo tras MAX_INTENTOS
    const MINUTOS_BLOQUEO = 30;

    // ─── Relaciones ───────────────────────────────────────────────

    public function empleado(): BelongsTo
    {
        return $this->belongsTo(Empleado::class, 'empleado_id');
    }

    public function creadoPor(): BelongsTo
    {
        return $this->belongsTo(Usuario::class, 'creado_por_id');
    }

    // ─── Helpers ─────────────────────────────────────────────────

    public function estaBloqueado(): bool
    {
        if ($this->estado === self::ESTADO_BLOQUEADO) {
            return true;
        }

        if ($this->bloqueado_hasta && $this->bloqueado_hasta->isFuture()) {
            return true;
        }

        return false;
    }

    public function tienePermiso(string $permiso): bool
    {
        if (empty($this->permisos)) {
            return true; // Sin restricciones específicas = todos permitidos
        }

        return in_array($permiso, $this->permisos);
    }
}
