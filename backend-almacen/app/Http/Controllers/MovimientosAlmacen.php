<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use smartlynk\Core\Models\MovimientoInventario;
use smartlynk\Core\Models\CatalogoArticulo;
use smartlynk\Core\Models\DetalleMovimiento;
use smartlynk\Core\Models\Empleado;
use smartlynk\Core\Models\Proveedor;
use smartlynk\Core\Models\InventarioSerie;
use smartlynk\Core\Models\StockGeneral;
use smartlynk\Core\Models\OrdenVenta;
use smartlynk\Core\Models\DetalleOrdenVenta;
use Inertia\Inertia;



class MovimientosAlmacen extends Controller
{
    public function showMovimientosAlmacen()
    {
        // Obtener últimos 10 movimientos recientes ordenados descendentemente
        $movimientosRecientes = MovimientoInventario::with('detalles')
            ->orderBy('created_at', 'desc')
            ->take(10)
            ->get()
            ->map(function($mov) {
                return [
                    'id' => $mov->id,
                    'tipo_movimiento' => $mov->tipo_movimiento, // 'ENTRADA' o 'SALIDA'
                    'notas' => $mov->notas ?? 'Sin notas',
                    'cantidad_detalles' => $mov->detalles()->count(), // Cantidad de artículos en el movimiento
                    'fecha' => $mov->created_at->format('Y-m-d H:i')
                ];
            });
    
        return Inertia::render('MovimientosAlmacenPage', [
            'movimientosRecientes' => $movimientosRecientes
        ]);
    }

    public function showDetallesMovimiento($id)
    {
        // Obtener movimiento con sus detalles y relaciones
        $movimiento = MovimientoInventario::with([
            'detalles.articulo',
            'detalles.serie',
            'usuario',
            'empleado',
            'proveedor'
        ])->findOrFail($id);

        // Mapear datos generales del movimiento
        $datosMovimiento = [
            'id' => $movimiento->id,
            'tipo_movimiento' => $movimiento->tipo_movimiento,
            'fecha' => $movimiento->created_at->format('d/m/Y H:i'),
            'notas' => $movimiento->notas,
            'usuario' => $movimiento->usuario?->name,
            'empleado' => $movimiento->empleado?->nombre,
            'proveedor' => $movimiento->proveedor?->nombre,
        ];

        // Mapear detalles del movimiento
        $detalles = $movimiento->detalles->map(function($detalle) {
            return [
                'id' => $detalle->id,
                'articulo_id' => $detalle->articulo_id,
                'articulo_nombre' => $detalle->articulo?->nombre ?? 'Artículo no especificado',
                'cantidad' => $detalle->cantidad,
                 'orden_venta_id' => $detalle->orden_venta_id,
                'serie' => $detalle->serie?->numero_serie_fabricante ?? $detalle->serie?->codigo_interno_generado,
            ];
        });

        return Inertia::render('DetallesMovimientoPage', [
            'movimiento' => $datosMovimiento,
            'detalles' => $detalles
        ]);
    }

    public function showHistorialMovimientos(Request $request)
    {
        // Obtener parámetros de búsqueda y filtros
        $busqueda = $request->input('busqueda', '');
        $tipo = $request->input('tipo', '');
        $fechaInicio = $request->input('fecha_inicio', '');
        $fechaFin = $request->input('fecha_fin', '');
        $busquedaArticulo = $request->input('busqueda_articulo', '');
        $activeTab = $request->input('activeTab', 'movimientos');
        $cargarArticulos = $request->input('cargar_articulos', false);

        $movimientosData = [];
        $detallesData = [];

        // ===== PESTAÑA: MOVIMIENTOS GENERALES =====
        // Cargar movimientos si no hay búsqueda de artículos
        if (empty($busquedaArticulo) && !$cargarArticulos) {
            // Query base para movimientos
            $queryMovimientos = MovimientoInventario::with('detalles')
                ->orderBy('created_at', 'desc');

            // Filtros para movimientos
            if ($tipo) {
                $queryMovimientos->where('tipo_movimiento', $tipo);
            }

            if ($busqueda) {
                $queryMovimientos->where(function($q) use ($busqueda) {
                    $q->where('notas', 'like', "%$busqueda%")
                        ->orWhereHas('usuario', function($q) use ($busqueda) {
                            $q->where('nombre_usuario', 'like', "%$busqueda%");
                        });
                });
            }

            if ($fechaInicio && $fechaFin) {
                $queryMovimientos->whereBetween('created_at', [
                    date('Y-m-d 00:00:00', strtotime($fechaInicio)),
                    date('Y-m-d 23:59:59', strtotime($fechaFin))
                ]);
            }

            $movimientos = $queryMovimientos->paginate(15);

            // Mapear movimientos
            $movimientosData = array_map(function($mov) {
                return [
                    'id' => $mov->id,
                    'tipo_movimiento' => $mov->tipo_movimiento,
                    'notas' => $mov->notas ?? 'Sin notas',
                    'cantidad_detalles' => $mov->detalles->count(),
                    'fecha' => $mov->created_at->format('Y-m-d H:i')
                ];
            }, $movimientos->items());
        }

        // ===== PESTAÑA: BÚSQUEDA DE ARTÍCULOS =====
        if ($activeTab === 'articulos' || $cargarArticulos) {
            // Query para detalles de movimientos (búsqueda de artículos)
            $queryDetalles = DetalleMovimiento::with(['articulo', 'ticket'])
                ->orderBy('created_at', 'desc');

            // Si hay búsqueda específica, filtrar por nombre de artículo
            if (!empty($busquedaArticulo)) {
                $queryDetalles->whereHas('articulo', function($q) use ($busquedaArticulo) {
                    $q->where('nombre', 'like', "%$busquedaArticulo%");
                });
            }

            $detalles = $queryDetalles->paginate(10, ['*'], 'detalles_page');

            // Mapear detalles - con validaciones para relaciones
            $detallesData = array_map(function($det) {
                $ticket = $det->ticket;
                $articulo = $det->articulo;
                
                // Validar que existan las relaciones antes de acceder
                return [
                    'id' => $det->id,
                    'movimiento_id' => $ticket?->id ?? 0,
                    'movimiento_tipo' => $ticket?->tipo_movimiento ?? 'N/A',
                    'articulo_nombre' => $articulo?->nombre ?? 'Artículo no especificado',
                    'cantidad' => $det->cantidad ?? 0,
                    'fecha' => $ticket?->created_at ? $ticket->created_at->format('Y-m-d H:i') : 'N/A',
                    //'orden_venta_id' => $det->orden_venta_id ?? null
                ];
            }, $detalles->items());
        }

        return Inertia::render('RegistroMovimientosPage', [
            'movimientos' => $movimientosData,
            'detalles' => $detallesData,
            'filtros' => [
                'busqueda' => $busqueda,
                'tipo' => $tipo,
                'fecha_inicio' => $fechaInicio,
                'fecha_fin' => $fechaFin,
                'busqueda_articulo' => $busquedaArticulo
            ],
            'tabActiva' => $activeTab
        ]);
    }

    // Método para mostrar la página de registrar nuevo movimiento
    public function showRegistrarMovimiento()
    {
        // Obtener todos los empleados
        $empleados = Empleado::select('id', 'nombre_completo as nombre', 'numero_gafete', 'puesto_cargo')->get();
        
        // Obtener todos los proveedores
        $proveedores = Proveedor::select('id', 'nombre_empresa as nombre', 'contacto_principal', 'telefono')->get();
        
        // Obtener todos los artículos del catálogo
        $articulos = CatalogoArticulo::select('id', 'nombre', 'modelo', 'unidad_medida')
            ->with('subcategoria:id,nombre')
            ->get();

        // Obtener órdenes de venta activas
        $ordenesVenta = OrdenVenta::select('id', 'proyecto_id', 'fecha_hora', 'estado')
            ->with('proyecto:id,nombre_proyecto')
            ->where('estado', '!=', 'CANCELADA')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function($orden) {
                return [
                    'id' => $orden->id,
                    'fecha' => $orden->fecha_hora->format('Y-m-d'),
                    'proyecto' => $orden->proyecto?->nombre_proyecto ?? 'Sin proyecto',
                    'estado' => $orden->estado
                ];
            });

        return Inertia::render('RegistrarMovimientoAlmacen', [
            'empleados' => $empleados,
            'proveedores' => $proveedores,
            'articulos' => $articulos,
            'ordenesVenta' => $ordenesVenta
        ]);
    }

    // API endpoint para buscar artículos dinámicamente
    public function searchArticulos(Request $request)
    {
        $busqueda = $request->input('q', '');
        
        if (strlen($busqueda) < 1) {
            return response()->json([]);
        }

        $articulos = CatalogoArticulo::where('nombre', 'like', "%$busqueda%")
            ->orWhere('modelo', 'like', "%$busqueda%")
            ->select('id', 'nombre', 'modelo', 'unidad_medida', 'requiere_serie', 'es_consumible')
            ->with('subcategoria:id,nombre')
            ->limit(10)
            ->get()
            ->map(function($articulo) {
                // Obtener stock disponible
                if ($articulo->requiere_serie) {
                    $stock_disponible = InventarioSerie::where('articulo_id', $articulo->id)
                        ->where('estado', 'DISPONIBLE')
                        ->count();
                } else {
                    $stock = StockGeneral::where('articulo_id', $articulo->id)->first();
                    $stock_disponible = $stock?->cantidad ?? 0;
                }

                return [
                    'id' => $articulo->id,
                    'nombre' => $articulo->nombre,
                    'modelo' => $articulo->modelo,
                    'unidad_medida' => $articulo->unidad_medida,
                    'requiere_serie' => $articulo->requiere_serie,
                    'es_consumible' => $articulo->es_consumible,
                    'stock_disponible' => $stock_disponible,
                    'subcategoria' => $articulo->subcategoria?->nombre ?? 'N/A'
                ];
            });

        return response()->json($articulos);
    }

    // API endpoint para buscar empleados dinámicamente
    public function searchEmpleados(Request $request)
    {
        $busqueda = $request->input('q', '');
        
        if (strlen($busqueda) < 1) {
            return response()->json([]);
        }

        $empleados = Empleado::where('nombre_completo', 'like', "%$busqueda%")
            ->orWhere('numero_gafete', 'like', "%$busqueda%")
            ->select('id', 'nombre_completo as nombre', 'numero_gafete', 'puesto_cargo')
            ->limit(10)
            ->get();

        return response()->json($empleados);
    }

    // API endpoint para buscar proveedores dinámicamente
    public function searchProveedores(Request $request)
    {
        $busqueda = $request->input('q', '');
        
        if (strlen($busqueda) < 1) {
            return response()->json([]);
        }

        $proveedores = Proveedor::where('nombre_empresa', 'like', "%$busqueda%")
            ->orWhere('contacto_principal', 'like', "%$busqueda%")
            ->select('id', 'nombre_empresa as nombre', 'contacto_principal', 'telefono')
            ->limit(10)
            ->get();

        return response()->json($proveedores);
    }

    // API endpoint para buscar órdenes de venta dinámicamente
    public function searchOrdenesVenta(Request $request)
    {
        $busqueda = $request->input('q', '');
        
        $query = OrdenVenta::where('estado', '!=', 'CANCELADA')
            ->with('proyecto:id,nombre_proyecto')
            ->orderBy('created_at', 'desc');

        if (strlen($busqueda) > 0) {
            $query->where(function($q) use ($busqueda) {
                $q->where('id', 'like', "%$busqueda%")
                  ->orWhereHas('proyecto', function($q) use ($busqueda) {
                      $q->where('nombre_proyecto', 'like', "%$busqueda%");
                  });
            });
        }

        $ordenes = $query->limit(10)->get()->map(function($orden) {
            $proyectoNombre = $orden->proyecto?->nombre_proyecto ?? 'Sin proyecto';
            return [
                'id' => $orden->id,
                'label' => "Orden #{$orden->id} - {$proyectoNombre} ({$orden->fecha_hora->format('Y-m-d')})",
                'proyecto' => $proyectoNombre,
                'fecha' => $orden->fecha_hora->format('Y-m-d'),
                'estado' => $orden->estado
            ];
        });

        return response()->json($ordenes);
    }

    // API endpoint para obtener series disponibles de un artículo
    public function getSeriesDisponibles($articuloId)
    {
        $series = InventarioSerie::where('articulo_id', $articuloId)
            ->where('estado', 'DISPONIBLE')
            ->select('id', 'numero_serie_fabricante', 'codigo_interno_generado', 'estado')
            ->get();

        return response()->json($series);
    }

    // Página para mostrar estado del inventario
    public function showInventario()
    {
        return Inertia::render('InventarioPage');
    }

    // API endpoint para obtener estado del inventario
    public function getEstadoInventario(Request $request)
    {
        // Artículos con serie
        $seriesDisponibles = InventarioSerie::where('estado', 'DISPONIBLE')
            ->with('articulo')
            ->get()
            ->map(function($serie) {
                return [
                    'tipo' => 'serie',
                    'nombre' => $serie->articulo?->nombre ?? 'Artículo no especificado',
                    'modelo' => $serie->articulo?->modelo ?? '—',
                    'numero_serie' => $serie->numero_serie_fabricante ?? $serie->codigo_interno_generado,
                    'estado' => $serie->estado,
                    'cantidad' => 1,
                    'ubicacion' => $serie->ubicacion,
                ];
            });

        $seriesVendidas = InventarioSerie::where('estado', 'VENDIDO')
            ->with('articulo')
            ->get()
            ->map(function($serie) {
                return [
                    'tipo' => 'serie',
                    'nombre' => $serie->articulo?->nombre ?? 'Artículo no especificado',
                    'modelo' => $serie->articulo?->modelo ?? '—',
                    'numero_serie' => $serie->numero_serie_fabricante ?? $serie->codigo_interno_generado,
                    'estado' => $serie->estado,
                    'cantidad' => 1,
                    'ubicacion' => $serie->ubicacion,
                ];
            });

        // Artículos consumibles
        $consumibles = StockGeneral::with('articulo')
            ->get()
            ->map(function($stock) {
                return [
                    'tipo' => 'consumible',
                    'nombre' => $stock->articulo?->nombre ?? 'Artículo no especificado',
                    'modelo' => $stock->articulo?->modelo ?? '—',
                    'numero_serie' => null,
                    'estado' => 'DISPONIBLE',
                    'cantidad' => $stock->cantidad,
                    'ubicacion' => $stock->ubicacion,
                ];
            });

        $inventario = array_merge($seriesDisponibles->toArray(), $consumibles->toArray());

        return response()->json([
            'inventario' => $inventario,
            'stats' => [
                'activos' => $seriesDisponibles->count(),
                'vendidos' => $seriesVendidas->count(),
                'consumibles' => $consumibles->sum(fn($item) => $item['cantidad']),
            ]
        ]);
    }

    // Método para crear movimientos agrupados (nuevos con detalles)
    public function createMovimientosAgrupados(Request $request)
    {
        try {
            $validated = $request->validate([
                'movimientos' => 'required|array|min:1',
                'movimientos.*.tipo_movimiento' => 'required|in:ENTRADA,SALIDA',
                'movimientos.*.notas' => 'required|string|max:255',
                'movimientos.*.empleado_id' => 'nullable|exists:empleados,id',
                'movimientos.*.proveedor_id' => 'nullable|exists:proveedores,id',
                'movimientos.*.orden_venta_id' => 'nullable|exists:orden_venta,id',
                'movimientos.*.detalles' => 'required|array|min:1',
                'movimientos.*.detalles.*.articulo_id' => 'required|exists:catalogo_articulos,id',
                'movimientos.*.detalles.*.cantidad' => 'nullable|numeric|min:1',
                'movimientos.*.detalles.*.serie_id' => 'nullable|exists:inventario_series,id',
                'movimientos.*.detalles.*.numero_serie' => 'nullable|string|max:100',
                'movimientos.*.detalles.*.orden_venta_id' => 'nullable|exists:orden_venta,id',
            ]);

            $movimientosCreados = [];

            // Procesar cada movimiento
            foreach ($validated['movimientos'] as $movData) {
                // Validar restricción: orden_venta_id solo para SALIDAS
                if ($movData['tipo_movimiento'] === 'ENTRADA' && !empty($movData['orden_venta_id'] ?? null)) {
                    throw new \Exception('Las ENTRADAS no pueden tener orden_venta_id asociado');
                }

                // Crear el movimiento principal
                $movimiento = new MovimientoInventario();
                $movimiento->tipo_movimiento = $movData['tipo_movimiento'];
                $movimiento->notas = $movData['notas'];
                $movimiento->empleado_id = $movData['empleado_id'] ?? null;
                $movimiento->proveedor_id = $movData['proveedor_id'] ?? null;
                $movimiento->usuario_id = 1; // Asignar un usuario fijo para pruebas, en producción usar auth()->id() o similar
                $movimiento->save();

                // Procesar detalles y actualizar inventario
                foreach ($movData['detalles'] as $detalle) {
                    $articulo = CatalogoArticulo::findOrFail($detalle['articulo_id']);
                    
                    // Validar restricción: orden_venta_id en detalles
                    if ($movData['tipo_movimiento'] === 'ENTRADA' && !empty($detalle['orden_venta_id'] ?? null)) {
                        throw new \Exception('Las ENTRADAS no pueden tener orden_venta_id en detalles');
                    }
                    
                    // Crear registro de detalle
                    if ($articulo->requiere_serie) {
                        // Artículo CON serie
                        if ($movData['tipo_movimiento'] === 'ENTRADA') {
                            // ENTRADA: crear nuevo registro InventarioSerie
                            $serie = InventarioSerie::create([
                                'articulo_id' => $detalle['articulo_id'],
                                'numero_serie_fabricante' => null,
                                'codigo_interno_generado' => $detalle['numero_serie'] ?? null,
                                'estado' => 'DISPONIBLE',
                                'ubicacion' => null,
                            ]);

                            DetalleMovimiento::create([
                                'movimiento_id' => $movimiento->id,
                                'articulo_id' => $detalle['articulo_id'],
                                'cantidad' => null,
                                'serie_id' => $serie->id,
                                'orden_venta_id' => null,
                            ]);
                        } else {
                            // SALIDA: actualizar estado del InventarioSerie
                            $serie = InventarioSerie::findOrFail($detalle['serie_id']);
                            
                            // Validar que está disponible
                            if ($serie->estado !== 'DISPONIBLE') {
                                throw new \Exception("El artículo con serie {$serie->numero_serie_fabricante} no está disponible");
                            }

                            // Cambiar estado a VENDIDO
                            $serie->update(['estado' => 'VENDIDO']);

                            DetalleMovimiento::create([
                                'movimiento_id' => $movimiento->id,
                                'articulo_id' => $detalle['articulo_id'],
                                'cantidad' => null,
                                'serie_id' => $detalle['serie_id'],
                                'orden_venta_id' => $detalle['orden_venta_id'] ?? null,
                            ]);
                        }
                    } else {
                        // Artículo SIN serie (consumible)
                        if ($movData['tipo_movimiento'] === 'ENTRADA') {
                            // ENTRADA: incrementar stock
                            $stock = StockGeneral::firstOrCreate(
                                ['articulo_id' => $detalle['articulo_id']],
                                ['cantidad' => 0]
                            );
                            $stock->increment('cantidad', $detalle['cantidad']);
                        } else {
                            // SALIDA: decrementar stock
                            $stock = StockGeneral::where('articulo_id', $detalle['articulo_id'])->first();
                            
                            if (!$stock || $stock->cantidad < $detalle['cantidad']) {
                                throw new \Exception("No hay suficiente stock de {$articulo->nombre}");
                            }
                            
                            $stock->decrement('cantidad', $detalle['cantidad']);
                        }

                        DetalleMovimiento::create([
                            'movimiento_id' => $movimiento->id,
                            'articulo_id' => $detalle['articulo_id'],
                            'cantidad' => $detalle['cantidad'],
                            'serie_id' => null,
                            'orden_venta_id' => $detalle['orden_venta_id'] ?? null,
                        ]);
                    }
                }

                $movimientosCreados[] = [
                    'id' => $movimiento->id,
                    'tipo' => $movimiento->tipo_movimiento,
                    'notas' => $movimiento->notas,
                    'detalles_count' => count($movData['detalles'])
                ];
            }

            return response()->json([
                'success' => true,
                'message' => 'Movimientos registrados exitosamente',
                'movimientos' => $movimientosCreados
            ], 201);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error de validación',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al registrar movimientos: ' . $e->getMessage()
            ], 500);
        }
    }
    private function getOrdenesQuery()
    {
        return OrdenVenta::with(['proyecto:id,nombre_proyecto', 'detalleOrden'])
            ->where('estado', '!=', 'CANCELADA')
            ->orderByRaw("CASE WHEN estado = 'Completada' THEN 1 ELSE 0 END ASC")
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function($orden) {
                return [
                    'id' => $orden->id,
                    'fecha' => $orden->fecha_hora->format('Y-m-d'),
                    'proyecto' => $orden->proyecto?->nombre_proyecto ?? 'Sin proyecto',
                    'estado' => $orden->estado,
                    'articulos' => $orden->detalleOrden->count(),
                    'total_items' => $orden->detalleOrden->sum('cantidad_solicitada'),
                ];
            });
    }

    public function showOrdenes(Request $request)
    {
        return Inertia::render('OrdenesVentaPage', [
            'ordenesVenta' => $this->getOrdenesQuery()
        ]);
    }

    public function getOrdenesApi()
    {
        return response()->json([
            'ordenes' => $this->getOrdenesQuery()
        ]);
    }

    public function showDetallesOrden($id)
    {
        // Obtener orden de venta con sus detalles y relaciones
        $orden = OrdenVenta::with([
            'proyecto',
            'detalleOrden.articulo',
        ])->findOrFail($id);

        // Mapear datos generales de la orden
        $datosOrden = [
            'id' => $orden->id,
            'fecha_hora' => $orden->fecha_hora ? $orden->fecha_hora->format('d/m/Y H:i') : '—',
            'proyecto' => $orden->proyecto?->nombre_proyecto ?? 'Sin proyecto',
            'estado' => $orden->estado,
        ];

        // Mapear detalles de la orden
        $detalles = $orden->detalleOrden->map(function($detalle) {
            return [
                'id' => $detalle->id,
                'articulo_id' => $detalle->articulo_id,
                'articulo_nombre' => $detalle->articulo?->nombre ?? 'Artículo no especificado',
                'cantidad_solicitada' => $detalle->cantidad_solicitada,
                'cantidad_despachada' => $detalle->cantidad_despachada,
                'orden_venta_id' => $detalle->orden_venta_id,
            ];
        });

        return Inertia::render('DetallesOrdenVentaPage', [
            'orden' => $datosOrden,
            'detalles' => $detalles
        ]);
    }
}
