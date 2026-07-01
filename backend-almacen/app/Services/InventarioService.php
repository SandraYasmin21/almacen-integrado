<?php

namespace App\Services;

use App\Imports\InventarioEntradaImport;
use App\Models\InventarioSerie;
use App\Models\MovimientoInventario;
use Carbon\Carbon;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Maatwebsite\Excel\Facades\Excel;

class InventarioService
{
    public const IMPORT_HEADINGS = [
        'nombre',
        'marca',
        'modelo',
        'serie',
        'subcategoria',
        'ubicacion',
        'cantidad',
        'fecha_vencimiento_garantia',
        'notas',
    ];

    public function plantillaHeadings(): array
    {
        return self::IMPORT_HEADINGS;
    }

    public function plantillaRows(): array
    {
        return [[
            'Laptop Corporativa',
            'Dell',
            'Latitude 5430',
            'SN123456',
            'Activos fijos',
            'Almacen principal',
            1,
            now()->addYear()->format('Y-m-d'),
            'Equipo nuevo',
        ]];
    }

    public function importarEntradaMasiva(UploadedFile $archivo, ?int $proveedorId, ?string $notas, ?int $usuarioId): array
    {
        $rows = $this->leerArchivoImportacion($archivo);
        [$lineas, $errores, $ignorados] = $this->validarLineasImportacion($rows);

        if ($errores !== []) {
            return [
                'success' => false,
                'message' => 'El archivo contiene errores. No se guardo ningun registro.',
                'errores' => $errores,
                'ignorados' => $ignorados,
            ];
        }

        if ($lineas === []) {
            return [
                'success' => false,
                'message' => 'El archivo no contiene filas nuevas para importar.',
                'errores' => [],
                'ignorados' => $ignorados,
            ];
        }

        return DB::transaction(function () use ($lineas, $proveedorId, $notas, $usuarioId, $ignorados) {
            $movimientoId = $this->crearMovimiento(MovimientoInventario::TIPO_ENTRADA, [
                'usuario_id' => $usuarioId,
                'proveedor_id' => $proveedorId,
                'notas' => $notas ?: 'Ingreso masivo por plantilla Excel/CSV',
                'datos_previos' => [],
            ]);

            $creados = [
                'articulos' => 0,
                'series' => 0,
                'stock' => 0,
            ];

            foreach ($lineas as $linea) {
                $articulo = $this->resolverArticuloImportado($linea);
                if ($articulo['created']) {
                    $creados['articulos']++;
                }

                $articuloId = (int) $articulo['id'];
                $ubicacionId = $this->resolverUbicacionId($linea['ubicacion']);

                if ($linea['requiere_serie']) {
                    $serieId = DB::table('inventario_series')->insertGetId([
                        'articulo_id' => $articuloId,
                        'numero_serie_fabricante' => $linea['serie'],
                        'codigo_interno_generado' => $this->generarSkuSerie($articuloId),
                        'estado' => InventarioSerie::ESTADO_DISPONIBLE,
                        'ubicacion' => $linea['ubicacion'],
                        'ubicacion_id' => $ubicacionId,
                        'fecha_adquisicion' => now()->toDateString(),
                        'fecha_vencimiento_garantia' => $linea['fecha_vencimiento_garantia'],
                        'notas' => $linea['notas'],
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);

                    $this->crearDetalle($movimientoId, $articuloId, 1, $serieId);
                    $creados['series']++;
                    continue;
                }

                $this->incrementarStock($articuloId, (float) $linea['cantidad'], $linea['ubicacion'], $ubicacionId);
                $this->crearDetalle($movimientoId, $articuloId, (float) $linea['cantidad']);
                $creados['stock']++;
            }

            $datosNuevos = [
                'totales' => $creados,
                'filas_importadas' => count($lineas),
                'filas_ignoradas' => count($ignorados),
            ];

            DB::table('movimiento_inventario')->where('id', $movimientoId)->update([
                'datos_nuevos' => json_encode($datosNuevos),
                'updated_at' => now(),
            ]);

            return [
                'success' => true,
                'message' => 'Importacion masiva registrada correctamente.',
                'movimiento_id' => $movimientoId,
                'creados' => $creados,
                'ignorados' => $ignorados,
                'errores' => [],
            ];
        });
    }

    public function registrarMovimientoAvanzado(array $payload, ?int $usuarioId): array
    {
        $tipo = $this->normalizarTipo((string) ($payload['tipo'] ?? $payload['tipo_movimiento'] ?? ''));

        return match ($tipo) {
            MovimientoInventario::TIPO_TRANSFERENCIA => $this->registrarTransferencia($payload, $usuarioId),
            MovimientoInventario::TIPO_ENVIO_REPARACION => $this->registrarCambioEstadoSerie($payload, $usuarioId, $tipo, InventarioSerie::ESTADO_REPARACION),
            MovimientoInventario::TIPO_RETORNO_REPARACION => $this->registrarCambioEstadoSerie($payload, $usuarioId, $tipo, InventarioSerie::ESTADO_DISPONIBLE),
            MovimientoInventario::TIPO_CAMBIO_RESPONSABLE => $this->registrarCambioResponsable($payload, $usuarioId),
            MovimientoInventario::TIPO_ASIGNACION => $this->registrarCambioResponsable($payload, $usuarioId, MovimientoInventario::TIPO_ASIGNACION),
            MovimientoInventario::TIPO_CAMBIO_ESTADO => $this->registrarCambioEstadoSerie($payload, $usuarioId, $tipo, (string) $payload['estado_destino']),
            MovimientoInventario::TIPO_BAJA_LOGICA => $this->registrarBajaLogica($payload, $usuarioId),
            default => throw ValidationException::withMessages(['tipo' => 'Tipo de movimiento avanzado no soportado.']),
        };
    }

    public function incrementarStock(int $articuloId, float $cantidad, ?string $ubicacion = null, ?int $ubicacionId = null): void
    {
        $query = DB::table('stock_general')
            ->where('articulo_id', $articuloId)
            ->whereNull('deleted_at');

        if ($ubicacionId !== null && Schema::hasColumn('stock_general', 'ubicacion_id')) {
            $query->where('ubicacion_id', $ubicacionId);
        } else {
            $query->where('ubicacion', $ubicacion);
        }

        $stock = $query->lockForUpdate()->first();

        if ($stock) {
            $nuevo = (float) $stock->cantidad + $cantidad;
            if ($nuevo < 0) {
                throw ValidationException::withMessages(['cantidad' => 'El movimiento generaria existencias negativas.']);
            }

            DB::table('stock_general')->where('id', $stock->id)->update([
                'cantidad' => $nuevo,
                'ubicacion' => $ubicacion ?? $stock->ubicacion,
                'ubicacion_id' => $ubicacionId ?? $stock->ubicacion_id ?? null,
                'updated_at' => now(),
            ]);
            return;
        }

        if ($cantidad < 0) {
            throw ValidationException::withMessages(['cantidad' => 'No hay stock suficiente en la ubicacion origen.']);
        }

        DB::table('stock_general')->insert([
            'articulo_id' => $articuloId,
            'cantidad' => $cantidad,
            'ubicacion' => $ubicacion,
            'ubicacion_id' => $ubicacionId,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    public function resolverUbicacionId(?string $nombre, string $tipo = 'almacen'): ?int
    {
        $nombre = trim((string) $nombre);
        if ($nombre === '' || ! Schema::hasTable('ubicaciones')) {
            return null;
        }

        $existing = DB::table('ubicaciones')->where('nombre', $nombre)->whereNull('deleted_at')->first();
        if ($existing) {
            return (int) $existing->id;
        }

        return (int) DB::table('ubicaciones')->insertGetId([
            'nombre' => $nombre,
            'tipo' => $tipo,
            'activo' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    private function registrarTransferencia(array $payload, ?int $usuarioId): array
    {
        return DB::transaction(function () use ($payload, $usuarioId) {
            $detalles = $this->detallesPayload($payload);
            [$origen, $origenId] = $this->resolverUbicacionPayload($payload, 'ubicacion_origen', 'ubicacion_id');
            [$destino, $destinoId] = $this->resolverUbicacionPayload($payload, 'ubicacion_destino', 'ubicacion_destino_id');

            if ($origen === null || $destino === null) {
                throw ValidationException::withMessages(['ubicacion' => 'La transferencia requiere ubicacion origen y destino.']);
            }

            $previos = [];
            $nuevos = [];

            $movimientoId = $this->crearMovimiento(MovimientoInventario::TIPO_TRANSFERENCIA, [
                'usuario_id' => $usuarioId,
                'notas' => $payload['notas'] ?? $payload['motivo'] ?? null,
                'motivo' => $payload['motivo'] ?? $payload['notas'] ?? null,
                'ubicacion_origen_id' => $origenId,
                'ubicacion_destino_id' => $destinoId,
                'proyecto_id' => $payload['proyecto_id'] ?? null,
            ]);

            foreach ($detalles as $detalle) {
                if (! empty($detalle['serie_id'])) {
                    $serie = DB::table('inventario_series')->where('id', $detalle['serie_id'])->lockForUpdate()->first();
                    if (! $serie) {
                        throw ValidationException::withMessages(['serie_id' => 'Serie no encontrada.']);
                    }

                    $previos[] = $this->snapshotSerie($serie);
                    DB::table('inventario_series')->where('id', $serie->id)->update([
                        'ubicacion' => $destino,
                        'ubicacion_id' => $destinoId,
                        'updated_at' => now(),
                    ]);
                    $nuevo = DB::table('inventario_series')->where('id', $serie->id)->first();
                    $nuevos[] = $this->snapshotSerie($nuevo);
                    $this->crearDetalle($movimientoId, (int) $serie->articulo_id, 1, (int) $serie->id);
                    continue;
                }

                $articuloId = (int) ($detalle['articulo_id'] ?? 0);
                $cantidad = (float) ($detalle['cantidad'] ?? 0);
                if ($articuloId <= 0 || $cantidad <= 0) {
                    throw ValidationException::withMessages(['detalles' => 'Cada consumible requiere articulo_id y cantidad mayor a cero.']);
                }

                $previos[] = $this->snapshotStock($articuloId, $origenId, $origen);
                $this->incrementarStock($articuloId, -$cantidad, $origen, $origenId);
                $this->incrementarStock($articuloId, $cantidad, $destino, $destinoId);
                $nuevos[] = [
                    'origen' => $this->snapshotStock($articuloId, $origenId, $origen),
                    'destino' => $this->snapshotStock($articuloId, $destinoId, $destino),
                ];
                $this->crearDetalle($movimientoId, $articuloId, $cantidad);
            }

            $this->actualizarAuditoria($movimientoId, $previos, $nuevos);

            return ['success' => true, 'message' => 'Transferencia registrada correctamente.', 'movimiento_id' => $movimientoId];
        });
    }

    private function registrarCambioEstadoSerie(array $payload, ?int $usuarioId, string $tipo, string $estado): array
    {
        return DB::transaction(function () use ($payload, $usuarioId, $tipo, $estado) {
            $detalles = $this->detallesPayload($payload);
            [$ubicacionDestino, $ubicacionDestinoId] = $this->resolverUbicacionPayload($payload, 'ubicacion_destino', 'ubicacion_destino_id');
            $previos = [];
            $nuevos = [];

            $movimientoId = $this->crearMovimiento($tipo, [
                'usuario_id' => $usuarioId,
                'notas' => $payload['notas'] ?? $payload['motivo'] ?? null,
                'motivo' => $payload['motivo'] ?? $payload['notas'] ?? null,
                'ubicacion_destino_id' => $ubicacionDestinoId,
                'proyecto_id' => $payload['proyecto_id'] ?? null,
            ]);

            foreach ($detalles as $detalle) {
                $serie = DB::table('inventario_series')->where('id', $detalle['serie_id'] ?? null)->lockForUpdate()->first();
                if (! $serie) {
                    throw ValidationException::withMessages(['serie_id' => 'Serie no encontrada.']);
                }

                $previos[] = $this->snapshotSerie($serie);
                $update = ['estado' => $estado, 'updated_at' => now()];
                if ($ubicacionDestino !== null) {
                    $update['ubicacion'] = $ubicacionDestino;
                    $update['ubicacion_id'] = $ubicacionDestinoId;
                }
                DB::table('inventario_series')->where('id', $serie->id)->update($update);
                $nuevo = DB::table('inventario_series')->where('id', $serie->id)->first();
                $nuevos[] = $this->snapshotSerie($nuevo);
                $this->crearDetalle($movimientoId, (int) $serie->articulo_id, 1, (int) $serie->id);
            }

            $this->actualizarAuditoria($movimientoId, $previos, $nuevos);

            return ['success' => true, 'message' => 'Movimiento de reparacion registrado correctamente.', 'movimiento_id' => $movimientoId];
        });
    }

    private function registrarCambioResponsable(array $payload, ?int $usuarioId, string $tipo = MovimientoInventario::TIPO_CAMBIO_RESPONSABLE): array
    {
        return DB::transaction(function () use ($payload, $usuarioId, $tipo) {
            $empleadoDestino = (int) ($payload['empleado_destino_id'] ?? $payload['empleado_id'] ?? 0);
            if ($empleadoDestino <= 0) {
                throw ValidationException::withMessages(['empleado_destino_id' => 'El cambio de responsable requiere empleado destino.']);
            }

            $previos = [];
            $nuevos = [];
            $movimientoId = $this->crearMovimiento($tipo, [
                'usuario_id' => $usuarioId,
                'empleado_id' => $empleadoDestino,
                'notas' => $payload['notas'] ?? $payload['motivo'] ?? null,
                'motivo' => $payload['motivo'] ?? $payload['notas'] ?? null,
                'responsable_nuevo_id' => $empleadoDestino,
                'proyecto_id' => $payload['proyecto_id'] ?? null,
            ]);

            foreach ($this->detallesPayload($payload) as $detalle) {
                $serie = DB::table('inventario_series')->where('id', $detalle['serie_id'] ?? null)->lockForUpdate()->first();
                if (! $serie) {
                    throw ValidationException::withMessages(['serie_id' => 'Serie no encontrada.']);
                }

                $asignacionPrevia = DB::table('asignaciones_activos')
                    ->where('serie_id', $serie->id)
                    ->whereNull('fecha_devolucion')
                    ->lockForUpdate()
                    ->first();

                $previos[] = [
                    'serie' => $this->snapshotSerie($serie),
                    'responsable_id' => $asignacionPrevia->empleado_id ?? null,
                ];

                if ($asignacionPrevia) {
                    DB::table('asignaciones_activos')->where('id', $asignacionPrevia->id)->update([
                        'fecha_devolucion' => now(),
                        'updated_at' => now(),
                    ]);
                }

                DB::table('asignaciones_activos')->insert([
                    'empleado_id' => $empleadoDestino,
                    'serie_id' => $serie->id,
                    'fecha_entrega' => now(),
                    'notas_estado_fisico' => $payload['notas'] ?? $payload['motivo'] ?? null,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);

                DB::table('inventario_series')->where('id', $serie->id)->update([
                    'estado' => InventarioSerie::ESTADO_ASIGNADO,
                    'updated_at' => now(),
                ]);

                $nuevos[] = [
                    'serie' => $this->snapshotSerie(DB::table('inventario_series')->where('id', $serie->id)->first()),
                    'responsable_id' => $empleadoDestino,
                ];
                $this->crearDetalle($movimientoId, (int) $serie->articulo_id, 1, (int) $serie->id);
            }

            $this->actualizarAuditoria($movimientoId, $previos, $nuevos);

            return ['success' => true, 'message' => 'Responsable actualizado correctamente.', 'movimiento_id' => $movimientoId];
        });
    }

    private function registrarBajaLogica(array $payload, ?int $usuarioId): array
    {
        return DB::transaction(function () use ($payload, $usuarioId) {
            $previos = [];
            $nuevos = [];
            $movimientoId = $this->crearMovimiento(MovimientoInventario::TIPO_BAJA_LOGICA, [
                'usuario_id' => $usuarioId,
                'notas' => $payload['notas'] ?? $payload['motivo'] ?? null,
                'motivo' => $payload['motivo'] ?? $payload['notas'] ?? null,
                'proyecto_id' => $payload['proyecto_id'] ?? null,
            ]);

            foreach ($this->detallesPayload($payload) as $detalle) {
                if (! empty($detalle['serie_id'])) {
                    $serie = DB::table('inventario_series')->where('id', $detalle['serie_id'])->lockForUpdate()->first();
                    if (! $serie) {
                        throw ValidationException::withMessages(['serie_id' => 'Serie no encontrada.']);
                    }
                    $previos[] = $this->snapshotSerie($serie);
                    DB::table('inventario_series')->where('id', $serie->id)->update([
                        'estado' => InventarioSerie::ESTADO_BAJA,
                        'deleted_at' => now(),
                        'updated_at' => now(),
                    ]);
                    $nuevos[] = $this->snapshotSerie(DB::table('inventario_series')->where('id', $serie->id)->first());
                    $this->crearDetalle($movimientoId, (int) $serie->articulo_id, 1, (int) $serie->id);
                    continue;
                }

                $articuloId = (int) ($detalle['articulo_id'] ?? 0);
                $cantidad = (float) ($detalle['cantidad'] ?? 0);
                [$ubicacion, $ubicacionId] = $this->resolverUbicacionPayload($detalle + $payload, 'ubicacion', 'ubicacion_id');

                $previos[] = $this->snapshotStock($articuloId, $ubicacionId, $ubicacion);
                $this->incrementarStock($articuloId, -$cantidad, $ubicacion, $ubicacionId);
                $nuevos[] = $this->snapshotStock($articuloId, $ubicacionId, $ubicacion);
                $this->crearDetalle($movimientoId, $articuloId, $cantidad);
            }

            $this->actualizarAuditoria($movimientoId, $previos, $nuevos);

            return ['success' => true, 'message' => 'Baja logica registrada correctamente.', 'movimiento_id' => $movimientoId];
        });
    }

    private function leerArchivoImportacion(UploadedFile $archivo): array
    {
        $sheets = Excel::toArray(new InventarioEntradaImport(), $archivo);
        return $sheets[0] ?? [];
    }

    private function validarLineasImportacion(array $rows): array
    {
        $errores = [];
        $ignorados = [];
        $lineas = [];

        if ($rows === []) {
            return [[], ['El archivo esta vacio.'], []];
        }

        $header = array_map(fn ($value) => $this->normalizarHeader((string) $value), array_shift($rows));
        $missing = array_diff(self::IMPORT_HEADINGS, $header);
        if ($missing !== []) {
            return [[], ['Faltan columnas obligatorias: '.implode(', ', $missing).'.'], []];
        }

        $seriesEnArchivo = [];

        foreach ($rows as $index => $row) {
            $numeroFila = $index + 2;
            $mapped = [];
            foreach ($header as $i => $key) {
                if (in_array($key, self::IMPORT_HEADINGS, true)) {
                    $mapped[$key] = isset($row[$i]) ? trim((string) $row[$i]) : null;
                }
            }

            if ($this->filaVacia($mapped)) {
                continue;
            }

            $nombre = $mapped['nombre'] ?? '';
            $serie = $mapped['serie'] ?? '';
            $cantidad = $mapped['cantidad'] ?? '';
            $requiereSerie = $serie !== '';

            if ($nombre === '') {
                $errores[] = "Fila {$numeroFila}: nombre es obligatorio.";
            }

            if (! $requiereSerie && ($cantidad === '' || ! is_numeric($cantidad) || (float) $cantidad <= 0)) {
                $errores[] = "Fila {$numeroFila}: cantidad debe ser mayor a cero para consumibles.";
            }

            $fechaGarantia = $mapped['fecha_vencimiento_garantia'] ?? null;
            if ($fechaGarantia !== null && $fechaGarantia !== '' && ! $this->fechaValida($fechaGarantia)) {
                $errores[] = "Fila {$numeroFila}: fecha_vencimiento_garantia debe usar formato YYYY-MM-DD.";
            }

            if ($requiereSerie) {
                $serieKey = mb_strtoupper($serie);
                if (isset($seriesEnArchivo[$serieKey])) {
                    $ignorados[] = ['fila' => $numeroFila, 'motivo' => "Serie duplicada dentro del archivo: {$serie}"];
                    continue;
                }
                $seriesEnArchivo[$serieKey] = true;

                if (DB::table('inventario_series')->whereRaw('UPPER(numero_serie_fabricante) = ?', [$serieKey])->whereNull('deleted_at')->exists()) {
                    $ignorados[] = ['fila' => $numeroFila, 'motivo' => "Serie ya existente: {$serie}"];
                    continue;
                }
            }

            if ($errores !== []) {
                continue;
            }

            $lineas[] = [
                'nombre' => $nombre,
                'marca' => $mapped['marca'] ?: null,
                'modelo' => $mapped['modelo'] ?: null,
                'serie' => $serie ?: null,
                'subcategoria' => $mapped['subcategoria'] ?: null,
                'ubicacion' => $mapped['ubicacion'] ?: null,
                'cantidad' => $requiereSerie ? 1 : (float) $cantidad,
                'fecha_vencimiento_garantia' => $fechaGarantia ?: null,
                'notas' => $mapped['notas'] ?: null,
                'requiere_serie' => $requiereSerie,
            ];
        }

        return [$lineas, $errores, $ignorados];
    }

    private function resolverArticuloImportado(array $linea): array
    {
        $subcategoriaId = $this->resolverSubcategoriaId($linea['subcategoria']);

        $query = DB::table('catalogo_articulos')
            ->whereNull('deleted_at')
            ->where('nombre', $linea['nombre'])
            ->where(function ($query) use ($linea) {
                $linea['marca'] === null
                    ? $query->whereNull('marca_fabricante')
                    : $query->where('marca_fabricante', $linea['marca']);
            })
            ->where(function ($query) use ($linea) {
                $linea['modelo'] === null
                    ? $query->whereNull('modelo')
                    : $query->where('modelo', $linea['modelo']);
            });

        $articulo = $query->lockForUpdate()->first();
        if ($articulo) {
            return ['id' => $articulo->id, 'created' => false];
        }

        $data = [
            'subcategoria_id' => $subcategoriaId,
            'nombre' => $linea['nombre'],
            'marca_fabricante' => $linea['marca'],
            'modelo' => $linea['modelo'],
            'requiere_serie' => $linea['requiere_serie'],
            'es_consumible' => ! $linea['requiere_serie'],
            'unidad_medida' => 'PZA',
            'stock_minimo' => 0,
            'created_at' => now(),
            'updated_at' => now(),
        ];

        if (Schema::hasColumn('catalogo_articulos', 'tipo_articulo')) {
            $data['tipo_articulo'] = $linea['requiere_serie'] ? 'herramienta' : 'venta';
        }

        if (Schema::hasColumn('catalogo_articulos', 'tipo_control')) {
            $data['tipo_control'] = $linea['requiere_serie'] ? 'ACTIVO' : 'MATERIAL';
        }

        $id = DB::table('catalogo_articulos')->insertGetId($data);

        if (Schema::hasColumn('catalogo_articulos', 'sku_maestro')) {
            DB::table('catalogo_articulos')->where('id', $id)->update(['sku_maestro' => $this->generarSkuMaestro($linea['nombre'], $id)]);
        }

        return ['id' => $id, 'created' => true];
    }

    private function resolverSubcategoriaId(?string $nombre): ?int
    {
        if ($nombre !== null && $nombre !== '') {
            $sub = DB::table('subcategorias')->where('nombre', $nombre)->whereNull('deleted_at')->first();
            if ($sub) {
                return (int) $sub->id;
            }
        }

        return DB::table('subcategorias')->whereNull('deleted_at')->value('id');
    }

    private function crearMovimiento(string $tipo, array $data = []): int
    {
        $tipoColumn = Schema::hasColumn('movimiento_inventario', 'tipo') ? 'tipo' : 'tipo_movimiento';
        $payload = [
            'fecha_hora' => Carbon::now(),
            $tipoColumn => Schema::hasColumn('movimiento_inventario', 'tipo') ? strtolower($tipo) : strtoupper($tipo),
            'usuario_id' => $data['usuario_id'] ?? auth()->id(),
            'empleado_id' => $data['empleado_id'] ?? null,
            'proveedor_id' => $data['proveedor_id'] ?? null,
            'notas' => $data['notas'] ?? null,
            'motivo' => $data['motivo'] ?? $data['notas'] ?? null,
            'datos_previos' => array_key_exists('datos_previos', $data) ? json_encode($data['datos_previos']) : null,
            'datos_nuevos' => array_key_exists('datos_nuevos', $data) ? json_encode($data['datos_nuevos']) : null,
            'created_at' => now(),
            'updated_at' => now(),
        ];

        if (Schema::hasColumn('movimiento_inventario', 'folio')) {
            $payload['folio'] = $this->generarFolioMovimiento();
        }

        foreach (['ubicacion_origen_id', 'ubicacion_destino_id', 'responsable_anterior_id', 'responsable_nuevo_id', 'proyecto_id'] as $column) {
            if (Schema::hasColumn('movimiento_inventario', $column)) {
                $payload[$column] = $data[$column] ?? null;
            }
        }

        if (Schema::hasColumn('movimiento_inventario', 'orden_venta_id')) {
            $payload['orden_venta_id'] = $data['orden_venta_id'] ?? null;
        }

        return (int) DB::table('movimiento_inventario')->insertGetId($payload);
    }

    private function generarFolioMovimiento(): string
    {
        do {
            $folio = 'MOV-' . now()->format('Ymd-His') . '-' . strtoupper(Str::random(4));
        } while (DB::table('movimiento_inventario')->where('folio', $folio)->exists());

        return $folio;
    }

    private function crearDetalle(int $movimientoId, int $articuloId, float $cantidad, ?int $serieId = null): void
    {
        DB::table('detalle_movimiento')->insert([
            'movimiento_id' => $movimientoId,
            'articulo_id' => $articuloId,
            'serie_id' => $serieId,
            'cantidad' => $cantidad,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    private function actualizarAuditoria(int $movimientoId, array $previos, array $nuevos): void
    {
        DB::table('movimiento_inventario')->where('id', $movimientoId)->update([
            'datos_previos' => json_encode($previos),
            'datos_nuevos' => json_encode($nuevos),
            'updated_at' => now(),
        ]);
    }

    private function normalizarTipo(string $tipo): string
    {
        return strtoupper(str_replace(['-', ' '], '_', trim($tipo)));
    }

    private function detallesPayload(array $payload): array
    {
        $detalles = $payload['detalles'] ?? null;
        if (is_array($detalles) && $detalles !== []) {
            return $detalles;
        }

        return [[
            'articulo_id' => $payload['articulo_id'] ?? null,
            'serie_id' => $payload['serie_id'] ?? null,
            'cantidad' => $payload['cantidad'] ?? null,
            'ubicacion' => $payload['ubicacion'] ?? null,
        ]];
    }

    private function snapshotSerie(?object $serie): ?array
    {
        if (! $serie) {
            return null;
        }

        $asignacion = DB::table('asignaciones_activos')
            ->where('serie_id', $serie->id)
            ->whereNull('fecha_devolucion')
            ->first();

        return [
            'serie_id' => $serie->id,
            'articulo_id' => $serie->articulo_id,
            'estado' => $serie->estado,
            'ubicacion' => $serie->ubicacion,
            'ubicacion_id' => $serie->ubicacion_id ?? null,
            'responsable_id' => $asignacion->empleado_id ?? null,
            'deleted_at' => $serie->deleted_at ?? null,
        ];
    }

    private function snapshotStock(int $articuloId, ?int $ubicacionId, ?string $ubicacion): ?array
    {
        $query = DB::table('stock_general')->where('articulo_id', $articuloId)->whereNull('deleted_at');
        if ($ubicacionId !== null && Schema::hasColumn('stock_general', 'ubicacion_id')) {
            $query->where('ubicacion_id', $ubicacionId);
        } else {
            $query->where('ubicacion', $ubicacion);
        }

        $stock = $query->first();
        return [
            'articulo_id' => $articuloId,
            'ubicacion' => $ubicacion,
            'ubicacion_id' => $ubicacionId,
            'cantidad' => $stock ? (float) $stock->cantidad : 0.0,
        ];
    }

    private function generarSkuSerie(int $articuloId): string
    {
        $articulo = DB::table('catalogo_articulos')->where('id', $articuloId)->first();
        $skuMaestro = $articulo->sku_maestro ?? $this->generarSkuMaestro($articulo->nombre ?? 'ART', $articuloId);

        if (Schema::hasColumn('catalogo_articulos', 'sku_maestro') && empty($articulo->sku_maestro)) {
            DB::table('catalogo_articulos')->where('id', $articuloId)->update(['sku_maestro' => $skuMaestro]);
        }

        $sequence = ((int) DB::table('inventario_series')->where('articulo_id', $articuloId)->count()) + 1;

        do {
            $sku = sprintf('%s-%03d', $skuMaestro, $sequence++);
        } while (DB::table('inventario_series')->where('codigo_interno_generado', $sku)->exists());

        return $sku;
    }

    private function generarSkuMaestro(string $nombre, int $id): string
    {
        $prefix = strtoupper(substr(preg_replace('/[^A-Za-z0-9]/', '', Str::ascii($nombre)) ?: 'ART', 0, 3));
        return 'SM-' . str_pad($prefix, 3, 'X') . '-' . str_pad((string) $id, 5, '0', STR_PAD_LEFT);
    }

    private function normalizarHeader(string $value): string
    {
        $value = Str::ascii(trim($value));
        $value = strtolower($value);
        $value = preg_replace('/[^a-z0-9]+/', '_', $value);
        return trim((string) $value, '_');
    }

    private function filaVacia(array $row): bool
    {
        foreach ($row as $value) {
            if (trim((string) $value) !== '') {
                return false;
            }
        }

        return true;
    }

    private function fechaValida(string $fecha): bool
    {
        try {
            Carbon::createFromFormat('Y-m-d', $fecha);
            return true;
        } catch (\Throwable) {
            return false;
        }
    }

    private function stringValue(array $payload, string $key): ?string
    {
        $value = trim((string) ($payload[$key] ?? ''));
        return $value === '' ? null : $value;
    }

    private function resolverUbicacionPayload(array $payload, string $nombreKey, string $idKey): array
    {
        $id = isset($payload[$idKey]) ? (int) $payload[$idKey] : null;
        $nombre = $this->stringValue($payload, $nombreKey);

        if ($id) {
            $row = DB::table('ubicaciones')->where('id', $id)->whereNull('deleted_at')->first();
            if ($row) {
                return [$row->nombre, (int) $row->id];
            }
        }

        return [$nombre, $this->resolverUbicacionId($nombre)];
    }
}
