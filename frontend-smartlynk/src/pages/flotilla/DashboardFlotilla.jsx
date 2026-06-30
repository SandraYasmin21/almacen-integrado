import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CalendarIcon } from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '../../lib/utils';
import { DateRangePicker } from '../../components/ui/date-range-picker';

export default function DashboardFlotilla() {
    const [date, setDate] = useState({
        from: new Date(2026, 4, 1),
        to: new Date(2026, 4, 31),
    });
    const [isLoading, setIsLoading] = useState(false);
    const [stats, setStats] = useState({
        totalVehiculos: 0,
        totalMantenimientos: 0,
        costoMantenimientos: 0,
        gastosExtra: 0,
        preventivos: { percent: 0, count: 0 },
        correctivos: { percent: 0, count: 0 },
        lecturas: { percent: 0, count: 0 },
        masPreventivos: [],
        masCorrectivos: []
    });

    useEffect(() => {
        handleApplyFilter();
    }, []);

    const handleApplyFilter = async () => {
        if (!date.from) return;
        
        setIsLoading(true);
        try {
            const token = localStorage.getItem('auth_token');
            const queryParams = new URLSearchParams();
            queryParams.append('fecha_inicio', format(date.from, 'yyyy-MM-dd'));
            if (date.to) queryParams.append('fecha_fin', format(date.to, 'yyyy-MM-dd'));

            const response = await fetch(`/api/flotilla/dashboard?${queryParams.toString()}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                const res = data.resumen || {};
                const porTipo = data.mantenimientos_por_tipo || [];
                
                const prev = porTipo.find(t => t.tipo === 'preventivo')?.total || 0;
                const corr = porTipo.find(t => t.tipo === 'correctivo')?.total || 0;
                const lec = porTipo.find(t => t.tipo === 'lectura')?.total || 0;
                const totalM = prev + corr + lec;
                
                setStats({
                    totalVehiculos: res.total_vehiculos_activos || 0,
                    totalMantenimientos: res.total_mantenimientos || 0,
                    costoMantenimientos: res.costo_total_mantenimientos || 0,
                    gastosExtra: res.costo_total_gastos_extra || 0,
                    preventivos: { 
                        percent: totalM ? Math.round((prev/totalM)*100) : 0, 
                        count: prev 
                    },
                    correctivos: { 
                        percent: totalM ? Math.round((corr/totalM)*100) : 0, 
                        count: corr 
                    },
                    lecturas: { 
                        percent: totalM ? Math.round((lec/totalM)*100) : 0, 
                        count: lec 
                    },
                    masPreventivos: data.vehiculos_mas_mantenimientos_preventivos || [],
                    masCorrectivos: data.vehiculos_mas_mantenimientos_correctivos || []
                });
            }
        } catch (error) {
            console.error("Error fetching dashboard stats", error);
        } finally {
            setIsLoading(false);
        }
    };

    const gastoTotalGeneral = stats.costoMantenimientos + stats.gastosExtra;
    return (
        <div className="space-y-6">
            {/* Filters */}
            <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-slate-600">Filtrar por fecha:</span>
                
                <DateRangePicker date={date} onDateChange={setDate} className="h-[42px]" />

                <button 
                    onClick={handleApplyFilter}
                    disabled={isLoading}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-all shadow-md shadow-blue-600/20 disabled:opacity-70 flex items-center justify-center min-w-[80px]"
                >
                    {isLoading ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : (
                        'Aplicar'
                    )}
                </button>
            </div>

            <div className={`transition-opacity duration-300 ${isLoading ? 'opacity-50 pointer-events-none' : 'opacity-100'} space-y-6`}>
                {/* Top Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm relative overflow-hidden group transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-lg hover:shadow-slate-200/60">
                    <div className="text-sm font-medium text-slate-500 mb-1">Total vehículos activos</div>
                    <div className="text-3xl font-bold text-slate-800">{stats.totalVehiculos}</div>
                    <div className="text-xs text-slate-400 mt-1">Estado ACTIVO en catálogo</div>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm relative overflow-hidden group transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-lg hover:shadow-slate-200/60">
                    <div className="text-sm font-medium text-slate-500 mb-1">Total mantenimientos</div>
                    <div className="text-3xl font-bold text-slate-800">{stats.totalMantenimientos}</div>
                    <div className="text-xs text-slate-400 mt-1">En el período seleccionado</div>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm relative overflow-hidden group transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-lg hover:shadow-slate-200/60">
                    <div className="text-sm font-medium text-slate-500 mb-1">Costo mantenimientos</div>
                    <div className="text-3xl font-bold text-slate-800">${stats.costoMantenimientos.toLocaleString()}</div>
                    <div className="text-xs text-slate-400 mt-1">Suma de costos del período</div>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm relative overflow-hidden group transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-lg hover:shadow-slate-200/60">
                    <div className="text-sm font-medium text-slate-500 mb-1">Gastos extra</div>
                    <div className="text-3xl font-bold text-slate-800">${stats.gastosExtra.toLocaleString()}</div>
                    <div className="text-xs text-slate-400 mt-1">Combustible, multas, etc.</div>
                </div>
            </div>

            {/* General Total Banner */}
            <div className="bg-[#1a1a27] text-white rounded-2xl p-6 flex flex-col items-center justify-center text-center shadow-xl">
                <div className="text-sm font-medium text-slate-400 mb-2">Gasto total general (mantenimientos + gastos extra):</div>
                <div className="text-4xl font-bold text-white">${gastoTotalGeneral.toLocaleString()} MXN</div>
            </div>

            {/* Bottom Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Desglose por tipo */}
                <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6 transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-lg hover:shadow-slate-200/60">
                    <h3 className="font-bold text-slate-800 mb-6">Desglose por tipo</h3>
                    
                    <div className="space-y-6">
                        <div>
                            <div className="flex justify-between text-sm mb-2">
                                <span className="font-bold text-slate-700">Preventivo</span>
                                <span className="text-emerald-600 font-bold">{stats.preventivos.percent}%</span>
                            </div>
                            <div className="text-xs text-slate-500 mb-2">{stats.preventivos.count} registros</div>
                            <div className="w-full bg-slate-100 rounded-full h-2">
                                <div className="bg-emerald-500 h-2 rounded-full transition-all duration-500" style={{ width: `${stats.preventivos.percent}%` }}></div>
                            </div>
                        </div>

                        <div>
                            <div className="flex justify-between text-sm mb-2">
                                <span className="font-bold text-slate-700">Correctivo</span>
                                <span className="text-red-500 font-bold">{stats.correctivos.percent}%</span>
                            </div>
                            <div className="text-xs text-slate-500 mb-2">{stats.correctivos.count} registros</div>
                            <div className="w-full bg-slate-100 rounded-full h-2">
                                <div className="bg-red-500 h-2 rounded-full transition-all duration-500" style={{ width: `${stats.correctivos.percent}%` }}></div>
                            </div>
                        </div>

                        <div>
                            <div className="flex justify-between text-sm mb-2">
                                <span className="font-bold text-slate-700">Lectura</span>
                                <span className="text-blue-500 font-bold">{stats.lecturas.percent}%</span>
                            </div>
                            <div className="text-xs text-slate-500 mb-2">{stats.lecturas.count} registros</div>
                            <div className="w-full bg-slate-100 rounded-full h-2">
                                <div className="bg-blue-500 h-2 rounded-full transition-all duration-500" style={{ width: `${stats.lecturas.percent}%` }}></div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Top 5 Preventivos */}
                <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6 transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-lg hover:shadow-slate-200/60">
                    <h3 className="font-bold text-slate-800 mb-6">Top 5 - Más mantenimientos preventivos</h3>
                    
                    <div className="space-y-3">
                        {stats.masPreventivos.length === 0 && <div className="text-sm text-slate-400">Sin datos</div>}
                        {stats.masPreventivos.map((v, i) => (
                            <div key={v.vehiculo_id} className="flex items-center gap-3 bg-emerald-50/50 text-emerald-800 font-semibold text-sm px-4 py-3 rounded-xl border border-emerald-100">
                                <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs shrink-0">{i + 1}</div>
                                <span>{v.nombre} - {v.total_preventivos}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Top 5 Correctivos */}
                <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6 transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-lg hover:shadow-slate-200/60">
                    <h3 className="font-bold text-slate-800 mb-6">Top 5 - Más mantenimientos correctivos</h3>
                    <div className="space-y-3">
                        {stats.masCorrectivos.length === 0 && <div className="text-sm text-slate-400">Sin datos</div>}
                        {stats.masCorrectivos.map((v, i) => (
                            <div key={v.vehiculo_id} className="flex items-center gap-3 bg-red-50/50 text-red-800 font-semibold text-sm px-4 py-3 rounded-xl border border-red-100">
                                <div className="w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center text-xs shrink-0">{i + 1}</div>
                                <span>{v.nombre} - {v.total_correctivos}</span>
                            </div>
                        ))}
                    </div>
                </div>

                </div>
            </div>
        </div>
    );
}
