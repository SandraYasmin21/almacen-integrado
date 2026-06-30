<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Migración 000004 – Cierre de BD vehicular + Kiosco real + Adjuntos
 *
 * Resuelve los siguientes ítems del diagnóstico:
 *  ✔ Campos BD vehicular faltantes (seguro, GPS, combustible, verificación, km)
 *  ✔ Tabla perfiles_kiosco real (login gafete+PIN real)
 *  ✔ Tabla adjuntos_sistema (archivos reales de activos / facturas / garantías)
 *  ✔ Firma digital en asignaciones_activos (entregas con evidencia)
 *  ✔ Folio en gastos_extra_vehiculos
 */
return new class extends Migration
{
    public function up(): void
    {
        // ──────────────────────────────────────────────────────────────
        // 1. vehiculos_flotilla — campos que faltaban para el PDF/módulo
        // ──────────────────────────────────────────────────────────────
        Schema::table('vehiculos_flotilla', function (Blueprint $table) {
            if (! Schema::hasColumn('vehiculos_flotilla', 'color')) {
                $table->string('color', 60)->nullable()->after('tipo_vehiculo');
            }
            if (! Schema::hasColumn('vehiculos_flotilla', 'tipo_combustible')) {
                $table->string('tipo_combustible', 60)->nullable()->after('color');
            }
            if (! Schema::hasColumn('vehiculos_flotilla', 'capacidad_carga')) {
                $table->string('capacidad_carga', 80)->nullable()->after('tipo_combustible');
            }
            // Seguro
            if (! Schema::hasColumn('vehiculos_flotilla', 'vencimiento_seguro')) {
                $table->date('vencimiento_seguro')->nullable()->after('poliza_seguro');
            }
            if (! Schema::hasColumn('vehiculos_flotilla', 'aseguradora')) {
                $table->string('aseguradora', 120)->nullable()->after('vencimiento_seguro');
            }
            // Verificación vehicular
            if (! Schema::hasColumn('vehiculos_flotilla', 'vencimiento_verificacion')) {
                $table->date('vencimiento_verificacion')->nullable()->after('aseguradora');
            }
            // GPS
            if (! Schema::hasColumn('vehiculos_flotilla', 'gps_activo')) {
                $table->boolean('gps_activo')->default(true)->after('estado_gps');
            }
            if (! Schema::hasColumn('vehiculos_flotilla', 'gps_proveedor')) {
                $table->string('gps_proveedor', 120)->nullable()->after('gps_activo');
            }
            // KM tracking
            if (! Schema::hasColumn('vehiculos_flotilla', 'ultima_actualizacion_km')) {
                $table->timestamp('ultima_actualizacion_km')->nullable()->after('kilometraje_actual');
            }
            if (! Schema::hasColumn('vehiculos_flotilla', 'km_proximo_mantenimiento')) {
                $table->decimal('km_proximo_mantenimiento', 12, 2)->nullable()->after('ultima_actualizacion_km');
            }
            // Propietario y costo
            if (! Schema::hasColumn('vehiculos_flotilla', 'propietario')) {
                $table->string('propietario', 120)->nullable()->after('observaciones');
            }
            if (! Schema::hasColumn('vehiculos_flotilla', 'costo_adquisicion')) {
                $table->decimal('costo_adquisicion', 14, 2)->nullable()->after('propietario');
            }
            if (! Schema::hasColumn('vehiculos_flotilla', 'fecha_adquisicion')) {
                $table->date('fecha_adquisicion')->nullable()->after('costo_adquisicion');
            }
        });

        // ──────────────────────────────────────────────────────────────
        // 2. gastos_extra_vehiculos — folio y tipo controlado
        // ──────────────────────────────────────────────────────────────
        Schema::table('gastos_extra_vehiculos', function (Blueprint $table) {
            if (! Schema::hasColumn('gastos_extra_vehiculos', 'folio')) {
                $table->string('folio', 40)->nullable()->unique()->after('id');
            }
            if (! Schema::hasColumn('gastos_extra_vehiculos', 'requiere_evidencia')) {
                $table->boolean('requiere_evidencia')->default(false)->after('evidencia_path');
            }
            if (! Schema::hasColumn('gastos_extra_vehiculos', 'comprobante_fiscal')) {
                $table->string('comprobante_fiscal', 255)->nullable()->after('requiere_evidencia');
            }
        });

        // Generar folios faltantes en gastos_extra
        DB::table('gastos_extra_vehiculos')
            ->whereNull('folio')
            ->orderBy('id')
            ->select('id')
            ->chunkById(200, function ($rows) {
                foreach ($rows as $row) {
                    DB::table('gastos_extra_vehiculos')
                        ->where('id', $row->id)
                        ->update(['folio' => sprintf('GEV-%06d', $row->id)]);
                }
            });

        // ──────────────────────────────────────────────────────────────
        // 3. asignaciones_activos — firma digital real y condición
        // ──────────────────────────────────────────────────────────────
        Schema::table('asignaciones_activos', function (Blueprint $table) {
            if (! Schema::hasColumn('asignaciones_activos', 'firma_digital')) {
                $table->longText('firma_digital')->nullable()->after('notas_estado_fisico');
            }
            if (! Schema::hasColumn('asignaciones_activos', 'condicion_entrega')) {
                $table->string('condicion_entrega', 60)->nullable()->after('firma_digital');
            }
            if (! Schema::hasColumn('asignaciones_activos', 'condicion_devolucion')) {
                $table->string('condicion_devolucion', 60)->nullable()->after('condicion_entrega');
            }
            if (! Schema::hasColumn('asignaciones_activos', 'folio')) {
                $table->string('folio', 40)->nullable()->unique()->after('id');
            }
            if (! Schema::hasColumn('asignaciones_activos', 'usuario_entrega_id')) {
                $table->foreignId('usuario_entrega_id')
                    ->nullable()
                    ->after('condicion_devolucion')
                    ->constrained('usuarios_sistema')
                    ->nullOnDelete();
            }
        });

        // Generar folios faltantes en asignaciones
        DB::table('asignaciones_activos')
            ->whereNull('folio')
            ->orderBy('id')
            ->select('id')
            ->chunkById(200, function ($rows) {
                foreach ($rows as $row) {
                    DB::table('asignaciones_activos')
                        ->where('id', $row->id)
                        ->update(['folio' => sprintf('ASG-%06d', $row->id)]);
                }
            });

        // ──────────────────────────────────────────────────────────────
        // 4. movimiento_inventario — adjunto y firma
        // ──────────────────────────────────────────────────────────────
        Schema::table('movimiento_inventario', function (Blueprint $table) {
            if (! Schema::hasColumn('movimiento_inventario', 'firma_digital')) {
                $table->longText('firma_digital')->nullable()->after('motivo');
            }
        });

        // ──────────────────────────────────────────────────────────────
        // 5. perfiles_kiosco — tabla REAL (reemplaza simulación anterior)
        // ──────────────────────────────────────────────────────────────
        if (! Schema::hasTable('perfiles_kiosco')) {
            Schema::create('perfiles_kiosco', function (Blueprint $table) {
                $table->id();
                $table->foreignId('empleado_id')
                    ->constrained('empleados')
                    ->cascadeOnDelete();
                $table->string('pin_hash');                    // Hash bcrypt del PIN
                $table->string('estado', 30)->default('activo'); // activo | suspendido | bloqueado
                $table->json('kioscos_autorizados')->nullable(); // ["kiosco_1","kiosco_2"]
                $table->json('permisos')->nullable();           // ["prestamo","devolucion","flotilla"]
                $table->unsignedTinyInteger('intentos_fallidos')->default(0);
                $table->timestamp('bloqueado_hasta')->nullable();
                $table->timestamp('ultimo_acceso')->nullable();
                $table->foreignId('creado_por_id')
                    ->nullable()
                    ->constrained('usuarios_sistema')
                    ->nullOnDelete();
                $table->timestamps();
                $table->softDeletes();

                // Un empleado solo puede tener un perfil activo
                $table->unique('empleado_id');
            });
        }

        // ──────────────────────────────────────────────────────────────
        // 6. kiosco_tokens — tokens de sesión kiosco (Sanctum-like)
        // ──────────────────────────────────────────────────────────────
        if (! Schema::hasTable('kiosco_tokens')) {
            Schema::create('kiosco_tokens', function (Blueprint $table) {
                $table->id();
                $table->foreignId('perfil_kiosco_id')
                    ->constrained('perfiles_kiosco')
                    ->cascadeOnDelete();
                $table->foreignId('empleado_id')
                    ->constrained('empleados')
                    ->cascadeOnDelete();
                $table->string('token_hash', 128)->unique();
                $table->string('nombre', 100)->default('kiosco-session');
                $table->json('abilities')->nullable();
                $table->timestamp('expires_at')->nullable();
                $table->timestamp('last_used_at')->nullable();
                $table->timestamps();

                $table->index(['token_hash']);
                $table->index(['empleado_id', 'expires_at']);
            });
        }

        // ──────────────────────────────────────────────────────────────
        // 7. adjuntos_sistema — archivos reales persistidos
        // ──────────────────────────────────────────────────────────────
        if (! Schema::hasTable('adjuntos_sistema')) {
            Schema::create('adjuntos_sistema', function (Blueprint $table) {
                $table->id();
                // Relación polimórfica con cualquier tabla
                $table->string('entidad_tipo', 80);   // catalogo_articulos, vehiculos_flotilla, etc.
                $table->unsignedBigInteger('entidad_id');
                // Metadatos del archivo
                $table->string('nombre_original');
                $table->string('nombre_almacenado');
                $table->string('disco', 30)->default('public'); // public | s3
                $table->string('ruta');                          // path en Storage
                $table->string('mime_type', 120)->nullable();
                $table->unsignedBigInteger('tamano_bytes')->default(0);
                $table->string('categoria', 80)->nullable(); // factura | garantia | manual | evidencia | foto | otro
                $table->text('descripcion')->nullable();
                $table->foreignId('subido_por_id')
                    ->nullable()
                    ->constrained('usuarios_sistema')
                    ->nullOnDelete();
                $table->timestamps();
                $table->softDeletes();

                $table->index(['entidad_tipo', 'entidad_id']);
                $table->index(['categoria']);
            });
        }

        // ──────────────────────────────────────────────────────────────
        // 8. registros_vehiculares — campos faltantes para alertas
        // ──────────────────────────────────────────────────────────────
        Schema::table('registros_vehiculares', function (Blueprint $table) {
            if (! Schema::hasColumn('registros_vehiculares', 'estatus_reparacion')) {
                $table->string('estatus_reparacion', 40)->nullable()->after('tipo_mantenimiento');
            }
            if (! Schema::hasColumn('registros_vehiculares', 'fecha_inicio_reparacion')) {
                $table->date('fecha_inicio_reparacion')->nullable()->after('estatus_reparacion');
            }
            if (! Schema::hasColumn('registros_vehiculares', 'fecha_fin_reparacion')) {
                $table->date('fecha_fin_reparacion')->nullable()->after('fecha_inicio_reparacion');
            }
            if (! Schema::hasColumn('registros_vehiculares', 'taller')) {
                $table->string('taller', 150)->nullable()->after('fecha_fin_reparacion');
            }
            if (! Schema::hasColumn('registros_vehiculares', 'folio')) {
                $table->string('folio', 40)->nullable()->unique()->after('id');
            }
        });

        // Generar folios en registros_vehiculares
        DB::table('registros_vehiculares')
            ->whereNull('folio')
            ->orderBy('id')
            ->select('id')
            ->chunkById(200, function ($rows) {
                foreach ($rows as $row) {
                    DB::table('registros_vehiculares')
                        ->where('id', $row->id)
                        ->update(['folio' => sprintf('REG-%06d', $row->id)]);
                }
            });

        // ──────────────────────────────────────────────────────────────
        // 9. alertas_sistema — enriquecer con vehiculo_id
        // ──────────────────────────────────────────────────────────────
        Schema::table('alertas_sistema', function (Blueprint $table) {
            if (! Schema::hasColumn('alertas_sistema', 'vehiculo_id')) {
                $table->foreignId('vehiculo_id')
                    ->nullable()
                    ->after('metadata')
                    ->constrained('vehiculos_flotilla')
                    ->nullOnDelete();
            }
            if (! Schema::hasColumn('alertas_sistema', 'empleado_id')) {
                $table->foreignId('empleado_id')
                    ->nullable()
                    ->after('vehiculo_id')
                    ->constrained('empleados')
                    ->nullOnDelete();
            }
            if (! Schema::hasColumn('alertas_sistema', 'serie_id')) {
                $table->foreignId('serie_id')
                    ->nullable()
                    ->after('empleado_id')
                    ->constrained('inventario_series')
                    ->nullOnDelete();
            }
            if (! Schema::hasColumn('alertas_sistema', 'resuelta_por_id')) {
                $table->foreignId('resuelta_por_id')
                    ->nullable()
                    ->after('serie_id')
                    ->constrained('usuarios_sistema')
                    ->nullOnDelete();
            }
            if (! Schema::hasColumn('alertas_sistema', 'fecha_resolucion')) {
                $table->timestamp('fecha_resolucion')->nullable()->after('resuelta_por_id');
            }
        });
    }

    // ──────────────────────────────────────────────────────────────────
    // DOWN
    // ──────────────────────────────────────────────────────────────────
    public function down(): void
    {
        Schema::dropIfExists('adjuntos_sistema');
        Schema::dropIfExists('kiosco_tokens');
        Schema::dropIfExists('perfiles_kiosco');

        Schema::table('alertas_sistema', function (Blueprint $table) {
            foreach (['fecha_resolucion', 'resuelta_por_id', 'serie_id', 'empleado_id', 'vehiculo_id'] as $col) {
                if (Schema::hasColumn('alertas_sistema', $col)) {
                    if (in_array($col, ['vehiculo_id', 'empleado_id', 'serie_id', 'resuelta_por_id'])) {
                        $table->dropForeign([$col]);
                    }
                    $table->dropColumn($col);
                }
            }
        });

        Schema::table('registros_vehiculares', function (Blueprint $table) {
            foreach (['folio', 'taller', 'fecha_fin_reparacion', 'fecha_inicio_reparacion', 'estatus_reparacion'] as $col) {
                if (Schema::hasColumn('registros_vehiculares', $col)) {
                    $table->dropColumn($col);
                }
            }
        });

        Schema::table('movimiento_inventario', function (Blueprint $table) {
            if (Schema::hasColumn('movimiento_inventario', 'firma_digital')) {
                $table->dropColumn('firma_digital');
            }
        });

        Schema::table('asignaciones_activos', function (Blueprint $table) {
            foreach (['usuario_entrega_id', 'folio', 'condicion_devolucion', 'condicion_entrega', 'firma_digital'] as $col) {
                if (Schema::hasColumn('asignaciones_activos', $col)) {
                    if ($col === 'usuario_entrega_id') {
                        $table->dropForeign([$col]);
                    }
                    $table->dropColumn($col);
                }
            }
        });

        Schema::table('gastos_extra_vehiculos', function (Blueprint $table) {
            foreach (['comprobante_fiscal', 'requiere_evidencia', 'folio'] as $col) {
                if (Schema::hasColumn('gastos_extra_vehiculos', $col)) {
                    $table->dropColumn($col);
                }
            }
        });

        Schema::table('vehiculos_flotilla', function (Blueprint $table) {
            foreach ([
                'fecha_adquisicion', 'costo_adquisicion', 'propietario',
                'km_proximo_mantenimiento', 'ultima_actualizacion_km',
                'gps_proveedor', 'gps_activo',
                'vencimiento_verificacion', 'aseguradora', 'vencimiento_seguro',
                'capacidad_carga', 'tipo_combustible', 'color',
            ] as $col) {
                if (Schema::hasColumn('vehiculos_flotilla', $col)) {
                    $table->dropColumn($col);
                }
            }
        });
    }
};
