<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class GastoExtraVehiculo extends Model
{
    use SoftDeletes;

    protected $table = 'gastos_extra_vehiculos';

    protected $fillable = [
        'vehiculo_id',
        'usuario_id',
        'fecha',
        'tipo',
        'costo',
        'observaciones',
        'evidencia_path',
    ];

    protected $casts = [
        'fecha' => 'date',
        'costo' => 'float',
        'deleted_at' => 'datetime',
    ];

    // ─── Relaciones ───────────────────────────────────────────────

    public function vehiculo(): BelongsTo
    {
        return $this->belongsTo(VehiculoFlotilla::class, 'vehiculo_id');
    }

    public function usuario(): BelongsTo
    {
        return $this->belongsTo(Usuario::class, 'usuario_id');
    }
}
