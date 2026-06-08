<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Cache\RateLimiting\Limit;
use App\Http\Controllers\AlmacenController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\BitacoraViajeController;
use App\Http\Controllers\CategoriaController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\EmpleadoController;
use App\Http\Controllers\FlotillaDashboardController;
use App\Http\Controllers\FlotillaKilometrajeController;
use App\Http\Controllers\GastoExtraVehiculoController;
use App\Http\Controllers\RegistroVehicularController;
use App\Http\Controllers\VehiculoFlotillaController;

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

    Route::get('almacen/articulos', [AlmacenController::class, 'inventarioApi']);
    Route::get('almacen/categorias', fn () => DB::table('categorias')->where('activo', true)->orderBy('nombre')->get());
    Route::get('almacen/ubicaciones', fn () => DB::table('stock_general')
        ->select('ubicacion', DB::raw('COUNT(*) as total_articulos'), DB::raw('SUM(cantidad) as total_unidades'))
        ->whereNotNull('ubicacion')
        ->groupBy('ubicacion')
        ->orderBy('ubicacion')
        ->get());
    Route::post('almacen/entrada', [AlmacenController::class, 'registrarEntrada']);
    Route::get('almacen/sku/{codigo}', [AlmacenController::class, 'buscarSku']);
    Route::post('almacen/salida', [AlmacenController::class, 'registrarSalida']);
    Route::post('almacen/prestamo', [AlmacenController::class, 'registrarPrestamo']);
    Route::post('almacen/devolucion', [AlmacenController::class, 'registrarDevolucion']);
    Route::post('almacen/movimiento', [AlmacenController::class, 'registrarMovimiento']);
    Route::get('almacen/movimientos', [AlmacenController::class, 'movimientosApi']);
    Route::get('almacen/movimientos/{id}', [AlmacenController::class, 'movimientoDetalle']);
    Route::put('almacen/movimientos/{id}', [AlmacenController::class, 'actualizarMovimiento']);
    Route::delete('almacen/movimientos/{id}', [AlmacenController::class, 'eliminarMovimiento']);

    Route::get('proveedores', fn () => DB::table('proveedores')->where('activo', true)->orderBy('nombre_empresa')->get());
    Route::get('empleados/estados', [EmpleadoController::class, 'estadosApi']);
    Route::get('empleados', [EmpleadoController::class, 'apiIndex']);
    Route::apiResource('categorias', CategoriaController::class);
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
