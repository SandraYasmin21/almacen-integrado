import React, { useState } from "react";
import { router } from '@inertiajs/react';

export default function DetallesMovimientoPage({ movimiento = {}, detalles = [] }) {
    const [detalleSeleccionado, setDetalleSeleccionado] = useState(null);

    return (
        <div className="flex">
            <aside className="w-1/6 h-screen bg-gray-200 p-4">
                Supuesto menu lateral
            </aside>
            <main className="w-5/6">
                <header className="bg-gray-200">
                    Supuesto menu superior
                </header>
                <section className="bg-gray-100">
                    <div className="bg-blue-800 flex flex-row gap-4 justify-between items-center p-8 rounded-b-3xl">
                        <h1 className="text-start text-white text-4xl font-bold m-4">
                            Detalles del Movimiento
                        </h1>
                        <button
                            onClick={() => router.visit('/movimientos')}
                            className="px-6 py-2 bg-white text-blue-800 font-bold rounded-lg hover:bg-gray-100 transition-colors"
                        >
                            ← Volver
                        </button>
                    </div>

                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Información General del Movimiento */}
                        <div className="col-span-1 md:col-span-2">
                            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                                <div className="mb-4">
                                    <h2 className="text-lg font-semibold text-gray-800 mb-4">Información General</h2>
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <article className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                        <p className="text-xs text-gray-500 font-semibold mb-1">Tipo de Movimiento</p>
                                        <span className={`px-3 py-1 rounded text-white text-sm font-bold inline-block ${
                                            movimiento.tipo_movimiento === 'ENTRADA' ? 'bg-green-500' : 'bg-red-500'
                                        }`}>
                                            {movimiento.tipo_movimiento === 'ENTRADA' ? '📥 Entrada' : '📤 Salida'}
                                        </span>
                                    </article>

                                    <article className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                        <p className="text-xs text-gray-500 font-semibold mb-1">Fecha</p>
                                        <p className="text-sm font-medium text-gray-800">{movimiento.fecha || '—'}</p>
                                    </article>

                                    <article className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                        <p className="text-xs text-gray-500 font-semibold mb-1">Usuario</p>
                                        <p className="text-sm font-medium text-gray-800">{movimiento.usuario || '—'}</p>
                                    </article>

                                    <article className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                        <p className="text-xs text-gray-500 font-semibold mb-1">Total Artículos</p>
                                        <p className="text-sm font-bold text-blue-600">{detalles.length} artículo{detalles.length !== 1 ? 's' : ''}</p>
                                    </article>

                                    {movimiento.empleado && movimiento.empleado !== 'N/A' && (
                                        <article className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                            <p className="text-xs text-gray-500 font-semibold mb-1">Empleado Responsable</p>
                                            <p className="text-sm font-medium text-gray-800">{movimiento.empleado}</p>
                                        </article>
                                    )}

                                    {movimiento.proveedor && movimiento.proveedor !== 'N/A' && (
                                        <article className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                            <p className="text-xs text-gray-500 font-semibold mb-1">Proveedor</p>
                                            <p className="text-sm font-medium text-gray-800">{movimiento.proveedor}</p>
                                        </article>
                                    )}

                                    {movimiento.notas && (
                                        <article className="bg-gray-50 p-4 rounded-lg border border-gray-200 col-span-2 md:col-span-1">
                                            <p className="text-xs text-gray-500 font-semibold mb-1">Notas del Movimiento</p>
                                            <p className="text-sm font-medium text-gray-800" title={movimiento.notas}>{movimiento.notas}</p>
                                        </article>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Tabla de Detalles */}
                        <div className="col-span-1 md:col-span-2">
                            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                                <div className="mb-4">
                                    <h2 className="text-lg font-semibold text-gray-800">Artículos del Movimiento</h2>
                                    <p className="text-sm text-gray-500">Presiona en un artículo para ver más detalles</p>
                                </div>

                                {detalles.length > 0 ? (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm border-collapse">
                                            <thead>
                                                <tr className="bg-gray-100 border-b-2 border-gray-300">
                                                    <th className="p-3 text-left font-semibold">Artículo</th>
                                                    <th className="p-3 text-center font-semibold">Cantidad</th>
                                                    <th className="p-3 text-center font-semibold">Orden de Venta</th>
                                                    <th className="p-3 text-left font-semibold">Número de Serie</th>
                                                    <th className="p-3 text-center font-semibold">Acción</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {detalles.map((detalle, idx) => (
                                                    <tr 
                                                        key={idx}
                                                        onClick={() => setDetalleSeleccionado(detalle)}
                                                        className="border-b border-gray-200 hover:bg-blue-50 cursor-pointer transition-colors"
                                                    >
                                                        <td className="p-3 font-medium text-gray-800">
                                                            {detalle.articulo_nombre || 'Artículo no especificado'}
                                                        </td>
                                                        <td className="p-3 text-center font-semibold text-gray-800">
                                                            {detalle.cantidad || '—'}
                                                        </td>
                                                        <td className="p-3 text-center font-semibold text-gray-800">
                                                            {detalle.orden_venta_id || '—'}
                                                        </td>
                                                        <td className="p-3 text-gray-700 font-mono text-xs">
                                                            {detalle.serie && detalle.serie !== 'N/A' ? detalle.serie : '—'}
                                                        </td>
                                                        <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                                                            <button
                                                                onClick={() => setDetalleSeleccionado(detalle)}
                                                                className="px-3 py-1 bg-blue-500 text-white rounded text-xs font-semibold hover:bg-blue-600 transition-colors"
                                                            >
                                                                Ver detalles
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <p className="text-center text-gray-500 py-8">No hay detalles en este movimiento</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Modal de Detalle */}
                    {detalleSeleccionado && (
                        <div 
                            className="fixed inset-0 z-50 flex items-center justify-center bg-transparent bg-gray-400 backdrop-blur-xs animate-backdropFadeIn"
                            onClick={() => setDetalleSeleccionado(null)}
                        >
                            <div 
                                className="bg-white p-10 rounded shadow-md animate-modalSlideIn max-w-md w-full"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div className="flex justify-between items-center mb-4 p-2">
                                    <h2 className="text-lg font-bold border-r-2 border-gray-300 pr-10">Detalle del Artículo</h2>
                                    <button 
                                        onClick={() => setDetalleSeleccionado(null)}
                                        className="p-2 px-3 m-2 bg-red-400 rounded text-white font-bold hover:bg-red-500 transition"
                                    >
                                        X
                                    </button>
                                </div>
                                <hr className="border rounded-md h-px my-4 border-blue-500" />

                                <div className="space-y-4">
                                    <article className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                        <p className="text-xs text-gray-500 font-semibold mb-1">Nombre del Artículo</p>
                                        <p className="text-sm font-medium text-gray-800">{detalleSeleccionado.articulo_nombre || '—'}</p>
                                    </article>

                                    <article className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                        <p className="text-xs text-gray-500 font-semibold mb-1">Cantidad Registrada</p>
                                        <p className="text-sm font-bold text-blue-600">{detalleSeleccionado.cantidad || '—'}</p>
                                    </article>

                                    {detalleSeleccionado.serie && detalleSeleccionado.serie !== 'N/A' && (
                                        <article className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                            <p className="text-xs text-gray-500 font-semibold mb-1">Número de Serie</p>
                                            <p className="text-sm font-mono text-gray-800 font-semibold">{detalleSeleccionado.serie}</p>
                                        </article>
                                    )}

                                    {detalleSeleccionado.orden_venta_id &&(
                                        <article className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                            <p className="text-xs text-gray-500 font-semibold mb-1">ID de Orden de Venta</p>
                                            <p className="text-sm font-medium text-gray-800">#{detalleSeleccionado.orden_venta_id ?? 'Sin orden de venta'}</p>
                                        </article>
                                    )}

                                    <article className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                        <p className="text-xs text-gray-500 font-semibold mb-1">ID del Artículo en Catálogo</p>
                                        <p className="text-sm font-medium text-gray-600">#{detalleSeleccionado.articulo_id}</p>
                                    </article>
                                </div>

                                <div className="flex justify-end gap-2 mt-6">
                                    <button
                                        onClick={() => setDetalleSeleccionado(null)}
                                        className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors font-semibold"
                                    >
                                        Cerrar
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </section>
            </main>
        </div>
    );
}
