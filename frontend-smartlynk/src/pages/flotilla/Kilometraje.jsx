import { useState } from 'react';
import { ExclamationTriangleIcon, WrenchScrewdriverIcon, ClockIcon } from '@heroicons/react/24/solid';
import { toast } from 'sonner';

export default function Kilometraje() {
    const vehiculos = [
        {
            id: 1, vehiculo: 'F-150 Gris', estado_alerta: 'Req. Mant.', max_km: '92,000', ult_correctivo: '25/abr',
            km_correctivo: '91,200 km', ult_preventivo: '10/ene', km_preventivo: '85,000 km',
            km_bitacora: '2,340 km', proximo_mant: '95,000 km', req_mant: 'SI', revisar: 'NO',
            avance: 77, color_avance: 'bg-red-500', alert_row: true, type: 'danger'
        },
        {
            id: 2, vehiculo: 'RAM Roja', estado_alerta: 'Req. Mant.', max_km: '73,100', ult_correctivo: '02/may',
            km_correctivo: '72,450 km', ult_preventivo: '15/feb', km_preventivo: '68,000 km',
            km_bitacora: '1,200 km', proximo_mant: '78,000 km', req_mant: 'SI', revisar: 'NO',
            avance: 67, color_avance: 'bg-emerald-500', alert_row: true, type: 'danger'
        },
        {
            id: 3, vehiculo: 'NP300 Blanca', estado_alerta: 'Sin historial', max_km: '21,000', ult_correctivo: '-',
            km_correctivo: '- km', ult_preventivo: '-', km_preventivo: '- km',
            km_bitacora: '980 km', proximo_mant: '-', req_mant: 'NO', revisar: 'SI',
            avance: 0, color_avance: 'bg-slate-200', alert_row: true, type: 'warning'
        },
        {
            id: 4, vehiculo: 'Ranger Blanca', estado_alerta: '', max_km: '45,550', ult_correctivo: '28/abr',
            km_correctivo: '44,100 km', ult_preventivo: '05/may', km_preventivo: '45,230 km',
            km_bitacora: '2,100 km', proximo_mant: '55,230 km', req_mant: 'NO', revisar: 'NO',
            avance: 61, color_avance: 'bg-emerald-500', alert_row: false
        },
        {
            id: 5, vehiculo: 'Silverado 834', estado_alerta: '', max_km: '38,285', ult_correctivo: '02/may',
            km_correctivo: '36,100 km', ult_preventivo: '15/mar', km_preventivo: '25,000 km',
            km_bitacora: '1,900 km', proximo_mant: '45,000 km', req_mant: 'NO', revisar: 'NO',
            avance: 60, color_avance: 'bg-emerald-500', alert_row: false
        },
        {
            id: 6, vehiculo: 'Hilux Plata', estado_alerta: '', max_km: '29,200', ult_correctivo: '20/abr',
            km_correctivo: '28,700 km', ult_preventivo: '01/abr', km_preventivo: '27,500 km',
            km_bitacora: '2,550 km', proximo_mant: '37,500 km', req_mant: 'NO', revisar: 'NO',
            avance: 55, color_avance: 'bg-emerald-500', alert_row: false
        }
    ];

    return (
        <div className="space-y-6">
            {/* Top actions */}
            <div className="flex justify-end gap-2 mb-2">
                <button 
                    onClick={() => toast.success('Exportando a PDF...')}
                    className="bg-[#ff2d55] hover:bg-[#ff1441] text-white px-5 py-2 rounded-full text-sm font-semibold shadow-sm transition-colors outline-none"
                >
                    Exportar PDF
                </button>
                <button 
                    onClick={() => toast.success('Exportando a Excel...')} 
                    className="bg-[#00d084] hover:bg-[#00bd78] text-white px-5 py-2 rounded-full text-sm font-semibold shadow-sm transition-colors outline-none"
                >
                    Exportar Excel
                </button>
            </div>

            {/* Alert Banner */}
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center shrink-0">
                    <span className="text-white font-bold text-sm">!</span>
                </div>
                <div className="text-red-700 font-medium text-sm flex flex-col gap-1">
                    <div className="flex items-center gap-1.5">
                        <WrenchScrewdriverIcon className="w-4 h-4" />
                        <span className="font-bold underline cursor-pointer">3 vehículos requieren mantenimiento preventivo</span>
                        <span className="text-red-600/80 text-xs">(campo: requiere_mantenimiento = true)</span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                        <ClockIcon className="w-4 h-4 text-amber-600" />
                        <span className="font-bold underline cursor-pointer text-amber-700">1 vehículo sin historial preventivo</span>
                        <span className="text-red-600/80 text-xs">(campo: revisar_kilometraje = true)</span>
                    </div>
                </div>
            </div>

            {/* Main Table */}
            <div className="bg-white border border-slate-200/60 rounded-2xl shadow-sm overflow-hidden flex flex-col transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-lg hover:shadow-slate-200/60">
                <div className="w-full overflow-hidden">
                    <table className="w-full table-fixed text-left text-sm text-slate-600">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100">
                                <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Vehículo</th>
                                <th className="py-4 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-center">Max KM</th>
                                <th className="py-4 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-center">Ult. Correctivo</th>
                                <th className="py-4 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-center">KM Correctivo</th>
                                <th className="py-4 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-center">Ult. Preventivo</th>
                                <th className="py-4 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-center">KM Preventivo</th>
                                <th className="py-4 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-center">KM Bitácora</th>
                                <th className="py-4 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-center">Próximo Mant.</th>
                                <th className="py-4 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-center">Req. Mant.</th>
                                <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider text-center">Revisar</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {vehiculos.map((v) => (
                                <tr key={v.id} className={`${v.type === 'danger' ? 'bg-red-50/20' : v.type === 'warning' ? 'bg-orange-50/20' : 'hover:bg-slate-50/50'} transition-colors`}>
                                    <td className="py-4 px-6">
                                        <div className="font-bold text-slate-800 text-sm mb-2">{v.vehiculo}</div>
                                        {v.estado_alerta && (
                                            <div className={`text-xs font-semibold mb-2 ${v.type === 'danger' ? 'text-red-500' : 'text-orange-500'}`}>
                                                {v.estado_alerta}
                                            </div>
                                        )}
                                        {v.avance > 0 && (
                                            <div className="flex items-center gap-2">
                                                <div className="w-24 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                                    <div className={`h-full rounded-full ${v.avance > 90 ? 'bg-red-600 animate-pulse' : v.avance > 70 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${v.avance}%` }}></div>
                                                </div>
                                                <span className="text-[10px] text-slate-400 font-medium">{v.avance}% avance hacia próximo mant.</span>
                                            </div>
                                        )}
                                    </td>
                                    <td className="py-4 px-3 text-center font-bold text-slate-800 text-sm">{v.max_km}</td>
                                    <td className="py-4 px-3 text-center text-slate-500 text-sm">{v.ult_correctivo}</td>
                                    <td className="py-4 px-3 text-center text-slate-500 text-sm">{v.km_correctivo}</td>
                                    <td className="py-4 px-3 text-center text-slate-500 text-sm">{v.ult_preventivo}</td>
                                    <td className="py-4 px-3 text-center text-slate-500 text-sm">{v.km_preventivo}</td>
                                    <td className="py-4 px-3 text-center font-semibold text-blue-500 text-sm">{v.km_bitacora}</td>
                                    <td className={`py-4 px-3 text-center text-sm ${v.req_mant === 'SI' ? 'font-bold text-red-600' : 'text-gray-800 font-medium'}`}>{v.proximo_mant}</td>
                                    <td className="py-4 px-3 text-center">
                                        {v.req_mant === 'SI' ? (
                                            <span className="px-2.5 py-1 text-xs font-semibold bg-red-100 text-red-800 rounded-full animate-pulse">Requerido</span>
                                        ) : (
                                            <span className="px-2.5 py-1 text-xs font-semibold bg-emerald-100 text-emerald-800 rounded-full">OK</span>
                                        )}
                                    </td>
                                    <td className="py-4 px-6 text-center">
                                        {v.revisar === 'SI' ? (
                                            <span className="px-2.5 py-1 text-xs font-semibold bg-orange-100 text-orange-800 rounded-full animate-pulse">Revisar</span>
                                        ) : (
                                            <span className="px-2.5 py-1 text-xs font-semibold bg-emerald-100 text-emerald-800 rounded-full">OK</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Legend */}
            <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-4 flex flex-wrap items-center gap-6 text-xs font-semibold text-slate-600">
                <span className="text-slate-500 font-medium">Leyenda:</span>
                <span className="text-red-500 flex items-center gap-2">
                    Requiere mantenimiento - km actual {">"} próximo_mantenimiento_km
                </span>
                <span className="text-orange-500 flex items-center gap-2">
                    Sin historial preventivo - revisar_kilometraje = true
                </span>
                <span className="text-emerald-500 flex items-center gap-2">
                    OK - al corriente
                </span>
            </div>
        </div>
    );
}
