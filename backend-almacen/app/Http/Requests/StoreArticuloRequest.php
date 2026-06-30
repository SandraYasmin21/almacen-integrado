<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreArticuloRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('create', \App\Models\CatalogoArticulo::class) ?? false;
    }

    public function rules(): array
    {
        $tipo = strtoupper((string) $this->input('tipo_control', 'HERRAMIENTA'));

        return [
            'nombre' => ['required', 'string', 'max:150'],
            'marca' => ['nullable', 'string', 'max:150'],
            'modelo' => ['nullable', 'string', 'max:150'],
            'subcategoria_id' => ['nullable', 'integer', 'exists:subcategorias,id'],
            'unidad_medida' => [Rule::requiredIf($tipo === 'MATERIAL'), 'nullable', 'string', 'max:20'],
            'cantidad' => [Rule::requiredIf($tipo === 'MATERIAL'), 'nullable', 'numeric', 'min:0'],
            'stock_minimo' => ['nullable', 'numeric', 'min:0'],
            'requiere_serie' => [Rule::requiredIf($tipo === 'ACTIVO'), 'boolean'],
            'es_consumible' => ['nullable', 'boolean'],
            'tipo_control' => ['required', Rule::in(['ACTIVO', 'MATERIAL', 'VEHICULO', 'HERRAMIENTA'])],
            'tipo_articulo' => ['nullable', 'in:venta,herramienta,mixto'],
        ];
    }

    protected function prepareForValidation(): void
    {
        $tipo = strtoupper((string) $this->input('tipo_control', $this->boolean('es_consumible') ? 'MATERIAL' : 'HERRAMIENTA'));
        $this->merge([
            'tipo_control' => $tipo,
            'requiere_serie' => $tipo === 'ACTIVO' ? true : $this->boolean('requiere_serie'),
        ]);
    }
}
