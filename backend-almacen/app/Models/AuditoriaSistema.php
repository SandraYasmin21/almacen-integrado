<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AuditoriaSistema extends Model
{
    protected $table = 'auditoria_sistema';

    protected $guarded = [];

    protected $casts = [
        'valor_anterior' => 'array',
        'valor_nuevo' => 'array',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];
}
