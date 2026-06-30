<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class CatalogoArticulo extends Model
{
    use SoftDeletes;

    public const TIPO_CONTROL_ACTIVO = 'ACTIVO';
    public const TIPO_CONTROL_MATERIAL = 'MATERIAL';
    public const TIPO_CONTROL_VEHICULO = 'VEHICULO';
    public const TIPO_CONTROL_HERRAMIENTA = 'HERRAMIENTA';

    public const TIPOS_CONTROL = [
        self::TIPO_CONTROL_ACTIVO,
        self::TIPO_CONTROL_MATERIAL,
        self::TIPO_CONTROL_VEHICULO,
        self::TIPO_CONTROL_HERRAMIENTA,
    ];

    protected $table = 'catalogo_articulos';

    protected $guarded = [];

    protected $casts = [
        'requiere_serie' => 'boolean',
        'es_consumible' => 'boolean',
        'activo' => 'boolean',
        'deleted_at' => 'datetime',
    ];

    public function subcategoria(): BelongsTo
    {
        return $this->belongsTo(Subcategoria::class, 'subcategoria_id');
    }
}
