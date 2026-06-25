<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Carbon\Carbon;

class KioscoAuthController extends Controller
{
    /**
     * Autenticación para el Kiosco (Gafete + PIN numérico)
     */
    public function login(Request $request)
    {
        $request->validate([
            'numero_gafete' => 'required|string',
            'pin'           => 'required|string',
        ]);

        // 1. Buscar empleado por gafete
        $empleado = DB::table('empleados')->where('numero_gafete', $request->numero_gafete)->first();

        if (!$empleado) {
            return response()->json(['error' => 'Gafete no encontrado'], 404);
        }

        // 2. Buscar perfil de kiosco activo
        $perfil = DB::table('perfiles_kiosco')
            ->where('empleado_id', $empleado->id)
            ->first();

        if (!$perfil) {
            return response()->json(['error' => 'No tienes un perfil de kiosco asignado. Contacta al administrador.'], 403);
        }

        if ($perfil->estado !== 'activo') {
            return response()->json(['error' => 'Tu perfil de kiosco está suspendido.'], 403);
        }

        // 3. Verificar PIN
        if (!Hash::check($request->pin, $perfil->pin)) {
            return response()->json(['error' => 'PIN incorrecto'], 401);
        }

        // 4. Actualizar último acceso
        DB::table('perfiles_kiosco')
            ->where('id', $perfil->id)
            ->update(['ultimo_acceso' => Carbon::now()]);

        // 5. Generar token de sesión (usamos Sanctum si el modelo de usuario lo permite, 
        // pero como es empleado, podemos emitir un token especial o hacer login manual con guard)
        // Ya que la BD principal de autenticación es 'usuarios_sistema', 
        // para Kiosco generaremos un token manual que devolveremos al front o usaremos la sesión.
        
        // Simulación de JWT/Sanctum simple para el kiosco (por ahora usaremos un token string básico o lo guardamos en cache/BD)
        $kioscoToken = bin2hex(random_bytes(32));
        
        // Aquí podríamos guardar el token en una tabla `kiosco_tokens` o similar
        // Para acelerar, devolveremos el perfil al frontend que lo guardará localmente (auto-logout en X minutos)
        // NOTA: Para producción real, se recomienda una tabla `personal_access_tokens` vinculada al empleado.

        return response()->json([
            'token' => $kioscoToken, // Token simulado
            'empleado' => [
                'id' => $empleado->id,
                'nombre_completo' => $empleado->nombre_completo,
                'numero_gafete' => $empleado->numero_gafete,
                'departamento_area' => $empleado->departamento_area,
            ],
            'kioscos_autorizados' => json_decode($perfil->kioscos_autorizados)
        ]);
    }
}
