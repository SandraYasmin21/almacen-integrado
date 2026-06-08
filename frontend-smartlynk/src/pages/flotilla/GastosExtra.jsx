import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
    PlusIcon,
    XMarkIcon,
    CurrencyDollarIcon,
    CalendarIcon,
    MagnifyingGlassIcon,
    FunnelIcon,
    ChevronDownIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    ChevronDoubleLeftIcon,
    ChevronDoubleRightIcon
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '../../lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '../../components/ui/popover';
import { DateRangePicker } from '../../components/ui/date-range-picker';
import { DatePicker } from '../../components/ui/date-picker';
import { SelectPremium } from '../../components/ui/SelectPremium';

const gastoSchema = z.object({
    vehiculo_id: z.string().min(1, 'Selecciona un vehículo'),
    fecha: z.string().min(1, 'La fecha es requerida'),
    tipo_gasto: z.string().min(1, 'El tipo de gasto es requerido').max(250, 'Máximo 250 caracteres'),
    costo: z.coerce.number().min(0.01, 'El costo debe ser mayor a 0'),
    observaciones: z.string().optional()
});

export default function GastosExtra() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editData, setEditData] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const totalPages = 5; // simulated
    
    // Date Range
    const [date, setDate] = useState({
        from: new Date(2026, 4, 1),
        to: new Date(2026, 4, 31),
    });

    const handleNuevoGasto = () => {
        setEditData(null);
        setIsModalOpen(true);
    };

    const handleEditGasto = (gasto) => {
        setEditData(gasto);
        setIsModalOpen(true);
    };

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting },
        control
    } = useForm({
        resolver: zodResolver(gastoSchema),
        defaultValues: {
            vehiculo_id: '',
            fecha: new Date().toISOString().split('T')[0],
            tipo_gasto: '',
            costo: '',
            observaciones: ''
        }
    });

    // Populate modal when editing
    useEffect(() => {
        if (isModalOpen) {
            if (editData) {
                const vehiculosMap = { 'RAM Roja': '1', 'Ranger Blanca': '2', 'Silverado 834': '3', 'F-150 Gris': '4', 'Hilux Plata': '5', 'NP300 Blanca': '6' };
                const vId = vehiculosMap[editData.vehiculo] || '1';
                
                let fechaFormateada = '2026-05-10';
                if (editData.fecha) {
                    const meses = { 'ene': '01', 'feb': '02', 'mar': '03', 'abr': '04', 'may': '05', 'jun': '06', 'jul': '07', 'ago': '08', 'sep': '09', 'oct': '10', 'nov': '11', 'dic': '12' };
                    const partes = editData.fecha.split('/');
                    if (partes.length === 3) {
                        fechaFormateada = `${partes[2]}-${meses[partes[1].toLowerCase()]}-${partes[0].padStart(2, '0')}`;
                    }
                }

                reset({
                    vehiculo_id: vId,
                    fecha: fechaFormateada,
                    tipo_gasto: editData.tipo || '',
                    costo: editData.costo || '',
                    observaciones: editData.observaciones || ''
                });
            } else {
                reset({
                    vehiculo_id: '',
                    fecha: new Date().toISOString().split('T')[0],
                    tipo_gasto: '',
                    costo: '',
                    observaciones: ''
                });
            }
        }
    }, [isModalOpen, editData, reset]);

    const onSubmit = async (data) => {
        try {
            console.log('Datos a guardar:', data);
            await new Promise(resolve => setTimeout(resolve, 1000));
            toast.success('Gasto extra registrado exitosamente');
            setIsModalOpen(false);
            reset();
        } catch (error) {
            toast.error('Error al registrar el gasto');
        }
    };

    // Datos simulados
    const gastos = [
        { id: 1, vehiculo: 'RAM Roja', fecha: '10/may/2026', tipo: 'Combustible', descripcion: 'carga completa de gasolina Magna', costo: 1200, observaciones: 'Estacion Pemex carr. norte km 12' },
        { id: 2, vehiculo: 'Ranger Blanca', fecha: '09/may/2026', tipo: 'Tenencia 2026', descripcion: 'pago anual de tenencia vehicular', costo: 2800, observaciones: 'Pago realizado en linea' },
        { id: 3, vehiculo: 'Silverado 834', fecha: '08/may/2026', tipo: 'Lavado completo', descripcion: 'interior y exterior con encerado', costo: 350, observaciones: 'Autolavado Express Matamoros' },
        { id: 4, vehiculo: 'F-150 Gris', fecha: '07/may/2026', tipo: 'Multa de transito', descripcion: 'exceso de velocidad en zona escolar', costo: 1500, observaciones: 'Infraccion No. 2024-08871' },
        { id: 5, vehiculo: 'Hilux Plata', fecha: '05/may/2026', tipo: 'Combustible', descripcion: 'carga parcial de gasolina', costo: 600, observaciones: '-' },
        { id: 6, vehiculo: 'NP300 Blanca', fecha: '03/may/2026', tipo: 'Verificacion vehicular', descripcion: 'Verificacion semestral obligatoria', costo: 400, observaciones: 'Verificentro Zona Norte' },
    ];

    return (
        <div className="space-y-6">
            <div className="flex justify-end">
                <button
                    onClick={handleNuevoGasto}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-all shadow-lg shadow-blue-600/20 flex items-center gap-2 "
                >
                    <PlusIcon className="w-5 h-5" />
                    Nuevo gasto
                </button>
            </div>

            {/* Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm relative overflow-hidden group transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-lg hover:shadow-slate-200/60">
                    <div className="text-sm font-medium text-slate-500 mb-1">Total mes actual</div>
                    <div className="text-2xl font-bold text-slate-800">$8,450</div>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm relative overflow-hidden group transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-lg hover:shadow-slate-200/60">
                    <div className="text-sm font-medium text-slate-500 mb-1">Gasto mayor</div>
                    <div className="text-2xl font-bold text-slate-800">Combustible</div>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm relative overflow-hidden group transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-lg hover:shadow-slate-200/60">
                    <div className="text-sm font-medium text-slate-500 mb-1">Vehículo más gasto</div>
                    <div className="text-2xl font-bold text-slate-800">RAM Roja</div>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm relative overflow-hidden group transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-lg hover:shadow-slate-200/60">
                    <div className="text-sm font-medium text-slate-500 mb-1">Registros del mes</div>
                    <div className="text-2xl font-bold text-slate-800">23</div>
                </div>
            </div>

            {/* Filters and List */}
            <div className="bg-white border border-slate-200/60 rounded-2xl shadow-sm overflow-hidden flex flex-col transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-lg hover:shadow-slate-200/60">
                <div className="p-4 border-b border-slate-100 flex flex-wrap gap-3 items-center bg-slate-50/50">
                    <div className="w-[180px]">
                        <SelectPremium 
                            defaultValue="todos" 
                            placeholder="Vehículo" 
                            options={[
                                { value: 'todos', label: 'Vehículo: Todos' },
                                { value: 'RAM Roja', label: 'RAM Roja' },
                                { value: 'Ranger Blanca', label: 'Ranger Blanca' }
                            ]} 
                        />
                    </div>
                    
                    <DateRangePicker date={date} onDateChange={setDate} className="w-[240px] h-[38px]" />
                    
                    <div className="flex gap-2 ml-auto">
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
                                <th className="py-3 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Vehículo</th>
                                <th className="py-3 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Fecha</th>
                                <th className="py-3 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Tipo de gasto</th>
                                <th className="py-3 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Costo</th>
                                <th className="py-3 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Observaciones</th>
                                <th className="py-3 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {gastos.map((item) => (
                                <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                                    <td className="py-4 px-6 text-sm font-semibold text-slate-800">
                                        {item.vehiculo}
                                    </td>
                                    <td className="py-4 px-6 text-sm text-slate-500 ">
                                        {item.fecha}
                                    </td>
                                    <td className="py-4 px-6 text-sm">
                                        <div className="font-medium text-slate-700">{item.tipo}</div>
                                        <div className="text-slate-400 text-xs mt-0.5">{item.descripcion}</div>
                                    </td>
                                    <td className="py-4 px-6 text-sm font-bold text-slate-800 ">
                                        ${item.costo.toLocaleString('es-MX')}
                                    </td>
                                    <td className="py-4 px-6 text-sm text-slate-500 truncate max-w-xs">
                                        {item.observaciones}
                                    </td>
                                    <td className="py-4 px-6 text-right">
                                        <button 
                                            onClick={() => handleEditGasto(item)}
                                            className="text-blue-600 hover:text-blue-800 text-sm font-medium border border-blue-200 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors"
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

            {/* Pagination */}
            <div className="flex flex-wrap items-center justify-between gap-4 bg-white border border-slate-200 rounded-xl px-4 py-3 shadow-sm">
                <div className="flex items-center gap-3">
                    <span className="text-sm text-slate-500">Filas por página:</span>
                    <div className="w-[80px]">
                        <SelectPremium 
                            value={String(rowsPerPage)} 
                            onChange={(val) => setRowsPerPage(Number(val))} 
                            options={[
                                { value: '10', label: '10' },
                                { value: '25', label: '25' },
                                { value: '50', label: '50' },
                                { value: '100', label: '100' }
                            ]}
                        />
                    </div>
                    <span className="text-sm text-slate-500 ml-2 hidden sm:inline">Mostrando 1-{Math.min(rowsPerPage, 6)} de 6 registros</span>
                </div>
                <div className="flex items-center gap-4">
                    <span className="text-sm text-slate-600 font-medium">Página {currentPage} de {totalPages}</span>
                    <div className="flex items-center gap-1">
                        <button 
                            onClick={() => setCurrentPage(1)}
                            disabled={currentPage === 1}
                            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-600 disabled:opacity-50 disabled:hover:bg-transparent transition-colors"
                        >
                            <ChevronDoubleLeftIcon className="w-4 h-4" />
                        </button>
                        <button 
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            disabled={currentPage === 1}
                            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-600 disabled:opacity-50 disabled:hover:bg-transparent transition-colors"
                        >
                            <ChevronLeftIcon className="w-4 h-4" />
                        </button>
                        <button 
                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                            disabled={currentPage === totalPages}
                            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-600 disabled:opacity-50 disabled:hover:bg-transparent transition-colors"
                        >
                            <ChevronRightIcon className="w-4 h-4" />
                        </button>
                        <button 
                            onClick={() => setCurrentPage(totalPages)}
                            disabled={currentPage === totalPages}
                            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-600 disabled:opacity-50 disabled:hover:bg-transparent transition-colors"
                        >
                            <ChevronDoubleRightIcon className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Modal de Nuevo Gasto Extra */}
            <AnimatePresence>
                {isModalOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40"
                            onClick={() => setIsModalOpen(false)}
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
                                        {editData ? "Detalle de gasto extra" : "Nuevo gasto extra"}
                                    </h2>
                                </div>
                                <button
                                    onClick={() => setIsModalOpen(false)}
                                    className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors"
                                >
                                    <XMarkIcon className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
                                <form id="gasto-form" onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                                    
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1.5">Vehículo *</label>
                                        <Controller
                                            name="vehiculo_id"
                                            control={control}
                                            render={({ field }) => (
                                                <SelectPremium 
                                                    value={field.value} 
                                                    onChange={field.onChange} 
                                                    placeholder="Seleccionar vehículo" 
                                                    options={[
                                                        { value: '1', label: 'RAM Roja' },
                                                        { value: '2', label: 'Ranger Blanca' }
                                                    ]}
                                                />
                                            )}
                                        />
                                        {errors.vehiculo_id && <span className="text-red-500 text-xs mt-1 block">{errors.vehiculo_id.message}</span>}
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1.5">Fecha *</label>
                                            <Controller
                                                name="fecha"
                                                control={control}
                                                render={({ field }) => (
                                                    <DatePicker
                                                        value={field.value}
                                                        onChange={(date) => field.onChange(date ? date.toISOString().split('T')[0] : '')}
                                                        placeholder="Seleccionar fecha"
                                                        className="w-full bg-slate-50"
                                                    />
                                                )}
                                            />
                                            {errors.fecha && <span className="text-red-500 text-xs mt-1 block">{errors.fecha.message}</span>}
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1.5">Costo * (MXN)</label>
                                            <div className="relative">
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    placeholder="0.00"
                                                    {...register('costo')}
                                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                                />
                                                <CurrencyDollarIcon className="w-5 h-5 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                                            </div>
                                            {errors.costo && <span className="text-red-500 text-xs mt-1 block">{errors.costo.message}</span>}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1.5">Tipo de gasto * (hasta 250 caracteres)</label>
                                        <textarea
                                            {...register('tipo_gasto')}
                                            placeholder="Combustible, multa, lavado, tenencia, verificacion..."
                                            rows="2"
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none transition-all placeholder:text-slate-400"
                                        ></textarea>
                                        {errors.tipo_gasto && <span className="text-red-500 text-xs mt-1 block">{errors.tipo_gasto.message}</span>}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1.5">Observaciones (opcional)</label>
                                        <textarea
                                            {...register('observaciones')}
                                            rows="2"
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none transition-all placeholder:text-slate-400"
                                        ></textarea>
                                    </div>

                                </form>
                            </div>

                            <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-start gap-3 shrink-0">
                                <button
                                    type="submit"
                                    form="gasto-form"
                                    disabled={isSubmitting}
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl text-sm font-medium transition-all shadow-lg shadow-blue-600/20 disabled:opacity-70 flex items-center justify-center min-w-[140px]"
                                >
                                    {isSubmitting ? 'Guardando...' : editData ? 'Guardar cambios' : 'Guardar gasto'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-6 py-2.5 rounded-xl text-sm font-medium transition-all"
                                >
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
