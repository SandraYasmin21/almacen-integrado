<?php

namespace smartlynk\Core\Models;

use Illuminate\Database\Eloquent\Model;

class Empleado extends Model
{
    protected $table = 'empleados';

    protected $guarded = [];

    protected $casts = [
        'fecha_ingreso' => 'date',
        'tiene_licencia' => 'boolean',
    ];

    public function getNombreAttribute(): ?string
    {
        return $this->nombre_completo;
    }
}