import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from 'react-router-dom';
import { DatePicker } from '../../../components/ui/date-picker';
import { SelectPremium } from '../../../components/ui/SelectPremium';
import { format } from 'date-fns';

export default function RegistroMovimientosPage() {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

    const [movimientos, setMovimientos] = useState([]);
    const [detalles, setDetalles] = useState([]);
    const [cargando, setCargando] = useState(false);

    const [tabActiva, setTabActiva] = useState(searchParams.get('activeTab') || 'movimientos');
    const [busquedaMovimiento, setBusquedaMovimiento] = useState(searchParams.get('busqueda') || '');
    const [tipoFiltro, setTipoFiltro] = useState(searchParams.get('tipo') || '');
    
    // Dates can be strings or Date objects
    const initialFechaInicio = searchParams.get('fecha_inicio');
    const initialFechaFin = searchParams.get('fecha_fin');
    const [fechaInicio, setFechaInicio] = useState(initialFechaInicio ? new Date(initialFechaInicio + 'T00:00:00') : '');
    const [fechaFin, setFechaFin] = useState(initialFechaFin ? new Date(initialFechaFin + 'T00:00:00') : '');
    const [busquedaArticulo, setBusquedaArticulo] = useState(searchParams.get('busqueda_articulo') || '');

    useEffect(() => {
        const fetchDatos = async () => {
            setCargando(true);
            try {
                // Replace with your API URL if it changes
                const response = await fetch(`/api/movimientos-historial?${searchParams.toString()}`);
                if (response.ok) {
                    const data = await response.json();
                    setMovimientos(data.movimientos || []);
                    setDetalles(data.detalles || []);
                }
            } catch (error) {
                console.error("Error cargando historial", error);
            } finally {
                setCargando(false);
            }
        };
        fetchDatos();
    }, [searchParams]);

    const handleBuscarMovimientos = (e) => {
        e.preventDefault();
        setSearchParams({
            busqueda: busquedaMovimiento,
            tipo: tipoFiltro,
            fecha_inicio: fechaInicio ? format(fechaInicio, 'yyyy-MM-dd') : '',
            fecha_fin: fechaFin ? format(fechaFin, 'yyyy-MM-dd') : '',
            busqueda_articulo: '',
            activeTab: 'movimientos'
        });
    };

    const handleBuscarArticulos = (e) => {
        e.preventDefault();
        setSearchParams({
            busqueda_articulo: busquedaArticulo || '',
            busqueda: '',
            tipo: '',
            fecha_inicio: '',
            fecha_fin: '',
            activeTab: 'articulos',
            cargar_articulos: 'true'
        });
    };

    const handleLimpiarFiltros = () => {
        setBusquedaMovimiento('');
        setTipoFiltro('');
        setFechaInicio('');
        setFechaFin('');
        setTabActiva('movimientos');
        setSearchParams({ activeTab: 'movimientos' });
    };

    const handleCambiarPestaniaMovimientos = () => {
        setTabActiva('movimientos');
        // Limpiar filtros de artículos
        setBusquedaArticulo('');
    };

    const handleCambiarPestaniaArticulos = () => {
        setTabActiva('articulos');
        setBusquedaMovimiento('');
        setTipoFiltro('');
        setFechaInicio('');
        setFechaFin('');
        setSearchParams({ activeTab: 'articulos', cargar_articulos: 'true' });
    };

    return (
        <div className="min-h-screen bg-slate-50 p-8">


                    {/* Tabs */}
                    <div className="p-0">
                        <div className="flex gap-4 mb-6 border-b border-slate-200">
                            <button
                                onClick={handleCambiarPestaniaMovimientos}
                                className={`px-6 py-3 font-semibold transition-all ${
                                    tabActiva === 'movimientos'
                                        ? 'text-blue-600 border-b-2 border-blue-600'
                                        : 'text-slate-500 hover:text-slate-800'
                                }`}
                            >
                                Movimientos Generales
                            </button>
                            <button
                                onClick={handleCambiarPestaniaArticulos}
                                className={`px-6 py-3 font-semibold transition-all ${
                                    tabActiva === 'articulos'
                                        ? 'text-blue-600 border-b-2 border-blue-600'
                                        : 'text-slate-500 hover:text-slate-800'
                                }`}
                            >
                                Búsqueda de Artículos
                            </button>
                        </div>

                        {/* TAB: MOVIMIENTOS GENERALES */}
                        {tabActiva === 'movimientos' && (
                            <div className="space-y-6">
                                {/* Filtros */}
                                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm !ring-0">
                                    <h2 className="text-lg font-semibold text-gray-800 mb-4">Filtros de Búsqueda</h2>
                                    
                                    <form onSubmit={handleBuscarMovimientos} className="space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Buscar por Notas</label>
                                                <input
                                                    type="text"
                                                    placeholder="Escribe para buscar..."
                                                    value={busquedaMovimiento}
                                                    onChange={(e) => setBusquedaMovimiento(e.target.value)}
                                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 mb-2">Tipo de Movimiento</label>
                                                <SelectPremium
                                                    value={tipoFiltro}
                                                    onChange={setTipoFiltro}
                                                    options={[
                                                        { value: '', label: 'Todos' },
                                                        { value: 'ENTRADA', label: 'Entrada' },
                                                        { value: 'SALIDA', label: 'Salida' }
                                                    ]}
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 mb-2">Fecha Inicio</label>
                                                <DatePicker
                                                    value={fechaInicio}
                                                    onChange={setFechaInicio}
                                                    placeholder="Selecciona inicio..."
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 mb-2">Fecha Fin</label>
                                                <DatePicker
                                                    value={fechaFin}
                                                    onChange={setFechaFin}
                                                    placeholder="Selecciona fin..."
                                                />
                                            </div>
                                        </div>

                                        <div className="flex gap-2">
                                            <button
                                                type="submit"
                                                className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-full hover:bg-blue-700 transition-colors shadow-sm"
                                            >
                                                Buscar
                                            </button>
                                            <button
                                                type="button"
                                                onClick={handleLimpiarFiltros}
                                                className="px-6 py-2 bg-slate-100 text-slate-700 font-semibold rounded-full hover:bg-slate-200 transition-colors shadow-sm"
                                            >
                                                Limpiar Filtros
                                            </button>
                                        </div>
                                    </form>
                                </div>

                                {/* Tabla de Movimientos */}
                                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm !ring-0">
                                    <h2 className="text-lg font-semibold text-slate-800 mb-4">Movimientos Registrados</h2>
                                    
                                    {cargando ? (
                                        <p className="text-center text-slate-500 py-8">Cargando datos...</p>
                                    ) : movimientos.length > 0 ? (
                                        <div className="overflow-hidden rounded-xl border border-slate-200">
                                            <table className="w-full text-sm border-collapse table-fixed">
                                                <thead>
                                                    <tr className="bg-gray-100 border-b-2 border-gray-300">
                                                        <th className="p-3 text-left font-semibold">Tipo</th>
                                                        <th className="p-3 text-left font-semibold">Notas</th>
                                                        <th className="p-3 text-center font-semibold">Artículos</th>
                                                        <th className="p-3 text-left font-semibold">Fecha</th>
                                                        <th className="p-3 text-center font-semibold">Acciones</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {movimientos.map((mov, idx) => (
                                                        <tr 
                                                            key={idx}
                                                            onClick={() => navigate(`/mostrador/movimientos/${mov.id}`)}
                                                            className="border-b border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors"
                                                        >
                                                            <td className="p-3">
                                                                <span className={`px-3 py-1 rounded-full text-white text-xs font-bold ${
                                                                    mov.tipo_movimiento === 'ENTRADA' ? 'bg-green-500' : 'bg-red-500'
                                                                }`}>
                                                                    {mov.tipo_movimiento === 'ENTRADA' ? '📥 Entrada' : '📤 Salida'}
                                                                </span>
                                                            </td>
                                                            <td className="p-3 text-slate-800 truncate" title={mov.notas}>{mov.notas}</td>
                                                            <td className="p-3 text-center font-semibold text-slate-800">{mov.cantidad_detalles}</td>
                                                            <td className="p-3 text-slate-700">{mov.fecha}</td>
                                                            <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                                                                <button
                                                                    onClick={() => navigate(`/mostrador/movimientos/${mov.id}`)}
                                                                    className="px-4 py-1.5 bg-blue-50 text-blue-700 rounded-full text-xs font-semibold hover:bg-blue-100 transition-colors"
                                                                >
                                                                    Ver Detalles
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    ) : (
                                        <p className="text-center text-gray-500 py-8">No hay movimientos que coincidan con los filtros</p>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* TAB: BÚSQUEDA DE ARTÍCULOS */}
                        {tabActiva === 'articulos' && (
                            <div className="space-y-6">
                                {/* Búsqueda de Artículos */}
                                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm !ring-0">
                                    <h2 className="text-lg font-semibold text-gray-800 mb-4">Buscar Artículos en Movimientos</h2>
                                    
                                    <form onSubmit={handleBuscarArticulos} className="flex gap-4">
                                        <div className="flex-1">
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Nombre del Artículo</label>
                                            <input
                                                type="text"
                                                placeholder="Escribe el nombre del artículo..."
                                                value={busquedaArticulo}
                                                onChange={(e) => setBusquedaArticulo(e.target.value)}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                        <div className="flex items-end gap-2">
                                            <button
                                                type="submit"
                                                className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-full hover:bg-blue-700 transition-colors shadow-sm"
                                            >
                                                Buscar
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setBusquedaArticulo('');
                                                    setSearchParams({ activeTab: 'articulos', cargar_articulos: 'true' });
                                                }}
                                                className="px-6 py-2 bg-slate-100 text-slate-700 font-semibold rounded-full hover:bg-slate-200 transition-colors shadow-sm"
                                            >
                                                Limpiar
                                            </button>
                                        </div>
                                    </form>
                                </div>

                                {/* Tabla de Artículos */}
                                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm !ring-0">
                                    <h2 className="text-lg font-semibold text-slate-800 mb-4">Artículos Encontrados</h2>
                                    
                                    {cargando ? (
                                        <p className="text-center text-slate-500 py-8">Cargando datos...</p>
                                    ) : detalles.length > 0 ? (
                                        <div className="overflow-hidden rounded-xl border border-slate-200">
                                            <table className="w-full text-sm border-collapse table-fixed">
                                                <thead>
                                                    <tr className="bg-gray-100 border-b-2 border-gray-300">
                                                        <th className="p-3 text-left font-semibold">Artículo</th>
                                                        <th className="p-3 text-center font-semibold">Cantidad</th>
                                                        <th className="p-3 text-left font-semibold">Tipo Movimiento</th>
                                                        <th className="p-3 text-left font-semibold">Orden Venta</th>
                                                        <th className="p-3 text-left font-semibold">Fecha</th>
                                                        <th className="p-3 text-center font-semibold">Acciones</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {detalles.map((det, idx) => (
                                                        <tr 
                                                            key={idx}
                                                            onClick={() => navigate(`/mostrador/movimientos/${det.movimiento_id}`)}
                                                            className="border-b border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors"
                                                        >
                                                            <td className="p-3 font-medium text-slate-800">{det.articulo_nombre}</td>
                                                            <td className="p-3 text-center font-semibold text-slate-800">{det.cantidad}</td>
                                                            <td className="p-3">
                                                                <span className={`px-3 py-1 rounded-full text-white text-xs font-bold ${
                                                                    det.movimiento_tipo === 'ENTRADA' ? 'bg-green-500' : 'bg-red-500'
                                                                }`}>
                                                                    {det.movimiento_tipo === 'ENTRADA' ? '📥 Entrada' : '📤 Salida'}
                                                                </span>
                                                            </td>
                                                            <td className="p-3 text-slate-700">
                                                                {det.orden_venta_id ? (
                                                                    <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-semibold">
                                                                        #{det.orden_venta_id}
                                                                    </span>
                                                                ) : (
                                                                    <span className="text-slate-400 text-xs">—</span>
                                                                )}
                                                            </td>
                                                            <td className="p-3 text-slate-700">{det.fecha}</td>
                                                            <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                                                                <button
                                                                    onClick={() => navigate(`/mostrador/movimientos/${det.movimiento_id}`)}
                                                                    className="px-4 py-1.5 bg-blue-50 text-blue-700 rounded-full text-xs font-semibold hover:bg-blue-100 transition-colors"
                                                                >
                                                                    Ver Movimiento
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    ) : (
                                        <p className="text-center text-slate-500 py-8">
                                            {busquedaArticulo ? 'No se encontraron artículos' : 'Busca un artículo para ver resultados'}
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
        </div>
    );
}
