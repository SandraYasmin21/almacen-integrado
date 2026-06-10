import React from "react";
import { router } from '@inertiajs/react';

export default function DetallesOrdenVentaPage({ orden = {}, detalles = [] }) {
    // Definir colores según el estado de la orden
    const getEstadoStyle = (estado) => {
        switch (estado?.toLowerCase()) {
            case 'pendiente':
                return 'bg-amber-100 text-amber-800 border-amber-200';
            case 'completada':
                return 'bg-emerald-100 text-emerald-800 border-emerald-200';
            case 'confirmada':
                return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'en proceso':
                return 'bg-indigo-100 text-indigo-800 border-indigo-200';
            case 'borrador':
                return 'bg-gray-100 text-gray-800 border-gray-200';
            default:
                return 'bg-slate-100 text-slate-800 border-slate-200';
        }
    };

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
                    {/* Encabezado Principal */}
                    <div className="bg-blue-800 flex flex-row gap-4 justify-between items-center p-8 rounded-b-3xl">
                        <h1 className="text-start text-white text-4xl font-bold m-4">
                            Detalles de Orden de Venta
                        </h1>
                        <button
                            onClick={() => router.visit('/ordenes')}
                            className="px-6 py-2 bg-white text-blue-800 font-bold rounded-lg hover:bg-gray-100 transition-colors"
                        >
                            ← Volver a Ordenes
                        </button>
                    </div>

                    <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Información General */}
                        <div className="col-span-1 md:col-span-3">
                            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                                <div className="mb-4">
                                    <h2 className="text-lg font-semibold text-gray-800 mb-4">Información de la Orden</h2>
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                    <article className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                        <p className="text-xs text-gray-500 font-semibold mb-1">ID de Orden</p>
                                        <p className="text-sm font-bold text-gray-800">#{orden.id}</p>
                                    </article>

                                    <article className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                        <p className="text-xs text-gray-500 font-semibold mb-1">Estado</p>
                                        <span className={`px-3 py-1 rounded text-xs font-bold inline-block border ${getEstadoStyle(orden.estado)}`}>
                                            {orden.estado || 'Desconocido'}
                                        </span>
                                    </article>

                                    <article className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                        <p className="text-xs text-gray-500 font-semibold mb-1">Proyecto</p>
                                        <p className="text-sm font-medium text-gray-800">{orden.proyecto || 'Sin proyecto'}</p>
                                    </article>

                                    <article className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                        <p className="text-xs text-gray-500 font-semibold mb-1">Fecha / Hora</p>
                                        <p className="text-sm font-medium text-gray-800">{orden.fecha_hora || '—'}</p>
                                    </article>

                                    <article className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                        <p className="text-xs text-gray-500 font-semibold mb-1">Total de Ítems</p>
                                        <p className="text-sm font-bold text-blue-600">
                                            {detalles.length} artículo{detalles.length !== 1 ? 's' : ''}
                                        </p>
                                    </article>
                                </div>
                            </div>
                        </div>

                        {/* Artículos de la Orden */}
                        <div className="col-span-1 md:col-span-3">
                            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                                <div className="mb-4">
                                    <h2 className="text-lg font-semibold text-gray-800">Artículos Solicitados</h2>
                                    <p className="text-sm text-gray-500">Listado de productos requeridos para esta orden de venta</p>
                                </div>

                                {detalles.length > 0 ? (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm border-collapse">
                                            <thead>
                                                <tr className="bg-gray-100 border-b-2 border-gray-300">
                                                    <th className="p-3 text-left font-semibold">ID Artículo</th>
                                                    <th className="p-3 text-left font-semibold">Artículo</th>
                                                    <th className="p-3 text-center font-semibold">Cant. Solicitada</th>
                                                    <th className="p-3 text-center font-semibold">Cant. Despachada</th>
                                                    <th className="p-3 text-center font-semibold">Diferencia</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {detalles.map((detalle, idx) => {
                                                    const solicitada = Number(detalle.cantidad_solicitada) || 0;
                                                    const despachada = Number(detalle.cantidad_despachada) || 0;
                                                    const diferencia = solicitada - despachada;
                                                    
                                                    return (
                                                        <tr key={idx} className="border-b border-gray-200 hover:bg-slate-50 transition-colors">
                                                            <td className="p-3 text-gray-600 font-mono text-xs">
                                                                #{detalle.articulo_id}
                                                            </td>
                                                            <td className="p-3 font-medium text-gray-800">
                                                                {detalle.articulo_nombre || 'Artículo no especificado'}
                                                            </td>
                                                            <td className="p-3 text-center font-semibold text-gray-800">
                                                                {solicitada}
                                                            </td>
                                                            <td className="p-3 text-center font-semibold text-gray-800">
                                                                {despachada}
                                                            </td>
                                                            <td className="p-3 text-center">
                                                                <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                                                                    diferencia === 0 
                                                                        ? 'bg-emerald-100 text-emerald-800' 
                                                                        : diferencia > 0 
                                                                            ? 'bg-amber-100 text-amber-800' 
                                                                            : 'bg-rose-100 text-rose-800'
                                                                }`}>
                                                                    {diferencia === 0 ? 'Completo' : `${diferencia} pendiente(s)`}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <p className="text-center text-gray-500 py-8">No hay artículos cargados en esta orden.</p>
                                )}
                            </div>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
}
