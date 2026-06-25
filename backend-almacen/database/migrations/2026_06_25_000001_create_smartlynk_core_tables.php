<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('usuarios_sistema', function (Blueprint $table) {
            $table->id();
            $table->string('nombre_usuario', 50)->unique();
            $table->string('email', 100)->unique();
            $table->string('password_hash');
            $table->boolean('password_cambiado')->default(false);
            $table->foreignId('generado_por_id')->nullable()->constrained('usuarios_sistema')->nullOnDelete();
            $table->string('rol_acceso', 50)->default('Consulta');
            $table->json('permisos_custom')->nullable();
            $table->boolean('activo')->default(true);
            $table->timestamp('ultimo_acceso')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('categorias', function (Blueprint $table) {
            $table->id();
            $table->string('nombre')->unique();
            $table->text('descripcion')->nullable();
            $table->boolean('activo')->default(true);
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('subcategorias', function (Blueprint $table) {
            $table->id();
            $table->foreignId('categoria_id')->constrained('categorias')->cascadeOnDelete();
            $table->string('nombre');
            $table->text('descripcion')->nullable();
            $table->boolean('activo')->default(true);
            $table->timestamps();
            $table->softDeletes();
            $table->unique(['categoria_id', 'nombre']);
        });

        Schema::create('proveedores', function (Blueprint $table) {
            $table->id();
            $table->string('nombre_empresa');
            $table->string('contacto')->nullable();
            $table->string('telefono')->nullable();
            $table->string('email')->nullable();
            $table->string('rfc')->nullable();
            $table->text('direccion')->nullable();
            $table->boolean('activo')->default(true);
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('empleados', function (Blueprint $table) {
            $table->id();
            $table->foreignId('usuario_id')->nullable()->constrained('usuarios_sistema')->nullOnDelete();
            $table->string('nombre_completo');
            $table->string('telefono_personal')->nullable();
            $table->string('curp')->nullable();
            $table->string('rfc')->nullable();
            $table->string('contacto_emergencia_nombre')->nullable();
            $table->string('contacto_emergencia_telefono')->nullable();
            $table->string('numero_gafete')->nullable()->unique();
            $table->string('codigo_sku_gafete')->nullable();
            $table->string('departamento_area')->nullable();
            $table->string('puesto_cargo')->nullable();
            $table->date('fecha_ingreso')->nullable();
            $table->boolean('tiene_licencia')->default(false);
            $table->string('numero_licencia')->nullable();
            $table->date('vencimiento_licencia')->nullable();
            $table->string('foto_perfil')->nullable();
            $table->boolean('activo')->default(true);
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('catalogo_articulos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('subcategoria_id')->nullable()->constrained('subcategorias')->nullOnDelete();
            $table->string('sku_maestro')->nullable()->unique();
            $table->string('nombre');
            $table->string('marca')->nullable();
            $table->string('modelo')->nullable();
            $table->string('tipo_articulo')->default('herramienta');
            $table->boolean('requiere_serie')->default(false);
            $table->boolean('es_consumible')->default(false);
            $table->string('unidad_medida', 50)->default('PZA');
            $table->decimal('stock_minimo', 12, 2)->default(0);
            $table->boolean('activo')->default(true);
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('stock_general', function (Blueprint $table) {
            $table->id();
            $table->foreignId('articulo_id')->constrained('catalogo_articulos')->cascadeOnDelete();
            $table->decimal('cantidad', 12, 2)->default(0);
            $table->string('ubicacion')->nullable();
            $table->timestamps();
            $table->softDeletes();
            $table->unique(['articulo_id', 'ubicacion']);
        });

        Schema::create('inventario_series', function (Blueprint $table) {
            $table->id();
            $table->foreignId('articulo_id')->constrained('catalogo_articulos')->cascadeOnDelete();
            $table->string('codigo_interno_generado')->unique();
            $table->string('numero_serie_fabricante')->nullable();
            $table->string('estado')->default('DISPONIBLE');
            $table->string('ubicacion')->nullable();
            $table->string('proposito_uso')->nullable();
            $table->text('nota')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('movimiento_inventario', function (Blueprint $table) {
            $table->id();
            $table->timestamp('fecha_hora')->nullable();
            $table->string('tipo_movimiento', 50)->nullable();
            $table->string('tipo', 50)->nullable();
            $table->foreignId('usuario_id')->nullable()->constrained('usuarios_sistema')->nullOnDelete();
            $table->foreignId('empleado_id')->nullable()->constrained('empleados')->nullOnDelete();
            $table->foreignId('proveedor_id')->nullable()->constrained('proveedores')->nullOnDelete();
            $table->text('notas')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('detalle_movimiento', function (Blueprint $table) {
            $table->id();
            $table->foreignId('movimiento_id')->constrained('movimiento_inventario')->cascadeOnDelete();
            $table->foreignId('articulo_id')->constrained('catalogo_articulos')->cascadeOnDelete();
            $table->foreignId('serie_id')->nullable()->constrained('inventario_series')->nullOnDelete();
            $table->foreignId('orden_venta_id')->nullable();
            $table->decimal('cantidad', 12, 2)->default(1);
            $table->string('estado_devolucion')->nullable();
            $table->timestamps();
        });

        Schema::create('asignaciones_activos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('empleado_id')->constrained('empleados')->cascadeOnDelete();
            $table->foreignId('serie_id')->constrained('inventario_series')->cascadeOnDelete();
            $table->timestamp('fecha_entrega')->nullable();
            $table->timestamp('fecha_devolucion')->nullable();
            $table->text('notas_estado_fisico')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('vehiculos_flotilla', function (Blueprint $table) {
            $table->id();
            $table->string('nombre');
            $table->string('modelo');
            $table->string('numero_serie')->nullable()->unique();
            $table->string('tipo_vehiculo')->nullable();
            $table->string('numero')->nullable();
            $table->string('estado_gps')->nullable();
            $table->string('placa')->nullable()->unique();
            $table->string('placas')->nullable()->unique();
            $table->string('poliza_seguro')->nullable();
            $table->string('grupo')->nullable();
            $table->string('certificacion')->nullable();
            $table->string('estado')->default('ACTIVO');
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('registros_vehiculares', function (Blueprint $table) {
            $table->id();
            $table->foreignId('vehiculo_id')->constrained('vehiculos_flotilla')->cascadeOnDelete();
            $table->string('nombre_vehiculo')->nullable();
            $table->string('niv')->nullable();
            $table->string('placas')->nullable();
            $table->date('fecha');
            $table->string('tipo');
            $table->text('detalle_falla')->nullable();
            $table->decimal('kilometraje', 12, 2)->default(0);
            $table->decimal('costo', 12, 2)->default(0);
            $table->string('tipo_mantenimiento')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('gastos_extra_vehiculos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('vehiculo_id')->constrained('vehiculos_flotilla')->cascadeOnDelete();
            $table->date('fecha');
            $table->string('tipo');
            $table->decimal('costo', 12, 2)->default(0);
            $table->text('observaciones')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('bitacora_vehiculos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('vehiculo_id')->constrained('vehiculos_flotilla')->cascadeOnDelete();
            $table->foreignId('empleado_id')->nullable()->constrained('empleados')->nullOnDelete();
            $table->timestamp('fecha_hora_salida')->nullable();
            $table->timestamp('fecha_salida')->nullable();
            $table->decimal('km_inicial', 12, 2)->default(0);
            $table->text('motivo_viaje')->nullable();
            $table->text('motivo_uso')->nullable();
            $table->timestamp('fecha_hora_regreso')->nullable();
            $table->timestamp('fecha_regreso')->nullable();
            $table->decimal('km_final', 12, 2)->nullable();
            $table->text('observaciones_retorno')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('ordenes_compra', function (Blueprint $table) {
            $table->id();
            $table->string('folio')->unique();
            $table->foreignId('proveedor_id')->nullable()->constrained('proveedores')->nullOnDelete();
            $table->foreignId('usuario_id')->nullable()->constrained('usuarios_sistema')->nullOnDelete();
            $table->string('estado')->default('borrador');
            $table->text('notas')->nullable();
            $table->date('fecha_esperada')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('detalle_orden_compra', function (Blueprint $table) {
            $table->id();
            $table->foreignId('orden_compra_id')->constrained('ordenes_compra')->cascadeOnDelete();
            $table->foreignId('articulo_id')->constrained('catalogo_articulos')->cascadeOnDelete();
            $table->integer('cantidad_solicitada')->default(1);
            $table->integer('cantidad_recibida')->default(0);
            $table->decimal('precio_unitario', 12, 2)->nullable();
            $table->timestamps();
        });

        Schema::create('proyecto_presupuestos', function (Blueprint $table) {
            $table->id();
            $table->string('nombre')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('orden_venta', function (Blueprint $table) {
            $table->id();
            $table->foreignId('proyecto_id')->nullable()->constrained('proyecto_presupuestos')->nullOnDelete();
            $table->timestamp('fecha_hora')->nullable();
            $table->string('folio')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('detalle_orden_venta', function (Blueprint $table) {
            $table->id();
            $table->foreignId('orden_venta_id')->constrained('orden_venta')->cascadeOnDelete();
            $table->foreignId('articulo_id')->nullable()->constrained('catalogo_articulos')->nullOnDelete();
            $table->decimal('cantidad', 12, 2)->default(1);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('detalle_orden_venta');
        Schema::dropIfExists('orden_venta');
        Schema::dropIfExists('proyecto_presupuestos');
        Schema::dropIfExists('detalle_orden_compra');
        Schema::dropIfExists('ordenes_compra');
        Schema::dropIfExists('bitacora_vehiculos');
        Schema::dropIfExists('gastos_extra_vehiculos');
        Schema::dropIfExists('registros_vehiculares');
        Schema::dropIfExists('vehiculos_flotilla');
        Schema::dropIfExists('asignaciones_activos');
        Schema::dropIfExists('detalle_movimiento');
        Schema::dropIfExists('movimiento_inventario');
        Schema::dropIfExists('inventario_series');
        Schema::dropIfExists('stock_general');
        Schema::dropIfExists('catalogo_articulos');
        Schema::dropIfExists('empleados');
        Schema::dropIfExists('proveedores');
        Schema::dropIfExists('subcategorias');
        Schema::dropIfExists('categorias');
        Schema::dropIfExists('usuarios_sistema');
    }
};
