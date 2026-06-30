<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('movimiento_inventario', function (Blueprint $table) {
            if (! Schema::hasColumn('movimiento_inventario', 'folio')) {
                $table->string('folio', 40)->nullable()->unique()->after('id');
            }
            if (! Schema::hasColumn('movimiento_inventario', 'motivo')) {
                $table->text('motivo')->nullable()->after('notas');
            }
            if (! Schema::hasColumn('movimiento_inventario', 'ubicacion_origen_id')) {
                $table->foreignId('ubicacion_origen_id')->nullable()->after('proveedor_id')->constrained('ubicaciones')->nullOnDelete();
            }
            if (! Schema::hasColumn('movimiento_inventario', 'ubicacion_destino_id')) {
                $table->foreignId('ubicacion_destino_id')->nullable()->after('ubicacion_origen_id')->constrained('ubicaciones')->nullOnDelete();
            }
            if (! Schema::hasColumn('movimiento_inventario', 'responsable_anterior_id')) {
                $table->foreignId('responsable_anterior_id')->nullable()->after('ubicacion_destino_id')->constrained('empleados')->nullOnDelete();
            }
            if (! Schema::hasColumn('movimiento_inventario', 'responsable_nuevo_id')) {
                $table->foreignId('responsable_nuevo_id')->nullable()->after('responsable_anterior_id')->constrained('empleados')->nullOnDelete();
            }
            if (! Schema::hasColumn('movimiento_inventario', 'proyecto_id')) {
                $table->foreignId('proyecto_id')->nullable()->after('responsable_nuevo_id')->constrained('proyectos_presupuestos')->nullOnDelete();
            }
        });

        DB::table('movimiento_inventario')
            ->whereNull('folio')
            ->orderBy('id')
            ->select('id')
            ->chunkById(200, function ($movimientos) {
                foreach ($movimientos as $movimiento) {
                    DB::table('movimiento_inventario')
                        ->where('id', $movimiento->id)
                        ->update(['folio' => sprintf('MOV-%06d', $movimiento->id)]);
                }
            });

        Schema::table('vehiculos_flotilla', function (Blueprint $table) {
            if (! Schema::hasColumn('vehiculos_flotilla', 'codigo_vehiculo')) {
                $table->string('codigo_vehiculo', 40)->nullable()->unique()->after('id');
            }
            if (! Schema::hasColumn('vehiculos_flotilla', 'marca')) {
                $table->string('marca', 120)->nullable()->after('nombre');
            }
            if (! Schema::hasColumn('vehiculos_flotilla', 'anio')) {
                $table->unsignedSmallInteger('anio')->nullable()->after('modelo');
            }
            if (! Schema::hasColumn('vehiculos_flotilla', 'niv')) {
                $table->string('niv', 120)->nullable()->after('numero_serie');
            }
            if (! Schema::hasColumn('vehiculos_flotilla', 'responsable_id')) {
                $table->foreignId('responsable_id')->nullable()->after('estado')->constrained('empleados')->nullOnDelete();
            }
            if (! Schema::hasColumn('vehiculos_flotilla', 'ubicacion_id')) {
                $table->foreignId('ubicacion_id')->nullable()->after('responsable_id')->constrained('ubicaciones')->nullOnDelete();
            }
            if (! Schema::hasColumn('vehiculos_flotilla', 'kilometraje_actual')) {
                $table->decimal('kilometraje_actual', 12, 2)->default(0)->after('ubicacion_id');
            }
            if (! Schema::hasColumn('vehiculos_flotilla', 'observaciones')) {
                $table->text('observaciones')->nullable()->after('kilometraje_actual');
            }
        });

        DB::table('vehiculos_flotilla')
            ->whereNull('codigo_vehiculo')
            ->orderBy('id')
            ->select('id')
            ->chunkById(200, function ($vehiculos) {
                foreach ($vehiculos as $vehiculo) {
                    DB::table('vehiculos_flotilla')
                        ->where('id', $vehiculo->id)
                        ->update(['codigo_vehiculo' => sprintf('VEH-%04d', $vehiculo->id)]);
                }
            });

        if (Schema::hasColumn('vehiculos_flotilla', 'niv')) {
            DB::table('vehiculos_flotilla')
                ->whereNull('niv')
                ->whereNotNull('numero_serie')
                ->update(['niv' => DB::raw('numero_serie')]);
        }

        Schema::table('registros_vehiculares', function (Blueprint $table) {
            if (! Schema::hasColumn('registros_vehiculares', 'usuario_id')) {
                $table->foreignId('usuario_id')->nullable()->after('vehiculo_id')->constrained('usuarios_sistema')->nullOnDelete();
            }
            if (! Schema::hasColumn('registros_vehiculares', 'notas')) {
                $table->text('notas')->nullable()->after('detalle_falla');
            }
            if (! Schema::hasColumn('registros_vehiculares', 'evidencia_path')) {
                $table->string('evidencia_path')->nullable()->after('notas');
            }
        });

        Schema::table('gastos_extra_vehiculos', function (Blueprint $table) {
            if (! Schema::hasColumn('gastos_extra_vehiculos', 'usuario_id')) {
                $table->foreignId('usuario_id')->nullable()->after('vehiculo_id')->constrained('usuarios_sistema')->nullOnDelete();
            }
            if (! Schema::hasColumn('gastos_extra_vehiculos', 'evidencia_path')) {
                $table->string('evidencia_path')->nullable()->after('observaciones');
            }
        });

        if (! Schema::hasTable('catalogos_configurables')) {
            Schema::create('catalogos_configurables', function (Blueprint $table) {
                $table->id();
                $table->string('tipo', 80);
                $table->string('clave', 120);
                $table->string('nombre', 180);
                $table->text('descripcion')->nullable();
                $table->boolean('activo')->default(true);
                $table->unsignedInteger('orden')->default(0);
                $table->json('metadata')->nullable();
                $table->timestamps();
                $table->softDeletes();
                $table->unique(['tipo', 'clave']);
                $table->index(['tipo', 'activo']);
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('catalogos_configurables');

        Schema::table('gastos_extra_vehiculos', function (Blueprint $table) {
            foreach (['evidencia_path', 'usuario_id'] as $column) {
                if (Schema::hasColumn('gastos_extra_vehiculos', $column)) {
                    $table->dropColumn($column);
                }
            }
        });

        Schema::table('registros_vehiculares', function (Blueprint $table) {
            foreach (['evidencia_path', 'notas', 'usuario_id'] as $column) {
                if (Schema::hasColumn('registros_vehiculares', $column)) {
                    $table->dropColumn($column);
                }
            }
        });

        Schema::table('vehiculos_flotilla', function (Blueprint $table) {
            foreach (['observaciones', 'kilometraje_actual', 'ubicacion_id', 'responsable_id', 'niv', 'anio', 'marca', 'codigo_vehiculo'] as $column) {
                if (Schema::hasColumn('vehiculos_flotilla', $column)) {
                    $table->dropColumn($column);
                }
            }
        });

        Schema::table('movimiento_inventario', function (Blueprint $table) {
            foreach (['proyecto_id', 'responsable_nuevo_id', 'responsable_anterior_id', 'ubicacion_destino_id', 'ubicacion_origen_id', 'motivo', 'folio'] as $column) {
                if (Schema::hasColumn('movimiento_inventario', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
