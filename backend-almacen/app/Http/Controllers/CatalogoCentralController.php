<?php

namespace App\Http\Controllers;

use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Maatwebsite\Excel\Facades\Excel;
use App\Exports\GenericExport;

class CatalogoCentralController extends Controller
{
    public function articulos(Request $request): JsonResponse
    {
        $perPage = min(max((int) $request->input('per_page', 12), 1), 50);
        $search = $this->clean($request->input('q', ''));

        $query = $this->articulosQuery();

        if ($search !== '') {
            $term = '%' . mb_strtolower($search) . '%';
            $query->where(function ($q) use ($term) {
                $q->whereRaw('LOWER(ca.nombre) LIKE ?', [$term])
                    ->orWhereRaw('LOWER(COALESCE(ca.modelo, \'\')) LIKE ?', [$term])
                    ->orWhereRaw('LOWER(COALESCE(ca.unidad_medida, \'\')) LIKE ?', [$term])
                    ->orWhereRaw('LOWER(COALESCE(sc.nombre, \'\')) LIKE ?', [$term])
                    ->orWhereRaw('LOWER(COALESCE(cat.nombre, \'\')) LIKE ?', [$term]);
            });
        }

        $articulos = $query->orderBy('ca.nombre')->paginate($perPage);

        return $this->ok('Artículos consultados correctamente.', $articulos);
    }

    public function vehiculos(Request $request): JsonResponse
    {
        $perPage = min(max((int) $request->input('per_page', 12), 1), 50);
        $search = $this->clean($request->input('q', ''));
        $placasColumn = $this->vehiclePlatesColumn();

        $query = DB::table('vehiculos_flotilla as vf')
            ->select(
                'vf.id',
                'vf.nombre',
                'vf.modelo',
                'vf.numero_serie',
                'vf.tipo_vehiculo',
                'vf.numero',
                'vf.estado_gps',
                "vf.$placasColumn as placas",
                'vf.poliza_seguro',
                'vf.grupo',
                'vf.certificacion',
                'vf.estado'
            )
            ->whereNull('vf.deleted_at');

        if ($search !== '') {
            $term = '%' . mb_strtolower($search) . '%';
            $query->where(function ($q) use ($term, $placasColumn) {
                $q->whereRaw('LOWER(vf.nombre) LIKE ?', [$term])
                    ->orWhereRaw('LOWER(vf.modelo) LIKE ?', [$term])
                    ->orWhereRaw("LOWER(COALESCE(vf.$placasColumn, '')) LIKE ?", [$term])
                    ->orWhereRaw('LOWER(COALESCE(vf.numero_serie, \'\')) LIKE ?', [$term])
                    ->orWhereRaw('LOWER(COALESCE(vf.tipo_vehiculo, \'\')) LIKE ?', [$term])
                    ->orWhereRaw('LOWER(COALESCE(vf.grupo, \'\')) LIKE ?', [$term]);
            });
        }

        $vehiculos = $query->orderBy('vf.nombre')->paginate($perPage);

        return $this->ok('Vehículos consultados correctamente.', $vehiculos);
    }

    public function subcategorias(): JsonResponse
    {
        $subcategorias = DB::table('subcategorias as sc')
            ->join('categorias as cat', 'sc.categoria_id', '=', 'cat.id')
            ->where('sc.activo', true)
            ->where('cat.activo', true)
            ->whereNull('sc.deleted_at')
            ->whereNull('cat.deleted_at')
            ->select(
                'sc.id',
                'sc.nombre',
                'sc.categoria_id',
                'cat.nombre as categoria'
            )
            ->orderBy('cat.nombre')
            ->orderBy('sc.nombre')
            ->get();

        return $this->ok('Subcategorías consultadas correctamente.', $subcategorias);
    }

    public function storeArticulo(Request $request): JsonResponse
    {
        $validated = $this->validateArticulo($request);

        $id = DB::transaction(function () use ($validated) {
            $subcategoriaId = $this->resolveSubcategoria($validated);

            $data = [
                'subcategoria_id' => $subcategoriaId,
                'nombre' => $this->clean($validated['nombre']),
                'modelo' => $this->nullableClean($validated['modelo'] ?? null),
                'requiere_serie' => (bool) ($validated['requiere_serie'] ?? false),
                'es_consumible' => (bool) ($validated['es_consumible'] ?? false),
                'unidad_medida' => strtoupper($this->clean($validated['unidad_medida'] ?? 'PZA')),
                'stock_minimo' => (float) ($validated['stock_minimo'] ?? 0),
                'created_at' => now(),
                'updated_at' => now(),
            ];

            if (Schema::hasColumn('catalogo_articulos', 'tipo_articulo')) {
                $data['tipo_articulo'] = $this->clean($validated['tipo_articulo'] ?? 'herramienta');
            }

            if (Schema::hasColumn('catalogo_articulos', 'sku_maestro')) {
                $data['sku_maestro'] = $this->generateMasterSku($validated['nombre']);
            }

            return DB::table('catalogo_articulos')->insertGetId($data);
        });

        return $this->ok('Artículo creado correctamente.', $this->findArticulo($id), 201);
    }

    public function updateArticulo(Request $request, int $id): JsonResponse
    {
        $validated = $this->validateArticulo($request, $id, true);

        DB::transaction(function () use ($validated, $id) {
            $data = [];

            $subcategoriaId = $this->resolveSubcategoria($validated);
            if ($subcategoriaId) {
                $data['subcategoria_id'] = $subcategoriaId;
            }

            foreach (['stock_minimo'] as $field) {
                if (array_key_exists($field, $validated)) {
                    $data[$field] = $validated[$field];
                }
            }

            foreach (['nombre', 'unidad_medida'] as $field) {
                if (array_key_exists($field, $validated)) {
                    $data[$field] = $field === 'unidad_medida'
                        ? strtoupper($this->clean($validated[$field]))
                        : $this->clean($validated[$field]);
                }
            }

            if (array_key_exists('modelo', $validated)) {
                $data['modelo'] = $this->nullableClean($validated['modelo']);
            }

            foreach (['requiere_serie', 'es_consumible'] as $field) {
                if (array_key_exists($field, $validated)) {
                    $data[$field] = (bool) $validated[$field];
                }
            }

            if (Schema::hasColumn('catalogo_articulos', 'tipo_articulo') && array_key_exists('tipo_articulo', $validated)) {
                $data['tipo_articulo'] = $this->clean($validated['tipo_articulo']);
            }

            if (Schema::hasColumn('catalogo_articulos', 'sku_maestro') && !empty($validated['regenerar_sku'])) {
                $nombreBase = $validated['nombre']
                    ?? DB::table('catalogo_articulos')->where('id', $id)->value('nombre')
                    ?? 'Artículo';
                $data['sku_maestro'] = $this->generateMasterSku($nombreBase, $id);
            }

            if ($data !== []) {
                $data['updated_at'] = now();
                DB::table('catalogo_articulos')
                    ->where('id', $id)
                    ->whereNull('deleted_at')
                    ->update($data);
            }
        });

        return $this->ok('Artículo actualizado correctamente.', $this->findArticulo($id));
    }

    public function storeVehiculo(Request $request): JsonResponse
    {
        $validated = $this->validateVehiculo($request);
        $placasColumn = $this->vehiclePlatesColumn();

        $id = DB::transaction(function () use ($validated, $placasColumn) {
            return DB::table('vehiculos_flotilla')->insertGetId([
                'nombre' => $this->clean($validated['nombre']),
                'modelo' => $this->clean($validated['modelo']),
                'numero_serie' => $this->nullableClean($validated['numero_serie'] ?? null),
                'tipo_vehiculo' => $this->clean($validated['tipo_vehiculo']),
                'numero' => $this->nullableClean($validated['numero'] ?? null),
                'estado_gps' => $this->clean($validated['estado_gps'] ?? 'Sin Unidad'),
                $placasColumn => strtoupper($this->clean($validated['placas'])),
                'poliza_seguro' => $this->nullableClean($validated['poliza_seguro'] ?? null),
                'grupo' => $this->nullableClean($validated['grupo'] ?? null),
                'certificacion' => $this->nullableClean($validated['certificacion'] ?? null),
                'estado' => strtoupper($this->clean($validated['estado'] ?? 'ACTIVO')),
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        });

        return $this->ok('Vehículo creado correctamente.', ['id' => $id], 201);
    }

    public function updateVehiculo(Request $request, int $id): JsonResponse
    {
        $validated = $this->validateVehiculo($request, $id, true);
        $placasColumn = $this->vehiclePlatesColumn();

        DB::transaction(function () use ($validated, $id, $placasColumn) {
            $data = [];

            foreach ([
                'nombre',
                'modelo',
                'numero_serie',
                'tipo_vehiculo',
                'numero',
                'estado_gps',
                'poliza_seguro',
                'grupo',
                'certificacion',
                'estado',
            ] as $field) {
                if (array_key_exists($field, $validated)) {
                    $data[$field] = $this->nullableClean($validated[$field]);
                }
            }

            if (array_key_exists('placas', $validated)) {
                $data[$placasColumn] = strtoupper($this->clean($validated['placas']));
            }

            if ($data !== []) {
                $data['updated_at'] = now();
                DB::table('vehiculos_flotilla')
                    ->where('id', $id)
                    ->whereNull('deleted_at')
                    ->update($data);
            }
        });

        return $this->ok('Vehículo actualizado correctamente.', ['id' => $id]);
    }

    public function export(Request $request, string $tipo, string $formato)
    {
        abort_unless(in_array($tipo, ['articulos', 'vehiculos'], true), 404);
        abort_unless(in_array($formato, ['excel', 'pdf'], true), 404);

        $rows = $tipo === 'articulos'
            ? $this->articulosQuery()->orderBy('ca.nombre')->get()
            : DB::table('vehiculos_flotilla as vf')
                ->whereNull('vf.deleted_at')
                ->select(
                    'vf.nombre',
                    'vf.modelo',
                    'vf.numero_serie',
                    'vf.tipo_vehiculo',
                    DB::raw($this->vehiclePlatesColumn() . ' as placas'),
                    'vf.estado_gps',
                    'vf.estado'
                )
                ->orderBy('vf.nombre')
                ->get();

        $filename = "catalogo_{$tipo}_" . Carbon::now()->format('Ymd_His');

        if ($formato === 'pdf') {
            $html = view('pdf.catalogo-central', [
                'tipo' => $tipo,
                'rows' => $rows,
                'fecha' => Carbon::now()->format('d/m/Y H:i'),
            ])->render();

            return Pdf::loadHTML($html)->setPaper('a4', 'landscape')->download($filename . '.pdf');
        }

        $data = [];
        if ($tipo === 'articulos') {
            $headings = ['Articulo', 'Modelo', 'SKU maestro', 'Categoria', 'Subcategoria', 'Unidad', 'Stock ideal', 'Stock actual', 'Tipo'];
            foreach ($rows as $row) {
                $data[] = [
                    $row->nombre,
                    $row->modelo,
                    $row->sku_maestro,
                    $row->categoria,
                    $row->subcategoria,
                    $row->unidad_medida,
                    $row->stock_minimo,
                    $row->stock_actual,
                    $row->tipo_articulo,
                ];
            }
        } else {
            $headings = ['Vehiculo', 'Modelo', 'Placas', 'NIV', 'Tipo', 'GPS', 'Estado'];
            foreach ($rows as $row) {
                $data[] = [
                    $row->nombre,
                    $row->modelo,
                    $row->placas,
                    $row->numero_serie,
                    $row->tipo_vehiculo,
                    $row->estado_gps,
                    $row->estado,
                ];
            }
        }

        return Excel::download(new GenericExport($data, $headings), $filename . '.xlsx');
    }

    private function articulosQuery()
    {
        $groupBy = [
            'ca.id',
            'ca.nombre',
            'ca.modelo',
            'ca.subcategoria_id',
            'ca.unidad_medida',
            'ca.stock_minimo',
            'ca.requiere_serie',
            'ca.es_consumible',
            'sc.nombre',
            'cat.nombre',
        ];

        if (Schema::hasColumn('catalogo_articulos', 'tipo_articulo')) {
            $groupBy[] = 'ca.tipo_articulo';
        }

        if (Schema::hasColumn('catalogo_articulos', 'sku_maestro')) {
            $groupBy[] = 'ca.sku_maestro';
        }

        return DB::table('catalogo_articulos as ca')
            ->leftJoin('subcategorias as sc', 'ca.subcategoria_id', '=', 'sc.id')
            ->leftJoin('categorias as cat', 'sc.categoria_id', '=', 'cat.id')
            ->leftJoin('stock_general as sg', function ($join) {
                $join->on('ca.id', '=', 'sg.articulo_id')->whereNull('sg.deleted_at');
            })
            ->whereNull('ca.deleted_at')
            ->select(
                'ca.id',
                'ca.nombre',
                'ca.modelo',
                'ca.subcategoria_id',
                'ca.unidad_medida',
                'ca.stock_minimo',
                'ca.requiere_serie',
                'ca.es_consumible',
                DB::raw($this->articleTypeExpression() . ' as tipo_articulo'),
                DB::raw($this->masterSkuExpression() . ' as sku_maestro'),
                'sc.nombre as subcategoria',
                'cat.nombre as categoria',
                DB::raw('COALESCE(SUM(sg.cantidad), 0) as stock_actual')
            )
            ->groupBy($groupBy);
    }

    private function validateArticulo(Request $request, ?int $id = null, bool $partial = false): array
    {
        $required = $partial ? 'sometimes' : 'required';

        return $request->validate([
            'nombre' => [$required, 'string', 'max:150'],
            'modelo' => ['nullable', 'string', 'max:150'],
            'subcategoria_id' => ['nullable', 'integer', Rule::exists('subcategorias', 'id')->whereNull('deleted_at')],
            'nueva_categoria' => ['nullable', 'string', 'max:150'],
            'nueva_subcategoria' => ['nullable', 'string', 'max:150'],
            'unidad_medida' => ['nullable', 'string', 'max:20'],
            'stock_minimo' => ['nullable', 'numeric', 'min:0'],
            'requiere_serie' => ['nullable', 'boolean'],
            'es_consumible' => ['nullable', 'boolean'],
            'tipo_articulo' => ['nullable', 'in:venta,herramienta,mixto'],
            'regenerar_sku' => ['nullable', 'boolean'],
        ]);
    }

    private function articleTypeExpression(): string
    {
        if (Schema::hasColumn('catalogo_articulos', 'tipo_articulo')) {
            return 'ca.tipo_articulo';
        }

        return "CASE WHEN ca.es_consumible THEN 'venta' ELSE 'herramienta' END";
    }

    private function masterSkuExpression(): string
    {
        if (Schema::hasColumn('catalogo_articulos', 'sku_maestro')) {
            return 'ca.sku_maestro';
        }

        return 'NULL';
    }

    private function findArticulo(int $id): ?object
    {
        return $this->articulosQuery()
            ->where('ca.id', $id)
            ->first();
    }

    private function generateMasterSku(string $nombre, ?int $ignoreId = null): string
    {
        $clean = preg_replace('/[^A-Za-z0-9]/', '', Str::ascii($nombre)) ?: 'ART';
        $prefix = strtoupper(substr($clean, 0, 3));
        $prefix = str_pad($prefix, 3, 'X');

        do {
            $sku = 'SM-' . $prefix . '-' . random_int(100000, 999999);
            $query = DB::table('catalogo_articulos')->where('sku_maestro', $sku);

            if ($ignoreId !== null) {
                $query->where('id', '!=', $ignoreId);
            }
        } while ($query->exists());

        return $sku;
    }

    private function validateVehiculo(Request $request, ?int $id = null, bool $partial = false): array
    {
        $required = $partial ? 'sometimes' : 'required';
        $placasColumn = $this->vehiclePlatesColumn();

        return $request->validate([
            'nombre' => [$required, 'string', 'max:150'],
            'modelo' => [$required, 'string', 'max:150'],
            'numero_serie' => ['nullable', 'string', 'max:100'],
            'tipo_vehiculo' => [$required, 'string', 'max:100'],
            'numero' => ['nullable', 'string', 'max:100'],
            'estado_gps' => ['nullable', 'string', 'max:50'],
            'placas' => [
                $required,
                'string',
                'max:30',
                Rule::unique('vehiculos_flotilla', $placasColumn)->ignore($id)->whereNull('deleted_at'),
            ],
            'poliza_seguro' => ['nullable', 'string', 'max:100'],
            'grupo' => ['nullable', 'string', 'max:100'],
            'certificacion' => ['nullable', 'string', 'max:100'],
            'estado' => ['nullable', 'in:ACTIVO,INACTIVO,Activo,Inactivo'],
        ]);
    }

    private function vehiclePlatesColumn(): string
    {
        return Schema::hasColumn('vehiculos_flotilla', 'placas') ? 'placas' : 'placa';
    }

    private function clean(?string $value): string
    {
        return trim(strip_tags((string) $value));
    }

    private function nullableClean(?string $value): ?string
    {
        $clean = $this->clean($value);
        return $clean === '' ? null : $clean;
    }

    private function resolveSubcategoria(array $validated): ?int
    {
        $subId = $validated['subcategoria_id'] ?? null;
        if (!$subId && !empty($validated['nueva_subcategoria']) && !empty($validated['nueva_categoria'])) {
            $catName = $this->clean($validated['nueva_categoria']);
            $subName = $this->clean($validated['nueva_subcategoria']);
            
            $cat = DB::table('categorias')->where('nombre', $catName)->whereNull('deleted_at')->first();
            if (!$cat) {
                $catId = DB::table('categorias')->insertGetId(['nombre' => $catName, 'activo' => true, 'created_at' => now(), 'updated_at' => now()]);
            } else {
                $catId = $cat->id;
            }

            $sub = DB::table('subcategorias')->where('categoria_id', $catId)->where('nombre', $subName)->whereNull('deleted_at')->first();
            if (!$sub) {
                $subId = DB::table('subcategorias')->insertGetId(['categoria_id' => $catId, 'nombre' => $subName, 'activo' => true, 'created_at' => now(), 'updated_at' => now()]);
            } else {
                $subId = $sub->id;
            }
        }
        return $subId;
    }

    private function ok(string $message, mixed $data = null, int $status = 200): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => $message,
            'data' => $data,
        ], $status);
    }
}
