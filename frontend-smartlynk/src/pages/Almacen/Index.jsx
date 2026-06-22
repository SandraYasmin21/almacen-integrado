import { useState, useEffect } from "react";
import Barcode from "react-barcode";
import { Link, useNavigate } from "react-router-dom";
import { DocumentPlusIcon, ArrowDownTrayIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { toast } from "sonner";
import { DataTableShell, ExportButtons, dataTableClass } from "../../components/ui/premium";
import { SelectPremium } from "../../components/ui/SelectPremium";

const API = import.meta.env.VITE_API_URL ?? "";
const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("smartlynk_token") ?? ""}`,
});

function Semaforo({ cantidad, minimo }) {
  const pct = minimo > 0 ? cantidad / minimo : 1;
  if (pct <= 0.2) return <Badge color="red">Crítico</Badge>;
  if (pct <= 1)   return <Badge color="amber">Bajo</Badge>;
  return <Badge color="green">Normal</Badge>;
}

function Badge({ color, children }) {
  const c = {
    red:   "bg-red-100 text-red-700",
    amber: "bg-amber-100 text-amber-700",
    green: "bg-green-100 text-green-700",
    blue:  "bg-blue-100 text-blue-700",
  };
  return <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${c[color] ?? c.blue}`}>{children}</span>;
}

function DotSemaforo({ cantidad, minimo }) {
  const pct = minimo > 0 ? cantidad / minimo : 1;
  const color = pct <= 0.2 ? "bg-red-500 shadow-[0_0_6px_#ef444480]"
              : pct <= 1 ? "bg-amber-400 shadow-[0_0_6px_#eab30880]"
              : "bg-green-500 shadow-[0_0_6px_#22c55e80]";
  return <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${color}`} />;
}

// Modal de salida rápida
function ModalSalida({ articulo, empleados, onClose, onSuccess }) {
  const [form, setForm] = useState({ empleado_id: "", cantidad: 1, tipo: "salida", notas: "" });
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const r = await fetch(`${API}/api/almacen/movimiento`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ ...form, articulo_id: articulo.articulo_id, serie_id: articulo.serie_id }),
      });
      const d = await r.json();
      if (d.success) { toast.success("Salida registrada"); onSuccess(); }
      else toast.error(d.message || "Error");
    } catch { toast.error("Error de conexión"); }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.4)" }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-semibold text-slate-800">Registrar Salida</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">×</button>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Artículo</label>
            <p className="text-sm font-semibold text-slate-800 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200">{articulo.nombre}</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Empleado que retira *</label>
            <SelectPremium 
              value={String(form.empleado_id)} 
              onChange={v => setForm(p => ({ ...p, empleado_id: v }))}
              placeholder="Seleccionar empleado..."
              options={empleados.map(emp => ({ value: String(emp.id), label: `${emp.nombre_completo} - ${emp.departamento_area}` }))}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Cantidad *</label>
              <input type="number" min={1} value={form.cantidad}
                onChange={e => setForm(p => ({ ...p, cantidad: e.target.value }))}
                required className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Tipo</label>
              <SelectPremium 
                value={form.tipo} 
                onChange={v => setForm(p => ({ ...p, tipo: v }))}
                options={[
                  { value: "salida", label: "Salida" },
                  { value: "prestamo", label: "Préstamo" }
                ]}
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Notas (opcional)</label>
            <textarea rows={2} value={form.notas} onChange={e => setForm(p => ({ ...p, notas: e.target.value }))}
              placeholder="Motivo, proyecto, etc."
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 resize-none" />
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 px-4 py-2 text-sm text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl font-medium transition">
              Cancelar
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-xl font-medium transition shadow-sm disabled:opacity-50">
              {loading ? "Registrando..." : "Registrar Salida"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Página principal de almacén
export default function AlmacenIndex() {
  const [articulos, setArticulos]   = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [empleados, setEmpleados]   = useState([]);
  const [ubicaciones, setUbicaciones] = useState([]);
  const [cargando, setCargando]     = useState(true);

  const [busqueda, setBusqueda]   = useState("");
  const [categoria, setCategoria] = useState("todas");
  const [estado, setEstado]       = useState("todos");
  const [tipoFiltro, setTipoFiltro] = useState("todos");
  const [vista, setVista]         = useState("tabla");
  const [modalArticulo, setModalArticulo] = useState(null);
  const [ubicacionSeleccionada, setUbicacionSeleccionada] = useState(null);
  const navigate = useNavigate();

  const [dropdownOpen, setDropdownOpen] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [modalNota, setModalNota] = useState(null);
  const [notaEdit, setNotaEdit] = useState("");

  // <-- ESTADOS PARA LA PLANTILLA -->
  const [templateModalOpen, setTemplateModalOpen] = useState(false);
  const [subcategoriasList, setSubcategoriasList] = useState([]);
  const [selectedSubcategoria, setSelectedSubcategoria] = useState("");

  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [exportConfig, setExportConfig] = useState({
    formato: "excel",
    tipo: "todos",
    categoria_id: "",
    ubicacion: "",
    fecha_inicio: "",
    fecha_fin: "",
  });
  const [isExporting, setIsExporting] = useState(false);

  const abrirModalNota = (art) => {
      setModalNota(art);
      setNotaEdit(art.notas || "");
      setDropdownOpen(null); // Cierra el menú de 3 puntos
  };

  const guardarNota = async () => {
      try {
          const response = await fetch(`${API}/api/almacen/serie/${modalNota.serie_id}/nota`, {
              method: 'PUT',
              headers: authHeaders(),
              body: JSON.stringify({ notas: notaEdit })
          });
          const data = await response.json();
          if (data.success) {
              toast.success(data.message);
              setModalNota(null);
              cargar(); // Recarga la tabla de inmediato
          } else {
              toast.error(data.message);
          }
      } catch (error) {
          toast.error("Error de conexión al guardar.");
      }
  };
  const handleSalidaRapida = (art) => {
        // Le pasamos el objeto completo a tu estado modalArticulo
        setModalArticulo(art); 
        setDropdownOpen(null); // Cerramos el menú de los 3 puntos
    };
  // Funciones para manejar eventos
  const toggleDropdown = (id) => setDropdownOpen(dropdownOpen === id ? null : id);
  
  const openModal = (art) => {
      setSelectedArticle(art);
      setIsModalOpen(true);
      setDropdownOpen(null); // Cierra el menú si estaba abierto
  };

  const closeModal = () => {
      setIsModalOpen(false);
      setSelectedArticle(null);
  };

  const cargar = async () => {
    setCargando(true);
    try {
      const [rArt, rCat, rEmp, rUbi] = await Promise.all([
        fetch(`${API}/api/almacen/inventario-detallado`, { headers: authHeaders() }),
        fetch(`${API}/api/almacen/categorias`, { headers: authHeaders() }),
        fetch(`${API}/api/empleados`, { headers: authHeaders() }),
        fetch(`${API}/api/almacen/ubicaciones`, { headers: authHeaders() }),
      ]);
      const [dArt, dCat, dEmp, dUbi] = await Promise.all([rArt.json(), rCat.json(), rEmp.json(), rUbi.json()]);
      console.log(dArt);
      setArticulos(dArt.data ?? dArt ?? []);
      setCategorias(dCat.data ?? dCat ?? []);
      setEmpleados(dEmp.data ?? dEmp ?? []);
      setUbicaciones(dUbi.data ?? dUbi ?? []);
    } catch { toast.error("Error al cargar datos del almacén"); }
    setCargando(false);
  };

  useEffect(() => { cargar(); }, []);

  const filtrados = articulos.filter(a => {
    // Convertimos la búsqueda a minúsculas una sola vez para mejorar el rendimiento
    const termino = busqueda.toLowerCase();
    
    const matchQ = !busqueda || 
      a.nombre.toLowerCase().includes(termino) ||
      (a.modelo ?? "").toLowerCase().includes(termino) ||
      (a.modeloarticulo ?? "").toLowerCase().includes(termino) ||
      (a.marca ?? "").toLowerCase().includes(termino) ||
      (a.numero_serie_fabricante ?? "").toLowerCase().includes(termino) ||
      (a.ubicacion ?? "").toLowerCase().includes(termino);
      
    const matchCat = categoria === "todas" || String(a.categoria_id) === String(categoria);
    const pct = a.stock_minimo > 0 ? a.cantidad / a.stock_minimo : 1;
    const matchEst = estado === "todos"
      || (estado === "critico" && pct <= 0.2)
      || (estado === "bajo"    && pct > 0.2 && pct <= 1)
      || (estado === "ok"      && pct > 1);
    const matchTipo = tipoFiltro === "todos" 
      || (tipoFiltro === "series" && a.row_type === "serie")
      || (tipoFiltro === "consumibles" && a.row_type === "consumible");
      
    return matchQ && matchCat && matchEst && matchTipo;
  });

  const hayFiltros = busqueda || categoria !== "todas" || estado !== "todos" || tipoFiltro !== "todos";

  const descargarExport = async (format) => {
    try {
      const response = await fetch(`${API}/api/almacen/export/${format}`, { headers: authHeaders() });
      if (!response.ok) throw new Error("No se pudo generar el archivo");
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `inventario.${format === "pdf" ? "pdf" : "xlsx"}`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success(`Exportación ${format.toUpperCase()} generada`);
    } catch (error) {
      toast.error(error.message || "No se pudo exportar");
    }
  };
  // 1. Función exclusiva para cargar la lista (se reutiliza en ambos modales)
  async function cargarSubcategorias() {
    // Si ya las cargamos antes, no hacemos otra petición a la base de datos
    if (subcategoriasList.length > 0) return; 
    
    try {
      const response = await fetch(`${API}/api/catalogo/subcategorias`, {
        headers: authHeaders(),
      });
      const payload = await response.json();
      if (payload.success) {
        setSubcategoriasList(payload.data);
      }
    } catch (error) {
      toast.error("Error al cargar las subcategorías");
    }
  }

  // 2. Función para abrir SÓLO el modal de Plantilla
  async function abrirModalPlantilla() {
    setTemplateModalOpen(true);
    await cargarSubcategorias();
  }

  // 3. Función para abrir SÓLO el modal de Exportación
  async function abrirModalExportacion() {
    setExportModalOpen(true);
    await cargarSubcategorias();
  }
  
  async function generarExportacionAvanzada() {
    setIsExporting(true);
    try {
      const params = new URLSearchParams({
        formato: exportConfig.formato,
        tipo: exportConfig.tipo,
        categoria_id: exportConfig.categoria_id,
        ubicacion: exportConfig.ubicacion,
        fecha_inicio: exportConfig.fecha_inicio,
        fecha_fin: exportConfig.fecha_fin,
      });

      const response = await fetch(`${API}/api/almacen/exportar-inventario?${params.toString()}`, {
        headers: authHeaders(),
      });

      if (!response.ok) throw new Error("Error al generar la exportación");

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const ext = exportConfig.formato === "pdf" ? "pdf" : "xlsx";
      link.setAttribute("download", `Inventario_Detallado_${new Date().getTime()}.${ext}`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success("Archivo descargado correctamente");
      setExportModalOpen(false);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsExporting(false);
    }
  }

  // Función para abrir el modal y cargar las subcategorías
  async function abrirModalPlantilla() {
    setTemplateModalOpen(true);
    try {
      const response = await fetch(`${API}/api/catalogo/subcategorias`, {
        headers: authHeaders(),
      });
      const payload = await response.json();
      if (payload.success) {
        setSubcategoriasList(payload.data);
      }
    } catch (error) {
      toast.error("Error al cargar las subcategorías");
    }
  }

  // Función para generar y descargar el archivo CSV
  function generarPlantillaCSV() {
    if (!selectedSubcategoria) {
      toast.error("Por favor, selecciona una subcategoría");
      return;
    }

    const sub = subcategoriasList.find(s => String(s.id) === String(selectedSubcategoria));
    const nombreSub = sub ? sub.nombre : "";

    // Cabeceras solicitadas
    const headers = ["nombre", "marca", "modelo", "serie", "subcategoria", "ubicacion", "cantidad", "notas"];
    const rows = [];

    // Generar 15 filas en blanco con la subcategoría pre-llenada
    for (let i = 0; i < 15; i++) {
      rows.push(`"","","","","${nombreSub}","","",""`);
    }

    // Unir todo y agregar BOM (\uFEFF) para que Excel reconozca los acentos (UTF-8)
    const csvContent = "\uFEFF" + headers.join(",") + "\n" + rows.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    
    // Crear enlace oculto y forzar descarga
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Plantilla_Ingreso_${nombreSub.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success("Plantilla generada correctamente");
    setTemplateModalOpen(false);
    setSelectedSubcategoria("");
  }

  return (
    <>
      <div className="space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold ">Inventario</h1>
            <p className="text-slate-600">Lista de artículos en stock</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={abrirModalPlantilla}
              className="inline-flex h-11 items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-5 text-sm font-semibold text-blue-700 transition hover:-translate-y-0.5 hover:bg-blue-100 hover:shadow-sm"
            >
              <DocumentPlusIcon className="h-5 w-5" />
              Crear plantilla
            </button>
            <button
              onClick={() => {
                abrirModalExportacion();
              }}
              className="inline-flex h-11 items-center gap-2 rounded-full border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              <ArrowDownTrayIcon className="h-4 w-4" />
              Exportar Datos
            </button>

            <Link to="/almacen/entrada"
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl shadow-sm transition">
              + Nueva Entrada
            </Link>
            <Link to="/almacen/salida"
              className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 text-sm font-medium rounded-xl border border-slate-200 shadow-sm transition">
              Registrar Salida
            </Link>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-48">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
              </svg>
              <input value={busqueda} onChange={e => setBusqueda(e.target.value)}
                placeholder="Buscar por nombre, SKU, modelo, marca o S/N..."
                className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
            </div>
            <div className="w-[180px]">
              <SelectPremium 
                value={categoria} 
                onChange={setCategoria}
                placeholder="Todas las categorías"
                options={[
                  { value: "todas", label: "Todas las categorías" },
                  ...categorias.map(c => ({ value: String(c.id), label: c.nombre }))
                ]}
              />
            </div>
            <div className="w-[160px]">
              <SelectPremium 
                value={estado} 
                onChange={setEstado}
                placeholder="Todos los estados"
                options={[
                  { value: "todos", label: "Todos los estados" },
                  { value: "ok", label: "Stock normal" },
                  { value: "bajo", label: "Stock bajo" },
                  { value: "critico", label: "Stock crítico" }
                ]}
              />
            </div>
            <div className="w-[170px]">
              <SelectPremium 
                value={tipoFiltro} 
                onChange={setTipoFiltro}
                placeholder="Tipo de inventario"
                options={[
                  { value: "todos", label: "Todos los tipos" },
                  { value: "consumibles", label: "Consumibles" },
                  { value: "series", label: "Por número de serie" }
                ]}
              />
            </div>
            <div className="flex rounded-xl border border-slate-200 overflow-hidden text-xs">
              {["tabla", "ubicaciones"].map(v => (
                <button key={v} onClick={() => setVista(v)}
                  className={`px-3 py-2 capitalize transition ${vista === v ? "bg-blue-600 text-white" : "bg-white text-slate-600 hover:bg-slate-50"}`}>
                  {v === "tabla" ? "Tabla" : "Ubicaciones"}
                </button>
              ))}
            </div>
            {hayFiltros && (
              <button onClick={() => { setBusqueda(""); setCategoria("todas"); setEstado("todos"); setTipoFiltro("todos"); }}
                className="flex items-center gap-1.5 px-3 py-2 text-xs text-slate-500 hover:text-red-600 hover:bg-red-50 border border-slate-200 hover:border-red-200 rounded-xl transition">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
                </svg>
                Limpiar
              </button>
            )}
          </div>
        </div>

        {/* Vista Tabla */}
        {vista === "tabla" && (
          <>
            {/* Reabastecimiento Urgente */}
            {articulos.some(a => (a.cantidad ?? 0) === 0) && (
              <div className="bg-white rounded-2xl border-l-4 border-l-rose-500 border-y border-r border-slate-200 shadow-sm p-4 mb-4 animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center gap-2 mb-3">
                  <svg className="w-5 h-5 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                  </svg>
                  <h3 className="font-semibold text-slate-800">Reabastecimiento Urgente</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {articulos.filter(a => (a.cantidad ?? 0) === 0).slice(0, 10).map(art => (
                    <button key={art.id} onClick={() => navigate('/almacen/ordenes-compra', { state: { precargarArticulo: art } })}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-medium rounded-xl transition">
                      <span className="truncate max-w-[200px]">{art.nombre}</span>
                      <svg className="w-3.5 h-3.5 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>
                    </button>
                  ))}
                  {articulos.filter(a => (a.cantidad ?? 0) === 0).length > 10 && (
                    <span className="text-xs text-slate-500 flex items-center px-2">
                      y {articulos.filter(a => (a.cantidad ?? 0) === 0).length - 10} más...
                    </span>
                  )}
                </div>
              </div>
            )}

            <DataTableShell>
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-sm text-slate-500 bg-slate-50/50">
                    <th className="font-semibold px-5 py-3 rounded-tl-xl">Artículo</th>
                    <th className="font-semibold px-5 py-3">Categoría</th>
                    <th className="font-semibold px-5 py-3">Ubicación</th>
                    <th className="font-semibold px-5 py-3">Cantidad</th>
                    {/* SE ELIMINÓ LA COLUMNA MÍNIMO */}
                    <th className="font-semibold px-5 py-3">Notas</th>
                    <th className="font-semibold px-5 py-3">Estado</th>
                    <th className="font-semibold px-5 py-3 text-center rounded-tr-xl">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {filtrados.map((art, index) => {
                    // Crear un ID único para controlar qué dropdown está abierto
                    const uniqueId = `${art.row_type}-${art.serie_id || art.articulo_id}-${index}`;

                    return (
                      <tr 
                        key={uniqueId} 
                        className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                        onClick={() => openModal(art)} // Abrir modal al hacer clic en la fila
                      >
                        {/* 1. Columna Artículo (Incluye Marca y Modelo) */}
                        <td className="px-5 py-3">
                          <div className="flex flex-col gap-0.5">
                            <p className="truncate font-bold text-slate-800">{art.nombre}</p>
                            
                            {/* Mostramos Marca y Modelo del Artículo de forma compacta si existen */}
                            {(art.marca || art.modeloarticulo) && (
                              <p className="text-xs font-medium text-slate-500">
                                {art.marca ? art.marca : "Sin marca"} {art.modeloarticulo ? `· ${art.modeloarticulo}` : ""}
                              </p>
                            )}
                            
                            <div className="flex items-center gap-2 flex-wrap mt-1.5">
                              {art.row_type === 'serie' ? (
                                <>
                                  <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-bold rounded">SERIE</span>
                                  {art.numero_serie_fabricante && (
                                    <span className="text-xs font-mono text-amber-700 bg-amber-100 px-2 py-0.5 rounded-md">
                                      S/N: {art.numero_serie_fabricante}
                                    </span>
                                  )}
                                  <span className="text-xs font-mono text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                                    SKU: {art.modelo ?? "-"}
                                  </span>
                                </>
                              ) : (
                                <span className="text-xs font-mono text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                                  SKU: {art.modelo ?? "-"} · {art.unidad_medida}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* 2. Categoría */}
                        <td className="px-5 py-3">
                          <p className="text-sm text-slate-600">{art.categoria_nombre}</p>
                          <p className="text-xs text-slate-400">{art.subcategoria_nombre}</p>
                        </td>

                        {/* 3. Ubicación */}
                        <td className="px-5 py-3 text-sm text-slate-600">
                          {art.ubicacion || 'Sin asignar'}
                        </td>

                        {/* 4. Cantidad */}
                        <td className="px-5 py-3 text-sm font-medium text-slate-700">
                          {art.cantidad} <span className="text-xs font-normal text-slate-400">{art.unidad_medida}</span>
                        </td>

                        {/* SE ELIMINÓ EL <TD> DE MÍNIMO */}
                        <td className="px-5 py-3 text-sm text-slate-600 truncate max-w-[150px]" title={art.notas}>
                            {art.row_type === 'serie' ? (art.notas || 'Sin notas') : 'N/A'}
                        </td>
                        
                        {/* 5. Estado de Artículo / Serie */}
                        <td className="px-5 py-3 text-sm">
                          {art.row_type === 'serie' ? (
                              <span className={`px-2.5 py-1 rounded-full text-xs font-semibold uppercase 
                                ${art.estado === 'DISPONIBLE' ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'}`}>
                                {art.estado}
                              </span>
                          ) : (
                              <span className="px-2.5 py-1 rounded-full text-xs font-semibold uppercase bg-sky-100 text-sky-700">
                                {art.cantidad > 0 ? 'En Stock' : 'Agotado'}
                              </span>
                          )}
                        </td>

                        {/* 6. Acciones (Menú de 3 puntos) */}
                        <td className="px-5 py-3 text-center relative" onClick={(e) => e.stopPropagation()}>
                          {/* El e.stopPropagation() evita que al hacer clic en las acciones se abra también el modal de la fila */}
                          <button 
                            onClick={() => toggleDropdown(uniqueId)}
                            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                          >
                            {/* Icono de 3 puntos (SVG) */}
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                            </svg>
                          </button>

                          {/* Dropdown Options */}
                          {dropdownOpen === uniqueId && (
                            <div className="absolute right-8 top-10 w-32 bg-white rounded-lg shadow-xl border border-slate-100 z-10 py-1">
                              <button 
                                onClick={() => openModal(art)}
                                className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                              >
                                Detalles
                              </button>
                              {/* Opciones extra para series */}
                              {art.row_type === 'serie' && (
                                  <button 
                                    onClick={() => abrirModalNota(art)}
                                    className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                                  >
                                    Editar Nota
                                  </button>
                              )}

                              <button
                                onClick={() => handleSalidaRapida(art)} // Usamos la función para abrir el modal de salida rápida
                                className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"

                              > 
                                Salida Rápida
                              </button>
                              {/* Aquí podrías agregar más opciones futuras como "Editar", "Eliminar", etc. */}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
          </DataTableShell>
          </>
        )}

        {/* Vista Ubicaciones */}
        {vista === "ubicaciones" && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {ubicaciones.length === 0 ? (
              <div className="col-span-full py-12 text-center">
                <p className="text-sm text-slate-400">No hay ubicaciones registradas</p>
              </div>
            ) : ubicaciones.map(ub => (
              <button key={ub.ubicacion} onClick={() => setUbicacionSeleccionada(ub)}
                className="text-left bg-white rounded-2xl border border-slate-200 shadow-sm p-4 hover:shadow-lg hover:-translate-y-1.5 transition-all duration-200">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                    <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
                    </svg>
                  </div>
                  <span className="text-xs font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-lg font-mono">{ub.ubicacion}</span>
                </div>
                <p className="text-sm font-semibold text-slate-800">{ub.total_articulos} artículos</p>
                <p className="text-xs text-slate-400 mt-0.5">{ub.total_unidades} unidades totales</p>
              </button>
            ))}
          </div>
        )}

      </div>

      {/* Slide-over de Ubicaciones */}
      {ubicacionSeleccionada && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm transition-opacity" onClick={() => setUbicacionSeleccionada(null)} />
          <div className="relative w-full max-w-md bg-white h-full shadow-2xl animate-in slide-in-from-right flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-bold text-slate-800">Ubicación: <span className="font-mono text-blue-600">{ubicacionSeleccionada.ubicacion}</span></h3>
                <p className="text-sm text-slate-500">{ubicacionSeleccionada.total_articulos} artículos • {ubicacionSeleccionada.total_unidades} unidades</p>
              </div>
              <button onClick={() => setUbicacionSeleccionada(null)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {articulos.filter(a => a.ubicacion === ubicacionSeleccionada.ubicacion).map(art => (
                <div key={art.id} className="flex items-start justify-between p-4 rounded-xl border border-slate-100 hover:border-blue-100 hover:bg-blue-50/50 transition">
                  <div>
                    <p className="font-semibold text-slate-800 text-sm">{art.nombre}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{art.modelo ?? "-"} • {art.categoria_nombre}</p>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-slate-800 text-sm">{art.cantidad ?? 0}</span>
                    <p className="text-[10px] text-slate-400 font-medium uppercase mt-0.5">{art.unidad_medida}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-4 border-t border-slate-100 bg-slate-50">
              <button onClick={() => setUbicacionSeleccionada(null)} className="w-full py-2.5 bg-white border border-slate-200 rounded-xl font-medium text-slate-600 hover:bg-slate-50 transition shadow-sm">
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Salida Rápida en Index.jsx */}
      {modalArticulo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" onClick={() => setModalArticulo(null)}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
            
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
              <h3 className="text-base font-bold text-slate-800">
                Confirmar Salida Rápida
              </h3>
              <button onClick={() => setModalArticulo(null)} className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-200 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <form onSubmit={async (e) => {
              e.preventDefault();
              
              const formData = new FormData(e.target);
              
              // Armamos el payload exacto para el Backend
              const datosSalida = {
                articulo_id: modalArticulo.articulo_id,
                // Si es serie la cantidad es forzada a 1, si no, se lee del input
                cantidad: modalArticulo.row_type === 'serie' ? 1 : Number(formData.get('cantidad')),
                // ENLACE DE SERIE: Si el artículo es de tipo serie, enviamos su identificador
                serie_id: modalArticulo.row_type === 'serie' ? modalArticulo.serie_id : null,
                notas: formData.get('notas')
                // Ya no enviamos empleado_id ni orden_venta
              };

              try {
                // Asegúrate de que esta ruta coincida con la que usarás en api.php
                const response = await fetch(`${API}/api/almacen/salida`, {
                  method: 'POST',
                  headers: authHeaders(),
                  body: JSON.stringify(datosSalida)
                });
                
                const res = await response.json();
                if (res.success) {
                  toast.success("Salida rápida registrada con éxito");
                  setModalArticulo(null); // Cierra el modal
                  cargar(); // <--- ESTA ES TU FUNCIÓN QUE REFRESCA LA TABLA AL INSTANTE
                } else {
                  toast.error(res.message || "Error al registrar la salida");
                }
              } catch (error) {
                toast.error("Error de comunicación con el servidor");
              }
            }} className="p-6 space-y-4">
              
              <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Artículo Seleccionado</span>
                <p className="text-sm font-semibold text-slate-800 mt-0.5">{modalArticulo.nombre}</p>
                
                {modalArticulo.row_type === 'serie' ? (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    <span className="text-[10px] font-bold bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">
                      SERIE ÚNICA
                    </span>
                    {modalArticulo.numero_serie_fabricante && (
                      <span className="text-[10px] font-mono bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded border border-amber-200">
                        N/S: {modalArticulo.numero_serie_fabricante}
                      </span>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 mt-1 font-medium">
                    Disponibles en Stock: <span className="text-slate-800 font-semibold">{modalArticulo.cantidad} {modalArticulo.unidad_medida}</span>
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Cantidad a Retirar</label>
                <input
                  type="number"
                  name="cantidad"
                  defaultValue={1}
                  min={1}
                  max={modalArticulo.row_type === 'serie' ? 1 : modalArticulo.cantidad}
                  disabled={modalArticulo.row_type === 'serie'}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white disabled:bg-slate-100 disabled:text-slate-500 font-medium focus:outline-none focus:border-blue-500 transition-colors"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Notas / Motivo de Salida</label>
                <textarea
                  name="notas"
                  rows="2"
                  placeholder="Escribe un motivo o referencia para esta salida..."
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-colors resize-none"
                ></textarea>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => setModalArticulo(null)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 text-sm font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium shadow-sm transition-colors"
                >
                  Confirmar Salida
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Detalles */}
      {isModalOpen && selectedArticle && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" onClick={closeModal}>
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
                  
                  {/* Header del Modal */}
                  <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                      <h3 className="text-lg font-bold text-slate-800">
                          Detalles del Artículo
                      </h3>
                      <button onClick={closeModal} className="text-slate-400 hover:text-slate-600 bg-white rounded-full p-1 hover:bg-slate-200 transition-colors">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                  </div>

                  {/* Cuerpo del Modal (Ahora Horizontal) */}
                  <div className="p-6 overflow-y-auto flex flex-col md:flex-row gap-8">
                      
                      {/* Columna Izquierda: Información del Artículo */}
                      <div className="flex-1">
                          <div className="mb-6">
                              <h4 className="text-2xl font-bold text-slate-800">{selectedArticle.nombre}</h4>
                              <h5 className="text-sm text-slate-500 mt-1">{selectedArticle.marca ? selectedArticle.marca : 'Sin marca'} {selectedArticle.modeloarticulo ? `· ${selectedArticle.modeloarticulo}` : ''}</h5>
                              <span className="inline-flex mt-2 px-2.5 py-1 bg-slate-100 text-slate-600 text-xs font-semibold rounded uppercase">
                                  {selectedArticle.row_type === 'serie' ? 'Artículo Seriado' : 'Consumible / General'}
                              </span>
                          </div>

                          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                              <div className="p-3 bg-slate-50 rounded-lg">
                                  <span className="block text-slate-500 text-xs mb-1">Categoría</span>
                                  <p className="font-medium text-slate-800">{selectedArticle.categoria_nombre}</p>
                              </div>
                              <div className="p-3 bg-slate-50 rounded-lg">
                                  <span className="block text-slate-500 text-xs mb-1">Subcategoría</span>
                                  <p className="font-medium text-slate-800">{selectedArticle.subcategoria_nombre}</p>
                              </div>
                              <div className="p-3 bg-slate-50 rounded-lg">
                                  <span className="block text-slate-500 text-xs mb-1">Cantidad Actual</span>
                                  <p className="font-medium text-slate-800">{selectedArticle.cantidad} {selectedArticle.unidad_medida}</p>
                              </div>
                              <div className="p-3 bg-slate-50 rounded-lg">
                                  <span className="block text-slate-500 text-xs mb-1">Ubicación</span>
                                  <p className="font-medium text-slate-800">{selectedArticle.ubicacion || 'No asignada'}</p>
                              </div>
                              <div className="p-3 bg-slate-50 rounded-lg">
                                  <span className="block text-slate-500 text-xs mb-1">Estado</span>
                                  <p className="font-medium text-slate-800 capitalize">{selectedArticle.estado !== 'N/A' ? selectedArticle.estado : 'En Stock'}</p>
                              </div>
                              {selectedArticle.row_type === 'serie' && selectedArticle.numero_serie_fabricante && (
                                  <>
                                  <div className="p-3 bg-amber-50 rounded-lg border border-amber-100">
                                      <span className="block text-amber-700 text-xs mb-1 font-semibold">N/S Fabricante</span>
                                      <p className="font-mono font-medium text-amber-900">{selectedArticle.numero_serie_fabricante}</p>
                                  </div>
                                  <div className="p-3 bg-slate-50 rounded-lg">
                                      <span className="block text-slate-500 text-xs mb-1">Notas</span>
                                      <p className="font-medium text-slate-800">{selectedArticle.notas || 'Sin notas'}</p>
                                  </div>
                                  <div className="p-3 bg-slate-50 rounded-lg">
                                      <span className="block text-slate-500 text-xs mb-1">Fecha de registro</span>
                                      <p className="font-medium text-slate-800">{new Date(selectedArticle.fecha_adquisicion).toLocaleDateString()}</p>
                                  </div>
                                  </>
                              )}
                          </div>
                      </div>

                      {/* Columna Derecha: Código de Barras (SKU) */}
                      <div className="w-full md:w-124 border-t md:border-t-0 md:border-l border-slate-100 pt-6 md:pt-0 md:pl-8 flex flex-col items-center justify-center bg-slate-50/50 rounded-xl">
                          <span className="text-sm font-semibold text-slate-600 mb-4">Código Interno (SKU)</span>
                          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                              {selectedArticle.modelo ? (
                                  <Barcode 
                                      value={selectedArticle.modelo} 
                                      width={1.5} 
                                      height={50} 
                                      displayValue={true} 
                                      fontSize={14}
                                      background="#ffffff"
                                      lineColor="#1e293b"
                                  />
                              ) : (
                                  <p className="text-slate-400 italic text-sm text-center">Sin código<br/>interno</p>
                              )}
                          </div>
                      </div>
                  </div>
                  
                  {/* Footer del Modal */}
                  <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end">
                      <button onClick={closeModal} className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 hover:text-slate-900 transition-colors text-sm font-medium shadow-sm">
                          Cerrar Detalles
                      </button>
                  </div>
              </div>
          </div>
      )}
      {/* Modal Editar Nota Exclusivo para Series */}
      {modalNota && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" onClick={() => setModalNota(null)}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
              <h3 className="text-base font-bold text-slate-800">Condición / Notas de la Serie</h3>
            </div>
            <div className="p-6">
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">Nota del Artículo</label>
              <textarea
                value={notaEdit}
                onChange={(e) => setNotaEdit(e.target.value)}
                rows="3"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 resize-none"
                placeholder="Ej: Nuevo, Desgastado, Reparado, etc."
              ></textarea>
            </div>
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2">
              <button onClick={() => setModalNota(null)} className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 text-sm font-medium transition-colors">Cancelar</button>
              <button onClick={guardarNota} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium shadow-sm transition-colors">Guardar Cambios</button>
            </div>
          </div>
        </div>
      )}
      {/* --- MODAL PARA CREAR PLANTILLA --- */}
      {templateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }} onClick={() => setTemplateModalOpen(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-800">Generar Plantilla de Ingreso</h3>
              <button onClick={() => setTemplateModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <p className="text-sm text-slate-500">
                Se descargará un archivo Excel (CSV) con las columnas estructuradas para la inyección de datos. La columna <strong>Subcategoría</strong> se autocompletará en todas las filas.
              </p>
              
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-800">
                  Subcategoría a ingresar <span className="text-rose-500">*</span>
                </label>
                <select
                  value={selectedSubcategoria}
                  onChange={(e) => setSelectedSubcategoria(e.target.value)}
                  className="w-full h-11 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
                >
                  <option value="">Selecciona una subcategoría...</option>
                  {subcategoriasList.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.categoria} - {sub.nombre}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
              <button 
                onClick={() => setTemplateModalOpen(false)} 
                className="px-5 py-2.5 rounded-full border border-slate-200 text-slate-600 hover:bg-slate-100 text-sm font-bold transition-all"
              >
                Cancelar
              </button>
              <button 
                onClick={generarPlantillaCSV} 
                disabled={!selectedSubcategoria}
                className="px-5 py-2.5 rounded-full bg-blue-600 text-white hover:bg-blue-700 hover:shadow-md text-sm font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <ArrowDownTrayIcon className="w-4 h-4" />
                Descargar Plantilla
              </button>
            </div>
          </div>
        </div>
      )}
      {/* --- MODAL DE EXPORTACIÓN AVANZADA --- */}
      {exportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm" onClick={() => !isExporting && setExportModalOpen(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-800">Exportar Inventario</h3>
              <button disabled={isExporting} onClick={() => setExportModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Formato</label>
                  <select value={exportConfig.formato} onChange={(e) => setExportConfig({...exportConfig, formato: e.target.value})} className="w-full h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm outline-none">
                    <option value="excel">Excel (.xlsx)</option>
                    <option value="pdf">Documento PDF</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Tipo de Registro</label>
                  <select value={exportConfig.tipo} onChange={(e) => setExportConfig({...exportConfig, tipo: e.target.value})} className="w-full h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm outline-none">
                    <option value="todos">Ambos (Todos)</option>
                    <option value="consumibles">Solo Consumibles</option>
                    <option value="series">Solo Equipos c/ Serie</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Filtrar por Categoría</label>
                <select value={exportConfig.categoria_id} onChange={(e) => setExportConfig({...exportConfig, categoria_id: e.target.value})} className="w-full h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm outline-none">
                  <option value="">Todas las categorías</option>
                  {/* Se asume que las categorías se cargan en subcategoriasList, limpiamos duplicados: */}
                  {Array.from(new Set(subcategoriasList.map(s => s.categoria_id))).map(catId => {
                    const cat = subcategoriasList.find(s => s.categoria_id === catId);
                    return <option key={catId} value={catId}>{cat.categoria}</option>;
                  })}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Ubicación Física</label>
                <input type="text" placeholder="Ej. HR-01" value={exportConfig.ubicacion} onChange={(e) => setExportConfig({...exportConfig, ubicacion: e.target.value})} className="w-full h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm outline-none" />
              </div>

              {exportConfig.tipo !== "consumibles" && (
                <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl space-y-3">
                  <p className="text-xs font-bold text-blue-800">Rango de Fecha de Adquisición (Opcional, Solo Series)</p>
                  <div className="grid grid-cols-2 gap-3">
                    <input type="date" value={exportConfig.fecha_inicio} onChange={(e) => setExportConfig({...exportConfig, fecha_inicio: e.target.value})} className="w-full h-9 rounded-md border border-blue-200 bg-white px-2 text-xs outline-none" />
                    <input type="date" value={exportConfig.fecha_fin} onChange={(e) => setExportConfig({...exportConfig, fecha_fin: e.target.value})} className="w-full h-9 rounded-md border border-blue-200 bg-white px-2 text-xs outline-none" />
                  </div>
                </div>
              )}
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
              <button disabled={isExporting} onClick={() => setExportModalOpen(false)} className="px-4 py-2 rounded-full border border-slate-200 text-slate-600 hover:bg-slate-100 text-sm font-bold transition-all">
                Cancelar
              </button>
              <button disabled={isExporting} onClick={generarExportacionAvanzada} className="px-5 py-2 rounded-full bg-blue-600 text-white hover:bg-blue-700 text-sm font-bold transition-all disabled:opacity-50 flex items-center gap-2">
                <ArrowDownTrayIcon className="w-4 h-4" />
                {isExporting ? "Generando..." : "Descargar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
