import React, { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export default function RegistrarMovimientoAlmacen({ empleados = [], proveedores = [], ordenesVenta = [], initialTipo = "entrada" }) {
    const navigate = useNavigate();
    // Tipo fijo por submodulo: "entrada" o "salida"
    const [tipoMovimiento] = useState(initialTipo === "salida" ? "salida" : "entrada");

    // Estados para el movimiento actual
    const [articulos, setArticulos] = useState([]);
    const [motivo, setMotivo] = useState("");
    const [empleadoSeleccionado, setEmpleadoSeleccionado] = useState(null);
    const [proveedorSeleccionado, setProveedorSeleccionado] = useState(null);

    // Estados para formulario de artículo
    const [articuloSeleccionado, setArticuloSeleccionado] = useState(null);
    const [busquedaArticulo, setBusquedaArticulo] = useState("");
    const [articulosFiltrados, setArticulosFiltrados] = useState([]);
    const [cantidad, setCantidad] = useState("");
    const [cargandoArticulos, setCargandoArticulos] = useState(false);
    
    // Estados para series (si requiere serie)
    const [numeroSerie, setNumeroSerie] = useState("");
    const [seriesDisponibles, setSeriesDisponibles] = useState([]);
    const [serieSeleccionada, setSerieSeleccionada] = useState(null);
    const [cargandoSeries, setCargandoSeries] = useState(false);
    const [seriesAgregadas, setSeriesAgregadas] = useState([]); // Para entrada con serie

    // Estados para búsqueda
    const [busquedaEmpleado, setBusquedaEmpleado] = useState("");
    const [empleadosFiltrados, setEmpleadosFiltrados] = useState([]);
    const [busquedaProveedor, setBusquedaProveedor] = useState("");
    const [proveedoresFiltrados, setProveedoresFiltrados] = useState([]);
    
    // Orden de venta por detalle (no por movimiento)
    const [ordenVentaDetalleSeleccionada, setOrdenVentaDetalleSeleccionada] = useState(null);
    const [busquedaOrdenVentaDetalle, setBusquedaOrdenVentaDetalle] = useState("");
    const [ordenesFiltradas, setOrdenesFiltradas] = useState([]);

    // Efecto para buscar artículos
    useEffect(() => {
        if (busquedaArticulo.trim().length > 0) {
            setCargandoArticulos(true);
            fetch(`/api/articulos/search?q=${encodeURIComponent(busquedaArticulo)}`)
                .then(response => response.json())
                .then(data => {
                    setArticulosFiltrados(data);
                    setCargandoArticulos(false);
                })
                .catch(error => {
                    console.error('Error buscando artículos:', error);
                    setCargandoArticulos(false);
                });
        } else {
            setArticulosFiltrados([]);
        }
    }, [busquedaArticulo]);

    // Efecto para filtrar empleados
    useEffect(() => {
        if (busquedaEmpleado.trim().length > 0) {
            const filtrados = empleados.filter(emp =>
                emp.nombre.toLowerCase().includes(busquedaEmpleado.toLowerCase()) ||
                String(emp.numero_gafete).includes(busquedaEmpleado) ||
                String(emp.id).includes(busquedaEmpleado)
            );
            setEmpleadosFiltrados(filtrados);
        } else {
            setEmpleadosFiltrados([]);
        }
    }, [busquedaEmpleado, empleados]);

    // Efecto para filtrar proveedores
    useEffect(() => {
        if (busquedaProveedor.trim().length > 0) {
            const filtrados = proveedores.filter(prov =>
                prov.nombre.toLowerCase().includes(busquedaProveedor.toLowerCase()) ||
                (prov.contacto_principal && prov.contacto_principal.toLowerCase().includes(busquedaProveedor.toLowerCase())) ||
                String(prov.id).includes(busquedaProveedor)
            );
            setProveedoresFiltrados(filtrados);
        } else {
            setProveedoresFiltrados([]);
        }
    }, [busquedaProveedor, proveedores]);

    // Efecto para filtrar órdenes de venta (por detalle)
    useEffect(() => {
        if (busquedaOrdenVentaDetalle.trim().length > 0) {
            fetch(`/api/ordenes-venta/search?q=${encodeURIComponent(busquedaOrdenVentaDetalle)}`)
                .then(response => response.json())
                .then(data => {
                    setOrdenesFiltradas(data);
                })
                .catch(error => {
                    console.error('Error buscando órdenes:', error);
                });
        } else {
            setOrdenesFiltradas([]);
        }
    }, [busquedaOrdenVentaDetalle]);

    // Efecto para cargar series disponibles (SALIDA)
    useEffect(() => {
        if (tipoMovimiento === "salida" && articuloSeleccionado?.requiere_serie && articuloSeleccionado?.id) {
            setCargandoSeries(true);
            fetch(`/api/articulos/${articuloSeleccionado.id}/series-disponibles`)
                .then(response => response.json())
                .then(data => {
                    setSeriesDisponibles(data);
                    setCargandoSeries(false);
                })
                .catch(error => {
                    console.error('Error cargando series:', error);
                    setCargandoSeries(false);
                });
        }
    }, [articuloSeleccionado, tipoMovimiento]);

    const handleAgregarSerie = () => {
        if (!articuloSeleccionado) {
            toast.warning("Por favor selecciona un artículo");
            return;
        }

        if (articuloSeleccionado.requiere_serie) {
            // Artículo CON serie
            if (!numeroSerie.trim()) {
                toast.warning("Por favor ingresa el número de serie");
                return;
            }

            // Verificar que no esté duplicada
            if (seriesAgregadas.some(s => s.numero_serie === numeroSerie)) {
                toast.warning("Este número de serie ya fue agregado");
                return;
            }

            const nuevaSerie = {
                id: Date.now(),
                articulo_id: articuloSeleccionado.id,
                nombre: articuloSeleccionado.nombre,
                modelo: articuloSeleccionado.modelo,
                numero_serie: numeroSerie,
                unidad_medida: articuloSeleccionado.unidad_medida,
                requiere_serie: true
            };

            setSeriesAgregadas([...seriesAgregadas, nuevaSerie]);
            setNumeroSerie("");
        }
    };

    const handleAgregarArticulo = () => {
        if (!articuloSeleccionado) {
            toast.warning("Por favor selecciona un artículo");
            return;
        }

        if (articuloSeleccionado.requiere_serie) {
            // Para artículos CON serie
            if (tipoMovimiento === "entrada") {
                // En entrada, debe tener series agregadas
                if (seriesAgregadas.length === 0) {
                    toast.warning("Por favor agrega al menos un número de serie");
                    return;
                }
                // Agregar todas las series como detalles
                const seriesConOrdenVenta = seriesAgregadas.map(s => ({
                    ...s,
                    orden_venta_id: null
                }));
                setArticulos([...articulos, ...seriesConOrdenVenta]);
                setSeriesAgregadas([]);
                setArticuloSeleccionado(null);
                setBusquedaArticulo("");
                setArticulosFiltrados([]);
            } else {
                // En salida, debe tener serie seleccionada
                if (!serieSeleccionada) {
                    toast.warning("Por favor selecciona un número de serie disponible");
                    return;
                }
                const nuevoDetalle = {
                    id: Date.now(),
                    articulo_id: articuloSeleccionado.id,
                    nombre: articuloSeleccionado.nombre,
                    modelo: articuloSeleccionado.modelo,
                    unidad_medida: articuloSeleccionado.unidad_medida,
                    requiere_serie: true,
                    serie_id: serieSeleccionada.id,
                    numero_serie: serieSeleccionada.numero_serie_fabricante || serieSeleccionada.codigo_interno_generado,
                    cantidad: 1,
                    orden_venta_id: ordenVentaDetalleSeleccionada?.id
                };
                setArticulos([...articulos, nuevoDetalle]);
                setArticuloSeleccionado(null);
                setBusquedaArticulo("");
                setSerieSeleccionada(null);
                setSeriesDisponibles([]);
                setArticulosFiltrados([]);
                setOrdenVentaDetalleSeleccionada(null);
                setBusquedaOrdenVentaDetalle("");
            }
        } else {
            // Para artículos SIN serie (consumibles)
            if (!cantidad.trim() || cantidad <= 0) {
                toast.warning("Por favor ingresa una cantidad mayor a 0");
                return;
            }
            
            // En SALIDA, validar stock
            if (tipoMovimiento === "salida" && articuloSeleccionado.stock_disponible < cantidad) {
                toast.warning(`Stock insuficiente. Disponible: ${articuloSeleccionado.stock_disponible} ${articuloSeleccionado.unidad_medida}`);
                return;
            }

            const nuevoDetalle = {
                id: Date.now(),
                articulo_id: articuloSeleccionado.id,
                nombre: articuloSeleccionado.nombre,
                modelo: articuloSeleccionado.modelo,
                cantidad: parseFloat(cantidad),
                unidad_medida: articuloSeleccionado.unidad_medida,
                requiere_serie: false,
                orden_venta_id: tipoMovimiento === "salida" ? ordenVentaDetalleSeleccionada?.id : null
            };
            setArticulos([...articulos, nuevoDetalle]);
            setArticuloSeleccionado(null);
            setBusquedaArticulo("");
            setCantidad("");
            setArticulosFiltrados([]);
            setOrdenVentaDetalleSeleccionada(null);
            setBusquedaOrdenVentaDetalle("");
        }
    };

    const handleEliminarArticulo = (id) => {
        setArticulos(articulos.filter(art => art.id !== id));
    };

    const handleEliminarSerie = (id) => {
        setSeriesAgregadas(seriesAgregadas.filter(s => s.id !== id));
    };

    const handleConfirmarMovimiento = async () => {
        if (articulos.length === 0) {
            toast.warning("Por favor agrega al menos un artículo");
            return;
        }

        if (!motivo.trim()) {
            toast.warning("Por favor ingresa el motivo del movimiento");
            return;
        }

        const movimiento = {
            tipo_movimiento: tipoMovimiento.toUpperCase(),
            notas: motivo,
            empleado_id: empleadoSeleccionado?.id || null,
            proveedor_id: proveedorSeleccionado?.id || null,
            detalles: articulos.map(art => {
                const detalle = {
                    articulo_id: art.articulo_id,
                    orden_venta_id: art.orden_venta_id || null,
                };
                
                // Si tiene serie
                if (art.requiere_serie) {
                    if (tipoMovimiento === "entrada") {
                        // En entrada, enviar numero_serie
                        detalle.numero_serie = art.numero_serie;
                    } else {
                        // En salida, enviar serie_id
                        detalle.serie_id = art.serie_id;
                    }
                } else {
                    // Sin serie, enviar cantidad
                    detalle.cantidad = art.cantidad;
                }
                
                return detalle;
            }),
        };

        try {
            const response = await fetch('/movimientos-agrupados', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content'),
                },
                body: JSON.stringify({ movimientos: [movimiento] })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Error al registrar movimiento');
            }

            toast.success('¡Movimiento registrado exitosamente!');

            // Reiniciar
            setArticulos([]);
            setMotivo("");
            setEmpleadoSeleccionado(null);
            setProveedorSeleccionado(null);
            setOrdenVentaDetalleSeleccionada(null);
            setBusquedaOrdenVentaDetalle("");

        } catch (error) {
            console.error('Error:', error);
            toast.error('Error al registrar movimiento: ' + error.message);
        }
    };

    const handleCambiarTipo = () => {
        if (articulos.length > 0) {
            const confirmar = window.confirm('¿Descartar los artículos agregados y cambiar de tipo?');
            if (!confirmar) return;
        }
        setTipoMovimiento(null);
        setArticulos([]);
        setMotivo("");
        setEmpleadoSeleccionado(null);
        setProveedorSeleccionado(null);
        setSeriesAgregadas([]);
        setOrdenVentaDetalleSeleccionada(null);
        setBusquedaOrdenVentaDetalle("");
    };

    // Pantalla de selección de tipo
    if (tipoMovimiento === null) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-8">
                <div className="max-w-md w-full">
                    <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm !ring-0 text-center">
                        <h1 className="text-3xl font-bold text-slate-900 mb-4 font-inter tracking-tight">Registrar Movimiento</h1>
                        <p className="text-slate-500 mb-8">Selecciona el tipo de movimiento a registrar</p>

                                <div className="space-y-4">
                                    <button
                                        onClick={() => setTipoMovimiento("entrada")}
                                        className="w-full p-6 bg-green-500 text-white font-bold rounded-2xl hover:bg-green-600 transition-all shadow-sm hover:-translate-y-0.5"
                                    >
                                        <div className="text-sm uppercase tracking-widest opacity-90">Movimiento</div>
                                        <div className="text-2xl mt-2">Entrada</div>
                                    </button>

                                    <button
                                        onClick={() => setTipoMovimiento("salida")}
                                        className="w-full p-6 bg-red-500 text-white font-bold rounded-2xl hover:bg-red-600 transition-all shadow-sm hover:-translate-y-0.5"
                                    >
                                        <div className="text-sm uppercase tracking-widest opacity-90">Movimiento</div>
                                        <div className="text-2xl mt-2">Salida</div>
                                    </button>
                                </div>

                                <button
                                    onClick={() => navigate('/mostrador')}
                                    className="w-full mt-8 px-4 py-3 bg-slate-100 text-slate-700 font-semibold rounded-full hover:bg-slate-200 transition-colors shadow-sm"
                                >
                                    ← Volver
                                </button>
                    </div>
                </div>
            </div>
        );
    }

    // Pantalla de registro
    const colorBg = tipoMovimiento === "entrada" ? "bg-green-50" : "bg-red-50";
    const colorBorder = tipoMovimiento === "entrada" ? "border-green-200" : "border-red-200";
    const colorBadge = tipoMovimiento === "entrada" ? "bg-green-500" : "bg-red-500";
    const titulo = tipoMovimiento === "entrada" ? "Entrada" : "Salida";
    return (
        <div className="min-h-screen bg-slate-50">
            <div className="p-8 max-w-7xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 mb-2 font-inter tracking-tight">Registrar {titulo} de Almacén</h1>
                        <p className="text-slate-500">Agrega artículos y confirma para registrar</p>
                    </div>
                    <button
                        onClick={() => navigate('/mostrador')}
                        className="px-6 py-2 bg-white text-slate-700 font-bold rounded-full hover:bg-slate-100 transition-colors border border-slate-200 shadow-sm hover:-translate-y-0.5 transform"
                    >
                        ← Volver
                    </button>
                </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Columna de formulario */}
                            <div className="lg:col-span-1">
                                {/* Badge del tipo */}
                                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm !ring-0 mb-6 text-center">
                                    <span className={`${colorBadge} text-white px-4 py-2 rounded-full font-bold text-lg inline-block shadow-sm`}>
                                        {titulo.toUpperCase()}
                                    </span>
                                </div>

                                {/* Selector de artículos */}
                                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm !ring-0">
                                    <div className="mb-4">
                                        <h3 className="text-lg font-semibold text-slate-800">Agregar Artículo</h3>
                                        <p className="text-sm text-slate-500">Busca y selecciona artículos</p>
                                    </div>

                                    {articuloSeleccionado ? (
                                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-4">
                                            <div className="flex justify-between items-start mb-3">
                                                <div>
                                                    <p className="font-semibold text-slate-800">{articuloSeleccionado.nombre}</p>
                                                    {articuloSeleccionado.modelo && (
                                                        <p className="text-sm text-slate-600">Modelo: {articuloSeleccionado.modelo}</p>
                                                    )}
                                                    <p className="text-sm text-slate-600">Stock disponible: <span className="font-bold text-slate-800">{articuloSeleccionado.stock_disponible} {articuloSeleccionado.requiere_serie ? 'unidades' : articuloSeleccionado.unidad_medida}</span></p>
                                                    {articuloSeleccionado.requiere_serie && (
                                                        <p className="text-xs text-blue-600 font-semibold mt-1">Requiere número de serie</p>
                                                    )}
                                                </div>
                                                <button
                                                    onClick={() => {
                                                        setArticuloSeleccionado(null);
                                                        setBusquedaArticulo("");
                                                        setSeriesAgregadas([]);
                                                        setNumeroSerie("");
                                                        setSerieSeleccionada(null);
                                                    }}
                                                    className="text-red-500 hover:text-red-700 font-semibold text-sm"
                                                >
                                                    Cambiar
                                                </button>
                                            </div>

                                            {/* Campo para artículos CON serie */}
                                            {articuloSeleccionado.requiere_serie ? (
                                                <>
                                                    {tipoMovimiento === "entrada" ? (
                                                        <div className="space-y-3">
                                                            <div className="flex gap-2">
                                                                <input
                                                                    type="text"
                                                                    placeholder="Número de serie"
                                                                    value={numeroSerie}
                                                                    onChange={(e) => setNumeroSerie(e.target.value)}
                                                                    className="flex-1 px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                                                />
                                                                <button
                                                                    onClick={handleAgregarSerie}
                                                                    className="px-4 py-2 bg-slate-800 text-white rounded-xl text-sm hover:bg-slate-900 font-semibold transition-colors"
                                                                >
                                                                    + Agregar
                                                                </button>
                                                            </div>
                                                            
                                                            {/* Lista de series agregadas */}
                                                            {seriesAgregadas.length > 0 && (
                                                                <div className="bg-blue-50 p-3 rounded border border-blue-200">
                                                                    <p className="text-xs font-semibold text-gray-600 mb-2">Series agregadas ({seriesAgregadas.length}):</p>
                                                                    <div className="space-y-1">
                                                                        {seriesAgregadas.map(s => (
                                                                            <div key={s.id} className="flex justify-between items-center text-xs bg-white p-2 rounded">
                                                                                <span className="font-mono text-blue-600">{s.numero_serie}</span>
                                                                                <button
                                                                                    onClick={() => handleEliminarSerie(s.id)}
                                                                                    className="text-red-500 hover:text-red-700 font-bold"
                                                                                >
                                                                                    ✕
                                                                                </button>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {/* Orden de Venta para SALIDA - ENTRADA con serie */}
                                                            {tipoMovimiento === "salida" && (
                                                                <div className="mb-3 bg-amber-50 p-3 rounded border border-amber-200">
                                                                    <label className="block text-xs font-medium text-gray-700 mb-2">Orden de Venta (Opcional)</label>
                                                                    {ordenVentaDetalleSeleccionada ? (
                                                                        <div className="bg-green-50 p-2 rounded border border-green-200">
                                                                            <div className="text-xs">
                                                                                <p className="font-semibold text-gray-800">#{ordenVentaDetalleSeleccionada.id}</p>
                                                                                <p className="text-gray-600">{ordenVentaDetalleSeleccionada.proyecto} • {ordenVentaDetalleSeleccionada.fecha}</p>
                                                                            </div>
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => {
                                                                                    setOrdenVentaDetalleSeleccionada(null);
                                                                                    setBusquedaOrdenVentaDetalle("");
                                                                                }}
                                                                                className="text-red-500 hover:text-red-700 text-xs font-semibold mt-1"
                                                                            >
                                                                                Cambiar
                                                                            </button>
                                                                        </div>
                                                                    ) : (
                                                                        <>
                                                                            <input
                                                                                type="text"
                                                                                placeholder="Buscar orden..."
                                                                                value={busquedaOrdenVentaDetalle}
                                                                                onChange={(e) => setBusquedaOrdenVentaDetalle(e.target.value)}
                                                                                className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-green-500"
                                                                            />
                                                                            {busquedaOrdenVentaDetalle && ordenesFiltradas.length > 0 && (
                                                                                <div className="max-h-24 overflow-y-auto border border-gray-200 rounded mt-1">
                                                                                    {ordenesFiltradas.map(orden => (
                                                                                        <button
                                                                                            type="button"
                                                                                            key={orden.id}
                                                                                            onClick={() => {
                                                                                                setOrdenVentaDetalleSeleccionada(orden);
                                                                                                setBusquedaOrdenVentaDetalle("");
                                                                                            }}
                                                                                            className="w-full p-1 text-left hover:bg-green-100 border-b border-gray-200 last:border-b-0 text-xs"
                                                                                        >
                                                                                            <div className="font-semibold">#{orden.id}</div>
                                                                                            <div className="text-gray-600 text-xs">{orden.proyecto} • {orden.fecha}</div>
                                                                                        </button>
                                                                                    ))}
                                                                                </div>
                                                                            )}
                                                                        </>
                                                                    )}
                                                                </div>
                                                            )}

                                                            <button
                                                                onClick={handleAgregarArticulo}
                                                                disabled={seriesAgregadas.length === 0}
                                                                className="w-full px-4 py-2.5 bg-green-500 text-white rounded-full text-sm hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed font-semibold shadow-sm hover:-translate-y-0.5 transition-all"
                                                            >
                                                                Agregar {seriesAgregadas.length} serie{seriesAgregadas.length !== 1 ? 's' : ''}
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        // SALIDA: Selector de serie
                                                        <div>
                                                            {cargandoSeries ? (
                                                                <p className="p-2 text-center text-gray-500 text-sm">Cargando series...</p>
                                                            ) : seriesDisponibles.length > 0 ? (
                                                                <>
                                                                    <select
                                                                        value={serieSeleccionada?.id || ""}
                                                                        onChange={(e) => {
                                                                            const serie = seriesDisponibles.find(s => s.id === parseInt(e.target.value));
                                                                            setSerieSeleccionada(serie);
                                                                        }}
                                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2 text-sm"
                                                                    >
                                                                        <option value="">Selecciona un número de serie</option>
                                                                        {seriesDisponibles.map(serie => (
                                                                            <option key={serie.id} value={serie.id}>
                                                                                {serie.numero_serie_fabricante || serie.codigo_interno_generado}
                                                                            </option>
                                                                        ))}
                                                                    </select>
                                                                    {/* Orden de Venta para SALIDA */}
                                                                    <div className="mb-3">
                                                                        <label className="block text-xs font-medium text-gray-700 mb-2">Orden de Venta (Opcional)</label>
                                                                        {ordenVentaDetalleSeleccionada ? (
                                                                            <div className="bg-green-50 p-2 rounded border border-green-200">
                                                                                <div className="text-xs">
                                                                                    <p className="font-semibold text-gray-800">#{ordenVentaDetalleSeleccionada.id}</p>
                                                                                    <p className="text-gray-600">{ordenVentaDetalleSeleccionada.proyecto} • {ordenVentaDetalleSeleccionada.fecha}</p>
                                                                                </div>
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() => {
                                                                                        setOrdenVentaDetalleSeleccionada(null);
                                                                                        setBusquedaOrdenVentaDetalle("");
                                                                                    }}
                                                                                    className="text-red-500 hover:text-red-700 text-xs font-semibold mt-1"
                                                                                >
                                                                                    Cambiar
                                                                                </button>
                                                                            </div>
                                                                        ) : (
                                                                            <>
                                                                                <input
                                                                                    type="text"
                                                                                    placeholder="Buscar orden..."
                                                                                    value={busquedaOrdenVentaDetalle}
                                                                                    onChange={(e) => setBusquedaOrdenVentaDetalle(e.target.value)}
                                                                                    className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-green-500"
                                                                                />
                                                                                {busquedaOrdenVentaDetalle && ordenesFiltradas.length > 0 && (
                                                                                    <div className="max-h-24 overflow-y-auto border border-gray-200 rounded mt-1">
                                                                                        {ordenesFiltradas.map(orden => (
                                                                                            <button
                                                                                                type="button"
                                                                                                key={orden.id}
                                                                                                onClick={() => {
                                                                                                    setOrdenVentaDetalleSeleccionada(orden);
                                                                                                    setBusquedaOrdenVentaDetalle("");
                                                                                                }}
                                                                                                className="w-full p-1 text-left hover:bg-green-100 border-b border-gray-200 last:border-b-0 text-xs"
                                                                                            >
                                                                                                <div className="font-semibold">#{orden.id}</div>
                                                                                                <div className="text-gray-600 text-xs">{orden.proyecto} • {orden.fecha}</div>
                                                                                            </button>
                                                                                        ))}
                                                                                    </div>
                                                                                )}
                                                                            </>
                                                                        )}
                                                                    </div>

                                                                    <button
                                                                        onClick={handleAgregarArticulo}
                                                                        disabled={!serieSeleccionada}
                                                                        className="w-full px-4 py-2.5 bg-green-500 text-white rounded-full text-sm hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed font-semibold shadow-sm hover:-translate-y-0.5 transition-all"
                                                                    >
                                                                        Agregar
                                                                    </button>
                                                                </>
                                                            ) : (
                                                                <p className="p-3 text-center text-red-600 text-sm font-semibold bg-red-50 rounded">No hay unidades disponibles</p>
                                                            )}
                                                        </div>
                                                    )}
                                                </>
                                            ) : (
                                                // Campo para artículos SIN serie
                                                <div>
                                                    <div className="flex gap-2 mb-3">
                                                        <input
                                                            type="number"
                                                            placeholder="Cantidad"
                                                            value={cantidad}
                                                            onChange={(e) => setCantidad(e.target.value)}
                                                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                                            max={tipoMovimiento === "salida" ? articuloSeleccionado.stock_disponible : undefined}
                                                        />
                                                    </div>

                                                    {/* Orden de Venta para SALIDA */}
                                                    {tipoMovimiento === "salida" && (
                                                        <div className="mb-3">
                                                            <label className="block text-xs font-medium text-gray-700 mb-2">Orden de Venta (Opcional)</label>
                                                            {ordenVentaDetalleSeleccionada ? (
                                                                <div className="bg-green-50 p-2 rounded border border-green-200">
                                                                    <div className="text-xs">
                                                                        <p className="font-semibold text-gray-800">#{ordenVentaDetalleSeleccionada.id}</p>
                                                                        <p className="text-gray-600">{ordenVentaDetalleSeleccionada.proyecto} • {ordenVentaDetalleSeleccionada.fecha}</p>
                                                                    </div>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => {
                                                                            setOrdenVentaDetalleSeleccionada(null);
                                                                            setBusquedaOrdenVentaDetalle("");
                                                                        }}
                                                                        className="text-red-500 hover:text-red-700 text-xs font-semibold mt-1"
                                                                    >
                                                                        Cambiar
                                                                    </button>
                                                                </div>
                                                            ) : (
                                                                <>
                                                                    <input
                                                                        type="text"
                                                                        placeholder="Buscar orden..."
                                                                        value={busquedaOrdenVentaDetalle}
                                                                        onChange={(e) => setBusquedaOrdenVentaDetalle(e.target.value)}
                                                                        className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-green-500"
                                                                    />
                                                                    {busquedaOrdenVentaDetalle && ordenesFiltradas.length > 0 && (
                                                                        <div className="max-h-24 overflow-y-auto border border-gray-200 rounded mt-1">
                                                                            {ordenesFiltradas.map(orden => (
                                                                                <button
                                                                                    type="button"
                                                                                    key={orden.id}
                                                                                    onClick={() => {
                                                                                        setOrdenVentaDetalleSeleccionada(orden);
                                                                                        setBusquedaOrdenVentaDetalle("");
                                                                                    }}
                                                                                    className="w-full p-1 text-left hover:bg-green-100 border-b border-gray-200 last:border-b-0 text-xs"
                                                                                >
                                                                                    <div className="font-semibold">#{orden.id}</div>
                                                                                    <div className="text-gray-600 text-xs">{orden.proyecto} • {orden.fecha}</div>
                                                                                </button>
                                                                            ))}
                                                                        </div>
                                                                    )}
                                                                </>
                                                            )}
                                                        </div>
                                                    )}

                                                    <button
                                                        onClick={handleAgregarArticulo}
                                                        className="w-full px-3 py-2 bg-green-500 text-white rounded text-sm hover:bg-green-600 font-semibold"
                                                    >
                                                        Agregar
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <>
                                            <input
                                                type="text"
                                                placeholder="Busca por nombre o modelo..."
                                                value={busquedaArticulo}
                                                onChange={(e) => setBusquedaArticulo(e.target.value)}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 mb-2"
                                            />

                                            {busquedaArticulo && (
                                                <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg">
                                                    {cargandoArticulos ? (
                                                        <p className="p-4 text-center text-gray-500">Buscando...</p>
                                                    ) : articulosFiltrados.length > 0 ? (
                                                        articulosFiltrados.map(art => (
                                                            <button
                                                                key={art.id}
                                                                onClick={() => {
                                                                    setArticuloSeleccionado(art);
                                                                    setBusquedaArticulo("");
                                                                    setNumeroSerie("");
                                                                    setSeriesAgregadas([]);
                                                                }}
                                                                className="w-full p-3 text-left hover:bg-amber-100 border-b border-gray-200 last:border-b-0 transition-colors"
                                                            >
                                                                <div className="flex justify-between items-start">
                                                                    <div>
                                                                        <p className="font-medium text-gray-800">{art.nombre}</p>
                                                                        <p className="text-xs text-gray-500">{art.modelo ? `Modelo: ${art.modelo}` : 'Sin modelo'}</p>
                                                                    </div>
                                                                    <div className="text-right">
                                                                        <p className="text-xs font-bold text-green-600">Stock: {art.stock_disponible}</p>
                                                                        {art.requiere_serie && (
                                                                            <p className="text-xs text-blue-600 font-semibold">Con serie</p>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </button>
                                                        ))
                                                    ) : (
                                                        <p className="p-4 text-center text-gray-500">No encontrado</p>
                                                    )}
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Columna de movimiento */}
                            <div className="lg:col-span-2 space-y-6">
                                <div className={`${colorBg} p-6 rounded-2xl border ${colorBorder} shadow-sm`}>
                                    <h2 className="text-xl font-semibold text-gray-800 mb-6">Detalles del {titulo}</h2>

                                    {/* Motivo */}
                                    <div className="mb-6">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Motivo del {titulo}</label>
                                        <input
                                            type="text"
                                            placeholder={`Ej: Compra a proveedor, Devolución, etc`}
                                            value={motivo}
                                            onChange={(e) => setMotivo(e.target.value)}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400"
                                        />
                                    </div>

                                    {/* Empleado y Proveedor */}
                                    <div className="grid grid-cols-2 gap-4 mb-6">
                                        {/* Empleado */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Empleado Responsable (Opcional)</label>
                                            {empleadoSeleccionado ? (
                                                <div className="bg-white p-3 rounded-lg border border-gray-200">
                                                    <p className="font-medium text-gray-800">{empleadoSeleccionado.nombre}</p>
                                                    <button
                                                        onClick={() => {
                                                            setEmpleadoSeleccionado(null);
                                                            setBusquedaEmpleado("");
                                                        }}
                                                        className="text-red-500 hover:text-red-700 text-xs font-semibold mt-1"
                                                    >
                                                        Cambiar
                                                    </button>
                                                </div>
                                            ) : (
                                                <>
                                                    <input
                                                        type="text"
                                                        placeholder="Buscar empleado..."
                                                        value={busquedaEmpleado}
                                                        onChange={(e) => setBusquedaEmpleado(e.target.value)}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                                    />
                                                    {busquedaEmpleado && empleadosFiltrados.length > 0 && (
                                                        <div className="max-h-32 overflow-y-auto border border-gray-200 rounded-lg mt-1">
                                                            {empleadosFiltrados.map(emp => (
                                                                <button
                                                                    key={emp.id}
                                                                    onClick={() => {
                                                                        setEmpleadoSeleccionado(emp);
                                                                        setBusquedaEmpleado("");
                                                                    }}
                                                                    className="w-full p-2 text-left hover:bg-blue-100 border-b border-gray-200 last:border-b-0 text-xs"
                                                                >
                                                                    {emp.nombre}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    )}
                                                </>
                                            )}
                                        </div>

                                        {/* Proveedor */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Proveedor (Opcional)</label>
                                            {proveedorSeleccionado ? (
                                                <div className="bg-white p-3 rounded-lg border border-gray-200">
                                                    <p className="font-medium text-gray-800">{proveedorSeleccionado.nombre}</p>
                                                    <button
                                                        onClick={() => {
                                                            setProveedorSeleccionado(null);
                                                            setBusquedaProveedor("");
                                                        }}
                                                        className="text-red-500 hover:text-red-700 text-xs font-semibold mt-1"
                                                    >
                                                        Cambiar
                                                    </button>
                                                </div>
                                            ) : (
                                                <>
                                                    <input
                                                        type="text"
                                                        placeholder="Buscar proveedor..."
                                                        value={busquedaProveedor}
                                                        onChange={(e) => setBusquedaProveedor(e.target.value)}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                                                    />
                                                    {busquedaProveedor && proveedoresFiltrados.length > 0 && (
                                                        <div className="max-h-32 overflow-y-auto border border-gray-200 rounded-lg mt-1">
                                                            {proveedoresFiltrados.map(prov => (
                                                                <button
                                                                    key={prov.id}
                                                                    onClick={() => {
                                                                        setProveedorSeleccionado(prov);
                                                                        setBusquedaProveedor("");
                                                                    }}
                                                                    className="w-full p-2 text-left hover:bg-purple-100 border-b border-gray-200 last:border-b-0 text-xs"
                                                                >
                                                                    {prov.nombre}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    {/* Lista de artículos */}
                                    {articulos.length > 0 ? (
                                        <div className="border-t pt-6">
                                            <h3 className="font-semibold text-gray-800 mb-3">Artículos a {titulo.toLowerCase()}</h3>
                                            <div className="space-y-2">
                                                {articulos.map(art => (
                                                    <div key={art.id} className="bg-white p-3 rounded-lg border border-gray-200 flex justify-between items-start">
                                                        <div className="flex-1">
                                                            <p className="font-medium text-gray-800">{art.nombre}</p>
                                                            {art.requiere_serie ? (
                                                                <p className="text-sm text-gray-600">
                                                                    Serie: <span className="font-semibold">{art.numero_serie}</span>
                                                                </p>
                                                            ) : (
                                                                <p className="text-sm text-gray-600">
                                                                    Cantidad: <span className="font-semibold">{art.cantidad} {art.unidad_medida}</span>
                                                                </p>
                                                            )}
                                                            {art.modelo && (
                                                                <p className="text-xs text-gray-500">Modelo: {art.modelo}</p>
                                                            )}
                                                            {art.orden_venta_id && (
                                                                <p className="text-xs text-green-600 font-semibold mt-1">
                                                                    Orden de Venta: <span className="bg-green-100 px-2 py-0.5 rounded">#{art.orden_venta_id}</span>
                                                                </p>
                                                            )}
                                                        </div>
                                                        <button
                                                            onClick={() => handleEliminarArticulo(art.id)}
                                                            className="px-3 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600 transition-colors font-semibold"
                                                        >
                                                            Eliminar
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="border-t pt-6 text-center text-gray-500 text-sm">
                                            No hay artículos agregados aún
                                        </div>
                                    )}
                                </div>

                                {/* Botones de acción */}
                                <div className="flex gap-4">
                                    <button
                                        onClick={() => navigate('/mostrador')}
                                        className="flex-1 px-6 py-3 bg-gray-500 text-white font-bold rounded-lg hover:bg-gray-600 transition-colors"
                                    >
                                        ← Volver
                                    </button>
                                    <button
                                        onClick={handleConfirmarMovimiento}
                                        disabled={articulos.length === 0}
                                        className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-blue-500 text-white font-bold rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Confirmar y Registrar
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
        </div>
    );
}
