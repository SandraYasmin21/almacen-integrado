<?php

namespace App\Console\Commands;

use App\Services\AuditoriaService;
use App\Services\BackupService;
use Illuminate\Console\Command;

class BackupDatabase extends Command
{
    protected $signature = 'db:backup {--upload : Envia el backup al disco externo configurado}';

    protected $description = 'Genera un respaldo SQL de PostgreSQL usando pg_dump.';

    public function handle(BackupService $backups, AuditoriaService $auditoria): int
    {
        $backup = $backups->generar();
        $auditoria->registrar('backups', $backup['file'], 'BACKUP_GENERATED', null, null, $backup);

        $this->info('Backup generado: ' . $backup['path']);

        if ($this->option('upload')) {
            $upload = $backups->upload($backup['file']);
            $auditoria->registrar('backups', $backup['file'], 'BACKUP_UPLOADED', null, null, $upload);
            $this->info('Backup enviado a ' . $upload['disk'] . ':' . $upload['path']);
        }

        return self::SUCCESS;
    }
}
