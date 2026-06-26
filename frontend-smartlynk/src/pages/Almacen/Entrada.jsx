import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Barcode from "react-barcode";
import { toast } from "sonner";
import { PremiumModal } from "../../components/ui/premium";
import {
  UploadCloud,
  AlertTriangle,
  XCircle,
  KeyRound,
  Package,
  Printer
} from "lucide-react";

const API = import.meta.env.VITE_API_URL ?? "";
const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("smartlynk_token") ?? ""}`,
});

/* ── Modal resultado ─────────────────────────────────────── */
function ResultModal({ result, onClose }) {
  const printRef = useRef(null);
  const skus = result?.skus_generados ?? result?.skus ?? [];
  const isConsumible = skus.length === 0;

  const imprimir = () => {
    const html = printRef.current?.innerHTML;
    const w = window.open("", "_blank", "width=520,height=640");
    if (!w || !html) return toast.error("No se pudo abrir la ventana de impresión");
    w.document.write(`<html><head><title>Etiquetas</title><style>
      @page{size:55mm 30mm;margin:3mm}body{margin:0;font-family:sans-serif;text-align:center}
      .et{width:50mm;height:25mm;page-break-after:always;display:flex;flex-direction:column;align-items:center;justify-content:center}
      .tit{font-size:9px;font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:48mm;margin:0 0 2mm}
      .sku{font-size:8px;font-weight:700;margin:1mm 0 0}svg{max-width:46mm;height:14mm}
    </style></head><body>${html}</body></html>`);
    w.document.close();
    setTimeout(() => { w.print(); w.close(); }, 150);
  };

  return (
    <PremiumModal className="max-w-3xl p-0" onBackdropClick={onClose}>
      <div className="flex items-start justify-between border-b border-slate-100 p-5 bg-slate-50">
        <div>
          <h3 className="text-lg font-bold text-slate-900">Entrada registrada con éxito ✓</h3>
          <p className="mt-1 text-sm text-slate-500">
            Se ingresaron {result?.cantidad ?? 0} unidades totales al almacén.
          </p>
        </div>
        <button onClick={onClose} className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-500 hover:bg-slate-200 transition-colors">Cerrar</button>
      </div>

      <div className="max-h-[55vh] overflow-y-auto p-6 bg-white">
        {isConsumible ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-sm text-emerald-800 flex items-center gap-3 font-medium">
            <Package className="h-6 w-6 shrink-0" />
            Se sumaron cantidades al stock general. No hay etiquetas individuales para imprimir.
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm font-semibold text-slate-700">Etiquetas generadas ({skus.length}):</p>
            <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
              {skus.map((sku) => (
                <div key={sku} className="rounded-xl border border-slate-200 bg-slate-50 p-4 flex flex-col items-center">
                  <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">{sku}</p>
                  <div className="rounded-lg bg-white p-2 w-full flex justify-center border border-slate-100 shadow-sm">
                    <Barcode value={sku} height={40} width={1.2} fontSize={10} margin={2} background="#ffffff" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        <div ref={printRef} className="hidden">
          {skus.map((sku) => (
            <div key={sku} className="et">
              <Barcode value={sku} height={42} width={1.15} fontSize={0} margin={2} displayValue={false} />
              <p className="sku">{sku}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3 border-t border-slate-100 p-5 sm:flex-row sm:justify-end bg-slate-50">
        {skus.length > 0 && (
          <button onClick={imprimir} className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-blue-700 shadow-sm">
            <Printer className="h-4 w-4" />
            Imprimir Etiquetas
          </button>
        )}
        <button onClick={onClose} className="rounded-xl bg-white border border-slate-200 px-5 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50 shadow-sm">
          Finalizar
        </button>
      </div>
    </PremiumModal>
  );
}

/* ── Página principal ─────────────────────────────────────── */
export default function Entrada() {
  const navigate = useNavigate();

  // Datos Maestro
  const [proveedores, setProveedores] = useState([]);
  const [catalogo, setCatalogo] = useState([]);
  const [cargando, setCargando] = useState(true);

  // Estados del Carrito y Búsqueda
  const [carrito, setCarrito] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [resultados, setResultados] = useState([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Estados del Formulario (Columna Derecha)
  const [form, setForm] = useState({ proveedor_id: "", notas: "" });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  // --- ESTADOS PARA CARGA POR PLANTILLA (CSV) ---
  const [csvModalOpen, setCsvModalOpen] = useState(false);
  const [csvErrors, setCsvErrors] = useState([]);
  const [csvWarnings, setCsvWarnings] = useState([]);
  const [csvCatalogo, setCsvCatalogo] = useState([]);
  const [csvInventario, setCsvInventario] = useState([]);
  const [isCsvUploading, setIsCsvUploading] = useState(false);

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));
  
  useEffect(() => {
    const cargar = async () => {
      try {
        const [rProv, rCat] = await Promise.all([
          fetch(`${API}/api/proveedores`, { headers: authHeaders() }),
          fetch(`${API}/api/almacen/catalogo-entrada`, { headers: authHeaders() })
        ]);
        const dProv = await rProv.json();
        const dCat = await rCat.json();
        
        setProveedores(dProv.data ?? dProv ?? []);
        setCatalogo(dCat.data ?? dCat ?? []);
      } catch {
        toast.error("Error al cargar la información base.");
      } finally {
        setCargando(false);
      }
    };
    cargar();

    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setIsDropdownOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Buscador Inteligente
  useEffect(() => {
    if (busqueda.trim().length > 1) {
      const lower = busqueda.toLowerCase();
      const filtrados = catalogo.filter(a => 
        (a.nombre && a.nombre.toLowerCase().includes(lower)) || 
        (a.modelo && a.modelo.toLowerCase().includes(lower))
      ).slice(0, 15);
      setResultados(filtrados);
      setIsDropdownOpen(true);
    } else {
      setResultados([]);
      setIsDropdownOpen(false);
    }
  }, [busqueda, catalogo]);

  const agregarAlCarrito = (art) => {
    const requiereSerie = Boolean(art.requiere_serie);
    
    if (requiereSerie) {
      setCarrito([...carrito, { 
        ...art, 
        uuid: Date.now() + Math.random(), 
        cantidadEntrada: 1, 
        numero_serie_fabricante: "", 
        ubicacion: art.ubicacion ?? "",
        notas: "Nuevo" // <--- DATO AGREGADO
      }]);
    } else {
      const existeIdx = carrito.findIndex(item => item.id === art.id && !item.requiere_serie);
      if (existeIdx >= 0) {
        const nuevoCarrito = [...carrito];
        nuevoCarrito[existeIdx].cantidadEntrada += 1;
        setCarrito(nuevoCarrito);
      } else {
        setCarrito([...carrito, { 
          ...art, 
          uuid: Date.now() + Math.random(), 
          cantidadEntrada: 1, 
          ubicacion: art.ubicacion ?? "" 
        }]);
      }
    }
    
    setBusqueda("");
    setIsDropdownOpen(false);
    toast.success("Artículo agregado");
  };

  const actualizarFila = (index, campo, valor) => {
    const nuevoCarrito = [...carrito];
    if (campo === 'cantidadEntrada') {
      if (Number(valor) < 1) return;
      nuevoCarrito[index][campo] = Number(valor);
    } else {
      nuevoCarrito[index][campo] = valor;
    }
    setCarrito(nuevoCarrito);
  };

  const quitarDelCarrito = (index) => {
    setCarrito(carrito.filter((_, i) => i !== index));
  };

  const submit = async (e) => {
    e.preventDefault();
    if (carrito.length === 0) return toast.error("Agregue al menos un artículo");

    const incompletos = carrito.some(item => item.requiere_serie && !item.ubicacion && !item.numero_serie_fabricante);
    if (incompletos) toast.warning("Recomendación: Es ideal colocar la ubicación o N/S a los artículos seriados.");

    setLoading(true);
    try {
      const payload = {
        proveedor_id: form.proveedor_id || null,
        orden_venta_id: null, // Se envía siempre en null
        salida_id: null, // Se envía siempre en null por seguridad
        notas: form.notas || null,
        detalles: carrito.map(item => ({
          articulo_id: item.id,
          cantidad: item.requiere_serie ? 1 : item.cantidadEntrada,
          requiere_serie: item.requiere_serie,
          modelo: item.modelo,
          ubicacion: item.ubicacion,
          numero_serie_fabricante: item.numero_serie_fabricante || null,
          notas: item.requiere_serie ? item.notas : null 
        }))
      };

      const res = await fetch(`${API}/api/almacen/entrada`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      
      if (!data.success) throw new Error(data.message);
      
      toast.success("Entrada procesada con éxito");
      setResult(data.data);
      
      // --- REDIRECCIÓN AL INVENTARIO ---
      // Cambia '/inventario' por la ruta real que manejes en tu frontend
      setTimeout(() => {
          navigate('/almacen'); 
      }, 500); // Un pequeño retraso de medio segundo permite que el usuario vea el Toast de éxito

    } catch (err) {
      toast.error(err.message || "Error al registrar entrada");
    } finally {
      setLoading(false);
    }
  };
  // Función para leer y parsear el archivo CSV
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      // Limpiar BOM (caracteres invisibles que Excel añade)
      const text = evt.target.result.replace(/^\uFEFF/, '');
      const lines = text.split('\n').filter(l => l.trim() !== '');

      if (lines.length < 2) {
        toast.error("El archivo está vacío o no tiene datos válidos.");
        return;
      }

      // Extraer cabeceras (limpiando comillas dobles si las hay)
      const rawHeaders = lines[0].split(',').map(h => h.replace(/^"|"$/g, '').trim().toLowerCase());
      
      const data = [];
      for (let i = 1; i < lines.length; i++) {
        let line = lines[i].trim();
        let parts = [];
        
        // Nuestro generador de plantilla usa "dato","dato", esto lo separa perfectamente
        if (line.startsWith('"') && line.endsWith('"')) {
          parts = line.slice(1, -1).split('","');
        } else {
          parts = line.split(',');
        }

        const obj = {};
        rawHeaders.forEach((h, idx) => obj[h] = parts[idx] || "");
        data.push(obj);
      }

      analyzeData(data);
    };
    reader.readAsText(file);
  };

  // Función para validar la lógica del catálogo e inventario
  const analyzeData = (data) => {
    let errs = [];
    let warns = [];
    let catMap = new Map();
    let inv = [];

    data.forEach((row, idx) => {
      const fila = idx + 2; // +1 de cabecera, +1 por índice 0
      const isSerie = row.serie && row.serie.trim() !== "";
      const cant = Number(row.cantidad);

      // --- VALIDACIONES DE ERRORES ---
      if (!row.nombre || row.nombre.trim() === "") {
        errs.push(`Fila ${fila}: Falta el nombre del artículo.`);
      }
      if (!row.subcategoria || row.subcategoria.trim() === "") {
        errs.push(`Fila ${fila}: La subcategoría es obligatoria para registrar en el catálogo.`);
      }
      if (isNaN(cant) || cant <= 0) {
        errs.push(`Fila ${fila}: La cantidad debe ser mayor a 0.`);
      }
      if (isSerie && cant !== 1) {
        errs.push(`Fila ${fila}: El artículo con serie (${row.serie}) solo puede tener cantidad 1.`);
      }

      // --- VALIDACIONES DE ADVERTENCIAS ---
      if (!isSerie && row.notas && row.notas.trim() !== "") {
        warns.push(`Fila ${fila}: El artículo (${row.nombre}) es consumible. Sus notas serán ignoradas en stock_general.`);
      }

      // --- PROCESAMIENTO DE CATÁLOGO (Lo que se validará/creará) ---
      if (row.nombre) {
        // Agrupamos por la combinación de nombre + marca + modelo para no repetirlos
        const key = `${row.nombre.toLowerCase().trim()}|${(row.marca||'').toLowerCase().trim()}|${(row.modelo||'').toLowerCase().trim()}`;
        
        if (!catMap.has(key)) {
          catMap.set(key, {
            nombre: row.nombre,
            marca: row.marca,
            modelo: row.modelo,
            subcategoria: row.subcategoria,
            requiere_serie: isSerie,
            es_consumible: !isSerie
          });
        } else {
          // Detectar inconsistencia si en la misma plantilla un artículo tiene serie y luego no tiene
          const existing = catMap.get(key);
          if (existing.requiere_serie !== isSerie) {
            errs.push(`Fila ${fila}: Inconsistencia. '${row.nombre}' está marcado con y sin número de serie en filas diferentes.`);
          }
        }
      }

      // --- INGRESO A INVENTARIO ---
      inv.push({ ...row, fila });
    });

    setCsvErrors(errs);
    setCsvWarnings(warns);
    setCsvCatalogo(Array.from(catMap.values()));
    setCsvInventario(inv);
  };

  // Enviar los datos estructurados al Backend
  const confirmarCSV = async () => {
    setIsCsvUploading(true);
    try {
      // Enviamos el Proveedor si fue seleccionado en el formulario general
      const payload = {
        proveedor_id: form.proveedor_id || null, 
        notas: "Ingreso masivo por plantilla CSV",
        lineas: csvInventario
      };

      const response = await fetch(`${API}/api/almacen/entrada/importar-csv`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || "Error al procesar la plantilla en el servidor.");
      }

      toast.success("Inventario ingresado correctamente desde CSV");
      setCsvModalOpen(false);
      navigate("/almacen"); 
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsCsvUploading(false);
    }
  };

  if (cargando) return <div className="p-10 text-center text-slate-500 font-medium animate-pulse">Cargando módulos...</div>;

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Registrar Entrada</h1>
        <p className="text-sm text-slate-500 mt-1">Busque artículos y defina sus detalles antes de ingresarlos.</p>
      </div>
      <button 
           type="button" 
           onClick={() => {
              setCsvErrors([]); setCsvWarnings([]); setCsvCatalogo([]); setCsvInventario([]);
              setCsvModalOpen(true);
           }}
           className="inline-flex items-center gap-2 mb-4 rounded-xl bg-emerald-100 text-emerald-700 px-5 py-2.5 text-sm font-bold shadow-sm transition hover:bg-emerald-200"
         >
           <UploadCloud className="w-5 h-5" />
           Cargar desde Plantilla (CSV)
      </button>

      <form onSubmit={submit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* COLUMNA IZQUIERDA: Buscador y Carrito */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Buscador */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative" ref={dropdownRef}>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Buscar en el Catálogo</label>
            <div className="relative">
              <input 
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full pl-4 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                placeholder="Escriba el nombre o modelo del artículo..."
              />
            </div>

            {/* Dropdown de Resultados */}
            {isDropdownOpen && resultados.length > 0 && (
              <div className="absolute z-20 mt-2 w-[calc(100%-40px)] bg-white border border-slate-200 rounded-xl shadow-xl max-h-80 overflow-y-auto">
                {resultados.map((art) => (
                  <div 
                    key={art.id} 
                    onClick={() => agregarAlCarrito(art)}
                    className="p-3 hover:bg-slate-50 cursor-pointer border-b border-slate-50 last:border-0 flex justify-between items-center transition-colors"
                  >
                    <div>
                      <p className="font-semibold text-slate-800 text-sm">{art.nombre}</p>
                      <p className="text-xs text-slate-500 font-mono mt-0.5">Mod: {art.modelo ?? 'N/A'}</p>
                    </div>
                    <div>
                      {art.requiere_serie ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                          <KeyRound className="h-3 w-3" />
                          SERIE (Añadir Individual)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full">
                          <Package className="h-3 w-3" />
                          GENERAL
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Tabla Carrito */}
          <div className="bg-white border border-slate-200 shadow-sm rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
              <h3 className="font-semibold text-slate-800">Lista de Recepción ({carrito.length})</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-white text-slate-500 border-b border-slate-100">
                  <tr>
                    <th className="px-5 py-3 font-medium w-2/5">Artículo</th>
                    <th className="px-5 py-3 font-medium">Cantidad</th>
                    <th className="px-5 py-3 font-medium">Detalles Físicos</th>
                    <th className="px-5 py-3 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {carrito.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="px-5 py-12 text-center text-slate-400 italic">
                        El carrito de entrada está vacío.
                      </td>
                    </tr>
                  ) : (
                    carrito.map((item, index) => (
                      <tr key={item.uuid} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-5 py-3 align-top">
                          <p className="font-semibold text-slate-800">{item.nombre}</p>
                          <div className="flex items-center gap-2 mt-1">
                            {item.requiere_serie ? (
                              <span className="text-[10px] font-bold text-blue-600 bg-blue-50 border border-blue-100 px-1.5 py-0.5 rounded">SERIADO</span>
                            ) : (
                              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded">GENERAL</span>
                            )}
                            <span className="text-xs text-slate-400 truncate">Mod: {item.modelo}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3 align-top">
                          <input 
                            type="number"
                            value={item.cantidadEntrada}
                            min={1}
                            disabled={item.requiere_serie}
                            onChange={(e) => actualizarFila(index, 'cantidadEntrada', e.target.value)}
                            className="w-20 px-2 py-1.5 border border-slate-200 rounded-lg bg-white text-sm focus:outline-none focus:border-blue-500 disabled:bg-slate-50 disabled:text-slate-400 text-center"
                          />
                        </td>
                        <td className="px-5 py-3 space-y-2 align-top">
                          <input 
                            type="text"
                            placeholder="Ubicación (Ej: HR-01)"
                            value={item.ubicacion || ''}
                            onChange={(e) => actualizarFila(index, 'ubicacion', e.target.value)}
                            className="w-full px-3 py-1.5 border border-slate-200 rounded-lg bg-white text-xs focus:outline-none focus:border-blue-500 placeholder:text-slate-300"
                          />
                          {item.requiere_serie && (
                            <>
                              <input 
                                type="text"
                                placeholder="N/S Fabricante (Opcional)"
                                value={item.numero_serie_fabricante || ''}
                                onChange={(e) => actualizarFila(index, 'numero_serie_fabricante', e.target.value)}
                                className="w-full px-3 py-1.5 border border-amber-200 bg-amber-50 rounded-lg text-xs focus:outline-none focus:border-amber-400 placeholder:text-amber-300/80 font-mono text-amber-900"
                              />
                              {/* INPUT PARA NOTAS */}
                              <input 
                                type="text"
                                placeholder="Nota / Condición (Ej: Nuevo)"
                                value={item.notas || ''}
                                onChange={(e) => actualizarFila(index, 'notas', e.target.value)}
                                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg bg-white text-xs focus:outline-none focus:border-blue-500 placeholder:text-slate-300"
                              />
                            </>
                          )}
                        </td>
                        <td className="px-5 py-3 text-center align-top">
                          <button type="button" onClick={() => quitarDelCarrito(index)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
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

        {/* COLUMNA DERECHA: Datos del Documento */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-5">
            <h3 className="font-semibold text-slate-800 border-b border-slate-100 pb-3">Información de Recepción</h3>
            
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Proveedor / Origen</label>
              <select 
                value={form.proveedor_id}
                onChange={(e) => set("proveedor_id", e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 text-slate-700 bg-white"
              >
                <option value="">No especificado / Interno</option>
                {proveedores.map(p => <option key={p.id} value={p.id}>{p.nombre_empresa}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Notas del Movimiento</label>
              <textarea
                value={form.notas}
                onChange={(e) => set("notas", e.target.value)}
                rows="3"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 text-slate-700 bg-white resize-none"
                placeholder="N° factura, guía de envío, o referencias..."
              ></textarea>
            </div>

            <div className="pt-4 border-t border-slate-100 flex flex-col gap-3">
              <button 
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-sm transition-colors disabled:opacity-50"
              >
                {loading ? "Registrando Entrada..." : "Procesar Entrada"}
              </button>
              <Link to="/almacen" className="w-full py-3 text-center bg-slate-50 hover:bg-slate-100 text-slate-600 font-bold border border-slate-200 rounded-xl transition-colors">
                Cancelar
              </Link>
            </div>
          </div>
        </div>
      </form>
      
      {result && <ResultModal result={result} onClose={() => navigate("/almacen")} />}
        {/* --- MODAL DE CARGA POR PLANTILLA (CSV) --- */}
      {csvModalOpen && (
        <PremiumModal className="max-w-4xl" onBackdropClick={() => !isCsvUploading && setCsvModalOpen(false)}>
          <div className="flex flex-col space-y-6 max-h-[85vh]">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900">Importar Plantilla de Ingreso</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Valida los datos de tu archivo antes de que se inyecten a la base de datos.
                </p>
              </div>
              <button onClick={() => setCsvModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-6 pr-2">
              {/* Zona para subir el archivo */}
              <div className="rounded-2xl border-2 border-dashed border-emerald-200 bg-emerald-50 p-6 text-center">
                  <input 
                    type="file" 
                    accept=".csv" 
                    onChange={handleFileUpload} 
                    className="block w-full text-sm text-slate-600 file:mr-4 file:py-2.5 file:px-5 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-emerald-600 file:text-white hover:file:bg-emerald-700 cursor-pointer" 
                  />
                  <p className="text-xs text-slate-500 mt-3 font-medium">Sube el archivo Excel (.csv) descargado previamente.</p>
              </div>

              {/* Errores (Bloquean el envío) */}
              {csvErrors.length > 0 && (
                  <div className="rounded-2xl bg-rose-50 p-5 border border-rose-200">
                    <h3 className="text-sm font-extrabold text-rose-700 mb-2 flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5"/> Errores Encontrados ({csvErrors.length})
                    </h3>
                    <ul className="text-xs font-semibold text-rose-600 list-disc pl-5 space-y-1">
                      {csvErrors.map((e,i) => <li key={i}>{e}</li>)}
                    </ul>
                  </div>
              )}

              {/* Advertencias (Permiten el envío) */}
              {csvWarnings.length > 0 && (
                  <div className="rounded-2xl bg-amber-50 p-5 border border-amber-200">
                    <h3 className="text-sm font-extrabold text-amber-700 mb-2 flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5"/> Advertencias ({csvWarnings.length})
                    </h3>
                    <ul className="text-xs font-medium text-amber-600 list-disc pl-5 space-y-1">
                      {csvWarnings.map((w,i) => <li key={i}>{w}</li>)}
                    </ul>
                  </div>
              )}

              {/* Tablas de Pre-visualización (Solo se muestran si se cargó algo) */}
              {csvCatalogo.length > 0 && (
                  <div className="space-y-6">
                    {/* Resumen 1: El Catálogo Maestro */}
                    <div>
                      <h3 className="text-sm font-bold text-slate-800 mb-1">1. Detección de Catálogo (Nuevos o Existentes)</h3>
                      <p className="text-xs text-slate-500 mb-3">Si no existe en la base de datos, se generará el registro maestro de forma automática.</p>
                      <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                            <tr>
                              <th className="px-4 py-3">Artículo</th>
                              <th className="px-4 py-3">Marca</th>
                              <th className="px-4 py-3">Modelo</th>
                              <th className="px-4 py-3 text-center">Tipo de Gestión</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 bg-white">
                            {csvCatalogo.map((c, i) => (
                              <tr key={i} className="hover:bg-slate-50 transition-colors">
                                <td className="px-4 py-3 font-bold text-slate-800">{c.nombre}</td>
                                <td className="px-4 py-3">{c.marca || "-"}</td>
                                <td className="px-4 py-3">{c.modelo || "-"}</td>
                                <td className="px-4 py-3 text-center">
                                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${c.requiere_serie ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                      {c.requiere_serie ? "REQUIERE SERIE" : "CONSUMIBLE"}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Resumen 2: El Inventario Real */}
                    <div>
                      <h3 className="text-sm font-bold text-slate-800 mb-1">2. Ingreso Físico a Almacén</h3>
                      <p className="text-xs text-slate-500 mb-3">Las piezas o equipos que se sumarán al inventario real en esta operación.</p>
                      <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                            <tr>
                              <th className="px-4 py-3 w-10">Fila</th>
                              <th className="px-4 py-3">Artículo a ingresar</th>
                              <th className="px-4 py-3 text-center">Cantidad</th>
                              <th className="px-4 py-3">S/N Físico</th>
                              <th className="px-4 py-3">Ubicación</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 bg-white">
                            {csvInventario.map((inv, i) => (
                              <tr key={i} className="hover:bg-slate-50 transition-colors">
                                <td className="px-4 py-2 text-slate-400 font-medium">{inv.fila}</td>
                                <td className="px-4 py-2 font-bold text-slate-800">{inv.nombre}</td>
                                <td className="px-4 py-2 text-center font-mono text-blue-600 font-bold bg-blue-50">{inv.cantidad}</td>
                                <td className="px-4 py-2 font-mono text-slate-600">{inv.serie || "-"}</td>
                                <td className="px-4 py-2">{inv.ubicacion || "-"}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
              )}
            </div>

            {/* Botones de acción */}
            <div className="flex justify-end gap-3 pt-5 border-t border-slate-100">
              <button 
                onClick={() => setCsvModalOpen(false)} 
                className="px-6 py-2.5 rounded-full border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition-colors"
              >
                Cancelar
              </button>
              
              {/* Botón deshabilitado si hay errores o no hay datos */}
              <button 
                onClick={confirmarCSV} 
                disabled={csvInventario.length === 0 || csvErrors.length > 0 || isCsvUploading}
                className="px-6 py-2.5 rounded-full bg-blue-600 text-white font-bold hover:bg-blue-700 shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCsvUploading ? "Procesando en servidor..." : "Confirmar e Ingresar"}
              </button>
            </div>
          </div>
        </PremiumModal>
      )}
    </div>
  );
}
