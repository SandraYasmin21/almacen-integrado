<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class CatalogosConfigurablesSeeder extends Seeder
{
    public function run(): void
    {
        $catalogos = [
            'estados_fisicos' => ['NUEVO', 'USADO', 'DANADO', 'EN_REPARACION'],
            'estatus_operativos' => ['DISPONIBLE', 'ASIGNADO', 'RESERVADO', 'EN_PROYECTO', 'EN_REPARACION', 'BAJA', 'EXTRAVIADO'],
            'tipos_movimiento' => ['ENTRADA', 'SALIDA', 'ASIGNACION', 'DEVOLUCION', 'TRANSFERENCIA', 'CAMBIO_RESPONSABLE', 'CAMBIO_ESTADO', 'ENVIO_REPARACION', 'RETORNO_REPARACION', 'BAJA_LOGICA'],
            'tipos_control' => ['ACTIVO', 'MATERIAL', 'VEHICULO', 'HERRAMIENTA'],
            'tipos_activo' => ['EQUIPO_TI', 'MATERIAL', 'VEHICULO', 'HERRAMIENTA', 'CONSUMIBLE'],
            'marcas' => ['DELL', 'HP', 'LENOVO', 'CISCO', 'UBIQUITI', 'FORD', 'NISSAN', 'CHEVROLET', 'GENERICO'],
            'tipos_ubicacion' => ['ALMACEN', 'OFICINA', 'CLIENTE', 'PROYECTO', 'VEHICULO', 'TALLER', 'REPARACION'],
            'estatus_vehiculo' => ['DISPONIBLE', 'ASIGNADO', 'EN_MANTENIMIENTO', 'BAJA', 'SINIESTRADO', 'ACTIVO', 'INACTIVO'],
            'tipos_mantenimiento' => ['PREVENTIVO', 'CORRECTIVO', 'LECTURA', 'DIAGNOSTICO', 'LAVADO', 'GASTO_EXTRA'],
        ];

        foreach ($catalogos as $tipo => $items) {
            foreach ($items as $orden => $nombre) {
                DB::table('catalogos_configurables')->updateOrInsert(
                    ['tipo' => $tipo, 'clave' => $nombre],
                    [
                        'nombre' => Str::headline(strtolower(str_replace('_', ' ', $nombre))),
                        'descripcion' => null,
                        'activo' => true,
                        'orden' => $orden + 1,
                        'metadata' => null,
                        'created_at' => now(),
                        'updated_at' => now(),
                        'deleted_at' => null,
                    ]
                );
            }
        }
    }
}
