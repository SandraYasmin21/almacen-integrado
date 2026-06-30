<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ConfiguracionSistema extends Model
{
    protected $table = 'configuraciones_sistema';

    protected $guarded = [];

    public static function value(string $clave, mixed $default = null): mixed
    {
        $config = static::query()->where('clave', $clave)->first();

        if (! $config) {
            return $default;
        }

        return match ($config->tipo) {
            'json' => json_decode((string) $config->valor, true) ?? $default,
            'integer' => (int) $config->valor,
            'boolean' => filter_var($config->valor, FILTER_VALIDATE_BOOL),
            default => $config->valor ?? $default,
        };
    }

    public static function putValue(string $clave, mixed $valor, string $tipo = 'string', ?string $descripcion = null): self
    {
        return static::query()->updateOrCreate(
            ['clave' => $clave],
            [
                'valor' => $tipo === 'json' ? json_encode($valor) : (string) $valor,
                'tipo' => $tipo,
                'descripcion' => $descripcion,
            ]
        );
    }
}
