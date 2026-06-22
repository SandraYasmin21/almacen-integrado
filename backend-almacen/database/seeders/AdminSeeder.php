<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use App\Models\Usuario; // Importamos el modelo correcto (Usuario en lugar de User)

class AdminSeeder extends Seeder
{
    public function run(): void
    {
        Usuario::updateOrCreate([
            'email' => 'admin@smartlynk.com',
        ], [
            'nombre_usuario'    => 'admin',
            'password_hash'     => Hash::make('admin123'), // Usamos password_hash en lugar de password
            'rol_acceso'        => 'Admin',
            'password_cambiado' => true, // Para que no pida cambiarla
            //'activo'            => true,
        ]);
    }
}
