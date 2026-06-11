import { useState } from 'react';
import { toast } from 'sonner';
import {
    MapIcon,
    ArrowDownTrayIcon,
    CheckIcon,
    MagnifyingGlassIcon,
    ShieldCheckIcon
} from '@heroicons/react/24/outline';
import { DateRangePicker } from '../../components/ui/date-range-picker';
import { SelectPremium } from '../../components/ui/SelectPremium';
import StatusBadge from '../../components/StatusBadge';

export default function BitacoraViajes() {
    const [date, setDate] = useState({
        from: new Date(2026, 4, 1),
        to: new Date(2026, 4, 31),
    });

    const getEstadoPill = (estado) => <StatusBadge status={estado} size="compact" />;

    const viajes = [
        { id: 1, vehiculo: 'Ranger Blanca', empleado: 'Garcia J.', salida: 'Hoy 08:15', km_ini: '45,230', motivo: 'Entrega material planta norte sector B', regreso: 'Hoy 14:30', km_fin: '45,550', recorrido: '320 km', estado: 'Completado', avatar: 'Ra' },
        { id: 2, vehiculo: 'Silverado 834', empleado: 'Lopez A.', salida: 'Hoy 09:00', km_ini: '38,100', motivo: 'Visita a proveedor - revision refacciones', regreso: '-', km_fin: '-', recorrido: '-', estado: 'En ruta', avatar: 'Si' },
        { id: 3, vehiculo: 'Hilux Plata', empleado: 'Ramirez M.', salida: 'Hoy 07:20', km_ini: '28,700', motivo: 'Traslado personal a obra norte', regreso: 'Hoy 10:15', km_fin: '28,885', recorrido: '185 km', estado: 'Completado', avatar: 'Hi' },
        { id: 4, vehiculo: 'NP300 Blanca', empleado: 'Torres R.', salida: 'Ayer 13:00', km_ini: '20,050', motivo: 'Recogida insumos almacen central', regreso: '-', km_fin: '-', recorrido: '-', estado: 'Sin regreso', avatar: 'NP' },
        { id: 5, vehiculo: 'RAM Roja', empleado: 'Hernandez C.', salida: 'Ayer 09:30', km_ini: '72,450', motivo: 'Supervision de obra zona sur', regreso: 'Ayer 17:00', km_fin: '72,542', recorrido: '92 km', estado: 'Completado', avatar: 'RA' },
    ];

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Bitácora de Viajes</h1>
                    <p className="mt-1 text-sm text-slate-500">Monitor de auditoría (Solo Lectura). Actividad registrada desde Kioscos.</p>
                </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm relative overflow-hidden group transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-lg hover:shadow-slate-200/60">
                    <div className="text-sm font-medium text-slate-500 mb-1">Viajes hoy</div>
                    <div className="text-2xl font-bold text-slate-800">7</div>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm relative overflow-hidden group transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-lg hover:shadow-slate-200/60">
                    <div className="text-sm font-medium text-slate-500 mb-1">En ruta ahora</div>
                    <div className="text-2xl font-bold text-slate-800">4</div>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm relative overflow-hidden group transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-lg hover:shadow-slate-200/60">
                    <div className="text-sm font-medium text-slate-500 mb-1">KM recorridos hoy</div>
                    <div className="text-2xl font-bold text-slate-800">1,240</div>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm relative overflow-hidden group transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-lg hover:shadow-slate-200/60">
                    <div className="text-sm font-medium text-red-500 mb-1">Sin regreso &gt;8h</div>
                    <div className="text-2xl font-bold text-red-700">1</div>
                </div>
            </div>

            {/* List */}
            <div className="bg-white border border-slate-200/60 rounded-2xl shadow-sm overflow-hidden flex flex-col transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-lg hover:shadow-slate-200/60">
                <div className="p-4 border-b border-slate-100 flex flex-wrap gap-3 justify-between items-center bg-slate-50/50">
                    <div className="flex gap-2">
                        <div className="w-[180px]">
                            <SelectPremium 
                                defaultValue="todos" 
                                placeholder="Vehículo" 
                                options={[{ value: 'todos', label: 'Vehículo: Todos' }]} 
                            />
                        </div>
                        <div className="w-[180px]">
                            <SelectPremium 
                                defaultValue="todos" 
                                placeholder="Empleado" 
                                options={[{ value: 'todos', label: 'Empleado: Todos' }]} 
                            />
                        </div>
                        <DateRangePicker date={date} onDateChange={setDate} className="w-[240px]" />
                        <div className="text-sm font-medium text-slate-500 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-md flex items-center gap-2">
                            <ShieldCheckIcon className="h-4 w-4" /> Modo Auditoría
                        </div>
                    </div>
                    <div className="flex gap-2">
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
                </div>

                <div className="w-full overflow-hidden">
                    <table className="w-full table-fixed text-left text-sm text-slate-600">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100">
                                <th className="w-[12%] px-3 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Vehículo</th>
                                <th className="w-[10%] px-3 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Empleado</th>
                                <th className="w-[10%] px-3 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Salida</th>
                                <th className="w-[8%] px-3 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">KM Ini.</th>
                                <th className="w-[20%] px-3 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Motivo</th>
                                <th className="w-[10%] px-3 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Regreso</th>
                                <th className="w-[8%] px-3 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">KM Fin.</th>
                                <th className="w-[10%] px-3 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Recorrido</th>
                                <th className="w-[12%] px-3 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">Estado</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {viajes.map((item) => (
                                <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-3 py-4">
                                        <div className="truncate text-sm font-semibold text-slate-800">{item.vehiculo}</div>
                                    </td>
                                    <td className="truncate px-3 py-4 text-sm text-slate-600">{item.empleado}</td>
                                    <td className="truncate px-3 py-4 text-sm font-medium text-slate-800">{item.salida}</td>
                                    <td className="truncate px-3 py-4 text-sm text-slate-500">{item.km_ini}</td>
                                    <td className="truncate px-3 py-4 text-xs leading-tight text-slate-500">{item.motivo}</td>
                                    <td className="truncate px-3 py-4 text-sm font-medium text-slate-600">{item.regreso}</td>
                                    <td className="truncate px-3 py-4 text-sm text-slate-500">{item.km_fin}</td>
                                    <td className="truncate px-3 py-4 text-sm font-bold text-emerald-600">{item.recorrido}</td>
                                    <td className="px-3 py-4 text-center">
                                        {getEstadoPill(item.estado)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
