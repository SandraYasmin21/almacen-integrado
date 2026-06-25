<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StockGeneral extends Model
{
    protected $table = 'stock_general';

    protected $guarded = [];

    public function articulo(): BelongsTo
    {
        return $this->belongsTo(CatalogoArticulo::class, 'articulo_id');
    }
}
