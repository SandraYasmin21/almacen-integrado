import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { 
    XMarkIcon,
    MagnifyingGlassIcon,
    ChevronDownIcon,
    CheckIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    ChevronDoubleLeftIcon,
    ChevronDoubleRightIcon,
    ArrowDownTrayIcon,
    TableCellsIcon,
    DocumentTextIcon,
    CalendarIcon
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '../../lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '../../components/ui/popover';
import { DateRangePicker } from '../../components/ui/date-range-picker';
import { DatePicker } from '../../components/ui/date-picker';
import { SelectPremium } from '../../components/ui/SelectPremium';

const mantenimientoSchema = z.object({
    vehiculo_id: z.string().min(1, "Obligatorio"),
    fecha: z.string().min(1, "Obligatorio"),
    tipo: z.enum(['preventivo', 'correctivo', 'lectura']),
    detalle_falla: z.string().optional(),
    kilometraje: z.string().min(1, "Obligatorio"),
    costo: z.string().optional(),
    subtipo: z.string().optional()
});

function FilterPopover({ title, options, selected, onChange }) {
    const toggleOption = (opt) => {
        if (selected.includes(opt)) {
            onChange(selected.filter(x => x !== opt));
        } else {
            onChange([...selected, opt]);
        }
    };

    return (
        <Popover>
            <PopoverTrigger asChild>
                <button className={`group flex h-11 items-center justify-between gap-2 rounded-xl border bg-white px-4 text-sm text-slate-700 shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/20 data-[state=open]:border-blue-400 data-[state=open]:ring-4 data-[state=open]:ring-blue-500/10 ${selected.length > 0 ? 'border-blue-200 bg-blue-50 text-blue-700 font-semibold' : 'border-slate-200 hover:border-slate-300'}`}>
                    {title} {selected.length > 0 && <span className="bg-blue-600 text-white text-[10px] px-1.5 py-0.5 rounded-full min-w-[1.25rem] text-center">{selected.length}</span>}
                    <ChevronDownIcon className="w-4 h-4 text-slate-400 transition-transform duration-200 group-data-[state=open]:rotate-180 group-data-[state=open]:text-blue-500" />
                </button>
            </PopoverTrigger>
            <PopoverContent 
                className="w-56 p-2 rounded-xl border border-slate-200 bg-white shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2" 
                align="start"
                sideOffset={8}
            >
                <div className="space-y-1">
                    {options.map(opt => (
                        <label key={opt} className={`flex items-center gap-2 px-3 py-2.5 rounded-lg cursor-pointer text-sm transition-colors ${selected.includes(opt) ? 'bg-blue-50/50 text-blue-900 font-medium' : 'text-slate-700 hover:bg-slate-50'}`}>
                            <div className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 transition-colors ${selected.includes(opt) ? 'bg-blue-600 border-blue-600' : 'border-slate-300 bg-white'}`}>
                                {selected.includes(opt) && <CheckIcon className="w-3 h-3 text-white" strokeWidth={3} />}
                            </div>
                            <span className="truncate">{opt}</span>
                        </label>
                    ))}
                </div>
            </PopoverContent>
        </Popover>
    );
}

export default function RegistroMantenimientos() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editData, setEditData] = useState(null);

    const handleNuevoRegistro = () => {
        setEditData(null);
        setIsModalOpen(true);
    };

    const handleEditRegistro = (registro) => {
        setEditData(registro);
        setIsModalOpen(true);
    };
    
    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const totalPages = 5;

    // Filters State
    const [filters, setFilters] = useState({
        vehiculo: [],
        tipo: []
    });
    
    const [date, setDate] = useState({
        from: new Date(2026, 4, 1),
        to: new Date(2026, 4, 31),
    });
    
    // Debounce Search State
    const [searchTerm, setSearchTerm] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [isSearching, setIsSearching] = useState(false);

    useEffect(() => {
        setIsSearching(true);
        const handler = setTimeout(() => {
            setDebouncedSearch(searchTerm);
            setIsSearching(false);
        }, 400); // 400ms debounce
        return () => clearTimeout(handler);
    }, [searchTerm]);

    const filterOptions = {
        vehiculo: ['Ranger Blanca', 'Silverado 834', 'RAM Roja', 'F-150 Gris', 'Hilux Plata', 'NP300 Blanca'],
        tipo: ['Preventivo', 'Correctivo', 'Lectura']
    };

    const removeFilter = (key, val) => {
        setFilters(prev => ({ ...prev, [key]: prev[key].filter(x => x !== val) }));
    };

    const clearFilters = () => {
        setFilters({ vehiculo: [], tipo: [] });
    };

    const activeFilterCount = Object.values(filters).flat().length;

    const handleExport = (format) => {
        const queryParams = new URLSearchParams();
        if (filters.vehiculo.length) queryParams.append('vehiculo', filters.vehiculo.join(','));
        if (filters.tipo.length) queryParams.append('tipo', filters.tipo.join(','));
        if (debouncedSearch) queryParams.append('search', debouncedSearch);

        if (date.from) queryParams.append('fecha_inicio', date.from.toISOString().split('T')[0]);
        if (date.to) queryParams.append('fecha_fin', date.to.toISOString().split('T')[0]);

        const url = `/api/exportar/mantenimientos/${format}${queryParams.toString()}`;
        
        toast.success(`Exportando ${format.toUpperCase()}...`, {
            description: `Peticion GET simulada a: ${url}`
        });
    };
    
    // Datos falsos para la tabla
    const registros = [
        { vehiculo: "Ranger Blanca", fecha: "05/may/2026", tipo: "preventivo", detalle: "Cambio de aceite y filtros - servicio 10,000 km", km: "45,230 km", costo: "$1,850", subtipo: "Cambio de aceite" },
        { vehiculo: "Silverado 834", fecha: "02/may/2026", tipo: "correctivo", detalle: "Falla en sistema de frenos - cambio pastillas traseras", km: "38,100 km", costo: "$3,200", subtipo: "Frenos" },
        { vehiculo: "RAM Roja", fecha: "28/abr/2026", tipo: "lectura", detalle: "Lectura de odometro - sin novedades", km: "72,450 km", costo: "$0", subtipo: "Lectura" },
        { vehiculo: "F-150 Gris", fecha: "25/abr/2026", tipo: "preventivo", detalle: "Revision general - cambio de llantas delanteras", km: "91,200 km", costo: "$4,500", subtipo: "Llantas" },
        { vehiculo: "Hilux Plata", fecha: "20/abr/2026", tipo: "correctivo", detalle: "Problema electrico - revision y reparacion de alternador", km: "28,700 km", costo: "$2,100", subtipo: "Sistema electrico" },
        { vehiculo: "NP300 Blanca", fecha: "15/abr/2026", tipo: "preventivo", detalle: "Servicio de 20,000 km - aceite, filtros, bujias", km: "20,050 km", costo: "$2,300", subtipo: "Servicio mayor" },
    ];

    return (
        <div className="pb-20">
            <div className="flex justify-end mb-4">
                <button 
                    onClick={handleNuevoRegistro}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-sm transition-colors flex items-center gap-2"
                >
                    + Nuevo registro
                </button>
            </div>

            {/* Filters */}
            <div className="flex flex-col gap-3 mb-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap gap-2">
                        <FilterPopover 
                            title="Vehículo" 
                            options={filterOptions.vehiculo} 
                            selected={filters.vehiculo} 
                            onChange={(val) => setFilters(prev => ({...prev, vehiculo: val}))} 
                        />
                        <FilterPopover 
                            title="Tipo" 
                            options={filterOptions.tipo} 
                            selected={filters.tipo} 
                            onChange={(val) => setFilters(prev => ({...prev, tipo: val}))} 
                        />
                        <DateRangePicker date={date} onDateChange={setDate} className="w-[240px] h-[38px]" />
                    </div>
                    <div className="flex gap-3">
                        <div className="relative">
                            <input 
                                type="text" 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Buscar mantenimiento..." 
                                className="bg-white border border-slate-200 rounded-lg pl-10 pr-10 py-2 text-sm text-slate-600 outline-none w-64 shadow-sm focus:ring-2 focus:ring-blue-500 transition-all"
                            />
                            <MagnifyingGlassIcon className="w-5 h-5 text-slate-400 absolute left-3 top-2.5" />
                            {isSearching && <span className="absolute right-3 top-3 flex h-4 w-4 rounded-full border-2 border-slate-300 border-t-blue-600 animate-spin"></span>}
                        </div>
                        <div className="flex gap-2">
                            <button 
                                onClick={() => handleExport('pdf')} 
                                className="bg-[#ff2d55] hover:bg-[#ff1441] text-white px-5 py-2 rounded-full text-sm font-semibold shadow-sm transition-colors outline-none"
                            >
                                Exportar PDF
                            </button>
                            <button 
                                onClick={() => handleExport('excel')} 
                                className="bg-[#00d084] hover:bg-[#00bd78] text-white px-5 py-2 rounded-full text-sm font-semibold shadow-sm transition-colors outline-none"
                            >
                                Exportar Excel
                            </button>
                        </div>
                    </div>
                </div>

                {/* Active Filter Pills (Chips) */}
                {activeFilterCount > 0 && (
                    <div className="flex flex-wrap items-center gap-2 pt-2">
                        <span className="text-xs font-semibold text-slate-500 mr-1">Filtros activos:</span>
                        {Object.entries(filters).map(([key, vals]) => 
                            vals.map(val => (
                                <span key={`${key}-${val}`} className="flex items-center gap-1 bg-white shadow-sm text-slate-700 text-xs font-semibold px-2.5 py-1 rounded-full border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
                                    <span className="text-slate-400 font-normal">{key.charAt(0).toUpperCase() + key.slice(1)}:</span> {val}
                                    <button onClick={() => removeFilter(key, val)} className="text-slate-400 hover:text-rose-500 ml-1 transition-colors outline-none">
                                        <XMarkIcon className="w-3.5 h-3.5" />
                                    </button>
                                </span>
                            ))
                        )}
                        <button onClick={clearFilters} className="text-xs text-blue-600 hover:text-blue-800 font-semibold px-2 py-1 ml-1 hover:underline transition-colors">
                            Limpiar todos
                        </button>
                    </div>
                )}
            </div>

            {/* Table */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-lg hover:shadow-slate-200/60 mb-4">
                <div className="w-full overflow-hidden">
                    <table className="w-full table-fixed text-left text-sm text-slate-600">
                        <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-4 font-semibold">Vehiculo</th>
                                <th className="px-6 py-4 font-semibold">Fecha</th>
                                <th className="px-6 py-4 font-semibold">Tipo</th>
                                <th className="px-6 py-4 font-semibold">Detalle / Falla</th>
                                <th className="px-6 py-4 font-semibold">Kilometraje</th>
                                <th className="px-6 py-4 font-semibold">Costo</th>
                                <th className="px-6 py-4 font-semibold">Subtipo</th>
                                <th className="px-6 py-4"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700">
                            {registros.map((r, i) => (
                                <tr key={i} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4 font-bold text-slate-800">{r.vehiculo}</td>
                                    <td className="px-6 py-4 text-slate-500">{r.fecha}</td>
                                    <td className="px-6 py-4">
                                        <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                                            r.tipo === 'preventivo' ? 'bg-emerald-100 text-emerald-700' :
                                            r.tipo === 'correctivo' ? 'bg-rose-100 text-rose-700' :
                                            'bg-blue-100 text-blue-700'
                                        }`}>{r.tipo}</span>
                                    </td>
                                    <td className="px-6 py-4 text-slate-600 truncate max-w-[200px]">{r.detalle}</td>
                                    <td className="px-6 py-4 font-semibold text-slate-800">{r.km}</td>
                                    <td className="px-6 py-4 font-bold text-slate-800">{r.costo}</td>
                                    <td className="px-6 py-4 text-slate-500">{r.subtipo}</td>
                                    <td className="px-6 py-4 text-right">
                                        <button 
                                            onClick={() => handleEditRegistro(r)}
                                            className="px-3 py-1.5 border border-blue-200 text-blue-600 rounded-lg text-xs font-semibold hover:bg-blue-50 transition-colors"
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
            <div className="flex flex-wrap items-center justify-between gap-4 bg-white border border-slate-200 rounded-xl px-4 py-3 shadow-sm mb-6">
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

            {/* Modal Nuevo Registro */}
            <NuevoRegistroModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} editData={editData} />
        </div>
    );
}

function NuevoRegistroModal({ isOpen, onClose, editData }) {
    const { register, handleSubmit, setValue, watch, reset, formState: { errors }, control } = useForm({
        resolver: zodResolver(mantenimientoSchema),
        defaultValues: {
            tipo: 'preventivo'
        }
    });

    useEffect(() => {
        if (isOpen) {
            if (editData) {
                const vId = editData.vehiculo === "Ranger Blanca" ? "1" : "2"; 
                setValue('vehiculo_id', vId);
                setValue('tipo', editData.tipo);
                setValue('detalle_falla', editData.detalle || "");
                setValue('kilometraje', editData.km ? editData.km.replace(' km', '').replace(/,/g, '') : "");
                setValue('costo', editData.costo ? editData.costo.replace('$', '').replace(/,/g, '') : "");
                setValue('subtipo', editData.subtipo || "");
            } else {
                reset({ tipo: 'preventivo' });
            }
        }
    }, [isOpen, editData, setValue, reset]);

    const tipoMantenimiento = watch('tipo');

    const onSubmit = (data) => {
        toast.success("Registro de mantenimiento guardado correctamente (simulación)");
        onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <motion.div 
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm"
                        onClick={onClose}
                    />
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="bg-white rounded-2xl shadow-xl w-full max-w-xl relative z-10 overflow-hidden"
                    >
                        <div className="p-6 border-b border-slate-100 flex justify-between items-start">
                            <div>
                                <h2 className="text-xl font-bold text-slate-800">
                                    {editData ? "Detalle de mantenimiento" : "Nuevo registro de mantenimiento"}
                                </h2>
                            </div>
                            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors">
                                <XMarkIcon className="w-6 h-6" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit(onSubmit)} className="p-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">Vehiculo <span className="text-red-500">*</span></label>
                                    <Controller
                                        name="vehiculo_id"
                                        control={control}
                                        render={({ field }) => (
                                            <SelectPremium 
                                                value={field.value} 
                                                onChange={field.onChange} 
                                                placeholder="Seleccionar vehículo" 
                                                options={[
                                                    { value: '1', label: 'Ranger Blanca' },
                                                    { value: '2', label: 'Silverado 834' }
                                                ]}
                                            />
                                        )}
                                    />
                                    {errors.vehiculo_id && <p className="text-red-500 text-xs mt-1">{errors.vehiculo_id.message}</p>}
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1">Fecha <span className="text-red-500">*</span></label>
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
                                        {errors.fecha && <p className="text-red-500 text-xs mt-1">{errors.fecha.message}</p>}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1">Tipo <span className="text-red-500">*</span></label>
                                        <div className="flex gap-2">
                                            {[
                                                { id: 'preventivo', label: 'Preventivo', activeClass: 'bg-emerald-500 text-white border-transparent' },
                                                { id: 'correctivo', label: 'Correctivo', activeClass: 'bg-rose-50 text-rose-600 border-rose-300' },
                                                { id: 'lectura', label: 'Lectura', activeClass: 'bg-blue-50 text-blue-600 border-blue-300' }
                                            ].map(t => (
                                                <button
                                                    key={t.id}
                                                    type="button"
                                                    onClick={() => setValue('tipo', t.id)}
                                                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                                                        tipoMantenimiento === t.id ?
                                                         t.activeClass
                                                        : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                                                    }`}
                                                >
                                                    {t.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">Detalle / Falla</label>
                                    <textarea 
                                        {...register('detalle_falla')}
                                        placeholder="Descripcion libre de la falla o trabajo realizado..."
                                        rows={3}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                                    ></textarea>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1">Kilometraje <span className="text-red-500">*</span></label>
                                        <input 
                                            {...register('kilometraje')}
                                            placeholder="Ej. 45230.50"
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                                        />
                                        {errors.kilometraje && <p className="text-red-500 text-xs mt-1">{errors.kilometraje.message}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1">Costo (MXN)</label>
                                        <input 
                                            {...register('costo')}
                                            placeholder="$0.00 - default: 0"
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">Subtipo</label>
                                    <input 
                                        {...register('subtipo')}
                                        placeholder="Cambio de aceite, Frenos, Llantas..."
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>
                            </div>
                            
                            <div className="mt-8 flex items-center gap-3">
                                <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-semibold shadow-sm transition-colors text-sm">
                                    {editData ? "Guardar cambios" : "Guardar registro"}
                                </button>
                                <button type="button" onClick={onClose} className="bg-white border border-slate-200 text-slate-700 px-6 py-2.5 rounded-xl font-semibold hover:bg-slate-50 transition-colors text-sm">
                                    Cancelar
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
