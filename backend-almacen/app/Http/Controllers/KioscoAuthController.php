<?php

namespace App\Http\Controllers;

use App\Models\Empleado;
use App\Models\PerfilKiosco;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * KioscoAuthController — Autenticación real para el Kiosco
 *
 * POST /api/kiosco/login           → Login gafete + PIN (retorna token real)
 * POST /api/kiosco/logout          → Invalida token de kiosco
 * GET  /api/kiosco/perfil          → Datos del empleado autenticado en kiosco
 */
class KioscoAuthController extends Controller
{
    /**
     * POST /api/kiosco/login
     *
     * Body: { "numero_gafete": "GAF-001", "pin": "1234" }
     */
    public function login(Request $request): JsonResponse
    {
        $request->validate([
            'numero_gafete' => 'required|string|max:50',
            'pin'           => 'required|string|min:4|max:10',
        ]);

        // 1. Buscar empleado por gafete
        $empleado = Empleado::where('numero_gafete', trim($request->numero_gafete))
            ->where('activo', true)
            ->first();

        if (! $empleado) {
            return response()->json([
                'error' => 'Gafete no encontrado o empleado inactivo.',
            ], 404);
        }

        // 2. Buscar perfil de kiosco activo
        $perfil = PerfilKiosco::where('empleado_id', $empleado->id)
            ->whereNull('deleted_at')
            ->first();

        if (! $perfil) {
            return response()->json([
                'error' => 'No tienes un perfil de kiosco asignado. Contacta al administrador.',
            ], 403);
        }

        // 3. Verificar si está bloqueado
        if ($perfil->estaBloqueado()) {
            $desbloqueaEn = $perfil->bloqueado_hasta
                ? $perfil->bloqueado_hasta->diffForHumans()
                : 'contacta al administrador';

            return response()->json([
                'error' => "Perfil bloqueado. Se desbloqueará {$desbloqueaEn}.",
            ], 403);
        }

        if ($perfil->estado !== PerfilKiosco::ESTADO_ACTIVO) {
            return response()->json([
                'error' => 'Tu perfil de kiosco está suspendido.',
            ], 403);
        }

        // 4. Verificar PIN
        if (! Hash::check($request->pin, $perfil->pin_hash)) {
            $intentos = $perfil->intentos_fallidos + 1;
            $bloqueadoHasta = null;

            if ($intentos >= PerfilKiosco::MAX_INTENTOS) {
                $intentos = 0;
                $bloqueadoHasta = now()->addMinutes(PerfilKiosco::MINUTOS_BLOQUEO);
            }

            $perfil->update([
                'intentos_fallidos' => $intentos,
                'bloqueado_hasta'   => $bloqueadoHasta,
            ]);

            $restantes = PerfilKiosco::MAX_INTENTOS - $intentos;

            return response()->json([
                'error' => $bloqueadoHasta
                    ? 'PIN incorrecto. Perfil bloqueado por ' . PerfilKiosco::MINUTOS_BLOQUEO . ' minutos.'
                    : "PIN incorrecto. Te quedan {$restantes} intentos.",
            ], 401);
        }

        // 5. Resetear intentos fallidos y guardar último acceso
        $perfil->update([
            'intentos_fallidos' => 0,
            'bloqueado_hasta'   => null,
            'ultimo_acceso'     => now(),
        ]);

        // 6. Generar token real en kiosco_tokens (TTL: 8 horas de turno)
        $tokenPlain = Str::random(80);
        $tokenHash  = hash('sha256', $tokenPlain);
        $expiresAt  = now()->addHours(8);

        // Revocar tokens anteriores del mismo empleado
        DB::table('kiosco_tokens')
            ->where('empleado_id', $empleado->id)
            ->where('expires_at', '<', now())
            ->delete();

        DB::table('kiosco_tokens')->insert([
            'perfil_kiosco_id' => $perfil->id,
            'empleado_id'      => $empleado->id,
            'token_hash'       => $tokenHash,
            'nombre'           => 'kiosco-session',
            'abilities'        => json_encode($perfil->permisos ?? ['prestamo', 'devolucion', 'flotilla']),
            'expires_at'       => $expiresAt,
            'created_at'       => now(),
            'updated_at'       => now(),
        ]);

        return response()->json([
            'token'             => $tokenPlain,
            'token_tipo'        => 'kiosco',
            'expira_en'         => $expiresAt->toIso8601String(),
            'kioscos_autorizados' => $perfil->kioscos_autorizados ?? [],
            'permisos'          => $perfil->permisos ?? ['prestamo', 'devolucion', 'flotilla'],
            'empleado' => [
                'id'                => $empleado->id,
                'nombre_completo'   => $empleado->nombre_completo,
                'numero_gafete'     => $empleado->numero_gafete,
                'departamento_area' => $empleado->departamento_area,
                'foto_perfil'       => $empleado->foto_perfil,
            ],
        ]);
    }

    /**
     * POST /api/kiosco/logout
     * Header: Authorization: Bearer <token>
     */
    public function logout(Request $request): JsonResponse
    {
        $tokenPlain = $request->bearerToken();

        if ($tokenPlain) {
            $tokenHash = hash('sha256', $tokenPlain);
            DB::table('kiosco_tokens')->where('token_hash', $tokenHash)->delete();
        }

        return response()->json(['mensaje' => 'Sesión de kiosco cerrada.']);
    }

    /**
     * GET /api/kiosco/perfil
     * Requiere token kiosco válido (middleware KioscoAuth)
     */
    public function perfil(Request $request): JsonResponse
    {
        // El middleware KioscoAuth inyecta el empleado en el request
        $empleado = $request->attributes->get('kiosco_empleado');
        $perfil   = $request->attributes->get('kiosco_perfil');
        $permisos = is_string($perfil->permisos ?? null)
            ? json_decode($perfil->permisos, true)
            : ($perfil->permisos ?? []);

        return response()->json([
            'empleado' => $empleado,
            'permisos' => $permisos ?: [],
        ]);
    }
}
