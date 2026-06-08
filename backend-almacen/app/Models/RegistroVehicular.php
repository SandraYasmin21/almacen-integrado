<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RegistroVehicular extends Model
{
    protected $table = 'registros_vehiculares';

    protected $fillable = [
        'vehiculo_id',
        'nombre_vehiculo',
        'niv',
        'placas',
        'fecha',
        'tipo',
        'detalle_falla',
        'kilometraje',
        'costo',
        'tipo_mantenimiento',
    ];

    protected $casts = [
        'fecha'        => 'date',
        'kilometraje'  => 'float',
        'costo'        => 'float',
    ];

    // ─── Relaciones ───────────────────────────────────────────────

    public function vehiculo(): BelongsTo
    {
        return $this->belongsTo(VehiculoFlotilla::class, 'vehiculo_id');
    }
}
