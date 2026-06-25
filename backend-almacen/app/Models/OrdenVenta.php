<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class OrdenVenta extends Model
{
    protected $table = 'orden_venta';

    protected $guarded = [];

    protected $casts = [
        'fecha_hora' => 'datetime',
    ];

    public function proyecto(): BelongsTo
    {
        return $this->belongsTo(ProyectoPresupuesto::class, 'proyecto_id');
    }

    public function detalleOrden(): HasMany
    {
        return $this->hasMany(DetalleOrdenVenta::class, 'orden_venta_id');
    }
}
