<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * Modelo local que extiende UsuarioSistema del paquete compartido.
 *
 * ¿Por qué un modelo local y no usar el del paquete directamente?
 * Porque Sanctum requiere que el modelo autenticable extienda Authenticatable
 * e implemente HasApiTokens. El modelo del paquete extiende solo Model,
 * lo que haría fallar $usuario->createToken() en runtime.
 *
 * Este modelo apunta a la misma tabla 'usuarios_sistema' y hereda
 * todos los campos, pero además añade las capacidades de autenticación.
 */
class Usuario extends Authenticatable
{
    use HasApiTokens, Notifiable, SoftDeletes;

    // Misma tabla que el modelo del paquete
    protected $table = 'usuarios_sistema';

    // Sanctum usa el campo 'password' por defecto para hash.
    // Nuestro campo se llama 'password_hash', lo redefinimos:
    protected $authPasswordName = 'password_hash';

    protected $fillable = [
        'nombre_usuario',
        'email',
        'password_hash',
        'password_cambiado',
        'rol_acceso',
        'activo',
    ];

    protected $hidden = [
        'password_hash',
    ];

    protected $casts = [
        'activo'            => 'boolean',
        'password_cambiado' => 'boolean',
        'ultimo_acceso'     => 'datetime',
        'deleted_at'        => 'datetime',
    ];

    // Constantes de roles (coherentes con el paquete)
    const ROL_ADMIN    = 'Admin';
    const ROL_ALMACEN  = 'Almacen';
    const ROL_VENDEDOR = 'Vendedor';

    /**
     * Sobrescribe el nombre del campo de password para que
     * Laravel Auth y Hash::check lo encuentren correctamente.
     */
    public function getAuthPassword(): string
    {
        return $this->password_hash;
    }
}
