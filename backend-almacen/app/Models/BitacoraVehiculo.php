<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BitacoraVehiculo extends Model
{
    protected $table = 'bitacora_vehiculos';

    protected $fillable = [
        'vehiculo_id',
        'empleado_id',
        'fecha_hora_salida',
        'km_inicial',
        'motivo_viaje',
        'fecha_hora_regreso',
        'km_final',
        'observaciones_retorno',
    ];

    protected $casts = [
        'fecha_hora_salida'  => 'datetime',
        'fecha_hora_regreso' => 'datetime',
        'km_inicial'         => 'float',
        'km_final'           => 'float',
    ];

    // ─── Relaciones ───────────────────────────────────────────────

    public function vehiculo(): BelongsTo
    {
        return $this->belongsTo(VehiculoFlotilla::class, 'vehiculo_id');
    }

    public function empleado(): BelongsTo
    {
        return $this->belongsTo(Empleado::class, 'empleado_id');
    }
}
