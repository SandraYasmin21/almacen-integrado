<?php

namespace App\Http\Controllers;

use App\Models\AdjuntoSistema;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

/**
 * AdjuntoController — Gestión de archivos adjuntos reales
 *
 * POST   /api/adjuntos              → subir archivo
 * GET    /api/adjuntos/{id}         → ver metadatos + URL
 * DELETE /api/adjuntos/{id}         → eliminar archivo y registro
 * GET    /api/adjuntos/entidad/{tipo}/{id} → listar adjuntos de una entidad
 */
class AdjuntoController extends Controller
{
    /** Tipos MIME permitidos */
    private const MIMES_PERMITIDOS = [
        'image/jpeg', 'image/png', 'image/webp', 'image/gif',
        'application/pdf',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/csv',
    ];

    /** Tamaño máximo 20 MB */
    private const MAX_BYTES = 20_971_520;

    // ──────────────────────────────────────────────────────────────
    // Listar adjuntos de una entidad
    // GET /api/adjuntos/entidad/{tipo}/{id}
    // ──────────────────────────────────────────────────────────────
    public function porEntidad(string $tipo, int $id): JsonResponse
    {
        $adjuntos = AdjuntoSistema::where('entidad_tipo', $tipo)
            ->where('entidad_id', $id)
            ->whereNull('deleted_at')
            ->with('subidoPor:id,nombre_usuario')
            ->orderByDesc('created_at')
            ->get();

        return response()->json($adjuntos);
    }

    // ──────────────────────────────────────────────────────────────
    // Subir archivo
    // POST /api/adjuntos
    // Body: multipart/form-data
    //   archivo       file    (required)
    //   entidad_tipo  string  (required) Ej: catalogo_articulos
    //   entidad_id    int     (required)
    //   categoria     string  (nullable) factura|garantia|manual|evidencia|foto|contrato|otro
    //   descripcion   string  (nullable)
    // ──────────────────────────────────────────────────────────────
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'archivo'      => 'required|file|max:20480',   // 20 MB
            'entidad_tipo' => 'required|string|max:80',
            'entidad_id'   => 'required|integer|min:1',
            'categoria'    => 'nullable|string|in:' . implode(',', AdjuntoSistema::CATEGORIAS_VALIDAS),
            'descripcion'  => 'nullable|string|max:500',
        ]);

        $archivo = $request->file('archivo');

        // Validar MIME type manualmente (más seguro que solo extensión)
        if (! in_array($archivo->getMimeType(), self::MIMES_PERMITIDOS)) {
            return response()->json([
                'mensaje' => 'Tipo de archivo no permitido. Formatos válidos: imágenes, PDF, Excel, Word, CSV.',
            ], 422);
        }

        // Validar tamaño
        if ($archivo->getSize() > self::MAX_BYTES) {
            return response()->json([
                'mensaje' => 'El archivo excede el tamaño máximo de 20 MB.',
            ], 422);
        }

        // Construir ruta organizada por entidad
        $entidadTipo = Str::slug($validated['entidad_tipo'], '_');
        $carpeta = "adjuntos/{$entidadTipo}/{$validated['entidad_id']}";
        $nombreAlmacenado = Str::uuid() . '.' . $archivo->getClientOriginalExtension();

        // Guardar en disco 'public'
        $disco = config('filesystems.adjuntos_disco', 'public');
        $ruta = $archivo->storeAs($carpeta, $nombreAlmacenado, $disco);

        if (! $ruta) {
            return response()->json(['mensaje' => 'Error al guardar el archivo en el servidor.'], 500);
        }

        $adjunto = AdjuntoSistema::create([
            'entidad_tipo'     => $validated['entidad_tipo'],
            'entidad_id'       => $validated['entidad_id'],
            'nombre_original'  => $archivo->getClientOriginalName(),
            'nombre_almacenado'=> $nombreAlmacenado,
            'disco'            => $disco,
            'ruta'             => $ruta,
            'mime_type'        => $archivo->getMimeType(),
            'tamano_bytes'     => $archivo->getSize(),
            'categoria'        => $validated['categoria'] ?? AdjuntoSistema::CATEGORIA_OTRO,
            'descripcion'      => $validated['descripcion'] ?? null,
            'subido_por_id'    => $request->user()?->id,
        ]);

        return response()->json([
            'mensaje'  => 'Archivo subido exitosamente',
            'adjunto'  => $adjunto->append(['url_publica', 'tamano_legible']),
        ], 201);
    }

    // ──────────────────────────────────────────────────────────────
    // Ver adjunto (metadatos + URL)
    // GET /api/adjuntos/{id}
    // ──────────────────────────────────────────────────────────────
    public function show(int $id): JsonResponse
    {
        $adjunto = AdjuntoSistema::with('subidoPor:id,nombre_usuario')
            ->findOrFail($id);

        return response()->json($adjunto->append(['url_publica', 'tamano_legible']));
    }

    // ──────────────────────────────────────────────────────────────
    // Eliminar adjunto (archivo + registro)
    // DELETE /api/adjuntos/{id}
    // ──────────────────────────────────────────────────────────────
    public function destroy(int $id): JsonResponse
    {
        $adjunto = AdjuntoSistema::findOrFail($id);

        // Eliminar archivo físico del disco
        $adjunto->eliminarArchivo();

        // Soft delete del registro
        $adjunto->delete();

        return response()->json(['mensaje' => 'Adjunto eliminado correctamente']);
    }
}
