import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import StatusBadge from "../../components/StatusBadge";

const API = import.meta.env.VITE_API_URL ?? "";
const authHeaders = (json = true) => ({
  Accept: "application/json",
  ...(json ? { "Content-Type": "application/json" } : {}),
  Authorization: `Bearer ${localStorage.getItem("smartlynk_token") ?? ""}`,
});

const emptyForm = {
  codigo_vehiculo: "",
  nombre: "",
  marca: "",
  modelo: "",
  anio: "",
  niv: "",
  placa: "",
  tipo_vehiculo: "",
  grupo: "",
  poliza_seguro: "",
  numero: "",
  estado_gps: "Funcionando",
  responsable_id: "",
  ubicacion_id: "",
  estado: "DISPONIBLE",
  kilometraje_actual: "0",
  observaciones: "",
};

const estados = ["DISPONIBLE", "ASIGNADO", "EN_MANTENIMIENTO", "BAJA", "SINIESTRADO"];
const estadosGps = ["Funcionando", "Sin GPS", "No pagado", "No coincide VIN", "Sin unidad"];
const tiposVehiculo = ["Auto", "Camioneta", "Grúa", "Pickup", "Camión", "Motocicleta", "Otro"];

function normalizeRows(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
}

function fmtKm(value) {
  return `${Number(value || 0).toLocaleString("es-MX")} km`;
}

function Field({ label, children, required }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">
        {label} {required && <span className="text-red-500">*</span>}
      </span>
      {children}
    </label>
  );
}

function inputClass() {
  return "h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-medium text-slate-800 outline-none transition focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-50";
}

export default function CatalogoVehiculos() {
  const [vehiculos, setVehiculos] = useState([]);
  const [empleados, setEmpleados] = useState([]);
  const [ubicaciones, setUbicaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [query, setQuery] = useState("");
  const [estadoFiltro, setEstadoFiltro] = useState("todos");

  const loadData = async () => {
    setLoading(true);
    try {
      const [vehiculosRes, empleadosRes, ubicacionesRes] = await Promise.all([
        fetch(`${API}/api/flotilla/vehiculos`, { headers: authHeaders() }),
        fetch(`${API}/api/empleados`, { headers: authHeaders() }),
        fetch(`${API}/api/ubicaciones`, { headers: authHeaders() }),
      ]);

      if (!vehiculosRes.ok) throw new Error("No se pudo cargar el catálogo de vehículos.");

      setVehiculos(normalizeRows(await vehiculosRes.json()));
      if (empleadosRes.ok) setEmpleados(normalizeRows(await empleadosRes.json()));
      if (ubicacionesRes.ok) setUbicaciones(normalizeRows(await ubicacionesRes.json()));
    } catch (error) {
      toast.error(error.message || "Error al cargar vehículos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const rows = useMemo(() => {
    const term = query.trim().toLowerCase();
    return vehiculos.filter((vehiculo) => {
      const estado = vehiculo.estado || "DISPONIBLE";
      const matchesEstado = estadoFiltro === "todos" || estado === estadoFiltro;
      const matchesQuery = !term || [
        vehiculo.codigo_vehiculo,
        vehiculo.nombre,
        vehiculo.marca,
        vehiculo.modelo,
        vehiculo.niv,
        vehiculo.numero_serie,
        vehiculo.placa,
        vehiculo.placas,
      ].some((value) => String(value || "").toLowerCase().includes(term));
      return matchesEstado && matchesQuery;
    });
  }, [vehiculos, query, estadoFiltro]);

  const resumen = useMemo(() => ({
    total: vehiculos.length,
    disponibles: vehiculos.filter((v) => ["ACTIVO", "DISPONIBLE"].includes(v.estado)).length,
    asignados: vehiculos.filter((v) => v.estado === "ASIGNADO").length,
    mantenimiento: vehiculos.filter((v) => v.estado === "EN_MANTENIMIENTO").length,
  }), [vehiculos]);

  const openNew = () => {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (vehiculo) => {
    setEditing(vehiculo);
    setForm({
      codigo_vehiculo: vehiculo.codigo_vehiculo || "",
      nombre: vehiculo.nombre || "",
      marca: vehiculo.marca || "",
      modelo: vehiculo.modelo || "",
      anio: vehiculo.anio || "",
      niv: vehiculo.niv || vehiculo.numero_serie || "",
      placa: vehiculo.placa || vehiculo.placas || "",
      tipo_vehiculo: vehiculo.tipo_vehiculo || "",
      grupo: vehiculo.grupo || "",
      poliza_seguro: vehiculo.poliza_seguro || "",
      numero: vehiculo.numero || "",
      estado_gps: vehiculo.estado_gps || "Funcionando",
      responsable_id: vehiculo.responsable_id ? String(vehiculo.responsable_id) : "",
      ubicacion_id: vehiculo.ubicacion_id ? String(vehiculo.ubicacion_id) : "",
      estado: vehiculo.estado || "DISPONIBLE",
      kilometraje_actual: vehiculo.kilometraje_actual ?? "0",
      observaciones: vehiculo.observaciones || "",
    });
    setModalOpen(true);
  };

  const save = async (event) => {
    event.preventDefault();
    const payload = {
      ...form,
      codigo_vehiculo: form.codigo_vehiculo || null,
      anio: form.anio ? Number(form.anio) : null,
      kilometraje_actual: Number(form.kilometraje_actual || 0),
      responsable_id: form.responsable_id ? Number(form.responsable_id) : null,
      ubicacion_id: form.ubicacion_id ? Number(form.ubicacion_id) : null,
      numero_serie: form.niv,
      niv: form.niv,
      placa: form.placa,
    };

    try {
      const response = await fetch(`${API}/api/flotilla/vehiculos${editing ? `/${editing.id}` : ""}`, {
        method: editing ? "PUT" : "POST",
        headers: authHeaders(),
        body: JSON.stringify(payload),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.message || result.mensaje || "No se pudo guardar el vehículo.");
      toast.success(editing ? "Vehículo actualizado" : "Vehículo registrado");
      setModalOpen(false);
      await loadData();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const baja = async (vehiculo) => {
    if (!window.confirm(`Dar de baja el vehículo ${vehiculo.nombre}?`)) return;
    try {
      const response = await fetch(`${API}/api/flotilla/vehiculos/${vehiculo.id}`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.message || result.mensaje || "No se pudo dar de baja.");
      toast.success("Vehículo dado de baja");
      await loadData();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const exportar = async (format) => {
    try {
      const response = await fetch(`${API}/api/catalogo/export/vehiculos/${format}`, { headers: authHeaders(false) });
      if (!response.ok) throw new Error("No se pudo generar el reporte.");
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `catalogo_vehiculos.${format === "excel" ? "xlsx" : "pdf"}`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <div className="space-y-6 pb-16">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Vehículos</h1>
          <p className="mt-1 text-sm text-slate-500">Catálogo administrativo de flotilla, responsables, ubicación, estatus y kilometraje.</p>
        </div>
        <button onClick={openNew} className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-blue-700">
          + Nuevo vehículo
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Metric label="Total registrados" value={resumen.total} />
        <Metric label="Disponibles" value={resumen.disponibles} />
        <Metric label="Asignados" value={resumen.asignados} />
        <Metric label="En mantenimiento" value={resumen.mantenimiento} />
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="h-11 min-w-72 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:ring-4 focus:ring-blue-50"
            placeholder="Buscar por código, nombre, placas, NIV o estatus..."
          />
          <select value={estadoFiltro} onChange={(event) => setEstadoFiltro(event.target.value)} className={inputClass() + " max-w-56"}>
            <option value="todos">Todos los estatus</option>
            {estados.map((estado) => <option key={estado} value={estado}>{estado}</option>)}
          </select>
          <button onClick={() => exportar("pdf")} className="rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-rose-700">PDF</button>
          <button onClick={() => exportar("excel")} className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-700">Excel</button>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-[1200px] w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Código / Nombre</th>
                <th className="px-4 py-3">Marca / Modelo</th>
                <th className="px-4 py-3">Año</th>
                <th className="px-4 py-3">NIV / Serie</th>
                <th className="px-4 py-3">Placas</th>
                <th className="px-4 py-3">Tipo</th>
                <th className="px-4 py-3">Responsable</th>
                <th className="px-4 py-3">Ubicación</th>
                <th className="px-4 py-3">Km actual</th>
                <th className="px-4 py-3 text-center">Estatus</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={11} className="px-4 py-10 text-center text-slate-400">Cargando vehículos...</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={11} className="px-4 py-10 text-center text-slate-400">Sin vehículos registrados.</td></tr>
              ) : rows.map((vehiculo) => (
                <tr key={vehiculo.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <p className="font-mono text-xs font-bold text-blue-700">{vehiculo.codigo_vehiculo || `VEH-${vehiculo.id}`}</p>
                    <p className="font-bold text-slate-900">{vehiculo.nombre}</p>
                    <p className="text-xs text-slate-400">GPS: {vehiculo.estado_gps || "-"}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-slate-800">{vehiculo.marca || "-"}</p>
                    <p className="text-xs text-slate-500">{vehiculo.modelo || "-"}</p>
                  </td>
                  <td className="px-4 py-3">{vehiculo.anio || "-"}</td>
                  <td className="max-w-44 truncate px-4 py-3 font-mono text-xs text-slate-500">{vehiculo.niv || vehiculo.numero_serie || "-"}</td>
                  <td className="px-4 py-3 font-semibold">{vehiculo.placa || vehiculo.placas || "-"}</td>
                  <td className="px-4 py-3">{vehiculo.tipo_vehiculo || "-"}</td>
                  <td className="px-4 py-3">{vehiculo.responsable?.nombre_completo || "-"}</td>
                  <td className="px-4 py-3">{vehiculo.ubicacion?.nombre || "-"}</td>
                  <td className="px-4 py-3 font-mono text-xs font-bold">{fmtKm(vehiculo.kilometraje_actual)}</td>
                  <td className="px-4 py-3 text-center"><StatusBadge status={vehiculo.estado || "DISPONIBLE"} size="compact" /></td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => openEdit(vehiculo)} className="rounded-lg border border-blue-200 px-3 py-1.5 text-xs font-bold text-blue-700 hover:bg-blue-50">Editar</button>
                      <button onClick={() => baja(vehiculo)} className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-bold text-red-700 hover:bg-red-50">Baja</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm">
          <div className="max-h-[92vh] w-full max-w-5xl overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 p-5">
              <h2 className="text-lg font-black text-slate-900">{editing ? "Editar vehículo" : "Registrar vehículo"}</h2>
              <button onClick={() => setModalOpen(false)} className="rounded-lg px-3 py-1 text-sm font-bold text-slate-500 hover:bg-slate-100">Cerrar</button>
            </div>
            <form onSubmit={save} className="max-h-[calc(92vh-76px)] overflow-y-auto p-5">
              <div className="grid gap-4 md:grid-cols-3">
                <Field label="Código del vehículo"><input className={inputClass()} value={form.codigo_vehiculo} onChange={(e) => setForm({ ...form, codigo_vehiculo: e.target.value })} placeholder="VEH-001" /></Field>
                <Field label="Nombre del vehículo" required><input required className={inputClass()} value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} /></Field>
                <Field label="Marca"><input className={inputClass()} value={form.marca} onChange={(e) => setForm({ ...form, marca: e.target.value })} /></Field>
                <Field label="Modelo / versión" required><input required className={inputClass()} value={form.modelo} onChange={(e) => setForm({ ...form, modelo: e.target.value })} /></Field>
                <Field label="Año"><input type="number" min="1950" max="2100" className={inputClass()} value={form.anio} onChange={(e) => setForm({ ...form, anio: e.target.value })} /></Field>
                <Field label="NIV / número de serie" required><input required className={inputClass()} value={form.niv} onChange={(e) => setForm({ ...form, niv: e.target.value.toUpperCase() })} /></Field>
                <Field label="Placas" required><input required className={inputClass()} value={form.placa} onChange={(e) => setForm({ ...form, placa: e.target.value.toUpperCase() })} /></Field>
                <Field label="Tipo de vehículo"><select className={inputClass()} value={form.tipo_vehiculo} onChange={(e) => setForm({ ...form, tipo_vehiculo: e.target.value })}><option value="">Seleccionar</option>{tiposVehiculo.map((tipo) => <option key={tipo}>{tipo}</option>)}</select></Field>
                <Field label="Grupo / razón social"><input className={inputClass()} value={form.grupo} onChange={(e) => setForm({ ...form, grupo: e.target.value })} /></Field>
                <Field label="Póliza de seguro"><input className={inputClass()} value={form.poliza_seguro} onChange={(e) => setForm({ ...form, poliza_seguro: e.target.value })} /></Field>
                <Field label="Número de GPS"><input className={inputClass()} value={form.numero} onChange={(e) => setForm({ ...form, numero: e.target.value })} /></Field>
                <Field label="Estado del GPS"><select className={inputClass()} value={form.estado_gps} onChange={(e) => setForm({ ...form, estado_gps: e.target.value })}>{estadosGps.map((estado) => <option key={estado}>{estado}</option>)}</select></Field>
                <Field label="Responsable actual"><select className={inputClass()} value={form.responsable_id} onChange={(e) => setForm({ ...form, responsable_id: e.target.value })}><option value="">Sin responsable</option>{empleados.map((empleado) => <option key={empleado.id} value={empleado.id}>{empleado.nombre_completo || empleado.nombre || empleado.nombre_usuario}</option>)}</select></Field>
                <Field label="Ubicación actual"><select className={inputClass()} value={form.ubicacion_id} onChange={(e) => setForm({ ...form, ubicacion_id: e.target.value })}><option value="">Sin ubicación</option>{ubicaciones.map((ubicacion) => <option key={ubicacion.id} value={ubicacion.id}>{ubicacion.nombre}</option>)}</select></Field>
                <Field label="Estatus operativo"><select className={inputClass()} value={form.estado} onChange={(e) => setForm({ ...form, estado: e.target.value })}>{estados.map((estado) => <option key={estado}>{estado}</option>)}</select></Field>
                <Field label="Kilometraje actual" required><input required type="number" min="0" step="1" className={inputClass()} value={form.kilometraje_actual} onChange={(e) => setForm({ ...form, kilometraje_actual: e.target.value })} /></Field>
                <div className="md:col-span-3">
                  <Field label="Observaciones"><textarea rows={3} className={inputClass() + " h-auto py-3"} value={form.observaciones} onChange={(e) => setForm({ ...form, observaciones: e.target.value })} /></Field>
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-3 border-t border-slate-100 pt-5">
                <button type="button" onClick={() => setModalOpen(false)} className="rounded-xl bg-slate-100 px-5 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-200">Cancelar</button>
                <button className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-blue-700">{editing ? "Guardar cambios" : "Registrar vehículo"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function Metric({ label, value }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-sm font-bold text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-black text-slate-900">{value}</p>
    </div>
  );
}
