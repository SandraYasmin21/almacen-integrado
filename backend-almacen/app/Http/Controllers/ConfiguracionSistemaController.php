<?php

namespace App\Http\Controllers;

use App\Models\ConfiguracionSistema;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ConfiguracionSistemaController extends Controller
{
    public function index(): JsonResponse
    {
        $this->authorize('backup', \App\Models\ReportePolicySubject::class);

        return response()->json(ConfiguracionSistema::query()->orderBy('clave')->get());
    }

    public function update(Request $request): JsonResponse
    {
        $this->authorize('backup', \App\Models\ReportePolicySubject::class);

        $data = $request->validate([
            'configuraciones' => ['required', 'array'],
            'configuraciones.*.clave' => ['required', 'string', 'max:120'],
            'configuraciones.*.valor' => ['nullable'],
            'configuraciones.*.tipo' => ['nullable', 'in:string,integer,boolean,json'],
            'configuraciones.*.descripcion' => ['nullable', 'string', 'max:500'],
        ]);

        $updated = collect($data['configuraciones'])->map(function (array $item) {
            return ConfiguracionSistema::putValue(
                $item['clave'],
                $item['valor'] ?? '',
                $item['tipo'] ?? 'string',
                $item['descripcion'] ?? null
            );
        });

        return response()->json($updated->values());
    }
}
