<?php

namespace App\Services;

use App\Models\ConfiguracionSistema;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Storage;
use RuntimeException;
use Symfony\Component\Process\Process;

class BackupService
{
    public function generar(): array
    {
        $relativeDirectory = 'backups';
        $fileName = 'backup_' . now()->format('Ymd_His') . '.sql';
        $absolutePath = storage_path('app/' . $relativeDirectory . '/' . $fileName);

        $connection = Config::get('database.default');
        $database = Config::get("database.connections.$connection.database");
        $host = Config::get("database.connections.$connection.host", '127.0.0.1');
        $port = (string) Config::get("database.connections.$connection.port", 5432);
        $username = Config::get("database.connections.$connection.username");
        $password = Config::get("database.connections.$connection.password");
        $pgDump = ConfiguracionSistema::value('backup.pg_dump_path', env('PG_DUMP_PATH', 'pg_dump'));

        File::ensureDirectoryExists(dirname($absolutePath));

        $process = new Process([
            $pgDump,
            '--host=' . $host,
            '--port=' . $port,
            '--username=' . $username,
            '--format=plain',
            '--no-owner',
            '--no-privileges',
            '--file=' . $absolutePath,
            $database,
        ]);
        $process->setTimeout(300);
        $process->setEnv(['PGPASSWORD' => (string) $password]);
        $process->run();

        if (! $process->isSuccessful()) {
            throw new RuntimeException('No se pudo generar el backup: ' . $process->getErrorOutput());
        }

        return [
            'file' => $fileName,
            'path' => $absolutePath,
            'size' => File::size($absolutePath),
        ];
    }

    public function upload(string $fileName): array
    {
        $this->assertSafeFile($fileName);

        $source = storage_path('app/backups/' . $fileName);
        if (! File::exists($source)) {
            throw new RuntimeException('El backup solicitado no existe.');
        }

        $diskName = ConfiguracionSistema::value('backup.external_disk', env('BACKUP_EXTERNAL_DISK'));
        if (! $diskName) {
            throw new RuntimeException('No hay disco externo configurado para backups.');
        }

        $target = 'backups/' . $fileName;
        Storage::disk($diskName)->put($target, File::get($source));

        return [
            'disk' => $diskName,
            'path' => $target,
        ];
    }

    public function assertSafeFile(string $fileName): void
    {
        if (! preg_match('/^backup_\d{8}_\d{6}\.sql$/', $fileName)) {
            throw new RuntimeException('Nombre de backup invalido.');
        }
    }
}
