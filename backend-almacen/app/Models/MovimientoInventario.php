<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class MovimientoInventario extends Model
{
    use SoftDeletes;

    public const TIPO_ENTRADA = 'ENTRADA';
    public const TIPO_SALIDA = 'SALIDA';
    public const TIPO_DEVOLUCION = 'DEVOLUCION';
    public const TIPO_ASIGNACION = 'ASIGNACION';
    public const TIPO_TRANSFERENCIA = 'TRANSFERENCIA';
    public const TIPO_ENVIO_REPARACION = 'ENVIO_REPARACION';
    public const TIPO_RETORNO_REPARACION = 'RETORNO_REPARACION';
    public const TIPO_CAMBIO_RESPONSABLE = 'CAMBIO_RESPONSABLE';
    public const TIPO_CAMBIO_ESTADO = 'CAMBIO_ESTADO';
    public const TIPO_BAJA_LOGICA = 'BAJA_LOGICA';

    public const TIPOS_FORMALES = [
        self::TIPO_ENTRADA,
        self::TIPO_SALIDA,
        self::TIPO_DEVOLUCION,
        self::TIPO_ASIGNACION,
        self::TIPO_TRANSFERENCIA,
        self::TIPO_ENVIO_REPARACION,
        self::TIPO_RETORNO_REPARACION,
        self::TIPO_CAMBIO_RESPONSABLE,
        self::TIPO_CAMBIO_ESTADO,
        self::TIPO_BAJA_LOGICA,
    ];

    protected $table = 'movimiento_inventario';

    protected $guarded = [];

    protected $casts = [
        'datos_previos' => 'array',
        'datos_nuevos' => 'array',
        'fecha_hora' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    public function detalles(): HasMany
    {
        return $this->hasMany(DetalleMovimiento::class, 'movimiento_id');
    }

    public function usuario(): BelongsTo
    {
        return $this->belongsTo(User::class, 'usuario_id');
    }

    public function empleado(): BelongsTo
    {
        return $this->belongsTo(Empleado::class, 'empleado_id');
    }

    public function proveedor(): BelongsTo
    {
        return $this->belongsTo(Proveedor::class, 'proveedor_id');
    }
}
