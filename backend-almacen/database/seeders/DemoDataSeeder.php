<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Carbon\Carbon;

class DemoDataSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Limpieza previa
        DB::table('empleados')->where('numero_gafete', '14502')->delete();
        DB::table('empleados')->where('numero_gafete', '00001')->delete();
        DB::table('usuarios_sistema')->where('email', 'admin@smartlynk.com')->delete();
        DB::table('inventario_series')->where('codigo_interno_generado', 'SL-BOS-001')->delete();
        DB::table('vehiculos_flotilla')->where('placa', 'XTR-999')->delete();
        DB::table('proyectos_presupuestos')->where('numero_folio', 'PRJ-RED-001')->delete();

        // 1. Usuarios del Sistema
        $adminId = DB::table('usuarios_sistema')->insertGetId([
            'nombre_usuario' => 'admin_demo',
            'email'          => 'admin@smartlynk.com',
            'password_hash'  => Hash::make('password123'),
            'rol_acceso'     => 'ADMINISTRADOR',
            'activo'         => true,
            'created_at'     => Carbon::now(),
            'updated_at'     => Carbon::now(),
        ]);

        // 2. Empleados (Para Kiosco y asignaciones)
        $empleadoKioscoId = DB::table('empleados')->insertGetId([
            'nombre_completo'   => 'Juan Pérez (Kiosco Demo)',
            'numero_gafete'     => '14502',
            'departamento_area' => 'Operaciones',
            'puesto_cargo'      => 'Técnico de Campo',
            'activo'            => true,
            'fecha_ingreso'     => Carbon::now()->subYears(2),
            'created_at'        => Carbon::now(),
            'updated_at'        => Carbon::now(),
        ]);

        $empleadoAdminId = DB::table('empleados')->insertGetId([
            'usuario_id'        => $adminId,
            'nombre_completo'   => 'Administrador Sistema',
            'numero_gafete'     => '00001',
            'departamento_area' => 'Sistemas',
            'puesto_cargo'      => 'Administrador',
            'activo'            => true,
            'fecha_ingreso'     => Carbon::now()->subYears(5),
            'created_at'        => Carbon::now(),
            'updated_at'        => Carbon::now(),
        ]);

        // 3. Perfil de Kiosco (PIN: 1234)
        DB::table('perfiles_kiosco')->insert([
            'empleado_id'         => $empleadoKioscoId,
            'pin_hash'            => Hash::make('1234'),
            'estado'              => 'activo',
            'kioscos_autorizados' => json_encode(['ALMACEN_PRINCIPAL', 'ALMACEN_NORTE']),
            'permisos'            => json_encode(['prestamos', 'vehiculos', 'resguardos']),
            'creado_por_id'       => $adminId,
            'created_at'          => Carbon::now(),
            'updated_at'          => Carbon::now(),
        ]);

        // 4. Categorías y Subcategorías
        $catId = DB::table('categorias')->insertGetId([
            'nombre'      => 'Herramientas',
            'descripcion' => 'Herramientas de trabajo',
            'created_at'  => Carbon::now(),
            'updated_at'  => Carbon::now(),
        ]);

        $subcatId = DB::table('subcategorias')->insertGetId([
            'categoria_id' => $catId,
            'nombre'       => 'Herramientas Eléctricas',
            'created_at'   => Carbon::now(),
            'updated_at'   => Carbon::now(),
        ]);

        // 5. Catálogo de Artículos (Activo Seriado y Consumible)
        $articuloSeriadoId = DB::table('catalogo_articulos')->insertGetId([
            'subcategoria_id'  => $subcatId,
            'nombre'           => 'Taladro Percutor Bosch',
            'modelo'           => 'BOSCH-TP-01',
            'requiere_serie'   => true,
            'es_consumible'    => false,
            'tipo_control'     => 'ACTIVO',
            'unidad_medida'    => 'PZA',
            'stock_minimo'     => 1,
            'created_at'       => Carbon::now(),
            'updated_at'       => Carbon::now(),
        ]);

        $articuloConsumibleId = DB::table('catalogo_articulos')->insertGetId([
            'subcategoria_id'  => $subcatId,
            'nombre'           => 'Brocas para Concreto',
            'modelo'           => 'BRO-CONC-10',
            'requiere_serie'   => false,
            'es_consumible'    => true,
            'tipo_control'     => 'MATERIAL',
            'unidad_medida'    => 'CAJA',
            'stock_minimo'     => 5,
            'created_at'       => Carbon::now(),
            'updated_at'       => Carbon::now(),
        ]);

        // 6. Inventario Series (Para el artículo seriado)
        $serieId = DB::table('inventario_series')->insertGetId([
            'articulo_id'             => $articuloSeriadoId,
            'numero_serie_fabricante' => 'SN-BOSCH-9991',
            'codigo_interno_generado' => 'SL-BOS-001',
            'estado'                  => 'DISPONIBLE',
            'ubicacion'               => 'ESTANTE A1',
            'fecha_adquisicion'       => Carbon::now()->subMonths(6),
            'created_at'              => Carbon::now(),
            'updated_at'              => Carbon::now(),
        ]);

        // 7. Stock General
        DB::table('stock_general')->insert([
            ['articulo_id' => $articuloSeriadoId, 'cantidad' => 1, 'ubicacion' => 'ESTANTE A1', 'created_at' => Carbon::now(), 'updated_at' => Carbon::now()],
            ['articulo_id' => $articuloConsumibleId, 'cantidad' => 50, 'ubicacion' => 'ESTANTE B2', 'created_at' => Carbon::now(), 'updated_at' => Carbon::now()],
        ]);

        // 8. Vehículos Flotilla
        $vehiculoId = DB::table('vehiculos_flotilla')->insertGetId([
            'nombre'                  => 'Camioneta Ford Ranger Demo',
            'marca'                   => 'Ford',
            'modelo'                  => 'Ranger',
            'anio'                    => 2023,
            'placa'                   => 'XTR-999',
            'placas'                  => 'XTR-999',
            'numero_serie'            => 'VIN1234567890FORD',
            'tipo_vehiculo'           => 'PICKUP',
            'estado'                  => 'DISPONIBLE',
            'kilometraje_actual'      => 15000,
            'gps_activo'              => true,
            'vencimiento_seguro'      => Carbon::now()->addMonths(3),
            'created_at'              => Carbon::now(),
            'updated_at'              => Carbon::now(),
        ]);

        DB::table('proyectos_presupuestos')->where('numero_folio', 'PRJ-RED-001')->delete();

        DB::table('clientes')->where('nombre_empresa', 'TechCorp SA de CV')->delete();

        // 8.5 Clientes
        $clienteId = DB::table('clientes')->insertGetId([
            'nombre_empresa' => 'TechCorp SA de CV',
            'contacto'       => 'Juan Cliente',
            'telefono'       => '5551234567',
            'created_at'     => Carbon::now(),
            'updated_at'     => Carbon::now(),
        ]);

        // 9. Proyectos
        DB::table('proyectos_presupuestos')->insert([
            'nombre_proyecto'        => 'Instalación de Redes Corporativo Sur',
            'numero_folio'           => 'PRJ-RED-001',
            'cliente_id'             => $clienteId,
            'cliente_nombre'         => 'TechCorp SA de CV',
            'usuario_id'             => $adminId,
            'responsable_id'         => $empleadoAdminId,
            'fecha_inicio'           => Carbon::now()->subDays(10),
            'fecha_cierre_estimada'  => Carbon::now()->addDays(60),
            'estatus'                => 'ACTIVO',
            'created_at'             => Carbon::now(),
            'updated_at'             => Carbon::now(),
        ]);

        $proyectoId = DB::table('proyectos_presupuestos')->where('numero_folio', 'PRJ-RED-001')->value('id');

        // 10. Recursos del Proyecto
        DB::table('proyecto_recursos')->insert([
            'proyecto_id' => $proyectoId,
            'recurso_tipo' => 'vehiculo',
            'recurso_id' => $vehiculoId,
            'cantidad' => 1,
            'costo_estimado' => 5000,
            'fecha_asignacion' => Carbon::now(),
            'created_at' => Carbon::now(),
            'updated_at' => Carbon::now(),
        ]);

        // 11. Mantenimiento Vehicular
        $mantenimientoId = DB::table('registros_vehiculares')->insertGetId([
            'vehiculo_id' => $vehiculoId,
            'tipo' => 'preventivo',
            'fecha' => Carbon::now()->subDays(5),
            'kilometraje' => 14000,
            'costo' => 2500.50,
            'proveedor_taller' => 'Taller Automotriz Central',
            'descripcion' => 'Cambio de aceite y filtros',
            'created_at' => Carbon::now(),
            'updated_at' => Carbon::now(),
        ]);

        // 12. Gasto Extra
        $gastoId = DB::table('gastos_extra_vehiculos')->insertGetId([
            'vehiculo_id' => $vehiculoId,
            'empleado_id' => $empleadoAdminId,
            'tipo_gasto' => 'MULTA',
            'monto' => 1500,
            'fecha' => Carbon::now()->subDays(2),
            'descripcion' => 'Exceso de velocidad',
            'estado' => 'PENDIENTE',
            'created_at' => Carbon::now(),
            'updated_at' => Carbon::now(),
        ]);

        // 13. Adjuntos Sistema
        DB::table('adjuntos_sistema')->insert([
            'entidad_tipo' => 'gastos_extra_vehiculos',
            'entidad_id' => $gastoId,
            'nombre_archivo' => 'evidencia_multa.pdf',
            'ruta_archivo' => 'adjuntos/demo_multa.pdf',
            'tipo_mime' => 'application/pdf',
            'tamano_bytes' => 102400,
            'subido_por' => $adminId,
            'created_at' => Carbon::now(),
            'updated_at' => Carbon::now(),
        ]);

        $this->command->info('Base de datos inicializada con datos Demo (Empleado Gafete: 14502, PIN: 1234).');
    }
}
