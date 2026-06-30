<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class ProyectoPresupuesto extends Model
{
    use SoftDeletes;

    protected $table = 'proyectos_presupuestos';

    protected $guarded = [];

    protected $casts = [
        'fecha_inicio' => 'date',
        'fecha_cierre_estimada' => 'date',
        'deleted_at' => 'datetime',
    ];

    public function responsable(): BelongsTo
    {
        return $this->belongsTo(Empleado::class, 'responsable_id');
    }

    public function recursos(): HasMany
    {
        return $this->hasMany(ProyectoRecurso::class, 'proyecto_id');
    }
}
