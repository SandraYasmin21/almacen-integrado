<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use App\Models\Empleado;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Generamos el número de gafete automáticamente al crear un Empleado
        Empleado::creating(function ($empleado) {
            if (empty($empleado->numero_gafete)) {
                // Puedes cambiar el formato aquí. Ej: EMP-2026-64A1B2
                $empleado->numero_gafete = 'EMP-' . date('Y') . '-' . strtoupper(substr(uniqid(), -6));
            }
        });
    }
}
