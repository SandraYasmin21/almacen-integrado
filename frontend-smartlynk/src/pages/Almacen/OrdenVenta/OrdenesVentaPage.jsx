import React, { useState, useEffect, useMemo } from "react";
import { router } from '@inertiajs/react';

export default function OrdenesVentaPage({ ordenesVenta = [] }) {
    const [cargando, setCargando] = useState(false);
    const [ordenes, setOrdenes] = useState(ordenesVenta);
    const [busqueda, setBusqueda] = useState("");
    const [filtroEstado, setFiltroEstado] = useState("TODOS");

    // Recargar ordenes desde el endpoint API
    const cargarOrdenes = async () => {
        try {
            setCargando(true);
            const response = await fetch("/api/inventario/ordenes");
            const data = await response.json();
            setOrdenes(data.ordenes || []);
        } catch (error) {
            console.error("Error cargando ordenes:", error);
        } finally {
            setCargando(false);
        }
    };

    // Estilos de badges para cada estado
    const getEstadoStyle = (estado) => {
        switch (estado?.toLowerCase()) {
            case 'pendiente':
                return 'bg-amber-100 text-amber-800 border-amber-200';
            case 'completada':
                return 'bg-emerald-100 text-emerald-800 border-emerald-200';
            default:
                return 'bg-slate-100 text-slate-800 border-slate-200';
        }
    };

    // Filtrar y buscar órdenes
    const ordenesFiltradas = useMemo(() => {
        return ordenes.filter(orden => {
            // Filtro por Estado
            const matchesEstado = filtroEstado === "TODOS" || 
                (filtroEstado === "PENDIENTE" && orden.estado?.toLowerCase() === "pendiente") ||
                (filtroEstado === "COMPLETADA" && orden.estado?.toLowerCase() === "completada");

            // Filtro por Búsqueda (ID o Proyecto)
            const query = busqueda.toLowerCase().trim();
            const matchesBusqueda = !query ||
                orden.id?.toString().includes(query) ||
                orden.proyecto?.toLowerCase().includes(query);

            return matchesEstado && matchesBusqueda;
        });
    }, [ordenes, filtroEstado, busqueda]);

    // Estadísticas
    const stats = useMemo(() => {
        const total = ordenes.length;
        const completadas = ordenes.filter(o => o.estado?.toLowerCase() === 'completada').length;
        const pendientes = ordenes.filter(o => o.estado?.toLowerCase() === 'pendiente').length;
        const totalItems = ordenes.reduce((acc, o) => acc + (Number(o.total_items) || 0), 0);

        return { total, completadas, pendientes, totalItems };
    }, [ordenes]);

    return (
        <div className="flex">
            {/* Supuesto menú lateral */}
            <aside className="w-1/6 h-screen bg-gray-200 p-4">
                Supuesto menu lateral
            </aside>

            <main className="w-5/6">
                {/* Supuesto menú superior */}
                <header className="bg-gray-200">
                    Supuesto menu superior
                </header>

                <section className="bg-gray-100 min-h-screen">
                    {/* Encabezado y Botón de Acción */}
                    <div className="bg-blue-800 flex flex-row gap-4 justify-between items-center p-8 rounded-b-3xl">
                        <h1 className="text-start text-white text-4xl font-bold">Gestión de Ordenes de Venta</h1>
                        <button
                            onClick={cargarOrdenes}
                            disabled={cargando}
                            className="px-4 py-2 bg-white text-blue-800 font-semibold rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
                        >
                            {cargando ? '⌛ Cargando...' : '🔄 Actualizar'}
                        </button>
                    </div>

                    <div className="p-6 space-y-6">

                    {/* Fila de Estadísticas */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total de Ordenes</span>
                            <div className="flex items-baseline justify-between mt-2">
                                <span className="text-3xl font-extrabold text-slate-800">{stats.total}</span>
                                <span className="p-1.5 bg-slate-100 text-slate-600 rounded-lg text-sm">📋</span>
                            </div>
                        </div>

                        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Pendientes</span>
                            <div className="flex items-baseline justify-between mt-2">
                                <span className="text-3xl font-extrabold text-amber-600">{stats.pendientes}</span>
                                <span className="p-1.5 bg-amber-50 text-amber-700 rounded-lg text-sm font-bold">⚡</span>
                            </div>
                        </div>

                        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Completadas</span>
                            <div className="flex items-baseline justify-between mt-2">
                                <span className="text-3xl font-extrabold text-emerald-600">{stats.completadas}</span>
                                <span className="p-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-sm font-bold">✓</span>
                            </div>
                        </div>

                        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Artículos Requeridos</span>
                            <div className="flex items-baseline justify-between mt-2">
                                <span className="text-3xl font-extrabold text-blue-600">{stats.totalItems}</span>
                                <span className="p-1.5 bg-blue-50 text-blue-700 rounded-lg text-sm font-bold">📦</span>
                            </div>
                        </div>
                    </div>

                    {/* Barra de Filtros y Búsqueda */}
                    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-4 items-center justify-between">
                        {/* Buscador */}
                        <div className="relative w-full md:w-96">
                            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                                🔍
                            </span>
                            <input
                                type="text"
                                placeholder="Buscar por ID o proyecto..."
                                value={busqueda}
                                onChange={(e) => setBusqueda(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-slate-700 placeholder-slate-400"
                            />
                            {busqueda && (
                                <button
                                    onClick={() => setBusqueda("")}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 text-sm font-bold"
                                >
                                    ✕
                                </button>
                            )}
                        </div>

                        {/* Filtros de Estado */}
                        <div className="flex flex-wrap gap-2 w-full md:w-auto">
                            {[
                                { key: "TODOS", label: "Todas" },
                                { key: "PENDIENTE", label: "⏳ Pendientes" },
                                { key: "COMPLETADA", label: "✓ Completadas" }
                            ].map((btn) => (
                                <button
                                    key={btn.key}
                                    onClick={() => setFiltroEstado(btn.key)}
                                    className={`px-4 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                                        filtroEstado === btn.key
                                            ? 'bg-blue-600 border-blue-600 text-white shadow-xs'
                                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                                    }`}
                                >
                                    {btn.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Listado de Órdenes */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <div>
                                <h2 className="text-lg font-bold text-slate-800">Órdenes de Venta Registradas</h2>
                                <p className="text-xs text-slate-400 mt-0.5">
                                    Se muestran {ordenesFiltradas.length} órdenes filtradas
                                </p>
                            </div>
                            <span className="text-xs bg-slate-100 text-slate-500 font-semibold px-2 py-1 rounded">
                                Ordenado por: Prioridad (Pendientes primero) & Fecha
                            </span>
                        </div>

                        {cargando ? (
                            <div className="p-16 flex flex-col items-center justify-center space-y-4">
                                <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-600 border-t-transparent"></div>
                                <p className="text-sm font-medium text-slate-500">Cargando catálogo de órdenes de venta...</p>
                            </div>
                        ) : ordenesFiltradas.length > 0 ? (
                            <div className="p-6 space-y-3">
                                {ordenesFiltradas.map((orden) => (
                                    <div
                                        key={orden.id}
                                        onClick={() => router.visit(`/ordenes/${orden.id}`)}
                                        className="w-full p-4 border border-slate-100 hover:border-blue-200 bg-white hover:bg-blue-50/20 rounded-xl transition-all duration-200 text-left cursor-pointer flex items-center justify-between group shadow-2xs hover:shadow-xs hover:-translate-y-0.5"
                                    >
                                        <div className="flex items-center gap-4 flex-1">
                                            {/* Badge de Estado */}
                                            <span className={`px-3 py-1 rounded-lg text-xs font-bold border whitespace-nowrap tracking-wide text-center w-28 ${getEstadoStyle(orden.estado)}`}>
                                                {orden.estado || 'Indefinido'}
                                            </span>

                                            {/* Detalles Generales */}
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <p className="text-sm font-bold text-slate-800">Orden #{orden.id}</p>
                                                    <span className="text-slate-300">•</span>
                                                    <p className="text-sm font-medium text-slate-600">{orden.proyecto}</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Estadísticas de items y fecha */}
                                        <div className="flex items-center gap-8">
                                            <div className="text-right space-y-0.5">
                                                <p className="text-xs font-bold text-slate-700">{orden.articulos} renglones</p>
                                                <p className="text-[10px] text-slate-400 font-semibold uppercase">Total: {orden.total_items} unidades</p>
                                            </div>
                                            <div className="text-right space-y-0.5">
                                                <p className="text-xs font-medium text-slate-600">{orden.fecha}</p>
                                                <p className="text-[10px] text-slate-400 font-semibold uppercase">Fecha Registro</p>
                                            </div>
                                            <span className="text-slate-300 group-hover:text-blue-600 group-hover:translate-x-1 transition-all font-bold text-lg">
                                                →
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-20 bg-slate-50/50">
                                <span className="text-4xl block mb-3">📋</span>
                                <h3 className="text-slate-700 font-bold text-base">No se encontraron órdenes</h3>
                                <p className="text-slate-400 text-xs mt-1 max-w-xs mx-auto">
                                    Intenta cambiando el filtro de estado o modificando los términos de tu búsqueda.
                                </p>
                                <button
                                    onClick={() => {
                                        setBusqueda("");
                                        setFiltroEstado("TODOS");
                                    }}
                                    className="mt-4 px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-xs"
                                >
                                    Limpiar Filtros
                                </button>
                            </div>
                        )}
                    </div>
                    </div>
                </section>
            </main>
        </div>
    );
}
