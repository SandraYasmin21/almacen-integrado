<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PeriodoOperativo extends Model
{
    public const ESTATUS_ABIERTO = 'ABIERTO';
    public const ESTATUS_CERRADO = 'CERRADO';

    protected $table = 'periodos_operativos';

    protected $guarded = [];

    protected $casts = [
        'fecha_inicio' => 'date',
        'fecha_fin' => 'date',
        'fecha_cierre' => 'datetime',
    ];
}
