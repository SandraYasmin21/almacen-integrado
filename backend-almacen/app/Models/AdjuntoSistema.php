<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Storage;

class AdjuntoSistema extends Model
{
    use SoftDeletes;

    protected $table = 'adjuntos_sistema';

    protected $fillable = [
        'entidad_tipo',
        'entidad_id',
        'nombre_original',
        'nombre_almacenado',
        'disco',
        'ruta',
        'mime_type',
        'tamano_bytes',
        'categoria',
        'descripcion',
        'subido_por_id',
    ];

    protected $casts = [
        'tamano_bytes' => 'integer',
        'deleted_at'   => 'datetime',
    ];

    // ─── Categorías válidas ───────────────────────────────────────

    const CATEGORIA_FACTURA   = 'factura';
    const CATEGORIA_GARANTIA  = 'garantia';
    const CATEGORIA_MANUAL    = 'manual';
    const CATEGORIA_EVIDENCIA = 'evidencia';
    const CATEGORIA_FOTO      = 'foto';
    const CATEGORIA_CONTRATO  = 'contrato';
    const CATEGORIA_OTRO      = 'otro';

    const CATEGORIAS_VALIDAS = [
        self::CATEGORIA_FACTURA,
        self::CATEGORIA_GARANTIA,
        self::CATEGORIA_MANUAL,
        self::CATEGORIA_EVIDENCIA,
        self::CATEGORIA_FOTO,
        self::CATEGORIA_CONTRATO,
        self::CATEGORIA_OTRO,
    ];

    // ─── Relaciones ───────────────────────────────────────────────

    public function subidoPor(): BelongsTo
    {
        return $this->belongsTo(Usuario::class, 'subido_por_id');
    }

    // ─── Appended attributes ──────────────────────────────────────

    protected $appends = ['url_publica', 'tamano_legible'];

    public function getUrlPublicaAttribute(): ?string
    {
        if (! $this->ruta) {
            return null;
        }

        return Storage::disk($this->disco)->url($this->ruta);
    }

    public function getTamanoLegibleAttribute(): string
    {
        $bytes = $this->tamano_bytes ?? 0;

        if ($bytes >= 1_048_576) {
            return round($bytes / 1_048_576, 2) . ' MB';
        }

        if ($bytes >= 1024) {
            return round($bytes / 1024, 1) . ' KB';
        }

        return $bytes . ' B';
    }

    // ─── Helpers ─────────────────────────────────────────────────

    public function eliminarArchivo(): bool
    {
        if ($this->ruta && Storage::disk($this->disco)->exists($this->ruta)) {
            return Storage::disk($this->disco)->delete($this->ruta);
        }

        return true;
    }
}
