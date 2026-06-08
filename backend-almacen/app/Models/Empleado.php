<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Empleado extends Model
{
    use HasFactory;

    // Permitimos que estos campos se llenen desde el formulario
    protected $fillable = [
        'numero_gafete',
        'nombre_completo',
        'departamento_area',
        'foto_perfil',
        'activo'
    ];
}