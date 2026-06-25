<?php

namespace smartlynk\Core;

use Illuminate\Support\ServiceProvider;

class SharedServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        // Servicio compartido local para el paquete.
    }

    public function boot(): void
    {
        // No se requiere bootstrap adicional para la copia local.
    }
}