<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Http\Controllers\AdjuntoController;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Cache\RateLimiting\Limit;
use App\Http\Controllers\AlmacenController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\BackupController;
use App\Http\Controllers\BitacoraViajeController;
use App\Http\Controllers\BusquedaAvanzadaController;
use App\Http\Controllers\CategoriaController;
use App\Http\Controllers\CatalogoCentralController;
use App\Http\Controllers\CatalogoConfigurableController;
use App\Http\Controllers\ConfiguracionSistemaController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\DocumentoOperacionController;
use App\Http\Controllers\EmpleadoController;
use App\Http\Controllers\FlotillaDashboardController;
use App\Http\Controllers\FlotillaKilometrajeController;
use App\Http\Controllers\GastoExtraVehiculoController;
use App\Http\Controllers\PeriodoOperativoController;
use App\Http\Controllers\ProyectoController;
use App\Http\Controllers\RegistroVehicularController;
use App\Http\Controllers\ReporteVehicularController;
use App\Http\Controllers\ReporteBasicoController;
use App\Http\Controllers\UbicacionController;
use App\Http\Controllers\UsuarioController;
use App\Http\Controllers\VehiculoFlotillaController;
use App\Http\Controllers\OrdenCompraController;
use App\Http\Controllers\FlotillaExportController;
use App\Http\Controllers\KioscoAuthController;
use App\Http\Controllers\KioscoOperacionesController;
// ============================================================
// Rate Limiters (desde variables de entorno)
// ============================================================

// Para modulos generales: categorias, empleados
RateLimiter::for('api-general', function (Request $request) {
    $maxRequests = (int) env('API_RATE_LIMIT', 60);
    return Limit::perMinute($maxRequests)->by($request->ip());
});

// Para el modulo de flotilla vehicular
RateLimiter::for('flotilla', function (Request $request) {
    $maxRequests = (int) env('FLOTILLA_RATE_LIMIT', 60);
    return Limit::perMinute($maxRequests)->by($request->ip());
});

// Para autenticacion: max 5 intentos por minuto (proteccion fuerza bruta)
RateLimiter::for('auth-login', function (Request $request) {
    $maxAttempts = (int) env('AUTH_RATE_LIMIT', 5);
    $email = strtolower((string) $request->input('email'));

    return Limit::perMinute($maxAttempts)
        ->by($email.'|'.$request->ip())
        ->response(function () {
            return response()->json([
                'mensaje' => 'Demasiados intentos de inicio de sesion. Espera 1 minuto.',
            ], 429);
        });
});


// ============================================================
// Ruta de autenticacion (ya existente)
// ============================================================
Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

Route::prefix('auth')->group(function () {
    // Login publico con proteccion fuerza bruta
    Route::post('login', [AuthController::class, 'login'])
        ->middleware('throttle:auth-login');

    // Rutas protegidas por token Sanctum
    Route::middleware('auth:sanctum')->group(function () {
        Route::post('logout', [AuthController::class, 'logout']);
        Route::get('me', [AuthController::class, 'me']);
    });
});

Route::post('documentos-operacion/{tipo}/pdf', [DocumentoOperacionController::class, 'generarPdf'])
    ->middleware('throttle:api-general');

// ============================================================
// Modulos internos protegidos
// CORS: aplica globalmente desde config/cors.php
// Rate Limiting: API_RATE_LIMIT/FLOTILLA_RATE_LIMIT por IP
// Auth: Bearer token Sanctum obligatorio
// ============================================================
Route::middleware(['auth:sanctum', 'throttle:api-general'])->group(function () {
    Route::get('dashboard/metricas', [DashboardController::class, 'metricas']);
    Route::get('notifications', [DashboardController::class, 'notifications']);
    Route::get('search', [DashboardController::class, 'search']);
    Route::post('sync-sheets', [DashboardController::class, 'syncSheets']);
    Route::get('export/excel', [DashboardController::class, 'exportExcel']);
    Route::get('export/pdf', [DashboardController::class, 'exportPDF']);

    Route::get('/almacen/dashboard', [AlmacenController::class, 'dashboardStats']);
    Route::get('/almacen/entrada/plantilla', [AlmacenController::class, 'descargarPlantillaImportacion']);
    Route::post('/almacen/entrada/importar', [AlmacenController::class, 'importarArchivo']);
    Route::post('/almacen/entrada/importar-csv', [AlmacenController::class, 'importarCSV']);
    Route::get('/almacen/exportar-inventario', [AlmacenController::class, 'exportarInventarioDetallado']);
    Route::get('almacen/inventario-detallado', [AlmacenController::class, 'inventarioDetalladoApi']);
    Route::get('almacen/articulos', [AlmacenController::class, 'inventarioApi']);
    Route::get('almacen/catalogo-entrada', [AlmacenController::class, 'catalogoEntradaApi']);
    Route::get('almacen/export/{format}', [AlmacenController::class, 'export']);
    Route::get('almacen/categorias', fn () => DB::table('categorias')->where('activo', true)->orderBy('nombre')->get());
    Route::get('almacen/ubicaciones', fn () => DB::table('stock_general')
        ->select('ubicacion', DB::raw('COUNT(*) as total_articulos'), DB::raw('SUM(cantidad) as total_unidades'))
        ->whereNotNull('ubicacion')
        ->groupBy('ubicacion')
        ->orderBy('ubicacion')
        ->get());
    Route::post('almacen/entrada', [AlmacenController::class, 'registrarEntrada']);
    Route::post('almacen/ajuste-fisico', [AlmacenController::class, 'registrarAjusteFisico']);
    Route::get('almacen/sku/{codigo}', [AlmacenController::class, 'buscarSku']);
    Route::get('almacen/articulos/{id}/series-disponibles', [AlmacenController::class, 'seriesDisponiblesPorArticulo']);
    Route::post('almacen/salida', [AlmacenController::class, 'registrarSalida']);
    Route::post('almacen/prestamo', [AlmacenController::class, 'registrarPrestamo']);
    Route::post('almacen/devolucion', [AlmacenController::class, 'registrarDevolucion']);
    Route::post('almacen/movimiento', [AlmacenController::class, 'registrarMovimiento']);
    Route::get('almacen/movimientos', [AlmacenController::class, 'movimientosApi']);
    Route::get('almacen/movimientos/{id}', [AlmacenController::class, 'movimientoDetalle']);
    Route::put('almacen/movimientos/{id}', [AlmacenController::class, 'actualizarMovimiento']);
    Route::delete('almacen/movimientos/{id}', [AlmacenController::class, 'eliminarMovimiento']);
    Route::put('almacen/serie/{id}/nota', [AlmacenController::class, 'actualizarNotaSerie']);
    // ── Órdenes de Compra ──────────────────────────────────────────────────────
    Route::get('almacen/requisiciones', [OrdenCompraController::class, 'requisiciones']);
    Route::get('almacen/ordenes-compra/export/excel', [OrdenCompraController::class, 'exportExcel']);
    Route::get('almacen/ordenes-compra/export/pdf',   [OrdenCompraController::class, 'exportPdf']);
    Route::get('almacen/ordenes-compra', [OrdenCompraController::class, 'index']);
    Route::post('almacen/ordenes-compra', [OrdenCompraController::class, 'store']);
    Route::get('almacen/ordenes-compra/{id}', [OrdenCompraController::class, 'show']);
    Route::put('almacen/ordenes-compra/{id}/estado', [OrdenCompraController::class, 'updateEstado']);
    // ──────────────────────────────────────────────────────────────────────────

    Route::get('proveedores', fn () => DB::table('proveedores')->where('activo', true)->orderBy('nombre_empresa')->get());
    Route::get('empleados/estados', [EmpleadoController::class, 'estadosApi']);
    Route::get('empleados', [EmpleadoController::class, 'apiIndex']);
    Route::apiResource('categorias', CategoriaController::class);

    Route::prefix('catalogo')->group(function () {
        Route::get('articulos', [CatalogoCentralController::class, 'articulos']);
        Route::get('vehiculos', [CatalogoCentralController::class, 'vehiculos']);
        Route::get('subcategorias', [CatalogoCentralController::class, 'subcategorias']);
        Route::post('articulos', [CatalogoCentralController::class, 'storeArticulo']);
        Route::put('articulos/{id}', [CatalogoCentralController::class, 'updateArticulo']);
        Route::delete('/articulos/{id}', [CatalogoCentralController::class, 'deleteArticulo']);
        Route::post('vehiculos', [CatalogoCentralController::class, 'storeVehiculo']);
        Route::put('vehiculos/{id}', [CatalogoCentralController::class, 'updateVehiculo']);
        Route::get('export/{tipo}/{formato}', [CatalogoCentralController::class, 'export']);
    });
});

Route::middleware(['auth:sanctum', 'throttle:api-general', 'check.role:Admin'])->prefix('admin')->group(function () {
    Route::apiResource('usuarios', UsuarioController::class)->only(['index', 'store', 'update']);
    Route::patch('usuarios/{usuario}/activar', [UsuarioController::class, 'activar']);
    Route::post('usuarios/{usuario}/reset-password', [UsuarioController::class, 'resetPassword']);

    Route::get('configuraciones', [ConfiguracionSistemaController::class, 'index']);
    Route::put('configuraciones', [ConfiguracionSistemaController::class, 'update']);

    Route::post('backups', [BackupController::class, 'store']);
    Route::get('backups/{file}', [BackupController::class, 'download']);
    Route::post('backups/{file}/upload', [BackupController::class, 'upload']);

    Route::get('auditoria', fn (Request $request) => DB::table('auditoria_sistema')
        ->orderByDesc('created_at')
        ->paginate($request->integer('per_page', 50)));
});

Route::middleware(['auth:sanctum', 'throttle:api-general', 'check.role:Admin,Almacen,Proyecto,Direccion'])->group(function () {
    Route::apiResource('ubicaciones', UbicacionController::class)
        ->parameters(['ubicaciones' => 'ubicacion'])
        ->except(['show']);
    Route::apiResource('catalogos-configurables', CatalogoConfigurableController::class)
        ->parameters(['catalogos-configurables' => 'catalogo'])
        ->except(['show']);
    Route::apiResource('proyectos', ProyectoController::class)->only(['index', 'store', 'show', 'update']);
    Route::post('proyectos/{proyecto}/recursos', [ProyectoController::class, 'asignarRecurso']);
    Route::delete('proyectos/{proyecto}/recursos/{recurso}', [ProyectoController::class, 'retirarRecurso']);

    Route::get('busqueda-avanzada', BusquedaAvanzadaController::class);
    Route::get('periodos-operativos', [PeriodoOperativoController::class, 'index']);
    Route::post('periodos-operativos', [PeriodoOperativoController::class, 'store']);
    Route::post('periodos-operativos/{periodo}/cerrar', [PeriodoOperativoController::class, 'cerrar'])->middleware('check.role:Admin');

    Route::get('reportes/vehiculos', [ReporteVehicularController::class, 'index']);
    Route::get('reportes/vehiculos/{vehiculoId}/historial', [ReporteVehicularController::class, 'historial']);
    Route::get('reportes/basicos', [ReporteBasicoController::class, 'index']);
    Route::get('reportes/basicos/{tipo}', [ReporteBasicoController::class, 'show']);
    Route::get('reportes/basicos/{tipo}/export', [ReporteBasicoController::class, 'export']);

    // Adjuntos
    Route::get('adjuntos/entidad/{tipo}/{id}', [AdjuntoController::class, 'porEntidad']);
    Route::post('adjuntos', [AdjuntoController::class, 'store']);
    Route::get('adjuntos/{id}', [AdjuntoController::class, 'show']);
    Route::delete('adjuntos/{id}', [AdjuntoController::class, 'destroy']);
});

// ============================================================
// Modulo de Flotilla Vehicular
// CORS: aplica globalmente desde config/cors.php
// Rate Limiting: 60 req/min por IP (FLOTILLA_RATE_LIMIT en .env)
// Sanitizacion: strip_tags + trim en cada controlador
// ============================================================
Route::prefix('flotilla')->middleware(['auth:sanctum', 'throttle:flotilla'])->group(function () {

    // Catalogo de Vehiculos
    Route::get('vehiculos/activos', [VehiculoFlotillaController::class, 'activos']);
    Route::apiResource('vehiculos', VehiculoFlotillaController::class);

    // Registro Vehicular (Mantenimientos)
    Route::apiResource('registros', RegistroVehicularController::class);

    // Gastos Extra
    Route::apiResource('gastos-extra', GastoExtraVehiculoController::class);

    // Bitacora de Viajes
    Route::get('bitacora-viajes/km-sugerido/{vehiculo_id}', [BitacoraViajeController::class, 'kmSugerido']);
    Route::apiResource('bitacora-viajes', BitacoraViajeController::class);

    // Dashboard
    Route::get('dashboard', [FlotillaDashboardController::class, 'index']);

    // Tabla de Kilometraje
    Route::get('kilometraje', [FlotillaKilometrajeController::class, 'index']);
});

// ============================================================
// Rutas de exportacion de Flotilla 
// (Usadas por los botones de exportar PDF/Excel)
// ============================================================
Route::prefix('exportar')->middleware(['auth:sanctum', 'throttle:api-general'])->group(function () {
    Route::get('mantenimientos/{formato}', [FlotillaExportController::class, 'mantenimientos']);
    Route::get('gastosextra/{formato}', [FlotillaExportController::class, 'gastosextra']);
    Route::get('kilometraje/{formato}', [FlotillaExportController::class, 'kilometraje']);
    Route::get('bitacora/{formato}', [FlotillaExportController::class, 'bitacora']);
});

// ============================================================
// Rutas migradas desde almacen/routes/web.php
// Estas rutas originalmente devolvian vistas de Inertia.
// ============================================================
use App\Http\Controllers\CatalogoController;
use App\Http\Controllers\FlotillaController;
// Nota: DashboardController, AlmacenController, EmpleadoController ya estan importados arriba.

Route::middleware(['auth:sanctum', 'throttle:api-general'])->group(function () {
    // Route::prefix('catalogo-web')->group(function () {
    //     Route::get('/', [CatalogoController::class, 'index']);
    //     Route::get('/crear', [CatalogoController::class, 'create']);
    //     Route::post('/', [CatalogoController::class, 'store']);
    //     Route::get('/{id}', [CatalogoController::class, 'show']);
    //     Route::get('/{id}/editar', [CatalogoController::class, 'edit']);
    //     Route::put('/{id}', [CatalogoController::class, 'update']);
    // });

    // Route::prefix('almacen-web')->group(function () {
    //     Route::get('/', [AlmacenController::class, 'index']);
    //     Route::get('/entrada', [AlmacenController::class, 'entradaForm']);
    //     Route::get('/salida', [AlmacenController::class, 'salidaForm']);
    //     Route::get('/prestamo', [AlmacenController::class, 'prestamoForm']);
    //     Route::get('/movimientos', [AlmacenController::class, 'movimientosView']);
    //     Route::get('/articulo/{id}', [AlmacenController::class, 'articuloDetalle']);
    //     Route::get('/serie/{id}', [AlmacenController::class, 'serieDetalle']);
    //     Route::get('/ubicacion/{ubicacion}', [AlmacenController::class, 'ubicacionDetalle']);
    // });

    Route::prefix('empleados-web')->group(function () {
        Route::get('/', [EmpleadoController::class, 'index']);
        Route::get('/nuevo', [EmpleadoController::class, 'create']);
        Route::post('/', [EmpleadoController::class, 'store']);
        Route::get('/{id}', [EmpleadoController::class, 'show']);
        Route::get('/{id}/editar', [EmpleadoController::class, 'edit']);
        Route::put('/{id}', [EmpleadoController::class, 'update']);
    });

    Route::prefix('flotilla-web')->group(function () {
        Route::get('/', [FlotillaController::class, 'index']);
        Route::get('/vehiculo/{id}', [FlotillaController::class, 'show']);
        Route::get('/bitacora', [FlotillaController::class, 'bitacora']);
    });
});

// ============================================================
// Kiosco — Autenticación pública (gafete + PIN)
// ============================================================
Route::prefix('kiosco')->group(function () {

    // Login público (rate limiting estricto: 5 intentos/minuto por IP)
    Route::post('login', [KioscoAuthController::class, 'login'])
        ->middleware('throttle:auth-login');

    Route::post('logout', [KioscoAuthController::class, 'logout']);

    // Operaciones protegidas por token kiosco
    Route::middleware(['kiosco.auth', 'throttle:api-general'])->group(function () {
        Route::get('perfil',               [KioscoAuthController::class, 'perfil']);
        Route::get('mis-prestamos',        [KioscoOperacionesController::class, 'misPrestamos']);
        Route::get('mi-vehiculo',          [KioscoOperacionesController::class, 'miVehiculo']);
        Route::get('sku/{codigo}',         [KioscoOperacionesController::class, 'buscarSku']);
        Route::post('salida-prestamo',     [KioscoOperacionesController::class, 'registrarSalidaPrestamo']);
        Route::post('devolucion',          [KioscoOperacionesController::class, 'registrarDevolucionPrestamo']);
        Route::post('resguardo',           [KioscoOperacionesController::class, 'registrarResguardoFirma']);
        Route::post('salida-vehiculo',     [KioscoOperacionesController::class, 'salidaVehiculo']);
        Route::post('regreso-vehiculo',    [KioscoOperacionesController::class, 'regresoVehiculo']);
    });
});

// ============================================================
// Adjuntos — Archivos reales (activos / facturas / garantías)
// Requiere autenticación Sanctum
// ============================================================
Route::middleware(['auth:sanctum', 'throttle:api-general'])->prefix('adjuntos')->group(function () {
    Route::post('/', [AdjuntoController::class, 'store']);
    Route::get('/{id}', [AdjuntoController::class, 'show']);
    Route::delete('/{id}', [AdjuntoController::class, 'destroy']);
    Route::get('/entidad/{tipo}/{id}', [AdjuntoController::class, 'porEntidad']);
});

// ============================================================
// Kiosco — Gestión de perfiles (Solo Admin con Sanctum)
// ============================================================
Route::middleware(['auth:sanctum', 'throttle:api-general', 'check.role:Admin,Almacen'])->group(function () {
    Route::get('kiosco-perfiles', function () {
        return response()->json(
            \DB::table('perfiles_kiosco as pk')
                ->join('empleados as e', 'pk.empleado_id', '=', 'e.id')
                ->leftJoin('usuarios_sistema as u', 'pk.creado_por_id', '=', 'u.id')
                ->select(
                    'pk.id', 'pk.estado', 'pk.permisos', 'pk.kioscos_autorizados',
                    'pk.ultimo_acceso', 'pk.intentos_fallidos',
                    'e.nombre_completo as empleado', 'e.numero_gafete',
                    'u.nombre_usuario as creado_por',
                    'pk.created_at', 'pk.updated_at'
                )
                ->whereNull('pk.deleted_at')
                ->orderBy('e.nombre_completo')
                ->get()
        );
    });

    Route::post('kiosco-perfiles', function (\Illuminate\Http\Request $request) {
        $validated = $request->validate([
            'empleado_id'          => 'required|integer|exists:empleados,id',
            'pin'                  => 'required|string|min:4|max:10',
            'estado'               => 'nullable|in:activo,suspendido',
            'kioscos_autorizados'  => 'nullable|array',
            'permisos'             => 'nullable|array',
        ]);

        // Verificar que no exista ya un perfil activo
        if (\DB::table('perfiles_kiosco')->where('empleado_id', $validated['empleado_id'])->whereNull('deleted_at')->exists()) {
            return response()->json(['mensaje' => 'Este empleado ya tiene un perfil de kiosco.'], 422);
        }

        $id = \DB::table('perfiles_kiosco')->insertGetId([
            'empleado_id'         => $validated['empleado_id'],
            'pin_hash'            => \Illuminate\Support\Facades\Hash::make($validated['pin']),
            'estado'              => $validated['estado'] ?? 'activo',
            'kioscos_autorizados' => json_encode($validated['kioscos_autorizados'] ?? []),
            'permisos'            => json_encode($validated['permisos'] ?? ['prestamo', 'devolucion', 'flotilla']),
            'creado_por_id'       => $request->user()?->id,
            'created_at'          => now(),
            'updated_at'          => now(),
        ]);

        return response()->json(['mensaje' => 'Perfil de kiosco creado.', 'id' => $id], 201);
    });

    Route::put('kiosco-perfiles/{id}/estado', function (\Illuminate\Http\Request $request, int $id) {
        $request->validate(['estado' => 'required|in:activo,suspendido,bloqueado']);
        \DB::table('perfiles_kiosco')->where('id', $id)->update([
            'estado'     => $request->estado,
            'updated_at' => now(),
        ]);
        return response()->json(['mensaje' => 'Estado actualizado.']);
    });

    Route::put('kiosco-perfiles/{id}/reset-pin', function (\Illuminate\Http\Request $request, int $id) {
        $request->validate(['pin' => 'required|string|min:4|max:10']);
        \DB::table('perfiles_kiosco')->where('id', $id)->update([
            'pin_hash'          => \Illuminate\Support\Facades\Hash::make($request->pin),
            'intentos_fallidos' => 0,
            'bloqueado_hasta'   => null,
            'updated_at'        => now(),
        ]);
        return response()->json(['mensaje' => 'PIN restablecido.']);
    });
});
