import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Eye, PackageMinus, ShoppingCart } from "lucide-react";
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
        body: JSON.stringify({ ...form, articulo_id: articulo.id }),
      });
      const d = await r.json();
      if (d.success) { toast.success("Salida registrada"); onSuccess(); }
      else toast.error(d.message || "Error");
    } catch { toast.error("Error de conexión"); }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={onClose} />
      <div className="relative z-10 bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-in zoom-in-95 duration-200">
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
  const [vista, setVista]         = useState("tabla");
  const [modalArticulo, setModalArticulo] = useState(null);
  const [ubicacionSeleccionada, setUbicacionSeleccionada] = useState(null);
  const navigate = useNavigate();

  const cargar = async () => {
    setCargando(true);
    try {
      const [rArt, rCat, rEmp, rUbi] = await Promise.all([
        fetch(`${API}/api/almacen/articulos`, { headers: authHeaders() }),
        fetch(`${API}/api/almacen/categorias`, { headers: authHeaders() }),
        fetch(`${API}/api/empleados`, { headers: authHeaders() }),
        fetch(`${API}/api/almacen/ubicaciones`, { headers: authHeaders() }),
      ]);
      const [dArt, dCat, dEmp, dUbi] = await Promise.all([rArt.json(), rCat.json(), rEmp.json(), rUbi.json()]);
      setArticulos(dArt.data ?? dArt ?? []);
      setCategorias(dCat.data ?? dCat ?? []);
      setEmpleados(dEmp.data ?? dEmp ?? []);
      setUbicaciones(dUbi.data ?? dUbi ?? []);
    } catch { toast.error("Error al cargar datos del almacén"); }
    setCargando(false);
  };

  useEffect(() => { cargar(); }, []);

  const filtrados = articulos.filter(a => {
    const matchQ = !busqueda || a.nombre.toLowerCase().includes(busqueda.toLowerCase())
      || (a.modelo ?? "").toLowerCase().includes(busqueda.toLowerCase())
      || (a.ubicacion ?? "").toLowerCase().includes(busqueda.toLowerCase());
    const matchCat = categoria === "todas" || String(a.categoria_id) === String(categoria);
    const pct = a.stock_minimo > 0 ? a.cantidad / a.stock_minimo : 1;
    const matchEst = estado === "todos"
      || (estado === "critico" && pct <= 0.2)
      || (estado === "bajo"    && pct > 0.2 && pct <= 1)
      || (estado === "ok"      && pct > 1);
    return matchQ && matchCat && matchEst;
  });

  const hayFiltros = busqueda || categoria !== "todas" || estado !== "todos";

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

  return (
    <>
      <div className="space-y-6">

        {/* Header */}
        <div className="flex items-center justify-end flex-wrap gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <button onClick={() => descargarExport("pdf")} className="flex items-center gap-2 px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white text-sm font-medium rounded-full shadow-sm hover:-translate-y-0.5 transition">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
              </svg>
              Exportar PDF
            </button>
            <button onClick={() => descargarExport("excel")} className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium rounded-full shadow-sm hover:-translate-y-0.5 transition">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
              </svg>
              Exportar Excel
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
                placeholder="Buscar por nombre, modelo, ubicación..."
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
            <div className="flex rounded-xl border border-slate-200 overflow-hidden text-xs">
              {["tabla", "ubicaciones"].map(v => (
                <button key={v} onClick={() => setVista(v)}
                  className={`px-3 py-2 capitalize transition ${vista === v ? "bg-blue-600 text-white" : "bg-white text-slate-600 hover:bg-slate-50"}`}>
                  {v === "tabla" ? "Tabla" : "Ubicaciones"}
                </button>
              ))}
            </div>
            {hayFiltros && (
              <button onClick={() => { setBusqueda(""); setCategoria("todas"); setEstado("todos"); }}
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
              <table className={dataTableClass()}>
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr className="text-xs text-slate-500 uppercase tracking-wide">
                    {["Artículo","Categoría","Ubicación","Stock","Mínimo","Estado"].map(h => (
                      <th key={h} className="px-5 py-3 text-left font-semibold">{h}</th>
                    ))}
                    <th className="px-5 py-3 text-right font-semibold">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {cargando ? (
                    <tr><td colSpan={7} className="px-5 py-12 text-center text-sm text-slate-400">Cargando...</td></tr>
                  ) : filtrados.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-5 py-12 text-center">
                        <div className="flex flex-col items-center gap-2">
                          <svg className="w-10 h-10 text-slate-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                          </svg>
                          <p className="text-sm font-medium text-slate-500">
                            {hayFiltros ? "No se encontraron resultados" : "No hay artículos registrados"}
                          </p>
                          {hayFiltros && (
                            <button onClick={() => { setBusqueda(""); setCategoria("todas"); setEstado("todos"); }}
                              className="mt-1 text-xs text-blue-600 hover:underline">
                              Limpiar filtros
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ) : filtrados.map(art => (
                    <tr key={art.id} className="hover:bg-slate-50 transition">
                      <td className="px-5 py-3">
                        <p className="truncate font-medium text-slate-800">{art.nombre}</p>
                        <p className="truncate text-xs text-slate-400">{art.modelo ?? "-"} · {art.unidad_medida}</p>
                      </td>
                      <td className="truncate px-5 py-3 text-xs text-slate-600">{art.subcategoria_nombre ?? art.subcategoria ?? "-"}</td>
                      <td className="px-5 py-3">
                        <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-lg font-mono">
                          {art.ubicacion ?? "-"}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <DotSemaforo cantidad={art.cantidad ?? 0} minimo={art.stock_minimo} />
                          <span className="font-semibold text-slate-800">{art.cantidad ?? 0}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-xs text-slate-400">{art.stock_minimo}</td>
                      <td className="px-5 py-3">
                        {(art.cantidad ?? 0) === 0 ? (
                           <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-rose-100 text-rose-700">Agotado</span>
                        ) : (
                           <Semaforo cantidad={art.cantidad ?? 0} minimo={art.stock_minimo} />
                        )}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {(art.cantidad ?? 0) === 0 ? (
                            <button
                              onClick={() => navigate('/almacen/ordenes-compra', { state: { precargarArticulo: art } })}
                              title="Comprar urgentemente"
                              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-full transition-colors"
                            >
                              <ShoppingCart className="w-3.5 h-3.5" />
                              Comprar
                            </button>
                          ) : (
                            <button
                              onClick={() => navigate('/catalogo', { state: { openArticulo: art } })}
                              title="Ver detalle"
                              className="p-1.5 rounded-md text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => setModalArticulo(art)}
                            title="Registrar salida"
                            className="p-1.5 rounded-md text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                          >
                            <PackageMinus className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
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

      {/* Modal */}
      {modalArticulo && (
        <ModalSalida
          articulo={modalArticulo}
          empleados={empleados}
          onClose={() => setModalArticulo(null)}
          onSuccess={() => { setModalArticulo(null); cargar(); }}
        />
      )}
    </>
  );
}
