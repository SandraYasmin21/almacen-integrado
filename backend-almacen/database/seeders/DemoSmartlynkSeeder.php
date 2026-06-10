<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;

class DemoSmartlynkSeeder extends Seeder
{
    public function run(): void
    {
        DB::transaction(function () {
            $userId = $this->ensureUser();

            $consumibles = $this->ensureCategory('Consumibles', 'Materiales que se descuentan por cantidad.');
            $red = $this->ensureCategory('Red e Infraestructura', 'Activos de red, cableado e infraestructura.');
            $herramientas = $this->ensureCategory('Herramientas Operativas', 'Herramientas y activos para resguardos y préstamos.');

            $subConsumibles = $this->ensureSubcategory($consumibles, 'Consumibles generales');
            $subRed = $this->ensureSubcategory($red, 'Red e infraestructura');
            $subHerramientas = $this->ensureSubcategory($herramientas, 'Herramientas operativas');
            $subActivos = $this->ensureSubcategory($herramientas, 'Activos fijos');

            $articles = [
                ['sku' => 'CON-TOR-001', 'name' => 'Pijas Tablaroca 1 1/4" (Negras)', 'model' => 'Fiero PT-114', 'unit' => 'CAJA (100)', 'stock' => 15, 'sub' => $subConsumibles, 'consumable' => true, 'series' => false],
                ['sku' => 'CON-TUE-005', 'name' => 'Tuerca Hexagonal Inoxidable 1/4"', 'model' => 'Inox STD', 'unit' => 'CAJA (50)', 'stock' => 20, 'sub' => $subConsumibles, 'consumable' => true, 'series' => false],
                ['sku' => 'CON-CIN-100', 'name' => 'Cinchos de Plástico Negros 20cm', 'model' => 'Truper 20-N', 'unit' => 'BOLSA (100)', 'stock' => 30, 'sub' => $subConsumibles, 'consumable' => true, 'series' => false],
                ['sku' => 'CON-CIN-150', 'name' => 'Cinta de Aislar Negra Profesional', 'model' => '3M Super 33+', 'unit' => 'ROLLO', 'stock' => 40, 'sub' => $subConsumibles, 'consumable' => true, 'series' => false],
                ['sku' => 'CON-RED-020', 'name' => 'Conectores RJ45 Cat6', 'model' => 'Panduit RJ6', 'unit' => 'CAJA (100)', 'stock' => 10, 'sub' => $subConsumibles, 'consumable' => true, 'series' => false],
                ['sku' => 'CON-LIM-002', 'name' => 'Alcohol Isopropílico en Aerosol', 'model' => 'Silimex 400ml', 'unit' => 'PIEZA', 'stock' => 25, 'sub' => $subConsumibles, 'consumable' => true, 'series' => false],

                ['sku' => 'RED-UPS-010', 'name' => 'No Break / UPS 1000VA 500W', 'model' => 'APC Back-UPS', 'unit' => 'PZA', 'stock' => 5, 'sub' => $subRed, 'consumable' => false, 'series' => true],
                ['sku' => 'RED-REG-005', 'name' => 'Regulador de Voltaje 8 Tomas', 'model' => 'Koblenz RI-2500', 'unit' => 'PZA', 'stock' => 15, 'sub' => $subRed, 'consumable' => false, 'series' => true],
                ['sku' => 'RED-AP-050', 'name' => 'Access Point WiFi 6 Interior', 'model' => 'Ubiquiti U6-Lite', 'unit' => 'PZA', 'stock' => 10, 'sub' => $subRed, 'consumable' => false, 'series' => true],
                ['sku' => 'RED-SW-024', 'name' => 'Switch Gigabit 24 Puertos PoE', 'model' => 'Cisco CBS110', 'unit' => 'PZA', 'stock' => 3, 'sub' => $subRed, 'consumable' => false, 'series' => true],
                ['sku' => 'RED-FIB-100', 'name' => 'Bobina Fibra Óptica Monomodo 2 Hilos', 'model' => 'Condumex 1000m', 'unit' => 'METRO', 'stock' => 2, 'sub' => $subRed, 'consumable' => false, 'series' => false],
                ['sku' => 'RED-UTP-006', 'name' => 'Bobina Cable UTP Cat6 100% Cobre', 'model' => 'Belden 305m', 'unit' => 'CAJA', 'stock' => 5, 'sub' => $subRed, 'consumable' => false, 'series' => false],

                ['sku' => 'HER-TAL-001', 'name' => 'Taladro Percutor Inalámbrico 20V', 'model' => 'DeWalt DCD778', 'unit' => 'PZA', 'stock' => 4, 'sub' => $subHerramientas, 'consumable' => false, 'series' => true],
                ['sku' => 'HER-MUL-005', 'name' => 'Multímetro Digital True RMS', 'model' => 'Fluke 115', 'unit' => 'PZA', 'stock' => 4, 'sub' => $subHerramientas, 'consumable' => false, 'series' => true],
                ['sku' => 'HER-PON-010', 'name' => 'Pinza Ponchadora RJ45/RJ11', 'model' => 'Klein Tools VDV', 'unit' => 'PZA', 'stock' => 4, 'sub' => $subHerramientas, 'consumable' => false, 'series' => true],
                ['sku' => 'HER-ESC-003', 'name' => 'Escalera de Fibra de Vidrio 6 Pasos', 'model' => 'Cuervo Tijera', 'unit' => 'PZA', 'stock' => 2, 'sub' => $subHerramientas, 'consumable' => false, 'series' => true],
                ['sku' => 'HER-LAP-020', 'name' => 'Laptop Corporativa Core i7 16GB', 'model' => 'Dell Latitude 5430', 'unit' => 'PZA', 'stock' => 3, 'sub' => $subActivos, 'consumable' => false, 'series' => true],
                ['sku' => 'HER-CEL-015', 'name' => 'Smartphone Uso Rudo (Cuadrilla)', 'model' => 'Samsung XCover 6', 'unit' => 'PZA', 'stock' => 3, 'sub' => $subActivos, 'consumable' => false, 'series' => true],
            ];

            $articleIds = [];
            foreach ($articles as $article) {
                $articleIds[$article['sku']] = $this->ensureArticle($article);
                $this->ensureStock($articleIds[$article['sku']], $article['stock'], $article['series'] ? 'SERIES' : 'A-01');

                if ($article['series']) {
                    $this->ensureSeries($articleIds[$article['sku']], $article['sku'], (int) $article['stock']);
                }
            }

            $employees = [
                ['badge' => 'EMP-1001', 'name' => 'Carlos Mendoza Rivas', 'department' => 'Operaciones', 'position' => 'Técnico de Cuadrilla A'],
                ['badge' => 'EMP-1002', 'name' => 'Sofía Bernal Montes', 'department' => 'Infraestructura', 'position' => 'Ingeniera de Redes'],
                ['badge' => 'EMP-1003', 'name' => 'Raúl Jiménez Garza', 'department' => 'Operaciones', 'position' => 'Técnico de Cuadrilla B'],
                ['badge' => 'EMP-1004', 'name' => 'Elena Torres Vega', 'department' => 'Ventas', 'position' => 'Ejecutiva Comercial'],
                ['badge' => 'EMP-1005', 'name' => 'Javier Orozco Luna', 'department' => 'Sistemas', 'position' => 'Soporte Técnico Nivel 2'],
                ['badge' => 'EMP-1006', 'name' => 'Miguel Ángel Soto', 'department' => 'Logística', 'position' => 'Chofer Repartidor'],
            ];

            $employeeIds = [];
            foreach ($employees as $employee) {
                $employeeIds[$employee['badge']] = $this->ensureEmployee($employee);
            }

            $this->assignFixedAsset($employeeIds['EMP-1001'], 'HER-LAP-020-001');
            $this->assignFixedAsset($employeeIds['EMP-1005'], 'HER-LAP-020-002');
            $this->assignFixedAsset($employeeIds['EMP-1006'], 'HER-CEL-015-001');

            $this->registerDemoLoan($userId, $employeeIds['EMP-1001'], $articleIds['HER-TAL-001'], 'HER-TAL-001-001', now()->subHours(5), 'Préstamo operativo: instalación en planta norte');
            $this->registerDemoLoan($userId, $employeeIds['EMP-1002'], $articleIds['HER-MUL-005'], 'HER-MUL-005-001', now()->subHours(26), 'Préstamo operativo: diagnóstico de red');
            $this->registerDemoLoan($userId, $employeeIds['EMP-1003'], $articleIds['HER-PON-010'], 'HER-PON-010-001', now()->subHours(50), 'Préstamo operativo: terminación de nodos RJ45');

            $this->ensureVehicleTrip($employeeIds['EMP-1006']);
        });
    }

    private function ensureUser(): int
    {
        $existing = DB::table('usuarios_sistema')->where('email', 'demo.smartlynk@local.test')->value('id');
        if ($existing) {
            return (int) $existing;
        }

        $payload = [
            'nombre_usuario' => 'demo_smartlynk',
            'email' => 'demo.smartlynk@local.test',
            'password_hash' => Hash::make('Demo123456!'),
            'rol_acceso' => 'Admin',
            'created_at' => now(),
            'updated_at' => now(),
        ];

        if (Schema::hasColumn('usuarios_sistema', 'password_cambiado')) {
            $payload['password_cambiado'] = true;
        }
        if (Schema::hasColumn('usuarios_sistema', 'activo')) {
            $payload['activo'] = true;
        }

        return (int) DB::table('usuarios_sistema')->insertGetId($payload);
    }

    private function ensureCategory(string $name, string $description): int
    {
        $id = DB::table('categorias')->where('nombre', $name)->value('id');
        $payload = ['descripcion' => $description, 'activo' => true, 'updated_at' => now(), 'deleted_at' => null];

        if ($id) {
            DB::table('categorias')->where('id', $id)->update($payload);
            return (int) $id;
        }

        $payload['nombre'] = $name;
        $payload['created_at'] = now();
        return (int) DB::table('categorias')->insertGetId($payload);
    }

    private function ensureSubcategory(int $categoryId, string $name): int
    {
        $id = DB::table('subcategorias')->where('categoria_id', $categoryId)->where('nombre', $name)->value('id');
        $payload = ['activo' => true, 'updated_at' => now(), 'deleted_at' => null];

        if ($id) {
            DB::table('subcategorias')->where('id', $id)->update($payload);
            return (int) $id;
        }

        $payload += ['categoria_id' => $categoryId, 'nombre' => $name, 'created_at' => now()];
        return (int) DB::table('subcategorias')->insertGetId($payload);
    }

    private function ensureArticle(array $article): int
    {
        $id = DB::table('catalogo_articulos')->where('nombre', $article['name'])->value('id');
        $payload = [
            'subcategoria_id' => $article['sub'],
            'modelo' => $article['model'],
            'requiere_serie' => $article['series'],
            'es_consumible' => $article['consumable'],
            'unidad_medida' => $article['unit'],
            'stock_minimo' => $article['stock'],
            'updated_at' => now(),
            'deleted_at' => null,
        ];

        if (Schema::hasColumn('catalogo_articulos', 'sku_maestro')) {
            $payload['sku_maestro'] = $article['sku'];
        }
        if (Schema::hasColumn('catalogo_articulos', 'tipo_articulo')) {
            $payload['tipo_articulo'] = $article['consumable'] ? 'venta' : 'herramienta';
        }

        if ($id) {
            DB::table('catalogo_articulos')->where('id', $id)->update($payload);
            return (int) $id;
        }

        $payload += ['nombre' => $article['name'], 'created_at' => now()];
        return (int) DB::table('catalogo_articulos')->insertGetId($payload);
    }

    private function ensureStock(int $articleId, float $quantity, string $location): void
    {
        $id = DB::table('stock_general')->where('articulo_id', $articleId)->value('id');
        $payload = [
            'cantidad' => $quantity,
            'ubicacion' => $location,
            'updated_at' => now(),
            'deleted_at' => null,
        ];

        if ($id) {
            DB::table('stock_general')->where('id', $id)->update($payload);
            return;
        }

        $payload += ['articulo_id' => $articleId, 'created_at' => now()];
        DB::table('stock_general')->insert($payload);
    }

    private function ensureSeries(int $articleId, string $masterSku, int $count): void
    {
        for ($i = 1; $i <= $count; $i++) {
            $code = sprintf('%s-%03d', $masterSku, $i);
            $id = DB::table('inventario_series')->where('codigo_interno_generado', $code)->value('id');
            $payload = [
                'articulo_id' => $articleId,
                'numero_serie_fabricante' => 'SN-' . str_replace('-', '', $code),
                'estado' => 'DISPONIBLE',
                'ubicacion' => 'RACK-' . substr($masterSku, 0, 3),
                'updated_at' => now(),
                'deleted_at' => null,
            ];

            if ($id) {
                $assigned = DB::table('asignaciones_activos')->where('serie_id', $id)->whereNull('fecha_devolucion')->exists();
                if (!$assigned) {
                    DB::table('inventario_series')->where('id', $id)->update($payload);
                }
                continue;
            }

            $payload += ['codigo_interno_generado' => $code, 'created_at' => now()];
            DB::table('inventario_series')->insert($payload);
        }
    }

    private function ensureEmployee(array $employee): int
    {
        $id = DB::table('empleados')->where('numero_gafete', $employee['badge'])->value('id');
        $payload = [
            'nombre_completo' => $employee['name'],
            'codigo_sku_gafete' => $employee['badge'],
            'departamento_area' => $employee['department'],
            'puesto_cargo' => $employee['position'],
            'updated_at' => now(),
            'deleted_at' => null,
        ];

        if ($id) {
            DB::table('empleados')->where('id', $id)->update($payload);
            return (int) $id;
        }

        $payload += ['numero_gafete' => $employee['badge'], 'created_at' => now()];
        return (int) DB::table('empleados')->insertGetId($payload);
    }

    private function assignFixedAsset(int $employeeId, string $seriesCode): void
    {
        $seriesId = DB::table('inventario_series')->where('codigo_interno_generado', $seriesCode)->value('id');
        if (!$seriesId) {
            return;
        }

        DB::table('inventario_series')->where('id', $seriesId)->update(['estado' => 'ASIGNADO', 'updated_at' => now()]);

        $exists = DB::table('asignaciones_activos')
            ->where('empleado_id', $employeeId)
            ->where('serie_id', $seriesId)
            ->whereNull('fecha_devolucion')
            ->exists();

        if (!$exists) {
            DB::table('asignaciones_activos')->insert([
                'empleado_id' => $employeeId,
                'serie_id' => $seriesId,
                'fecha_entrega' => now()->subDays(12),
                'notas_estado_fisico' => 'Demo Smartlynk: resguardo fijo activo.',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }

    private function registerDemoLoan(int $userId, int $employeeId, int $articleId, string $seriesCode, Carbon $date, string $notes): void
    {
        $seriesId = DB::table('inventario_series')->where('codigo_interno_generado', $seriesCode)->value('id');
        if (!$seriesId) {
            return;
        }

        DB::table('inventario_series')->where('id', $seriesId)->update(['estado' => 'ASIGNADO', 'updated_at' => now()]);

        $movementId = DB::table('movimiento_inventario')
            ->where('empleado_id', $employeeId)
            ->where('notas', '[DEMO_PRESTAMO] ' . $notes)
            ->value('id');

        $payload = [
            'fecha_hora' => $date,
            'tipo_movimiento' => 'SALIDA',
            'usuario_id' => $userId,
            'empleado_id' => $employeeId,
            'notas' => '[DEMO_PRESTAMO] ' . $notes,
            'updated_at' => now(),
            'deleted_at' => null,
        ];

        if ($movementId) {
            DB::table('movimiento_inventario')->where('id', $movementId)->update($payload);
            DB::table('detalle_movimiento')->where('movimiento_id', $movementId)->delete();
        } else {
            $payload['created_at'] = now();
            $movementId = DB::table('movimiento_inventario')->insertGetId($payload);
        }

        DB::table('detalle_movimiento')->insert([
            'movimiento_id' => $movementId,
            'articulo_id' => $articleId,
            'cantidad' => 1,
            'serie_id' => $seriesId,
            'estado_devolucion' => 'PENDIENTE',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    private function ensureVehicleTrip(int $employeeId): void
    {
        if (!Schema::hasTable('vehiculos_flotilla') || !Schema::hasTable('bitacora_vehiculos')) {
            return;
        }

        $vehicleId = DB::table('vehiculos_flotilla')->where('placas', 'ABC-123-D')->value('id');
        if (!$vehicleId) {
            $vehicleId = DB::table('vehiculos_flotilla')->insertGetId([
                'nombre' => 'Ranger Blanca',
                'modelo' => 'Ford Ranger 2021',
                'numero_serie' => '1FTER4FH5MLD00001',
                'tipo_vehiculo' => 'Pickup',
                'numero' => '830',
                'estado_gps' => 'ACTIVO',
                'placas' => 'ABC-123-D',
                'certificacion' => 'Certificada',
                'estado' => 'ACTIVO',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        $exists = DB::table('bitacora_vehiculos')
            ->where('vehiculo_id', $vehicleId)
            ->where('empleado_id', $employeeId)
            ->whereNull('fecha_regreso')
            ->exists();

        if (!$exists) {
            DB::table('bitacora_vehiculos')->insert([
                'vehiculo_id' => $vehicleId,
                'empleado_id' => $employeeId,
                'fecha_salida' => now()->subHours(3),
                'km_inicial' => 45550,
                'motivo_uso' => 'Demo Smartlynk: entrega de material a cliente.',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }
}
