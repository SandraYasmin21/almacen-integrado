<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class InventarioSerie extends Model
{
    use SoftDeletes;

    public const ESTADO_DISPONIBLE = 'DISPONIBLE';
    public const ESTADO_ASIGNADO = 'ASIGNADO';
    public const ESTADO_REPARACION = 'EN_REPARACION';
    public const ESTADO_BAJA = 'BAJA';
    public const ESTADO_EXTRAVIADO = 'EXTRAVIADO';

    protected $table = 'inventario_series';

    protected $guarded = [];

    protected $casts = [
        'ubicacion' => 'string',
        'fecha_adquisicion' => 'date',
        'fecha_vencimiento_garantia' => 'date',
        'deleted_at' => 'datetime',
    ];

    public function articulo(): BelongsTo
    {
        return $this->belongsTo(CatalogoArticulo::class, 'articulo_id');
    }

    public function ubicacionFisica(): BelongsTo
    {
        return $this->belongsTo(Ubicacion::class, 'ubicacion_id');
    }
}
