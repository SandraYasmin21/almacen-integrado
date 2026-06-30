<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class ProyectoRecurso extends Model
{
    use SoftDeletes;

    protected $table = 'proyecto_recursos';

    protected $guarded = [];

    protected $casts = [
        'fecha_asignacion' => 'datetime',
        'fecha_retiro' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    public function articulo()
    {
        return $this->belongsTo(CatalogoArticulo::class, 'articulo_id');
    }

    public function serie()
    {
        return $this->belongsTo(InventarioSerie::class, 'serie_id');
    }

    public function vehiculo()
    {
        return $this->belongsTo(VehiculoFlotilla::class, 'vehiculo_id');
    }
}
