import React, { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';

export default function MovimientosAlmacenPage({ movimientosRecientes = [] }) {
        const [movimientos, setMovimientos] = useState(movimientosRecientes.slice(0, 10));
        const navigate = useNavigate();

        return (
            <div className="min-h-screen bg-slate-50 p-8">


                <div className="space-y-6 grid grid-cols-2 md:grid-cols-6 gap-6">
                            {/* Acciones Rápidas */}
                            <div className="col-span-2 flex justify-end gap-4">
                                <div className="flex flex-col gap-4">
                                    <button
                                        onClick={() => navigate('/mostrador/entrada')}
                                        className="p-6 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-full hover:from-green-600 hover:to-green-700 transition-all transform hover:-translate-y-0.5 shadow-sm"
                                    >
                                        <div className="text-left">
                                            <p className="text-sm font-semibold opacity-90">Crear nuevo</p>
                                            <p className="text-2xl font-bold">Registrar Entrada</p>
                                        </div>
                                    </button>

                                    <button
                                        onClick={() => navigate('/mostrador/salida')}
                                        className="p-6 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-full hover:from-red-600 hover:to-red-700 transition-all transform hover:-translate-y-0.5 shadow-sm"
                                    >
                                        <div className="text-left">
                                            <p className="text-sm font-semibold opacity-90">Crear nuevo</p>
                                            <p className="text-2xl font-bold">Registrar Salida</p>
                                        </div>
                                    </button>

                                    <button
                                        onClick={() => navigate('/mostrador/historial')}
                                        className="p-6 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-full hover:from-blue-600 hover:to-blue-700 transition-all transform hover:-translate-y-0.5 shadow-sm"
                                    >
                                        <div className="text-left">
                                            <p className="text-sm font-semibold opacity-90">Ver todo</p>
                                            <p className="text-2xl font-bold">Historial de Movimientos</p>
                                        </div>
                                    </button>


                                    <button
                                        onClick={() => navigate('/mostrador/ordenes')}
                                        className="p-6 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-2xl hover:from-orange-600 hover:to-orange-700 transition-all transform hover:-translate-y-0.5 shadow-sm"
                                    >
                                        <div className="text-left">
                                            <p className="text-sm font-semibold opacity-90">Ver todo</p>
                                            <p className="text-2xl font-bold pb-4">Ordenes</p>
                                        </div>
                                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm !ring-0">
                                            <p className="text-gray-600 text-sm font-semibold mb-2">Ordenes Pendientes</p>
                                            <p className="text-4xl font-bold text-orange-600">-</p>
                                            <p className="text-xs text-gray-500 mt-2">Requieren atención</p>
                                        </div>
                                    </button>

                                </div>


                            
                            </div>
                            {/* Estadísticas */}

                            {/* Movimientos Recientes */}
                            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm !ring-0 col-span-4">
                                <div className="mb-6">
                                    <h2 className="text-xl font-bold text-gray-800 mb-1">Movimientos Recientes</h2>
                                    <p className="text-sm text-gray-500">Últimos {movimientos.length} movimientos - Presiona para ver detalles</p>
                                </div>

                                {movimientos.length > 0 ? (
                                    <div>
                                        <div className="space-y-3 mb-6">
                                            {movimientos.map((mov, idx) => (
                                                <button
                                                    key={idx}
                                                    onClick={() => navigate(`/mostrador/movimientos/${mov.id}`)}
                                                    className="w-full p-4 bg-gradient-to-r from-gray-50 to-gray-100 hover:from-blue-50 hover:to-blue-100 border border-gray-200 rounded-xl transition-all text-left group"
                                                >
                                                    <div className="flex justify-between items-center">
                                                        <div className="flex items-center gap-3 flex-1">
                                                            <span className={`px-3 py-1 rounded-lg text-white text-xs font-bold whitespace-nowrap ${
                                                                mov.tipo_movimiento === 'ENTRADA' ? 'bg-green-500' : 'bg-red-500'
                                                            }`}>
                                                                {mov.tipo_movimiento}
                                                            </span>
                                                            <span className="font-medium text-gray-800 flex-1 truncate">{mov.notas || 'Sin notas'}</span>
                                                        </div>
                                                        <div className="text-right ml-4">
                                                            <span className="text-sm font-bold text-gray-800">{mov.cantidad_detalles} artículo{mov.cantidad_detalles !== 1 ? 's' : ''}</span>
                                                            <p className="text-xs text-gray-500">{mov.fecha}</p>
                                                        </div>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>

                                        <button
                                            onClick={() => navigate('/mostrador/historial')}
                                            className="w-full px-4 py-3 bg-gray-100 text-gray-800 font-semibold rounded-full hover:bg-gray-200 transition-colors border border-gray-300"
                                        >
                                            Ver todos los movimientos ({movimientos.length}+)
                                        </button>
                                    </div>
                                ) : (
                                    <div className="text-center py-12">
                                        <p className="text-gray-500 mb-4">No hay movimientos registrados</p>
                                        <button
                                            onClick={() => navigate('/mostrador/entrada')}
                                            className="px-6 py-2 bg-green-500 text-white font-semibold rounded-full hover:bg-green-600 transition-colors shadow-sm"
                                        >
                                            Registrar el primer movimiento
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
            </div>
        );
}
