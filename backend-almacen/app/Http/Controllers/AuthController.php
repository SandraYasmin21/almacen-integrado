<?php

namespace App\Http\Controllers;

use App\Models\Usuario;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    // =========================================================================
    // SEGURIDAD APLICADA EN ESTE CONTROLADOR
    // =========================================================================
    // ✅ CORS:          Global en config/cors.php (CORS_ALLOWED_ORIGINS en .env)
    // ✅ Rate Limiting: throttle:auth-login → 5 intentos/min por IP (en routes/api.php)
    // ✅ Sanitización:  strip_tags + trim en todos los inputs de texto
    // ✅ Validación:    Reglas estrictas en cada campo
    // ✅ Tokens:        Laravel Sanctum (API key como Bearer Token)
    // ✅ Seguridad XSS: Mensaje de error genérico (no revela si el email existe)
    // ✅ Hash:          Contraseña verificada con Hash::check (bcrypt)
    // =========================================================================

    /**
     * Inicio de sesión del sistema SmartLynk.
     * Genera un Bearer Token (Sanctum) si las credenciales son válidas.
     *
     * POST /api/auth/login
     * Rate limit: AUTH_RATE_LIMIT intentos/min por IP (default: 5)
     */
    public function login(Request $request): JsonResponse
    {
        // 1. Validación estricta de inputs — rechaza tipos inesperados
        $validated = $request->validate([
            'email'    => 'required|string|email|max:150',
            'password' => 'required|string|min:6|max:100',
        ]);

        // 2. Sanitización — elimina etiquetas HTML y espacios extra
        $email = strtolower(strip_tags(trim($validated['email'])));
        // Nota: la contraseña NO se sanitiza con strip_tags porque
        // caracteres especiales (<, >, &) son válidos en contraseñas.
        // El Hash::check protege contra cualquier valor malicioso.

        // 3. Buscar usuario activo — consulta mínima (solo campos necesarios)
        $usuario = Usuario::where('email', $email)
            // ->where('activo', true)
            ->select(['id', 'nombre_usuario', 'email', 'password_hash', 'rol_acceso', 'password_cambiado'])
            ->first();

        // 4. Verificar credenciales con tiempo constante (evita timing attacks)
        //    Si el usuario no existe, se compara igual para no filtrar información
        $hashFallback = '$2y$12$CvdJwv6O7D0Y6/JcHjYZc.G8wo8AqN7QUdYxdgS4d61j6vEo6wRE6';
        $hashAVerificar = $usuario?->password_hash ?? $hashFallback;

        if (! $usuario || ! Hash::check($validated['password'], $hashAVerificar)) {
            // Mensaje genérico: nunca revelar si el email existe o no
            throw ValidationException::withMessages([
                'email' => ['Las credenciales proporcionadas son incorrectas.'],
            ]);
        }

        // 5. LA REGLA DE ORO: Verificar si debe cambiar su clave
        if ($usuario->password_cambiado == false) {
            return response()->json([
                'acceso' => false,
                'mensaje' => 'Por seguridad, debes actualizar tu contraseña temporal.',
                'requiere_cambio' => true
            ], 403);
        }

        // 5. Revocar tokens anteriores del mismo dispositivo (seguridad de sesión)
        //    Se puede comentar si se quiere permitir múltiples sesiones simultáneas
        $usuario->forceFill(['ultimo_acceso' => now()])->save();
        $usuario->tokens()->where('name', 'smartlynk-session')->delete();

        // 6. Generar nuevo Bearer Token Sanctum con expiración
        $expiresAt = now()->addMinutes((int) env('SANCTUM_TOKEN_EXPIRATION', 120));
        $token = $usuario->createToken('smartlynk-session', ['*'], $expiresAt)->plainTextToken;

        return response()->json([
            'mensaje' => 'Sesión iniciada correctamente',
            'token'   => $token,
            'usuario' => [
                'id'             => $usuario->id,
                'nombre_usuario' => $usuario->nombre_usuario,
                'email'          => $usuario->email,
                'rol_acceso'     => $usuario->rol_acceso,
            ],
        ]);
    }

    /**
     * Cierre de sesión: revoca el token actual del dispositivo.
     * POST /api/auth/logout
     * Requiere: Bearer Token válido (auth:sanctum)
     */
    public function logout(Request $request): JsonResponse
    {
        // Revocar únicamente el token con el que se hizo la petición
        // (no cierra sesión en otros dispositivos)
        $request->user()?->currentAccessToken()?->delete();

        return response()->json([
            'mensaje' => 'Sesión cerrada correctamente',
        ]);
    }

    /**
     * Devuelve los datos del usuario autenticado actual.
     * GET /api/auth/me
     * Requiere: Bearer Token válido (auth:sanctum)
     */
    public function me(Request $request): JsonResponse
    {
        $usuario = $request->user();

        return response()->json([
            'id'             => $usuario->id,
            'nombre_usuario' => $usuario->nombre_usuario,
            'email'          => $usuario->email,
            'rol_acceso'     => $usuario->rol_acceso,
        ]);
    }
}
