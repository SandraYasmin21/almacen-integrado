<?php

namespace App\Http\Requests;

use App\Models\Usuario;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreProyectoRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->hasRole(Usuario::ROL_ADMIN, Usuario::ROL_ALMACEN, Usuario::ROL_PROYECTO) ?? false;
    }

    public function rules(): array
    {
        return [
            'nombre' => ['required', 'string', 'max:180'],
            'cliente_nombre' => ['required', 'string', 'max:180'],
            'responsable_id' => ['required', 'exists:empleados,id'],
            'fecha_inicio' => ['nullable', 'date'],
            'fecha_cierre_estimada' => ['nullable', 'date', 'after_or_equal:fecha_inicio'],
            'estatus' => ['required', Rule::in(['PLANEADO', 'ACTIVO', 'PAUSADO', 'CERRADO', 'CANCELADO'])],
            'observaciones' => ['nullable', 'string', 'max:2000'],
        ];
    }
}
