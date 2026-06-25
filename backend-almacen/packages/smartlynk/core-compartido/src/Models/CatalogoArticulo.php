<?php

namespace smartlynk\Core\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CatalogoArticulo extends Model
{
    protected $table = 'catalogo_articulos';

    protected $guarded = [];

    public function subcategoria(): BelongsTo
    {
        return $this->belongsTo(Subcategoria::class, 'subcategoria_id');
    }
}