import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
    PlusIcon,
    XMarkIcon,
    MapIcon,
    DocumentTextIcon,
    ClockIcon,
    TruckIcon,
    ArrowDownTrayIcon,
    TableCellsIcon,
    CalendarIcon,
    ChevronDownIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    ChevronDoubleLeftIcon,
    ChevronDoubleRightIcon,
    CheckIcon
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '../../lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '../../components/ui/popover';
import { DateRangePicker } from '../../components/ui/date-range-picker';
import { DatePicker } from '../../components/ui/date-picker';
import { SelectPremium } from '../../components/ui/SelectPremium';

const salidaSchema = z.object({
    vehiculo_id: z.string().min(1, 'Selecciona un vehículo'),
    empleado_id: z.string().min(1, 'Selecciona un empleado'),
    fecha_salida: z.string().min(1, 'La fecha de salida es requerida'),
    km_inicial: z.coerce.number().min(1, 'Kilometraje inválido'),
    motivo: z.string().min(1, 'El motivo es requerido'),
    observaciones: z.string().optional()
});

const regresoSchema = z.object({
    fecha_regreso: z.string().min(1, 'La fecha de regreso es requerida'),
    km_final: z.coerce.number().min(1, 'El kilometraje final es requerido'),
    observaciones: z.string().optional()
});

export default function BitacoraViajes() {
    const [modalType, setModalType] = useState(null); // 'salida' o 'regreso'
    const [selectedViaje, setSelectedViaje] = useState(null);

    // Date Range
    const [date, setDate] = useState({
        from: new Date(2026, 4, 1),
        to: new Date(2026, 4, 31),
    });

    const {
        register: registerSalida,
        handleSubmit: handleSubmitSalida,
        reset: resetSalida,
        formState: { errors: errorsSalida, isSubmitting: isSubmittingSalida },
        control: controlSalida
    } = useForm({
        resolver: zodResolver(salidaSchema),
        defaultValues: {
            vehiculo_id: '',
            empleado_id: '',
            fecha_salida: new Date().toISOString().slice(0,16),
            km_inicial: 45230, // Ejemplo auto-rellenado
            motivo: '',
            observaciones: ''
        }
    });

    const {
        register: registerRegreso,
        handleSubmit: handleSubmitRegreso,
        reset: resetRegreso,
        formState: { errors: errorsRegreso, isSubmitting: isSubmittingRegreso },
        control: controlRegreso
    } = useForm({
        resolver: zodResolver(regresoSchema)
    });

    useEffect(() => {
        if (modalType === 'salida') {
            if (selectedViaje) {
                const vehiculosMap = { 'Ranger Blanca': '1', 'Silverado 834': '2', 'Hilux Plata': '3', 'NP300 Blanca': '4', 'RAM Roja': '5' };
                const vId = vehiculosMap[selectedViaje.vehiculo] || '1';
                
                resetSalida({
                    vehiculo_id: vId,
                    empleado_id: '1', // Dummy para el ejemplo
                    fecha_salida: new Date().toISOString().slice(0,16),
                    km_inicial: parseInt(selectedViaje.km_ini.replace(/,/g, '')),
                    motivo: selectedViaje.motivo,
                    observaciones: ''
                });
            } else {
                resetSalida({
                    vehiculo_id: '',
                    empleado_id: '',
                    fecha_salida: new Date().toISOString().slice(0,16),
                    km_inicial: 45230,
                    motivo: '',
                    observaciones: ''
                });
            }
        }
    }, [modalType, selectedViaje, resetSalida]);

    const openEditSalida = (viaje) => {
        setSelectedViaje(viaje);
        setModalType('salida');
    };

    const handleNuevaSalida = () => {
        setSelectedViaje(null);
        setModalType('salida');
    };

    const onSubmitSalida = async (data) => {
        try {
            await new Promise(resolve => setTimeout(resolve, 1000));
            toast.success('Salida registrada exitosamente');
            setModalType(null);
            resetSalida();
        } catch (error) {
            toast.error('Error al registrar salida');
        }
    };

    const onSubmitRegreso = async (data) => {
        try {
            await new Promise(resolve => setTimeout(resolve, 1000));
            toast.success('Regreso registrado exitosamente');
            setModalType(null);
            setSelectedViaje(null);
            resetRegreso();
        } catch (error) {
            toast.error('Error al registrar regreso');
        }
    };

    const openRegresoModal = (viaje) => {
        setSelectedViaje(viaje);
        resetRegreso({
            fecha_regreso: new Date().toISOString().slice(0,16),
            km_final: '',
            observaciones: ''
        });
        setModalType('regreso');
    };

    const getEstadoPill = (estado) => {
        switch(estado) {
            case 'Completado': return <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-semibold">Completado</span>;
            case 'En ruta': return <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">En ruta</span>;
            case 'Pendiente': return <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-semibold">Pendiente</span>;
            case 'Sin regreso': return <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-semibold">Sin regreso</span>;
            default: return null;
        }
    };

    const viajes = [
        { id: 1, vehiculo: 'Ranger Blanca', empleado: 'Garcia J.', salida: 'Hoy 08:15', km_ini: '45,230', motivo: 'Entrega material planta norte sector B', regreso: 'Hoy 14:30', km_fin: '45,550', recorrido: '320 km', estado: 'Completado', avatar: 'Ra' },
        { id: 2, vehiculo: 'Silverado 834', empleado: 'Lopez A.', salida: 'Hoy 09:00', km_ini: '38,100', motivo: 'Visita a proveedor - revision refacciones', regreso: '-', km_fin: '-', recorrido: '-', estado: 'En ruta', avatar: 'Si' },
        { id: 3, vehiculo: 'Hilux Plata', empleado: 'Ramirez M.', salida: 'Hoy 07:20', km_ini: '28,700', motivo: 'Traslado personal a obra norte', regreso: 'Hoy 10:15', km_fin: '28,885', recorrido: '185 km', estado: 'Completado', avatar: 'Hi' },
        { id: 4, vehiculo: 'NP300 Blanca', empleado: 'Torres R.', salida: 'Ayer 13:00', km_ini: '20,050', motivo: 'Recogida insumos almacen central', regreso: '-', km_fin: '-', recorrido: '-', estado: 'Sin regreso', avatar: 'NP' },
        { id: 5, vehiculo: 'RAM Roja', empleado: 'Hernandez C.', salida: 'Ayer 09:30', km_ini: '72,450', motivo: 'Supervision de obra zona sur', regreso: 'Ayer 17:00', km_fin: '72,542', recorrido: '92 km', estado: 'Completado', avatar: 'RA' },
    ];

    return (
        <div className="space-y-6">
            <div className="flex justify-end">
                <button
                    onClick={handleNuevaSalida}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-all shadow-lg shadow-blue-600/20 flex items-center gap-2 "
                >
                    <PlusIcon className="w-5 h-5" />
                    Nueva salida
                </button>
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
                        <div className="w-[160px]">
                            <SelectPremium 
                                defaultValue="todos" 
                                placeholder="Estado" 
                                options={[{ value: 'todos', label: 'Estado: Todos' }]} 
                            />
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

                <div className="w-full overflow-x-auto custom-scrollbar">
                    <table className="w-full min-w-[1200px] text-left text-sm text-slate-600 whitespace-nowrap">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100">
                                <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Vehículo</th>
                                <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Empleado</th>
                                <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Salida</th>
                                <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">KM Ini.</th>
                                <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Motivo</th>
                                <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Regreso</th>
                                <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">KM Fin.</th>
                                <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Recorrido</th>
                                <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Estado</th>
                                <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-center">Registrar Regreso</th>
                                <th className="py-3 px-4 text-right"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {viajes.map((item) => (
                                <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="py-4 px-4">
                                        <div className="font-semibold text-slate-800 text-sm">{item.vehiculo}</div>
                                    </td>
                                    <td className="py-4 px-4 text-sm text-slate-600">{item.empleado}</td>
                                    <td className="py-4 px-4 text-sm font-medium text-slate-800 ">{item.salida}</td>
                                    <td className="py-4 px-4 text-sm text-slate-500">{item.km_ini}</td>
                                    <td className="py-4 px-4 text-xs text-slate-500 max-w-[200px] leading-tight whitespace-normal">{item.motivo}</td>
                                    <td className="py-4 px-4 text-sm font-medium text-slate-600">{item.regreso}</td>
                                    <td className="py-4 px-4 text-sm text-slate-500">{item.km_fin}</td>
                                    <td className="py-4 px-4 text-sm font-bold text-emerald-600">{item.recorrido}</td>
                                    <td className="py-4 px-4">
                                        {getEstadoPill(item.estado)}
                                    </td>
                                    <td className="py-4 px-4 text-center">
                                        {(item.estado === 'En ruta' || item.estado === 'Sin regreso') ? (
                                            <button onClick={() => openRegresoModal(item)} className="text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3 py-1.5 rounded-lg text-xs font-bold transition-all w-full shadow-sm flex items-center justify-center gap-1.5">
                                                <CheckIcon className="w-4 h-4" />
                                                Regreso
                                            </button>
                                        ) : (
                                            <span className="text-slate-300 text-xs font-medium">-</span>
                                        )}
                                    </td>
                                    <td className="py-4 px-4 text-right ">
                                        <button 
                                            onClick={() => openEditSalida(item)}
                                            className="text-slate-500 hover:text-blue-600 text-xs font-semibold border border-slate-200 hover:border-blue-200 hover:bg-blue-50 px-2 py-1.5 rounded-lg transition-colors"
                                        >
                                            Ver
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal Salida */}
            <AnimatePresence>
                {modalType === 'salida' && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40"
                            onClick={() => setModalType(null)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-white rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col max-h-[90vh]"
                        >
                            <div className="p-6 border-b border-slate-100 flex justify-between items-start shrink-0">
                                <div>
                                    <h2 className="text-xl font-bold text-slate-800">
                                        {selectedViaje ? 'Detalle de salida' : 'Registrar salida de vehículo'}
                                    </h2>
                                </div>
                                <button
                                    onClick={() => setModalType(null)}
                                    className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors"
                                >
                                    <XMarkIcon className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
                                <form id="salida-form" onSubmit={handleSubmitSalida(onSubmitSalida)} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1.5">Vehículo *</label>
                                        <Controller
                                            name="vehiculo_id"
                                            control={controlSalida}
                                            render={({ field }) => (
                                                <SelectPremium 
                                                    value={field.value} 
                                                    onChange={field.onChange} 
                                                    placeholder="Seleccionar vehículo" 
                                                    options={[{ value: '1', label: 'Ranger Blanca' }]}
                                                />
                                            )}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1.5">Empleado asignado *</label>
                                        <Controller
                                            name="empleado_id"
                                            control={controlSalida}
                                            render={({ field }) => (
                                                <SelectPremium 
                                                    value={field.value} 
                                                    onChange={field.onChange} 
                                                    placeholder="Seleccionar empleado" 
                                                    options={[{ value: '1', label: 'Garcia J.' }]}
                                                />
                                            )}
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1.5">Fecha y hora de salida *</label>
                                            <Controller
                                                name="fecha_salida"
                                                control={controlSalida}
                                                render={({ field }) => (
                                                    <DatePicker
                                                        value={field.value}
                                                        onChange={(date) => field.onChange(date ? date.toISOString().slice(0, 16) : '')}
                                                        placeholder="Seleccionar fecha"
                                                    />
                                                )}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1.5">KM inicial (auto-rellenado)</label>
                                            <div className="relative">
                                                <input type="number" readOnly {...registerSalida('km_inicial')} className="w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-500 outline-none cursor-not-allowed" />
                                                <div className="absolute inset-y-0 right-3 flex items-center">
                                                    <span className="text-xs font-semibold text-slate-400">km</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1.5">Motivo del viaje *</label>
                                        <textarea {...registerSalida('motivo')} rows="2" placeholder="Justificación o motivo del viaje..." className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none placeholder:text-slate-400"></textarea>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1.5">Observaciones (opcional)</label>
                                        <textarea {...registerSalida('observaciones')} rows="1" placeholder="Notas adicionales..." className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none placeholder:text-slate-400"></textarea>
                                    </div>
                                </form>
                            </div>

                            <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-start gap-3 shrink-0">
                                <button type="submit" form="salida-form" disabled={isSubmittingSalida} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl text-sm font-medium transition-all shadow-lg shadow-blue-600/20 disabled:opacity-70">
                                    {isSubmittingSalida ? 'Guardando...' : selectedViaje ? 'Guardar cambios' : 'Registrar salida'}
                                </button>
                                <button type="button" onClick={() => setModalType(null)} className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-6 py-2.5 rounded-xl text-sm font-medium transition-all">
                                    Cancelar
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Modal Regreso */}
            <AnimatePresence>
                {modalType === 'regreso' && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40"
                            onClick={() => setModalType(null)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-white rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col"
                        >
                            <div className="p-6 border-b border-slate-100 flex justify-between items-start shrink-0">
                                <div>
                                    <h2 className="text-xl font-bold text-slate-800">Registrar regreso</h2>
                                </div>
                                <button onClick={() => setModalType(null)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors">
                                    <XMarkIcon className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="p-6 overflow-y-auto flex-1">
                                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-5">
                                    <div className="font-bold text-slate-800 text-sm mb-1">{selectedViaje.vehiculo} - {selectedViaje.empleado}</div>
                                    <div className="text-xs text-slate-500">Salida: {selectedViaje.salida} | KM inicial: {selectedViaje.km_ini} | Motivo: {selectedViaje.motivo}</div>
                                </div>

                                <form id="regreso-form" onSubmit={handleSubmitRegreso(onSubmitRegreso)} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1.5">Fecha y hora de regreso *</label>
                                        <Controller
                                            name="fecha_regreso"
                                            control={controlRegreso}
                                            render={({ field }) => (
                                                <DatePicker
                                                    value={field.value}
                                                    onChange={(date) => field.onChange(date ? date.toISOString().slice(0, 16) : '')}
                                                    placeholder="Seleccionar fecha"
                                                />
                                            )}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1.5">Kilometraje final *</label>
                                        <div className="relative">
                                            <input type="number" placeholder="Ej. 38,285" {...registerRegreso('km_final')} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none text-slate-700" />
                                        </div>
                                        <div className="mt-2 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-2 rounded-lg font-medium">
                                            KM recorridos = 38,285 - 38,100 = 185 km - calculado automáticamente
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1.5">Observaciones de retorno</label>
                                        <textarea {...registerRegreso('observaciones')} rows="2" placeholder="Regresó con llanta baja / Sin novedad..." className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none placeholder:text-slate-400"></textarea>
                                    </div>
                                </form>
                            </div>

                            <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-start gap-3 shrink-0">
                                <button type="submit" form="regreso-form" disabled={isSubmittingRegreso} className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-xl text-sm font-medium transition-all shadow-lg shadow-emerald-600/20 disabled:opacity-70">
                                    {isSubmittingRegreso ? 'Guardando...' : 'Confirmar regreso'}
                                </button>
                                <button type="button" onClick={() => setModalType(null)} className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-6 py-2.5 rounded-xl text-sm font-medium transition-all">
                                    Cancelar
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
