<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class VehiculoFlotilla extends Model
{
    /**
     * Nombre de tabla coherente con el paquete smartlynk/core-compartido.
     */
    protected $table = 'vehiculos_flotilla';

    protected $fillable = [
        'nombre',
        'modelo',
        'numero_serie',
        'tipo_vehiculo',
        'numero',
        'estado_gps',
        'placa',
        'poliza_seguro',
        'grupo',
        'certificacion',
        'estado',
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
