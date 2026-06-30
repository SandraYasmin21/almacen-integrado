<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('ubicaciones')) {
            Schema::create('ubicaciones', function (Blueprint $table) {
                $table->id();
                $table->string('nombre')->unique();
                $table->string('tipo', 50)->default('almacen');
                $table->boolean('activo')->default(true);
                $table->timestamps();
                $table->softDeletes();
            });
        }

        Schema::table('catalogo_articulos', function (Blueprint $table) {
            if (! Schema::hasColumn('catalogo_articulos', 'marca_fabricante')) {
                $table->string('marca_fabricante')->nullable()->after('nombre');
            }
        });

        Schema::table('stock_general', function (Blueprint $table) {
            if (! Schema::hasColumn('stock_general', 'ubicacion_id')) {
                $table->foreignId('ubicacion_id')->nullable()->after('ubicacion')->constrained('ubicaciones')->nullOnDelete();
            }
        });

        Schema::table('inventario_series', function (Blueprint $table) {
            if (! Schema::hasColumn('inventario_series', 'ubicacion_id')) {
                $table->foreignId('ubicacion_id')->nullable()->after('ubicacion')->constrained('ubicaciones')->nullOnDelete();
            }
            if (! Schema::hasColumn('inventario_series', 'fecha_adquisicion')) {
                $table->date('fecha_adquisicion')->nullable()->after('ubicacion_id');
            }
            if (! Schema::hasColumn('inventario_series', 'fecha_vencimiento_garantia')) {
                $table->date('fecha_vencimiento_garantia')->nullable()->after('fecha_adquisicion');
            }
            if (! Schema::hasColumn('inventario_series', 'notas')) {
                $table->text('notas')->nullable()->after('fecha_vencimiento_garantia');
            }
        });

        Schema::table('movimiento_inventario', function (Blueprint $table) {
            if (! Schema::hasColumn('movimiento_inventario', 'orden_venta_id')) {
                $table->foreignId('orden_venta_id')->nullable()->after('proveedor_id')->constrained('orden_venta')->nullOnDelete();
            }
            if (! Schema::hasColumn('movimiento_inventario', 'datos_previos')) {
                $table->json('datos_previos')->nullable()->after('notas');
            }
            if (! Schema::hasColumn('movimiento_inventario', 'datos_nuevos')) {
                $table->json('datos_nuevos')->nullable()->after('datos_previos');
            }
        });

        $this->migrateExistingLocations();
    }

    public function down(): void
    {
        Schema::table('movimiento_inventario', function (Blueprint $table) {
            foreach (['datos_nuevos', 'datos_previos', 'orden_venta_id'] as $column) {
                if (Schema::hasColumn('movimiento_inventario', $column)) {
                    $table->dropColumn($column);
                }
            }
        });

        Schema::table('inventario_series', function (Blueprint $table) {
            foreach (['notas', 'fecha_vencimiento_garantia', 'fecha_adquisicion', 'ubicacion_id'] as $column) {
                if (Schema::hasColumn('inventario_series', $column)) {
                    $table->dropColumn($column);
                }
            }
        });

        Schema::table('stock_general', function (Blueprint $table) {
            if (Schema::hasColumn('stock_general', 'ubicacion_id')) {
                $table->dropColumn('ubicacion_id');
            }
        });

        Schema::table('catalogo_articulos', function (Blueprint $table) {
            if (Schema::hasColumn('catalogo_articulos', 'marca_fabricante')) {
                $table->dropColumn('marca_fabricante');
            }
        });

        Schema::dropIfExists('ubicaciones');
    }

    private function migrateExistingLocations(): void
    {
        if (! Schema::hasTable('ubicaciones')) {
            return;
        }

        $names = collect();

        if (Schema::hasColumn('stock_general', 'ubicacion')) {
            $names = $names->merge(DB::table('stock_general')->whereNotNull('ubicacion')->pluck('ubicacion'));
        }

        if (Schema::hasColumn('inventario_series', 'ubicacion')) {
            $names = $names->merge(DB::table('inventario_series')->whereNotNull('ubicacion')->pluck('ubicacion'));
        }

        $names->map(fn ($name) => trim((string) $name))
            ->filter()
            ->unique()
            ->each(function (string $name) {
                DB::table('ubicaciones')->updateOrInsert(
                    ['nombre' => $name],
                    ['tipo' => 'almacen', 'activo' => true, 'updated_at' => now(), 'created_at' => now()]
                );
            });

        if (Schema::hasColumn('stock_general', 'ubicacion_id')) {
            DB::table('stock_general')
                ->whereNotNull('ubicacion')
                ->orderBy('id')
                ->chunkById(100, function ($rows) {
                    foreach ($rows as $row) {
                        $ubicacionId = DB::table('ubicaciones')->where('nombre', trim((string) $row->ubicacion))->value('id');
                        if ($ubicacionId) {
                            DB::table('stock_general')->where('id', $row->id)->update(['ubicacion_id' => $ubicacionId]);
                        }
                    }
                });
        }

        if (Schema::hasColumn('inventario_series', 'ubicacion_id')) {
            DB::table('inventario_series')
                ->whereNotNull('ubicacion')
                ->orderBy('id')
                ->chunkById(100, function ($rows) {
                    foreach ($rows as $row) {
                        $ubicacionId = DB::table('ubicaciones')->where('nombre', trim((string) $row->ubicacion))->value('id');
                        if ($ubicacionId) {
                            DB::table('inventario_series')->where('id', $row->id)->update(['ubicacion_id' => $ubicacionId]);
                        }
                    }
                });
        }
    }
};
