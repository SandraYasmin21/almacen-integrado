import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

const API = import.meta.env.VITE_API_URL ?? "";
const authHeaders = () => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${localStorage.getItem("smartlynk_token") ?? ""}`,
});

export default function Salida() {
    const navigate = useNavigate();
    
    // Estados para la data maestra
    const [inventario, setInventario] = useState([]);
    const [empleados, setEmpleados] = useState([]);
    const [proveedores, setProveedores] = useState([]);

    // Estados para el formulario
    const [empleadoId, setEmpleadoId] = useState('');
    const [proveedorId, setProveedorId] = useState('');
    const [notas, setNotas] = useState('');
    
    // Estados del Carrito y Búsqueda
    const [carrito, setCarrito] = useState([]);
    const [busqueda, setBusqueda] = useState('');
    const [resultados, setResultados] = useState([]);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    
    const dropdownRef = useRef(null);

    // Cargar datos al montar el componente
    useEffect(() => {
        cargarDatos();
        
        // Cerrar dropdown al hacer click fuera
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const cargarDatos = async () => {
        try {
            // Reutilizamos el endpoint que ya armamos para Index.jsx
            const [invRes, empRes, provRes] = await Promise.all([
                fetch(`${API}/api/almacen/inventario-detallado`, { headers: authHeaders() }),
                fetch(`${API}/api/empleados`, { headers: authHeaders() }),
                fetch(`${API}/api/proveedores`, { headers: authHeaders() }) // Ajusta la ruta si es distinta
            ]);

            const invData = await invRes.json();
            const empData = await empRes.json();
            const provData = await provRes.json();

            if (invData.success) setInventario(invData.data);
            if (empData.success) setEmpleados(empData.data);
            if (provData.success) setProveedores(provData.data);
        } catch (error) {
            toast.error("Error al cargar la información base.");
        }
    };

    // Buscador Inteligente en Tiempo Real
    useEffect(() => {
        if (busqueda.trim().length > 1) {
            const lower = busqueda.toLowerCase();
            const filtrados = inventario.filter(art => 
                art.nombre.toLowerCase().includes(lower) || 
                (art.modelo && art.modelo.toLowerCase().includes(lower)) ||
                (art.numero_serie_fabricante && art.numero_serie_fabricante.toLowerCase().includes(lower))
            );
            setResultados(filtrados);
            setIsDropdownOpen(true);
        } else {
            setResultados([]);
            setIsDropdownOpen(false);
        }
    }, [busqueda, inventario]);

    // Función para agregar al carrito
    const agregarAlCarrito = (art) => {
        // Validación: Si es SERIE, checar si ya lo agregamos
        if (art.row_type === 'serie') {
            if (carrito.some(item => item.serie_id === art.serie_id)) {
                toast.error("Esta serie ya está en el carrito.");
                return;
            }
            setCarrito([...carrito, { ...art, cantidadSalida: 1 }]);
        } else {
            // Si es CONSUMIBLE, revisar si ya existe para sumar +1 o agregarlo
            const existeIdx = carrito.findIndex(item => item.articulo_id === art.articulo_id && item.row_type !== 'serie');
            if (existeIdx >= 0) {
                const nuevoCarrito = [...carrito];
                if (nuevoCarrito[existeIdx].cantidadSalida < art.cantidad) {
                    nuevoCarrito[existeIdx].cantidadSalida += 1;
                    setCarrito(nuevoCarrito);
                } else {
                    toast.error(`Stock máximo alcanzado para ${art.nombre}`);
                }
            } else {
                setCarrito([...carrito, { ...art, cantidadSalida: 1 }]);
            }
        }
        
        setBusqueda('');
        setIsDropdownOpen(false);
        toast.success("Artículo agregado.");
    };

    // Actualizar cantidad manual en el carrito (Solo para consumibles)
    const actualizarCantidad = (index, nuevaCantidad) => {
        const num = Number(nuevaCantidad);
        const item = carrito[index];
        if (num > item.cantidad) {
            toast.error(`Solo hay ${item.cantidad} unidades en stock.`);
            return;
        }
        if (num < 1) return;

        const nuevoCarrito = [...carrito];
        nuevoCarrito[index].cantidadSalida = num;
        setCarrito(nuevoCarrito);
    };

    const quitarDelCarrito = (index) => {
        setCarrito(carrito.filter((_, i) => i !== index));
    };

    // Guardar Salida Completa
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (carrito.length === 0) {
            toast.error("Debe agregar al menos un artículo para registrar la salida.");
            return;
        }

        // Armamos el payload con el formato que ahora espera el Backend
        const payload = {
            empleado_id: empleadoId || null,
            proveedor_id: proveedorId || null,
            notas: notas,
            detalles: carrito.map(item => ({
                articulo_id: item.articulo_id,
                cantidad: item.cantidadSalida,
                serie_id: item.row_type === 'serie' ? item.serie_id : null
            }))
        };

        try {
            const response = await fetch(`${API}/api/almacen/salida`, {
                method: 'POST',
                headers: authHeaders(),
                body: JSON.stringify(payload)
            });
            const res = await response.json();

            if (res.success) {
                toast.success("Salida de inventario procesada con éxito.");
                navigate('/almacen'); // O la ruta a donde quieras redirigir tras el éxito
            } else {
                toast.error(res.message || "Error al procesar la salida.");
            }
        } catch (error) {
            toast.error("Error de comunicación con el servidor.");
        }
    };

    return (
        <div className="max-w-6xl mx-auto p-6">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-slate-800">Registrar Salida de Inventario</h1>
                <p className="text-sm text-slate-500 mt-1">Busque y agregue los artículos que desea retirar.</p>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Columna Izquierda: Carrito y Búsqueda */}
                <div className="lg:col-span-2 space-y-6">
                    
                    {/* Buscador de Artículos */}
                    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm relative" ref={dropdownRef}>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Buscar Artículo o Serie</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <svg className="h-5 w-5 text-slate-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" /></svg>
                            </div>
                            <input 
                                type="text"
                                value={busqueda}
                                onChange={(e) => setBusqueda(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                                placeholder="Escriba el nombre, SKU o N/S del fabricante..."
                            />
                        </div>

                        {/* Dropdown de Resultados */}
                        {isDropdownOpen && resultados.length > 0 && (
                            <div className="absolute z-20 mt-2 w-full bg-white border border-slate-200 rounded-lg shadow-xl max-h-80 overflow-y-auto">
                                {resultados.map((art, idx) => (
                                    <div 
                                        key={idx} 
                                        onClick={() => agregarAlCarrito(art)}
                                        className="p-3 hover:bg-slate-50 cursor-pointer border-b border-slate-50 last:border-0 flex justify-between items-center transition-colors"
                                    >
                                        <div>
                                            <p className="font-semibold text-slate-800 text-sm">{art.nombre}</p>
                                            <div className="flex items-center gap-2 mt-1">
                                                {art.row_type === 'serie' ? (
                                                    <span className="text-[10px] font-bold bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">SERIE</span>
                                                ) : (
                                                    <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded">GENERAL</span>
                                                )}
                                                <span className="text-xs text-slate-500 font-mono">SKU: {art.modelo ?? '-'}</span>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            {art.row_type === 'serie' && art.numero_serie_fabricante && (
                                                <p className="text-xs font-mono text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-100">N/S: {art.numero_serie_fabricante}</p>
                                            )}
                                            {art.row_type !== 'serie' && (
                                                <p className="text-xs text-slate-500 mt-1">Stock: <span className="font-bold text-slate-700">{art.cantidad}</span></p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        {isDropdownOpen && resultados.length === 0 && busqueda.length > 1 && (
                            <div className="absolute z-20 mt-2 w-full bg-white border border-slate-200 rounded-lg shadow-xl p-4 text-center text-sm text-slate-500">
                                No se encontraron artículos.
                            </div>
                        )}
                    </div>

                    {/* Tabla de Artículos Agregados (Carrito) */}
                    <div className="bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden">
                        <div className="px-5 py-4 border-b border-slate-100 bg-slate-50">
                            <h3 className="font-semibold text-slate-800">Artículos a retirar ({carrito.length})</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-white text-slate-500 border-b border-slate-100">
                                    <tr>
                                        <th className="px-5 py-3 font-medium">Artículo</th>
                                        <th className="px-5 py-3 font-medium w-32">Cant. Disponible</th>
                                        <th className="px-5 py-3 font-medium w-32">Cant. a Retirar</th>
                                        <th className="px-5 py-3 text-center">Quitar</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {carrito.length === 0 ? (
                                        <tr>
                                            <td colSpan="4" className="px-5 py-8 text-center text-slate-400 italic">
                                                No hay artículos agregados. Busque arriba para agregar.
                                            </td>
                                        </tr>
                                    ) : (
                                        carrito.map((item, index) => (
                                            <tr key={index} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="px-5 py-3">
                                                    <p className="font-medium text-slate-800">{item.nombre}</p>
                                                    <div className="flex gap-2 mt-1">
                                                        {item.row_type === 'serie' && (
                                                            <span className="text-[10px] font-bold bg-blue-100 text-blue-700 px-1 py-0.5 rounded">SERIE {item.numero_serie_fabricante && `- ${item.numero_serie_fabricante}`}</span>
                                                        )}
                                                        <span className="text-xs text-slate-400">SKU: {item.modelo}</span>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-3 text-slate-600">
                                                    {item.row_type === 'serie' ? 'Único' : item.cantidad}
                                                </td>
                                                <td className="px-5 py-3">
                                                    <input 
                                                        type="number"
                                                        value={item.cantidadSalida}
                                                        min={1}
                                                        max={item.row_type === 'serie' ? 1 : item.cantidad}
                                                        disabled={item.row_type === 'serie'}
                                                        onChange={(e) => actualizarCantidad(index, e.target.value)}
                                                        className="w-full px-2 py-1.5 border border-slate-200 rounded bg-white text-sm focus:outline-none focus:border-blue-500 disabled:bg-slate-100 disabled:text-slate-500 text-center"
                                                    />
                                                </td>
                                                <td className="px-5 py-3 text-center">
                                                    <button 
                                                        type="button" 
                                                        onClick={() => quitarDelCarrito(index)}
                                                        className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Columna Derecha: Formulario de Destino y Confirmación */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-5">
                        <h3 className="font-semibold text-slate-800 border-b border-slate-100 pb-3">Detalles de Destino</h3>
                        
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Empleado Asignado</label>
                            <select 
                                value={empleadoId}
                                onChange={(e) => setEmpleadoId(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 text-slate-700 bg-white"
                            >
                                <option value="">No aplica / Ninguno</option>
                                {empleados.map(emp => (
                                    <option key={emp.id} value={emp.id}>{emp.nombre}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Proveedor (Tercero)</label>
                            <select 
                                value={proveedorId}
                                onChange={(e) => setProveedorId(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 text-slate-700 bg-white"
                            >
                                <option value="">No aplica / Ninguno</option>
                                {proveedores.map(prov => (
                                    <option key={prov.id} value={prov.id}>{prov.nombre}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Motivo / Notas</label>
                            <textarea
                                value={notas}
                                onChange={(e) => setNotas(e.target.value)}
                                rows="3"
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 text-slate-700 bg-white resize-none"
                                placeholder="Escriba aquí el motivo o referencia de la salida..."
                            ></textarea>
                        </div>

                        <div className="pt-4 border-t border-slate-100">
                            <button 
                                type="submit"
                                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm transition-colors"
                            >
                                Confirmar Salida
                            </button>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
}