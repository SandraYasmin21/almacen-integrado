<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Ubicacion extends Model
{
    use SoftDeletes;

    protected $table = 'ubicaciones';

    protected $guarded = [];

    protected $casts = [
        'activo' => 'boolean',
    ];
}
