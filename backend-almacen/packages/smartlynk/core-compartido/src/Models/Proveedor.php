<?php

namespace smartlynk\Core\Models;

use Illuminate\Database\Eloquent\Model;

class Proveedor extends Model
{
    protected $table = 'proveedores';

    protected $guarded = [];

    public function getNombreAttribute(): ?string
    {
        return $this->nombre_empresa;
    }
}