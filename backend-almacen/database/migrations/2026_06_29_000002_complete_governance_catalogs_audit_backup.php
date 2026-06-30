<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('catalogo_articulos', function (Blueprint $table) {
            if (! Schema::hasColumn('catalogo_articulos', 'tipo_control')) {
                $table->string('tipo_control', 30)->default('HERRAMIENTA')->after('tipo_articulo');
            }
        });

        Schema::table('proyectos_presupuestos', function (Blueprint $table) {
            if (! Schema::hasColumn('proyectos_presupuestos', 'nombre')) {
                $table->string('nombre')->nullable()->after('id');
            }
            if (! Schema::hasColumn('proyectos_presupuestos', 'cliente_nombre')) {
                $table->string('cliente_nombre')->nullable()->after('nombre');
            }
            if (! Schema::hasColumn('proyectos_presupuestos', 'responsable_id')) {
                $table->foreignId('responsable_id')->nullable()->after('cliente_nombre')->constrained('empleados')->nullOnDelete();
            }
            if (! Schema::hasColumn('proyectos_presupuestos', 'fecha_inicio')) {
                $table->date('fecha_inicio')->nullable()->after('responsable_id');
            }
            if (! Schema::hasColumn('proyectos_presupuestos', 'fecha_cierre_estimada')) {
                $table->date('fecha_cierre_estimada')->nullable()->after('fecha_inicio');
            }
            if (! Schema::hasColumn('proyectos_presupuestos', 'estatus')) {
                $table->string('estatus', 40)->default('ACTIVO')->after('fecha_cierre_estimada');
            }
            if (! Schema::hasColumn('proyectos_presupuestos', 'observaciones')) {
                $table->text('observaciones')->nullable()->after('estatus');
            }
        });

        if (Schema::hasColumn('proyectos_presupuestos', 'nombre_proyecto') && Schema::hasColumn('proyectos_presupuestos', 'nombre')) {
            DB::table('proyectos_presupuestos')
                ->whereNull('nombre')
                ->update(['nombre' => DB::raw('nombre_proyecto')]);
        }

        if (Schema::hasColumn('proyectos_presupuestos', 'estado') && Schema::hasColumn('proyectos_presupuestos', 'estatus')) {
            DB::table('proyectos_presupuestos')
                ->whereNotNull('estado')
                ->where(function ($query) {
                    $query->whereNull('estatus')->orWhere('estatus', 'ACTIVO');
                })
                ->update(['estatus' => DB::raw('estado')]);
        }

        if (! Schema::hasTable('proyecto_recursos')) {
            Schema::create('proyecto_recursos', function (Blueprint $table) {
                $table->id();
                $table->foreignId('proyecto_id')->constrained('proyectos_presupuestos')->cascadeOnDelete();
                $table->foreignId('articulo_id')->nullable()->constrained('catalogo_articulos')->nullOnDelete();
                $table->foreignId('serie_id')->nullable()->constrained('inventario_series')->nullOnDelete();
                $table->foreignId('vehiculo_id')->nullable()->constrained('vehiculos_flotilla')->nullOnDelete();
                $table->decimal('cantidad', 12, 2)->default(1);
                $table->string('estatus', 40)->default('ASIGNADO');
                $table->text('notas')->nullable();
                $table->foreignId('asignado_por_id')->nullable()->constrained('usuarios_sistema')->nullOnDelete();
                $table->foreignId('retirado_por_id')->nullable()->constrained('usuarios_sistema')->nullOnDelete();
                $table->timestamp('fecha_asignacion')->nullable();
                $table->timestamp('fecha_retiro')->nullable();
                $table->timestamps();
                $table->softDeletes();
            });
        }

        if (! Schema::hasTable('auditoria_sistema')) {
            Schema::create('auditoria_sistema', function (Blueprint $table) {
                $table->id();
                $table->foreignId('usuario_id')->nullable()->constrained('usuarios_sistema')->nullOnDelete();
                $table->string('tabla', 120);
                $table->string('registro_id')->nullable();
                $table->string('accion', 40);
                $table->string('campo', 120)->nullable();
                $table->longText('valor_anterior')->nullable();
                $table->longText('valor_nuevo')->nullable();
                $table->ipAddress('ip')->nullable();
                $table->text('user_agent')->nullable();
                $table->timestamps();
                $table->index(['tabla', 'registro_id']);
                $table->index(['accion', 'created_at']);
            });
        }

        if (! Schema::hasTable('periodos_operativos')) {
            Schema::create('periodos_operativos', function (Blueprint $table) {
                $table->id();
                $table->date('fecha_inicio');
                $table->date('fecha_fin');
                $table->string('estatus', 30)->default('ABIERTO');
                $table->foreignId('cerrado_por_id')->nullable()->constrained('usuarios_sistema')->nullOnDelete();
                $table->timestamp('fecha_cierre')->nullable();
                $table->text('observaciones')->nullable();
                $table->timestamps();
                $table->unique(['fecha_inicio', 'fecha_fin']);
            });
        }

        if (! Schema::hasTable('configuraciones_sistema')) {
            Schema::create('configuraciones_sistema', function (Blueprint $table) {
                $table->id();
                $table->string('clave')->unique();
                $table->text('valor')->nullable();
                $table->string('tipo', 30)->default('string');
                $table->text('descripcion')->nullable();
                $table->timestamps();
            });
        }

        if (! Schema::hasTable('alertas_sistema')) {
            Schema::create('alertas_sistema', function (Blueprint $table) {
                $table->id();
                $table->string('tipo', 60);
                $table->string('titulo');
                $table->text('mensaje')->nullable();
                $table->string('severidad', 30)->default('warning');
                $table->json('metadata')->nullable();
                $table->boolean('resuelta')->default(false);
                $table->timestamps();
                $table->index(['tipo', 'resuelta']);
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('alertas_sistema');
        Schema::dropIfExists('configuraciones_sistema');
        Schema::dropIfExists('periodos_operativos');
        Schema::dropIfExists('auditoria_sistema');
        Schema::dropIfExists('proyecto_recursos');

        Schema::table('proyectos_presupuestos', function (Blueprint $table) {
            foreach (['observaciones', 'estatus', 'fecha_cierre_estimada', 'fecha_inicio', 'responsable_id', 'cliente_nombre', 'nombre'] as $column) {
                if (Schema::hasColumn('proyectos_presupuestos', $column)) {
                    $table->dropColumn($column);
                }
            }
        });

        Schema::table('catalogo_articulos', function (Blueprint $table) {
            if (Schema::hasColumn('catalogo_articulos', 'tipo_control')) {
                $table->dropColumn('tipo_control');
            }
        });
    }
};
