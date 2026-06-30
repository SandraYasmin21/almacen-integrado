<?php

namespace App\Http\Middleware;

use Carbon\Carbon;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\Response;

/**
 * KioscoAuth — Middleware para rutas protegidas del Kiosco
 *
 * Valida el token generado por KioscoAuthController::login()
 * e inyecta el empleado y perfil en el request.
 *
 * Uso en routes/api.php:
 *   Route::middleware('kiosco.auth')->group(...)
 */
class KioscoAuth
{
    public function handle(Request $request, Closure $next): Response
    {
        $tokenPlain = $request->bearerToken();

        if (! $tokenPlain) {
            return response()->json(['error' => 'Token de kiosco requerido.'], 401);
        }

        $tokenHash = hash('sha256', $tokenPlain);

        $tokenRow = DB::table('kiosco_tokens')
            ->where('token_hash', $tokenHash)
            ->first();

        if (! $tokenRow) {
            return response()->json(['error' => 'Token de kiosco inválido.'], 401);
        }

        // Verificar expiración
        if ($tokenRow->expires_at && Carbon::parse($tokenRow->expires_at)->isPast()) {
            DB::table('kiosco_tokens')->where('id', $tokenRow->id)->delete();
            return response()->json(['error' => 'Sesión de kiosco expirada. Inicia sesión nuevamente.'], 401);
        }

        // Actualizar last_used_at
        DB::table('kiosco_tokens')
            ->where('id', $tokenRow->id)
            ->update(['last_used_at' => now()]);

        // Cargar empleado y perfil
        $empleado = DB::table('empleados')->where('id', $tokenRow->empleado_id)->first();
        $perfil   = DB::table('perfiles_kiosco')->where('id', $tokenRow->perfil_kiosco_id)->first();

        if (! $empleado || ! $perfil || $perfil->estado !== 'activo') {
            return response()->json(['error' => 'Sesión inválida o perfil suspendido.'], 403);
        }

        // Inyectar en el request
        $request->attributes->set('kiosco_empleado', $empleado);
        $request->attributes->set('kiosco_perfil', $perfil);
        $request->attributes->set('kiosco_token_row', $tokenRow);

        return $next($request);
    }
}
