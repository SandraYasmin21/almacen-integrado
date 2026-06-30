<?php

namespace App\Http\Requests;

class UpdateArticuloRequest extends StoreArticuloRequest
{
    public function rules(): array
    {
        $rules = parent::rules();
        $rules['nombre'][0] = 'sometimes';
        $rules['tipo_control'][0] = 'sometimes';
        return $rules;
    }
}
