import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { 
    XMarkIcon,
    InformationCircleIcon,
    MagnifyingGlassIcon,
    ChevronDownIcon,
    CheckIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    ChevronDoubleLeftIcon,
    ChevronDoubleRightIcon,
    ArrowDownTrayIcon,
    TableCellsIcon,
    DocumentTextIcon
} from '@heroicons/react/24/outline';
import { Popover, PopoverContent, PopoverTrigger } from '../../components/ui/popover';
import { SelectPremium } from '../../components/ui/SelectPremium';
import StatusBadge from '../../components/StatusBadge';

const vehiculoSchema = z.object({
    nombre_alias: z.string().min(1, "Obligatorio"),
    modelo: z.string().min(1, "Obligatorio"),
    niv: z.string().min(1, "Obligatorio").regex(/^[A-Z0-9]+$/, "Formato alfanumérico"),
    placa: z.string().min(1, "Obligatorio"),
    numero_interno: z.string().optional(),
    tipo_vehiculo: z.string().optional(),
    poliza_seguro: z.string().optional(),
    certificacion: z.string().optional(),
    estado_gps: z.enum(['ACTIVO', 'INACTIVO', 'SIN UNIDAD'])
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

export default function CatalogoVehiculos() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editData, setEditData] = useState(null);

    const handleNuevoVehiculo = () => {
        setEditData(null);
        setIsModalOpen(true);
    };

    const handleEditVehiculo = (vehiculo) => {
        setEditData(vehiculo);
        setIsModalOpen(true);
    };
    
    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    // Filters State
    const [filters, setFilters] = useState({
        tipo: [],
        gps: [],
        estado: []
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
        tipo: ['Pickup', 'Camioneta', 'Sedán', 'Motocicleta'],
        gps: ['ACTIVO', 'INACTIVO', 'SIN UNIDAD'],
        estado: ['ACTIVO', 'INACTIVO', 'TALLER']
    };

    const removeFilter = (key, val) => {
        setFilters(prev => ({ ...prev, [key]: prev[key].filter(x => x !== val) }));
    };

    const clearFilters = () => {
        setFilters({ tipo: [], gps: [], estado: [] });
    };

    const activeFilterCount = Object.values(filters).flat().length;

    const handleExport = (format) => {
        const queryParams = new URLSearchParams();
        if (filters.tipo.length) queryParams.append('tipo', filters.tipo.join(','));
        if (filters.gps.length) queryParams.append('gps', filters.gps.join(','));
        if (filters.estado.length) queryParams.append('estado', filters.estado.join(','));
        if (debouncedSearch) queryParams.append('search', debouncedSearch);

        const url = `/api/exportar/${format}${queryParams.toString()}`;
        
        toast.success(`Exportando ${format.toUpperCase()}...`, {
            description: `Petición GET simulada a: ${url}`
        });
    };
    
    // Datos falsos para la tabla (simulación de backend)
    const allVehiculos = [
        { alias: "Ranger Blanca", no: "830", modelo: "Ford Ranger 2021", placa: "ABC-123-D", niv: "1FTER4FH5MLD...", tipo: "Pickup", gps: "ACTIVO", certificacion: "Certificada", estado: "ACTIVO" },
        { alias: "Silverado 834", no: "831", modelo: "Chev. Silverado 2022", placa: "XYZ-456-E", niv: "3GCUKREC4AG1...", tipo: "Camioneta", gps: "ACTIVO", certificacion: "VIG 20/09/25", estado: "ACTIVO" },
        { alias: "RAM Roja", no: "832", modelo: "Dodge RAM 1500 2020", placa: "TMX-1234", niv: "1D7RB1CT2AS1...", tipo: "Pickup", gps: "INACTIVO", certificacion: "Certificada", estado: "ACTIVO" },
        { alias: "F-150 Gris", no: "833", modelo: "Ford F-150 XLT 2019", placa: "TAM-5678", niv: "1FTFW1EF6BFB...", tipo: "Pickup", gps: "SIN UNIDAD", certificacion: "Sin cert.", estado: "INACTIVO" },
        { alias: "Hilux Plata", no: "834", modelo: "Toyota Hilux 2023", placa: "TMP-9012", niv: "MR0GX22G4001...", tipo: "Pickup", gps: "ACTIVO", certificacion: "Certificada", estado: "ACTIVO" },
        { alias: "NP300 Blanca", no: "835", modelo: "Nissan NP300 2022", placa: "TPP-3456", niv: "3N6AD33A9YK8...", tipo: "Camioneta", gps: "ACTIVO", certificacion: "Certificada", estado: "ACTIVO" },
    ];

    const totalVehiculos = allVehiculos.length;
    const totalPages = Math.ceil(totalVehiculos / rowsPerPage) || 1;
    const paginatedVehiculos = allVehiculos.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

    useEffect(() => {
        if (currentPage > totalPages) {
            setCurrentPage(totalPages);
        }
    }, [rowsPerPage, totalPages, currentPage]);

    return (
        <div className="pb-20">
            <div className="flex justify-end mb-4">
                <button 
                    onClick={handleNuevoVehiculo}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-sm transition-colors flex items-center gap-2"
                >
                    + Nuevo vehiculo
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 cursor-default transform-gpu transition-all duration-300 ease-out hover:-translate-y-1.5 hover:shadow-xl hover:shadow-slate-200/70">
                    <div className="text-sm text-slate-500 font-semibold mb-1">Total activos</div>
                    <div className="text-2xl font-bold text-slate-800">12</div>
                </div>
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 cursor-default transform-gpu transition-all duration-300 ease-out hover:-translate-y-1.5 hover:shadow-xl hover:shadow-slate-200/70">
                    <div className="text-sm text-slate-500 font-semibold mb-1">Inactivos</div>
                    <div className="text-2xl font-bold text-slate-800">2</div>
                </div>
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 cursor-default transform-gpu transition-all duration-300 ease-out hover:-translate-y-1.5 hover:shadow-xl hover:shadow-slate-200/70">
                    <div className="text-sm text-slate-500 font-semibold mb-1">Con GPS activo</div>
                    <div className="text-2xl font-bold text-slate-800">9</div>
                </div>
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 cursor-default transform-gpu transition-all duration-300 ease-out hover:-translate-y-1.5 hover:shadow-xl hover:shadow-slate-200/70">
                    <div className="text-sm text-slate-500 font-semibold mb-1">Sin poliza</div>
                    <div className="text-2xl font-bold text-slate-800">1</div>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col gap-3 mb-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap gap-2">
                        <FilterPopover 
                            title="Tipo vehículo" 
                            options={filterOptions.tipo} 
                            selected={filters.tipo} 
                            onChange={(val) => setFilters(prev => ({...prev, tipo: val}))} 
                        />
                        <FilterPopover 
                            title="Estado GPS" 
                            options={filterOptions.gps} 
                            selected={filters.gps} 
                            onChange={(val) => setFilters(prev => ({...prev, gps: val}))} 
                        />
                        <FilterPopover 
                            title="Estado" 
                            options={filterOptions.estado} 
                            selected={filters.estado} 
                            onChange={(val) => setFilters(prev => ({...prev, estado: val}))} 
                        />
                    </div>
                    <div className="flex gap-3">
                        <div className="relative">
                            <input 
                                type="text" 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Buscar nombre, placa, NIV..." 
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
                                    <span className="text-slate-400 font-normal">{key === 'gps' ? 'GPS' : key.charAt(0).toUpperCase() + key.slice(1)}:</span> {val}
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
                                <th className="w-[13%] px-4 py-4 font-semibold">Nombre / Alias</th>
                                <th className="w-[14%] px-4 py-4 font-semibold">Modelo</th>
                                <th className="w-[10%] px-4 py-4 font-semibold">Placa</th>
                                <th className="w-[13%] px-4 py-4 font-semibold">NIV</th>
                                <th className="w-[10%] px-4 py-4 font-semibold">Tipo</th>
                                <th className="w-[12%] px-4 py-4 text-center font-semibold">GPS</th>
                                <th className="w-[12%] px-4 py-4 font-semibold">Certificacion</th>
                                <th className="w-[10%] px-4 py-4 text-center font-semibold">Estado</th>
                                <th className="w-[6%] px-4 py-4"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700">
                            {paginatedVehiculos.map((v, i) => (
                                <tr key={i} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-4 py-4">
                                        <div>
                                            <div className="font-bold text-slate-800">{v.alias}</div>
                                            <div className="text-xs text-slate-500">No. {v.no}</div>
                                        </div>
                                    </td>
                                    <td className="truncate px-4 py-4">{v.modelo}</td>
                                    <td className="truncate px-4 py-4 font-semibold">{v.placa}</td>
                                    <td className="truncate px-4 py-4 text-xs text-slate-500">{v.niv}</td>
                                    <td className="truncate px-4 py-4 text-slate-500">{v.tipo}</td>
                                    <td className="px-4 py-4 text-center">
                                        <StatusBadge status={v.gps === 'ACTIVO' ? 'Activo' : v.gps === 'INACTIVO' ? 'Inactivo' : 'Sin unidad'} size="compact" />
                                    </td>
                                    <td className="truncate px-4 py-4 text-slate-500">{v.certificacion}</td>
                                    <td className="px-4 py-4 text-center">
                                        <StatusBadge status={v.estado === 'ACTIVO' ? 'Activo' : 'Inactivo'} size="compact" />
                                    </td>
                                    <td className="px-4 py-4 text-right">
                                        <button 
                                            onClick={() => handleEditVehiculo(v)}
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

            {/* Pagination placeholder */}
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
                    <span className="text-sm text-slate-500 ml-2 hidden sm:inline">Mostrando {totalVehiculos === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1}-{Math.min(currentPage * rowsPerPage, totalVehiculos)} de {totalVehiculos} vehículos</span>
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

            {/* Modal Nuevo Vehículo */}
            <NuevoVehiculoModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} editData={editData} />
        </div>
    );
}

function NuevoVehiculoModal({ isOpen, onClose, editData }) {
    const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm({
        resolver: zodResolver(vehiculoSchema),
        defaultValues: {
            estado_gps: 'ACTIVO'
        }
    });

    useEffect(() => {
        if (isOpen) {
            if (editData) {
                setValue('nombre_alias', editData.alias || "");
                setValue('modelo', editData.modelo || "");
                setValue('niv', editData.niv || "");
                setValue('placa', editData.placa || "");
                setValue('numero_interno', editData.no || "");
                setValue('tipo_vehiculo', editData.tipo || "");
                setValue('poliza_seguro', "");
                setValue('certificacion', editData.certificacion || "");
                setValue('estado_gps', editData.gps === 'ACTIVO' ? 'ACTIVO' : editData.gps === 'INACTIVO' ? 'INACTIVO' : 'SIN UNIDAD');
            } else {
                reset({ estado_gps: 'ACTIVO' });
            }
        }
    }, [isOpen, editData, setValue, reset]);

    const estadoGps = watch('estado_gps');

    const onSubmit = (data) => {
        toast.success("Vehículo registrado correctamente (simulación)");
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
                        className="bg-white rounded-2xl shadow-xl w-full max-w-2xl relative z-10 flex flex-col max-h-[90vh] overflow-hidden"
                    >
                        <div className="p-5 border-b border-slate-100 flex justify-between items-center shrink-0">
                            <h2 className="text-xl font-bold text-slate-800">
                                {editData ? "Detalle del vehículo" : "Nuevo vehículo"}
                            </h2>
                            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors">
                                <XMarkIcon className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="overflow-y-auto p-5 scrollbar-thin scrollbar-thumb-slate-200">
                            <form id="vehiculoForm" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1">Nombre / Alias <span className="text-red-500">*</span></label>
                                        <input 
                                            {...register('nombre_alias')}
                                            placeholder="Ej. Ranger Blanca"
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                                        />
                                        {errors.nombre_alias && <p className="text-red-500 text-xs mt-1">{errors.nombre_alias.message}</p>}
                                    </div>
                                    
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1">Modelo <span className="text-red-500">*</span></label>
                                        <input 
                                            {...register('modelo')}
                                            placeholder="Ej. Ford Ranger 2021"
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                                        />
                                        {errors.modelo && <p className="text-red-500 text-xs mt-1">{errors.modelo.message}</p>}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1">NIV / Número de serie <span className="text-red-500">*</span></label>
                                        <input 
                                            {...register('niv')}
                                            placeholder="1FTER4FH5MLD12345"
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none uppercase"
                                        />
                                        {errors.niv && <p className="text-red-500 text-xs mt-1">{errors.niv.message}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1">Placa <span className="text-red-500">*</span></label>
                                        <input 
                                            {...register('placa')}
                                            placeholder="ABC-123-D"
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none uppercase"
                                        />
                                        {errors.placa && <p className="text-red-500 text-xs mt-1">{errors.placa.message}</p>}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1">Número interno</label>
                                        <input 
                                            {...register('numero_interno')}
                                            placeholder="Ej. 834"
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1">Tipo de vehículo</label>
                                        <input 
                                            {...register('tipo_vehiculo')}
                                            placeholder="Camioneta, Pickup, Sedan..."
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1">Póliza de seguro</label>
                                        <input 
                                            {...register('poliza_seguro')}
                                            placeholder="Num. póliza"
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1">Certificación</label>
                                        <input 
                                            {...register('certificacion')}
                                            placeholder="VIG 29/09/09"
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">Estado GPS</label>
                                    <div className="flex flex-wrap gap-2">
                                        {['ACTIVO', 'INACTIVO', 'SIN UNIDAD'].map(estado => (
                                            <button
                                                key={estado}
                                                type="button"
                                                onClick={() => setValue('estado_gps', estado)}
                                                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                                                    estadoGps === estado ?
                                                     (estado === 'ACTIVO' ? 'bg-emerald-500 text-white shadow-sm' : estado === 'INACTIVO' ? 'bg-rose-500 text-white shadow-sm' : 'bg-amber-500 text-white shadow-sm')
                                                    : 'bg-white text-slate-500 hover:bg-slate-100 border border-slate-200'
                                                }`}
                                            >
                                                {estado}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </form>
                        </div>
                        
                        <div className="p-5 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-3 shrink-0">
                            <button type="button" onClick={onClose} className="bg-white border border-slate-200 text-slate-700 px-6 py-2.5 rounded-xl font-semibold hover:bg-slate-50 transition-colors text-sm">
                                Cancelar
                            </button>
                            <button form="vehiculoForm" type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-semibold shadow-sm transition-colors text-sm">
                                {editData ? "Guardar cambios" : "Registrar vehículo"}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
