<?php

namespace App\Observers;

use App\Services\AuditoriaService;
use Illuminate\Database\Eloquent\Model;

class AuditableObserver
{
    public function __construct(private readonly AuditoriaService $auditoria)
    {
    }

    public function created(Model $model): void
    {
        $this->auditoria->registrarModelo($model, 'CREATE', null, $model->getAttributes());
    }

    public function updated(Model $model): void
    {
        foreach ($model->getChanges() as $campo => $nuevo) {
            if ($campo === 'updated_at') {
                continue;
            }

            $accion = $campo === 'deleted_at'
                ? ($nuevo ? 'SOFT_DELETE' : 'RESTORE')
                : 'UPDATE';

            $this->auditoria->registrar(
                $model->getTable(),
                $model->getKey(),
                $accion,
                $campo,
                $model->getOriginal($campo),
                $nuevo
            );
        }
    }

    public function deleted(Model $model): void
    {
        if (method_exists($model, 'isForceDeleting') && ! $model->isForceDeleting()) {
            $this->auditoria->registrar(
                $model->getTable(),
                $model->getKey(),
                'SOFT_DELETE',
                'deleted_at',
                $model->getOriginal('deleted_at'),
                $model->deleted_at
            );

            return;
        }

        $this->auditoria->registrarModelo($model, 'DELETE', $model->getOriginal(), null);
    }

    public function restored(Model $model): void
    {
        $this->auditoria->registrar(
            $model->getTable(),
            $model->getKey(),
            'RESTORE',
            'deleted_at',
            $model->getOriginal('deleted_at'),
            null
        );
    }

    public function forceDeleted(Model $model): void
    {
        $this->auditoria->registrarModelo($model, 'FORCE_DELETE', $model->getOriginal(), null);
    }
}
