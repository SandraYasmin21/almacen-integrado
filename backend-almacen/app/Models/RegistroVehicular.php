<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class RegistroVehicular extends Model
{
    use SoftDeletes;

    protected $table = 'registros_vehiculares';

    protected $fillable = [
        'vehiculo_id',
        'usuario_id',
        'nombre_vehiculo',
        'niv',
        'placas',
        'fecha',
        'tipo',
        'detalle_falla',
        'notas',
        'evidencia_path',
        'kilometraje',
        'costo',
        'tipo_mantenimiento',
        'taller',
        'fecha_inicio_reparacion',
    ];

    protected $casts = [
        'fecha'        => 'date',
        'kilometraje'  => 'float',
        'costo'        => 'float',
        'deleted_at'   => 'datetime',
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
