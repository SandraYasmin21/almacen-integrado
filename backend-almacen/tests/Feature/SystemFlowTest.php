<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Tests\TestCase;
use App\Models\Usuario;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;

class SystemFlowTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
    }

    public function test_login_correcto_e_inactivo()
    {
        $user = Usuario::create([
            'nombre_usuario' => 'admin_test',
            'email' => 'test@test.com',
            'password_hash' => Hash::make('password123'),
            'rol_acceso' => 'ADMINISTRADOR',
            'password_cambiado' => true,
            'activo' => true
        ]);

        $response = $this->postJson('/api/auth/login', [
            'username' => 'admin_test',
            'password' => 'password123'
        ]);

        $response->assertStatus(200)
                 ->assertJsonStructure(['access_token']);

        // Inactivo
        $user->update(['activo' => false]);
        $response = $this->postJson('/api/auth/login', [
            'username' => 'admin_test',
            'password' => 'password123'
        ]);

        $response->assertStatus(401);
    }
}
