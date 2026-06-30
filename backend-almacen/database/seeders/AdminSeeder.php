<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class AdminSeeder extends Seeder
{
    public function run(): void
    {
        $payload = [
            'nombre_usuario'    => 'admin',
            'email' => 'admin@smartlynk.com',
            'password_hash'     => Hash::make('admin123'), // Usamos password_hash en lugar de password
            'rol_acceso'        => 'Admin',
            'password_cambiado' => true, // Para que no pida cambiarla
            'activo'            => true,
            'updated_at'        => now(),
        ];

        $usuario = DB::table('usuarios_sistema')
            ->where('email', $payload['email'])
            ->first();

        if ($usuario) {
            DB::table('usuarios_sistema')
                ->where('id', $usuario->id)
                ->update($payload);

            return;
        }

        DB::table('usuarios_sistema')->insert([
            ...$payload,
            'created_at' => now(),
        ]);
    }
}
