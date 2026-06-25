<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DetalleMovimiento extends Model
{
    protected $table = 'detalle_movimiento';

    protected $guarded = [];

    public function ticket(): BelongsTo
    {
        return $this->belongsTo(MovimientoInventario::class, 'movimiento_id');
    }

    public function articulo(): BelongsTo
    {
        return $this->belongsTo(CatalogoArticulo::class, 'articulo_id');
    }

    public function serie(): BelongsTo
    {
        return $this->belongsTo(InventarioSerie::class, 'serie_id');
    }

    public function ordenVenta(): BelongsTo
    {
        return $this->belongsTo(OrdenVenta::class, 'orden_venta_id');
    }
}
