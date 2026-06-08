<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GastoExtraVehiculo extends Model
{
    protected $table = 'gastos_extra_vehiculos';

    protected $fillable = [
        'vehiculo_id',
        'fecha',
        'tipo',
        'costo',
        'observaciones',
    ];

    protected $casts = [
        'fecha' => 'date',
        'costo' => 'float',
    ];

    // ─── Relaciones ───────────────────────────────────────────────

    public function vehiculo(): BelongsTo
    {
        return $this->belongsTo(VehiculoFlotilla::class, 'vehiculo_id');
    }
}
