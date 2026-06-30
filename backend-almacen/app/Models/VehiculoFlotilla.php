<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class VehiculoFlotilla extends Model
{
    use SoftDeletes;

    protected $table = 'vehiculos_flotilla';

    protected $fillable = [
        'codigo_vehiculo',
        'nombre',
        'marca',
        'modelo',
        'anio',
        'niv',
        'numero_serie',
        'tipo_vehiculo',
        'color',
        'tipo_combustible',
        'capacidad_carga',
        'numero',
        'estado_gps',
        'gps_activo',
        'gps_proveedor',
        'placa',
        'placas',
        'poliza_seguro',
        'vencimiento_seguro',
        'aseguradora',
        'vencimiento_verificacion',
        'grupo',
        'certificacion',
        'estado',
        'responsable_id',
        'ubicacion_id',
        'kilometraje_actual',
        'ultima_actualizacion_km',
        'km_proximo_mantenimiento',
        'observaciones',
        'propietario',
        'costo_adquisicion',
        'fecha_adquisicion',
    ];

    protected $casts = [
        'anio'                     => 'integer',
        'kilometraje_actual'       => 'float',
        'km_proximo_mantenimiento' => 'float',
        'costo_adquisicion'        => 'float',
        'gps_activo'               => 'boolean',
        'vencimiento_seguro'       => 'date',
        'vencimiento_verificacion' => 'date',
        'fecha_adquisicion'        => 'date',
        'ultima_actualizacion_km'  => 'datetime',
        'deleted_at'               => 'datetime',
    ];

    // ─── Relaciones ───────────────────────────────────────────────

    public function registrosVehiculares(): HasMany
    {
        return $this->hasMany(RegistroVehicular::class, 'vehiculo_id');
    }

    public function gastosExtra(): HasMany
    {
        return $this->hasMany(GastoExtraVehiculo::class, 'vehiculo_id');
    }

    public function bitacoraViajes(): HasMany
    {
        return $this->hasMany(BitacoraVehiculo::class, 'vehiculo_id');
    }
}
