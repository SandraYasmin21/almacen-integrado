<?php

namespace App\Http\Controllers;

use App\Models\Usuario;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class UsuarioController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Usuario::class);

        $usuarios = Usuario::query()
            ->when($request->filled('buscar'), function ($query) use ($request) {
                $term = '%' . $request->string('buscar')->toString() . '%';
                $query->where(function ($inner) use ($term) {
                    $inner->where('nombre_usuario', 'ilike', $term)
                        ->orWhere('email', 'ilike', $term);
                });
            })
            ->orderBy('nombre_usuario')
            ->paginate($request->integer('per_page', 25));

        return response()->json($usuarios);
    }

    public function store(Request $request): JsonResponse
    {
        $this->authorize('create', Usuario::class);

        $data = $request->validate([
            'nombre_usuario' => ['required', 'string', 'max:50', 'unique:usuarios_sistema,nombre_usuario'],
            'email' => ['required', 'email', 'max:100', 'unique:usuarios_sistema,email'],
            'rol_acceso' => ['required', Rule::in(Usuario::ROLES)],
            'activo' => ['nullable', 'boolean'],
        ]);

        $temporal = Str::password(12);

        $usuario = Usuario::create([
            ...$data,
            'password_hash' => Hash::make($temporal),
            'password_cambiado' => false,
            'generado_por_id' => $request->user()->id,
            'activo' => $data['activo'] ?? true,
        ]);

        return response()->json([
            'usuario' => $usuario,
            'password_temporal' => $temporal,
        ], 201);
    }

    public function update(Request $request, Usuario $usuario): JsonResponse
    {
        $this->authorize('update', $usuario);

        $data = $request->validate([
            'nombre_usuario' => ['sometimes', 'required', 'string', 'max:50', Rule::unique('usuarios_sistema', 'nombre_usuario')->ignore($usuario->id)],
            'email' => ['sometimes', 'required', 'email', 'max:100', Rule::unique('usuarios_sistema', 'email')->ignore($usuario->id)],
            'rol_acceso' => ['sometimes', 'required', Rule::in(Usuario::ROLES)],
            'activo' => ['sometimes', 'boolean'],
        ]);

        $usuario->update($data);

        return response()->json($usuario->fresh());
    }

    public function activar(Request $request, Usuario $usuario): JsonResponse
    {
        $this->authorize('update', $usuario);

        $data = $request->validate([
            'activo' => ['required', 'boolean'],
        ]);

        $usuario->update(['activo' => $data['activo']]);

        return response()->json($usuario->fresh());
    }

    public function resetPassword(Usuario $usuario): JsonResponse
    {
        $this->authorize('update', $usuario);

        $temporal = Str::password(12);
        $usuario->update([
            'password_hash' => Hash::make($temporal),
            'password_cambiado' => false,
        ]);

        return response()->json([
            'usuario_id' => $usuario->id,
            'password_temporal' => $temporal,
        ]);
    }
}
