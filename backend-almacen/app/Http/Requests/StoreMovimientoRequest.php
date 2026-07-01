<?php

namespace App\Http\Requests;

use App\Models\MovimientoInventario;
use App\Models\Usuario;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreMovimientoRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->hasRole(Usuario::ROL_ADMIN, Usuario::ROL_ALMACEN, Usuario::ROL_PROYECTO) ?? false;
    }

    public function rules(): array
    {
        return [
            'tipo' => ['required', Rule::in(MovimientoInventario::TIPOS_FORMALES)],
            'serie_id' => ['nullable', 'required_without:items', 'exists:inventario_series,id'],
            'items' => ['nullable', 'array', 'min:1'],
            'items.*.serie_id' => ['nullable', 'exists:inventario_series,id'],
            'items.*.articulo_id' => ['nullable', 'exists:catalogo_articulos,id'],
            'items.*.cantidad' => ['nullable', 'numeric', 'min:0.01'],
            'empleado_id' => ['nullable', 'exists:empleados,id'],
            'empleado_destino_id' => ['nullable', 'exists:empleados,id'],
            'ubicacion_id' => ['nullable', 'exists:ubicaciones,id'],
            'ubicacion_destino_id' => ['nullable', 'exists:ubicaciones,id'],
            'motivo' => ['nullable', 'string', 'max:1000'],
            'estado_destino' => ['nullable', 'required_if:tipo,CAMBIO_ESTADO', 'string', 'max:50'],
            'notas' => ['nullable', 'string', 'max:2000'],
        ];
    }
}
