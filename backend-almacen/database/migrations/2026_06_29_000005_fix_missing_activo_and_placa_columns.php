<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Migración 000005 — Corrección de incompatibilidades críticas de BD
 *
 * Resuelve exactamente los dos problemas que rompen endpoints reales:
 *
 * 1. catalogo_articulos no tiene columna `activo`
 *    → Rompe: /api/notifications, /api/search, /api/almacen/articulos,
 *              InventarioExport, DashboardController, AlmacenController
 *
 * 2. vehiculos_flotilla no tiene columna `placa`, solo `placas`
 *    → Rompe: /api/flotilla/dashboard, /api/flotilla/vehiculos,
 *              /api/reportes/vehiculos, /api/flotilla/registros,
 *              /api/flotilla/gastos-extra, /api/flotilla/kilometraje
 *
 * 3. empleados no tiene columna `activo`
 *    → Rompe: /api/empleados, búsqueda en dashboard
 *
 * 4. catalogo_articulos no tiene columna `marca` ni `activo` (varios controladores)
 *
 * Estrategia: agregar columnas faltantes + sincronizar datos existentes.
 * NO se modifica código de controladores — la BD se adapta al código.
 */
return new class extends Migration
{
    public function up(): void
    {
        // ──────────────────────────────────────────────────────────────────
        // 1. catalogo_articulos — agregar columna `activo`
        //    La tabla tiene `deleted_at` (SoftDeletes), pero los controladores
        //    también esperan un campo `activo` booleano.
        // ──────────────────────────────────────────────────────────────────
        Schema::table('catalogo_articulos', function (Blueprint $table) {
            if (! Schema::hasColumn('catalogo_articulos', 'activo')) {
                $table->boolean('activo')->default(true)->after('es_consumible');
            }
            // Algunos controladores también usan `marca` (sin sufijo _fabricante)
            if (! Schema::hasColumn('catalogo_articulos', 'marca')) {
                $table->string('marca', 120)->nullable()->after('activo');
            }
        });

        // Sincronizar activo: si tiene deleted_at → activo = false
        DB::table('catalogo_articulos')
            ->whereNotNull('deleted_at')
            ->update(['activo' => false]);

        // Los sin deleted_at quedan en activo = true (valor por defecto)

        // ──────────────────────────────────────────────────────────────────
        // 2. empleados — agregar columna `activo`
        //    EmpleadoController, DashboardController, KioscoAuthController
        //    todos hacen ->where('activo', true) o ->where('e.activo', true)
        // ──────────────────────────────────────────────────────────────────
        Schema::table('empleados', function (Blueprint $table) {
            if (! Schema::hasColumn('empleados', 'activo')) {
                $table->boolean('activo')->default(true)->after('foto_perfil');
            }
            if (! Schema::hasColumn('empleados', 'foto_perfil')) {
                $table->string('foto_perfil')->nullable()->after('vencimiento_licencia');
            }
        });

        // Sincronizar activo en empleados
        DB::table('empleados')
            ->whereNotNull('deleted_at')
            ->update(['activo' => false]);

        // ──────────────────────────────────────────────────────────────────
        // 3. vehiculos_flotilla — agregar columna `placa`
        //    La BD real solo tiene `placas` pero el código (controladores,
        //    relaciones eager load, select()) pide `placa`.
        //    Solución: agregar `placa` y sincronizar con `placas`.
        // ──────────────────────────────────────────────────────────────────
        Schema::table('vehiculos_flotilla', function (Blueprint $table) {
            if (! Schema::hasColumn('vehiculos_flotilla', 'placa')) {
                // No unique aquí porque placas puede estar duplicada en datos viejos
                $table->string('placa', 30)->nullable()->after('placas');
            }
        });

        // Sincronizar placa ← placas para todos los registros existentes
        DB::table('vehiculos_flotilla')
            ->whereNotNull('placas')
            ->where(function ($q) {
                $q->whereNull('placa')->orWhere('placa', '');
            })
            ->orderBy('id')
            ->select('id', 'placas')
            ->chunkById(200, function ($rows) {
                foreach ($rows as $row) {
                    DB::table('vehiculos_flotilla')
                        ->where('id', $row->id)
                        ->update(['placa' => $row->placas]);
                }
            });

        // ──────────────────────────────────────────────────────────────────
        // 4. proveedores — agregar `activo` si no existe
        //    AlmacenController: ->where('activo', true)
        // ──────────────────────────────────────────────────────────────────
        Schema::table('proveedores', function (Blueprint $table) {
            if (! Schema::hasColumn('proveedores', 'activo')) {
                $table->boolean('activo')->default(true)->after('direccion');
            }
        });

        DB::table('proveedores')
            ->whereNotNull('deleted_at')
            ->update(['activo' => false]);

        // ──────────────────────────────────────────────────────────────────
        // 5. categorias — agregar `activo` si no existe
        //    AlmacenController: ->where('activo', true)
        // ──────────────────────────────────────────────────────────────────
        Schema::table('categorias', function (Blueprint $table) {
            if (! Schema::hasColumn('categorias', 'activo')) {
                $table->boolean('activo')->default(true)->after('descripcion');
            }
        });

        DB::table('categorias')
            ->whereNotNull('deleted_at')
            ->update(['activo' => false]);

        // ──────────────────────────────────────────────────────────────────
        // 6. subcategorias — agregar `activo` si no existe
        //    CatalogoCentralController: ->where('sc.activo', true)
        // ──────────────────────────────────────────────────────────────────
        Schema::table('subcategorias', function (Blueprint $table) {
            if (! Schema::hasColumn('subcategorias', 'activo')) {
                $table->boolean('activo')->default(true)->after('descripcion');
            }
        });

        DB::table('subcategorias')
            ->whereNotNull('deleted_at')
            ->update(['activo' => false]);

        // ──────────────────────────────────────────────────────────────────
        // 7. Índices de rendimiento en columnas activo (evita full-scans)
        // ──────────────────────────────────────────────────────────────────
        // Solo agregar índices si las columnas recién se crearon
        // (si ya existían, sus índices ya deberían existir)
        try {
            DB::statement('CREATE INDEX IF NOT EXISTS idx_catalogo_articulos_activo ON catalogo_articulos(activo)');
            DB::statement('CREATE INDEX IF NOT EXISTS idx_empleados_activo ON empleados(activo)');
            DB::statement('CREATE INDEX IF NOT EXISTS idx_vehiculos_flotilla_placa ON vehiculos_flotilla(placa)');
        } catch (\Exception $e) {
            // Ignorar si los índices ya existen (PostgreSQL lanza error, no warning)
        }
    }

    public function down(): void
    {
        // Eliminar índices primero
        try {
            DB::statement('DROP INDEX IF EXISTS idx_catalogo_articulos_activo');
            DB::statement('DROP INDEX IF EXISTS idx_empleados_activo');
            DB::statement('DROP INDEX IF EXISTS idx_vehiculos_flotilla_placa');
        } catch (\Exception $e) {
            // Ignorar
        }

        Schema::table('subcategorias', function (Blueprint $table) {
            if (Schema::hasColumn('subcategorias', 'activo')) {
                $table->dropColumn('activo');
            }
        });

        Schema::table('categorias', function (Blueprint $table) {
            if (Schema::hasColumn('categorias', 'activo')) {
                $table->dropColumn('activo');
            }
        });

        Schema::table('proveedores', function (Blueprint $table) {
            if (Schema::hasColumn('proveedores', 'activo')) {
                $table->dropColumn('activo');
            }
        });

        Schema::table('vehiculos_flotilla', function (Blueprint $table) {
            if (Schema::hasColumn('vehiculos_flotilla', 'placa')) {
                $table->dropColumn('placa');
            }
        });

        Schema::table('empleados', function (Blueprint $table) {
            if (Schema::hasColumn('empleados', 'activo')) {
                $table->dropColumn('activo');
            }
            if (Schema::hasColumn('empleados', 'foto_perfil')) {
                $table->dropColumn('foto_perfil');
            }
        });

        Schema::table('catalogo_articulos', function (Blueprint $table) {
            if (Schema::hasColumn('catalogo_articulos', 'marca')) {
                $table->dropColumn('marca');
            }
            if (Schema::hasColumn('catalogo_articulos', 'activo')) {
                $table->dropColumn('activo');
            }
        });
    }
};
