import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/auth";
import { SelectPremium } from "@/components/ui/SelectPremium";

const emptyForm = {
  nombre: "",
  cliente_nombre: "",
  responsable_id: "",
  fecha_inicio: "",
  fecha_cierre_estimada: "",
  estatus: "ACTIVO",
  observaciones: "",
};

const emptyResource = {
  articulo_id: "",
  serie_id: "",
  vehiculo_id: "",
  cantidad: "1",
  notas: "",
};

export default function ProyectosIndex() {
  const [proyectos, setProyectos] = useState([]);
  const [empleados, setEmpleados] = useState([]);
  const [articulos, setArticulos] = useState([]);
  const [vehiculos, setVehiculos] = useState([]);
  const [series, setSeries] = useState([]);
  
  const [selectedId, setSelectedId] = useState("");
  const [selectedProject, setSelectedProject] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [resourceForm, setResourceForm] = useState(emptyResource);
  const [loading, setLoading] = useState(true);
  const [savingResource, setSavingResource] = useState(false);
  const [recursoType, setRecursoType] = useState('articulo'); // articulo, serie, vehiculo

  const selected = useMemo(
    () => selectedProject || proyectos.find((proyecto) => String(proyecto.id) === String(selectedId)),
    [proyectos, selectedId, selectedProject],
  );

  const articuloOptions = useMemo(() => articulos.map(a => ({ value: String(a.id), label: `${a.nombre} (ID: ${a.id})` })), [articulos]);
  const vehiculoOptions = useMemo(() => vehiculos.map(v => ({ value: String(v.id), label: `${v.nombre} - ${v.placa || v.placas || v.numero || ''}` })), [vehiculos]);
  const serieOptions = useMemo(() => series.filter(s => s.row_type === 'serie').map(s => ({ value: String(s.serie_id), label: `${s.numero_serie_fabricante || s.modelo} - ${s.nombre}` })), [series]);

  const load = async () => {
    setLoading(true);
    try {
      const [proyectosResponse, empleadosResponse, articulosRes, vehiculosRes, seriesRes] = await Promise.all([
        apiFetch("/api/proyectos"),
        apiFetch("/api/empleados"),
        apiFetch("/api/almacen/articulos"),
        apiFetch("/api/flotilla/vehiculos/activos"),
        apiFetch("/api/almacen/inventario-detallado") // Asumiendo que devuelve series
      ]);
      const proyectosPayload = await proyectosResponse.json();
      const empleadosPayload = await empleadosResponse.json();
      
      const articulosPayload = articulosRes.ok ? await articulosRes.json() : [];
      const vehiculosPayload = vehiculosRes.ok ? await vehiculosRes.json() : [];
      const seriesPayload = seriesRes.ok ? await seriesRes.json() : [];

      if (!proyectosResponse.ok) throw new Error(proyectosPayload.message || "No se pudieron cargar proyectos");
      
      const list = proyectosPayload.data || proyectosPayload;
      setProyectos(list);
      setEmpleados(empleadosPayload.data || empleadosPayload || []);
      setArticulos(articulosPayload.data || articulosPayload || []);
      setVehiculos(vehiculosPayload.data || vehiculosPayload || []);
      setSeries(seriesPayload.data || seriesPayload || []);

      if (!selectedId && list.length > 0) setSelectedId(String(list[0].id));
    } catch (error) {
      toast.error(error.message || "Error al cargar datos");
    } finally {
      setLoading(false);
    }
  };

  const loadProject = async (id = selectedId) => {
    if (!id) return;
    try {
      const response = await apiFetch(`/api/proyectos/${id}`);
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message || "No se pudo cargar el proyecto");
      setSelectedProject(payload);
    } catch (error) {
      toast.error(error.message || "No se pudo cargar el proyecto");
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (selectedId) loadProject(selectedId);
  }, [selectedId]);

  const submit = async (event) => {
    event.preventDefault();
    try {
      const payload = {
        ...form,
        responsable_id: form.responsable_id || null,
        fecha_inicio: form.fecha_inicio || null,
        fecha_cierre_estimada: form.fecha_cierre_estimada || null,
      };
      const response = await apiFetch("/api/proyectos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "No se pudo guardar el proyecto");
      toast.success("Proyecto registrado");
      setForm(emptyForm);
      setSelectedId(String(result.id));
      await load();
    } catch (error) {
      toast.error(error.message || "No se pudo guardar el proyecto");
    }
  };

  const assignResource = async (event) => {
    event.preventDefault();
    if (!selected?.id) return toast.error("Selecciona un proyecto");
    const linkedFields = ["articulo_id", "serie_id", "vehiculo_id"].filter((key) => resourceForm[key]);
    if (linkedFields.length !== 1) return toast.error("Captura solo un tipo de recurso por asociacion");

    setSavingResource(true);
    try {
      const payload = {
        articulo_id: resourceForm.articulo_id || null,
        serie_id: resourceForm.serie_id || null,
        vehiculo_id: resourceForm.vehiculo_id || null,
        cantidad: resourceForm.cantidad || 1,
        notas: resourceForm.notas || null,
      };
      const response = await apiFetch(`/api/proyectos/${selected.id}/recursos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "No se pudo asociar el recurso");
      toast.success("Recurso asociado");
      setResourceForm(emptyResource);
      await loadProject(selected.id);
    } catch (error) {
      toast.error(error.message || "No se pudo asociar el recurso");
    } finally {
      setSavingResource(false);
    }
  };

  const retireResource = async (resource) => {
    if (!selected?.id) return;
    
    const motivo = window.prompt("Motivo del retiro o devolución:");
    if (!motivo) return; // Usuario canceló o no ingresó motivo

    try {
      const response = await apiFetch(`/api/proyectos/${selected.id}/recursos/${resource.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notas: motivo }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "No se pudo retirar el recurso");
      toast.success("Recurso retirado");
      await loadProject(selected.id);
    } catch (error) {
      toast.error(error.message || "No se pudo retirar el recurso");
    }
  };

  return (
    <div className="mx-auto grid max-w-7xl gap-6 xl:grid-cols-[400px_1fr]">
      <form onSubmit={submit} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h1 className="text-xl font-extrabold text-slate-900">Proyectos</h1>
        <div className="mt-5 space-y-3">
          <input className="h-11 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:ring-4 focus:ring-blue-100" placeholder="Nombre del proyecto" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} required />
          <input className="h-11 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:ring-4 focus:ring-blue-100" placeholder="Cliente" value={form.cliente_nombre} onChange={(e) => setForm({ ...form, cliente_nombre: e.target.value })} />
          <select className="h-11 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:ring-4 focus:ring-blue-100" value={form.responsable_id} onChange={(e) => setForm({ ...form, responsable_id: e.target.value })}>
            <option value="">Responsable</option>
            {empleados.map((empleado) => (
              <option key={empleado.id} value={empleado.id}>{empleado.nombre_completo}</option>
            ))}
          </select>
          <div className="grid grid-cols-2 gap-3">
            <input type="date" className="h-11 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:ring-4 focus:ring-blue-100" value={form.fecha_inicio} onChange={(e) => setForm({ ...form, fecha_inicio: e.target.value })} />
            <input type="date" className="h-11 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:ring-4 focus:ring-blue-100" value={form.fecha_cierre_estimada} onChange={(e) => setForm({ ...form, fecha_cierre_estimada: e.target.value })} />
          </div>
          <select className="h-11 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:ring-4 focus:ring-blue-100" value={form.estatus} onChange={(e) => setForm({ ...form, estatus: e.target.value })}>
            {["PLANEADO", "ACTIVO", "PAUSADO", "CERRADO", "CANCELADO"].map((estatus) => <option key={estatus}>{estatus}</option>)}
          </select>
          <textarea className="min-h-24 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-4 focus:ring-blue-100" placeholder="Observaciones" value={form.observaciones} onChange={(e) => setForm({ ...form, observaciones: e.target.value })} />
          <button className="w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-bold text-white hover:bg-blue-700">Guardar proyecto</button>
        </div>
      </form>

      <div className="space-y-6">
        <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
            <p className="font-bold text-slate-900">Proyectos registrados</p>
            <select className="h-10 rounded-lg border border-slate-200 px-3 text-sm" value={selectedId} onChange={(event) => setSelectedId(event.target.value)}>
              <option value="">Seleccionar proyecto</option>
              {proyectos.map((proyecto) => <option key={proyecto.id} value={proyecto.id}>{proyecto.nombre}</option>)}
            </select>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs font-bold uppercase text-slate-500">
                <tr>
                  <th className="px-5 py-3">Proyecto</th>
                  <th className="px-5 py-3">Cliente</th>
                  <th className="px-5 py-3">Responsable</th>
                  <th className="px-5 py-3">Estatus</th>
                  <th className="px-5 py-3">Fechas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr><td colSpan={5} className="px-5 py-10 text-center text-slate-400">Cargando...</td></tr>
                ) : proyectos.length === 0 ? (
                  <tr><td colSpan={5} className="px-5 py-10 text-center text-slate-400">Sin proyectos</td></tr>
                ) : proyectos.map((proyecto) => (
                  <tr key={proyecto.id} className={String(proyecto.id) === String(selectedId) ? "bg-blue-50/60" : ""}>
                    <td className="px-5 py-3 font-bold text-slate-800">
                      <button type="button" className="text-left hover:text-blue-700" onClick={() => setSelectedId(String(proyecto.id))}>{proyecto.nombre}</button>
                    </td>
                    <td className="px-5 py-3">{proyecto.cliente_nombre || "-"}</td>
                    <td className="px-5 py-3">{proyecto.responsable?.nombre_completo || "-"}</td>
                    <td className="px-5 py-3">{proyecto.estatus}</td>
                    <td className="px-5 py-3 text-xs text-slate-500">{proyecto.fecha_inicio || "-"} / {proyecto.fecha_cierre_estimada || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="font-extrabold text-slate-900">Recursos del proyecto</h2>
              <p className="text-sm text-slate-500">{selected?.nombre || "Selecciona un proyecto"}</p>
            </div>
          </div>
          <form onSubmit={assignResource} className="mt-4 grid gap-3 md:grid-cols-5">
            <div className="md:col-span-1">
              <select 
                className="h-12 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all shadow-sm"
                value={recursoType}
                onChange={(e) => {
                  setRecursoType(e.target.value);
                  setResourceForm({ ...resourceForm, articulo_id: "", serie_id: "", vehiculo_id: "" });
                }}
              >
                <option value="articulo">Artículo Gral.</option>
                <option value="serie">Artículo Serializado</option>
                <option value="vehiculo">Vehículo</option>
              </select>
            </div>
            <div className="md:col-span-2">
              {recursoType === 'articulo' && (
                <SelectPremium 
                  options={articuloOptions} 
                  value={resourceForm.articulo_id} 
                  onChange={(val) => setResourceForm({ ...resourceForm, articulo_id: val, serie_id: "", vehiculo_id: "" })}
                  placeholder="Buscar Artículo..."
                />
              )}
              {recursoType === 'serie' && (
                <SelectPremium 
                  options={serieOptions} 
                  value={resourceForm.serie_id} 
                  onChange={(val) => setResourceForm({ ...resourceForm, serie_id: val, articulo_id: "", vehiculo_id: "" })}
                  placeholder="Buscar Serie..."
                />
              )}
              {recursoType === 'vehiculo' && (
                <SelectPremium 
                  options={vehiculoOptions} 
                  value={resourceForm.vehiculo_id} 
                  onChange={(val) => setResourceForm({ ...resourceForm, vehiculo_id: val, articulo_id: "", serie_id: "" })}
                  placeholder="Buscar Vehículo..."
                />
              )}
            </div>
            <input className="h-12 w-full rounded-xl border border-slate-200 px-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all shadow-sm md:col-span-1" placeholder="Cantidad" type="number" step="0.01" min="0.01" value={resourceForm.cantidad} onChange={(e) => setResourceForm({ ...resourceForm, cantidad: e.target.value })} />
            <button disabled={savingResource || !selected?.id} className="h-12 w-full rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50 transition-colors md:col-span-1">Asociar</button>
            <textarea className="min-h-20 rounded-xl border border-slate-200 px-3 py-2 text-sm shadow-sm md:col-span-5 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all" placeholder="Notas de asociacion" value={resourceForm.notas} onChange={(e) => setResourceForm({ ...resourceForm, notas: e.target.value })} />
          </form>
          <div className="mt-5 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs font-bold uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Tipo</th>
                  <th className="px-4 py-3">Referencia</th>
                  <th className="px-4 py-3">Cantidad</th>
                  <th className="px-4 py-3">Estatus</th>
                  <th className="px-4 py-3">Accion</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(selected?.recursos || []).length === 0 ? (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400">Sin recursos asociados</td></tr>
                ) : selected.recursos.map((recurso) => {
                  const tipo = recurso.serie_id ? "Serie" : recurso.vehiculo_id ? "Vehiculo" : "Articulo";
                  const nombreRef = recurso.articulo?.nombre 
                                  || recurso.serie?.numero_serie_fabricante 
                                  || recurso.vehiculo?.nombre 
                                  || "Sin nombre";
                  const idRef = recurso.serie_id || recurso.vehiculo_id || recurso.articulo_id || "-";
                  const referencia = `${nombreRef} (${idRef})`;
                  return (
                    <tr key={recurso.id}>
                      <td className="px-4 py-3 font-semibold text-slate-700">{tipo}</td>
                      <td className="px-4 py-3">#{referencia}</td>
                      <td className="px-4 py-3">{recurso.cantidad}</td>
                      <td className="px-4 py-3">{recurso.fecha_retiro ? "RETIRADO" : recurso.estatus}</td>
                      <td className="px-4 py-3">
                        {!recurso.fecha_retiro && (
                          <button type="button" onClick={() => retireResource(recurso)} className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50">Retirar</button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
