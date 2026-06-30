<?php

namespace App\Http\Controllers;

use App\Services\AuditoriaService;
use App\Services\BackupService;
use Illuminate\Http\JsonResponse;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class BackupController extends Controller
{
    public function __construct(
        private readonly BackupService $backups,
        private readonly AuditoriaService $auditoria
    ) {
    }

    public function store(): JsonResponse
    {
        $this->authorize('backup', \App\Models\ReportePolicySubject::class);

        $backup = $this->backups->generar();
        $this->auditoria->registrar('backups', $backup['file'], 'BACKUP_GENERATED', null, null, $backup);

        return response()->json($backup, 201);
    }

    public function download(string $file): BinaryFileResponse
    {
        $this->authorize('backup', \App\Models\ReportePolicySubject::class);
        $this->backups->assertSafeFile($file);

        $path = storage_path('app/backups/' . $file);
        $this->auditoria->registrar('backups', $file, 'BACKUP_DOWNLOADED');

        return response()->download($path, $file, ['Content-Type' => 'application/sql']);
    }

    public function upload(string $file): JsonResponse
    {
        $this->authorize('backup', \App\Models\ReportePolicySubject::class);

        $result = $this->backups->upload($file);
        $this->auditoria->registrar('backups', $file, 'BACKUP_UPLOADED', null, null, $result);

        return response()->json($result);
    }
}
