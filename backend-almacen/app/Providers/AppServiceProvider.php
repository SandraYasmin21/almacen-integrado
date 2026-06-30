<?php

namespace App\Providers;

use App\Models\CatalogoArticulo;
use App\Models\CatalogoConfigurable;
use App\Models\Empleado;
use App\Models\InventarioSerie;
use App\Models\MovimientoInventario;
use App\Models\ProyectoPresupuesto;
use App\Models\ProyectoRecurso;
use App\Models\StockGeneral;
use App\Models\Ubicacion;
use App\Models\Usuario;
use App\Models\VehiculoFlotilla;
use App\Observers\AuditableObserver;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        CatalogoArticulo::observe(AuditableObserver::class);
        CatalogoConfigurable::observe(AuditableObserver::class);
        InventarioSerie::observe(AuditableObserver::class);
        MovimientoInventario::observe(AuditableObserver::class);
        ProyectoPresupuesto::observe(AuditableObserver::class);
        ProyectoRecurso::observe(AuditableObserver::class);
        StockGeneral::observe(AuditableObserver::class);
        Ubicacion::observe(AuditableObserver::class);
        Usuario::observe(AuditableObserver::class);
        VehiculoFlotilla::observe(AuditableObserver::class);

        Empleado::creating(function ($empleado) {
            if (empty($empleado->numero_gafete)) {
                $empleado->numero_gafete = 'EMP-' . date('Y') . '-' . strtoupper(substr(uniqid(), -6));
            }
        });
    }
}
