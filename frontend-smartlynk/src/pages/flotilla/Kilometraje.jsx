import { ClockIcon, ExclamationTriangleIcon } from '@heroicons/react/24/solid';
import { toast } from 'sonner';
import StatusBadge from '../../components/StatusBadge';

export default function Kilometraje() {
    const vehiculos = [
        {
            id: 1, vehiculo: 'F-150 Gris', estado_alerta: 'Req. Mant.', max_km: '92,000', ult_correctivo: '25/abr',
            km_correctivo: '91,200 km', ult_preventivo: '10/ene', km_preventivo: '85,000 km',
            km_bitacora: '2,340 km', proximo_mant: '95,000 km', req_mant: 'SI', revisar: 'NO',
            avance: 77, alert_row: true, type: 'danger'
        },
        {
            id: 2, vehiculo: 'RAM Roja', estado_alerta: 'Req. Mant.', max_km: '73,100', ult_correctivo: '02/may',
            km_correctivo: '72,450 km', ult_preventivo: '15/feb', km_preventivo: '68,000 km',
            km_bitacora: '1,200 km', proximo_mant: '78,000 km', req_mant: 'SI', revisar: 'NO',
            avance: 67, alert_row: true, type: 'danger'
        },
        {
            id: 3, vehiculo: 'NP300 Blanca', estado_alerta: 'Sin historial', max_km: '21,000', ult_correctivo: '-',
            km_correctivo: '- km', ult_preventivo: '-', km_preventivo: '- km',
            km_bitacora: '980 km', proximo_mant: '-', req_mant: 'NO', revisar: 'SI',
            avance: 0, alert_row: true, type: 'warning'
        },
        {
            id: 4, vehiculo: 'Ranger Blanca', estado_alerta: '', max_km: '45,550', ult_correctivo: '28/abr',
            km_correctivo: '44,100 km', ult_preventivo: '05/may', km_preventivo: '45,230 km',
            km_bitacora: '2,100 km', proximo_mant: '55,230 km', req_mant: 'NO', revisar: 'NO',
            avance: 61, alert_row: false
        },
        {
            id: 5, vehiculo: 'Silverado 834', estado_alerta: '', max_km: '38,285', ult_correctivo: '02/may',
            km_correctivo: '36,100 km', ult_preventivo: '15/mar', km_preventivo: '25,000 km',
            km_bitacora: '1,900 km', proximo_mant: '45,000 km', req_mant: 'NO', revisar: 'NO',
            avance: 60, alert_row: false
        },
        {
            id: 6, vehiculo: 'Hilux Plata', estado_alerta: '', max_km: '29,200', ult_correctivo: '20/abr',
            km_correctivo: '28,700 km', ult_preventivo: '01/abr', km_preventivo: '27,500 km',
            km_bitacora: '2,550 km', proximo_mant: '37,500 km', req_mant: 'NO', revisar: 'NO',
            avance: 55, alert_row: false
        }
    ];

    const mantenimientoRequerido = vehiculos.filter((vehiculo) => vehiculo.req_mant === 'SI').length;
    const sinHistorial = vehiculos.filter((vehiculo) => vehiculo.revisar === 'SI').length;

    return (
        <div className="space-y-6">
            <div className="mb-2 flex justify-end gap-2">
                <button
                    onClick={() => toast.success('Exportando a PDF...')}
                    className="rounded-full bg-[#ff2d55] px-5 py-2 text-sm font-semibold text-white shadow-sm outline-none transition-colors hover:bg-[#ff1441]"
                >
                    Exportar PDF
                </button>
                <button
                    onClick={() => toast.success('Exportando a Excel...')}
                    className="rounded-full bg-[#00d084] px-5 py-2 text-sm font-semibold text-white shadow-sm outline-none transition-colors hover:bg-[#00bd78]"
                >
                    Exportar Excel
                </button>
            </div>

            <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="flex items-center gap-4 rounded-xl border-l-4 border-rose-500 bg-white p-4 shadow-sm transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-md">
                    <div className="rounded-full bg-rose-100 p-3 text-rose-600">
                        <ExclamationTriangleIcon className="h-6 w-6" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-slate-800">Atención Inmediata</h3>
                        <p className="text-sm text-slate-500">
                            <span className="font-semibold text-rose-600">{mantenimientoRequerido} vehículos</span> han superado su límite de kilometraje.
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-4 rounded-xl border-l-4 border-amber-500 bg-white p-4 shadow-sm transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-md">
                    <div className="rounded-full bg-amber-100 p-3 text-amber-600">
                        <ClockIcon className="h-6 w-6" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-slate-800">Revisión Preventiva</h3>
                        <p className="text-sm text-slate-500">
                            <span className="font-semibold text-amber-600">{sinHistorial} vehículo</span> no cuenta con registro de mantenimiento.
                        </p>
                    </div>
                </div>
            </div>

            <div className="flex flex-col overflow-hidden rounded-2xl border border-slate-200/60 bg-white shadow-sm transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-lg hover:shadow-slate-200/60">
                <div className="w-full overflow-hidden">
                    <table className="w-full table-fixed text-left text-sm text-slate-600">
                        <thead>
                            <tr className="border-b border-slate-100 bg-slate-50/50">
                                <th className="w-[14%] px-4 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">Vehículo</th>
                                <th className="w-[8%] px-2 py-4 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">Max KM</th>
                                <th className="w-[9%] px-2 py-4 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">Ult. Correctivo</th>
                                <th className="w-[10%] px-2 py-4 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">KM Correctivo</th>
                                <th className="w-[9%] px-2 py-4 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">Ult. Preventivo</th>
                                <th className="w-[10%] px-2 py-4 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">KM Preventivo</th>
                                <th className="w-[9%] px-2 py-4 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">KM Bitácora</th>
                                <th className="w-[9%] px-2 py-4 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">Próximo Mant.</th>
                                <th className="w-[11%] px-2 py-4 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">Req.</th>
                                <th className="w-[11%] px-2 py-4 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">Revisar</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {vehiculos.map((vehiculo) => (
                                <tr
                                    key={vehiculo.id}
                                    className={`${vehiculo.type === 'danger' ? 'bg-rose-50/20' : vehiculo.type === 'warning' ? 'bg-amber-50/20' : 'hover:bg-slate-50/50'} transition-colors`}
                                >
                                    <td className="px-4 py-4">
                                        <div className="mb-2 text-sm font-bold text-slate-800">{vehiculo.vehiculo}</div>
                                        {vehiculo.estado_alerta && (
                                            <div className={`mb-2 text-xs font-semibold ${vehiculo.type === 'danger' ? 'text-rose-500' : 'text-amber-500'}`}>
                                                {vehiculo.estado_alerta}
                                            </div>
                                        )}
                                        {vehiculo.avance > 0 && (
                                            <div className="flex items-center gap-2">
                                                <div className="h-1.5 w-24 overflow-hidden rounded-full bg-gray-200">
                                                    <div
                                                        className={`h-full rounded-full ${vehiculo.avance > 90 ? 'animate-pulse bg-rose-600' : vehiculo.avance > 70 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                                                        style={{ width: `${vehiculo.avance}%` }}
                                                    />
                                                </div>
                                                <span className="text-[10px] font-medium text-slate-400">{vehiculo.avance}% avance</span>
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-3 py-4 text-center text-sm font-bold text-slate-800">{vehiculo.max_km}</td>
                                    <td className="px-3 py-4 text-center text-sm text-slate-500">{vehiculo.ult_correctivo}</td>
                                    <td className="px-3 py-4 text-center text-sm text-slate-500">{vehiculo.km_correctivo}</td>
                                    <td className="px-3 py-4 text-center text-sm text-slate-500">{vehiculo.ult_preventivo}</td>
                                    <td className="px-3 py-4 text-center text-sm text-slate-500">{vehiculo.km_preventivo}</td>
                                    <td className="px-3 py-4 text-center text-sm font-semibold text-blue-500">{vehiculo.km_bitacora}</td>
                                    <td className={`px-3 py-4 text-center text-sm ${vehiculo.req_mant === 'SI' ? 'font-bold text-rose-600' : 'font-medium text-gray-800'}`}>{vehiculo.proximo_mant}</td>
                                    <td className="px-3 py-4 text-center">
                                        {vehiculo.req_mant === 'SI' ? (
                                            <StatusBadge status="Requerido" size="compact" />
                                        ) : (
                                            <StatusBadge status="OK" size="compact" />
                                        )}
                                    </td>
                                    <td className="px-2 py-4 text-center">
                                        {vehiculo.revisar === 'SI' ? (
                                            <StatusBadge status="Revisar" size="compact" />
                                        ) : (
                                            <StatusBadge status="OK" size="compact" />
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="mx-auto mt-6 flex w-fit flex-wrap items-center justify-center gap-6 rounded-full border border-slate-200 bg-slate-50 px-8 py-3 shadow-sm">
                <div className="flex items-center gap-2">
                    <span className="relative flex h-3 w-3">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75" />
                        <span className="relative inline-flex h-3 w-3 rounded-full bg-rose-500" />
                    </span>
                    <span className="text-xs font-medium text-slate-600">Mantenimiento Urgente</span>
                </div>

                <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-amber-500" />
                    <span className="text-xs font-medium text-slate-600">Sin Historial</span>
                </div>

                <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-emerald-500" />
                    <span className="text-xs font-medium text-slate-600">Al Corriente</span>
                </div>
            </div>
        </div>
    );
}
