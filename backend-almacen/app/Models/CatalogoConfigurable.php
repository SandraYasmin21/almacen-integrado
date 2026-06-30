<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class CatalogoConfigurable extends Model
{
    use SoftDeletes;

    protected $table = 'catalogos_configurables';

    protected $guarded = [];

    protected $casts = [
        'activo' => 'boolean',
        'metadata' => 'array',
        'deleted_at' => 'datetime',
    ];
}
