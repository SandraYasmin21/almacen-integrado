<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class InventarioSerie extends Model
{
    protected $table = 'inventario_series';

    protected $guarded = [];

    protected $casts = [
        'ubicacion' => 'string',
    ];

    public function articulo(): BelongsTo
    {
        return $this->belongsTo(CatalogoArticulo::class, 'articulo_id');
    }
}
