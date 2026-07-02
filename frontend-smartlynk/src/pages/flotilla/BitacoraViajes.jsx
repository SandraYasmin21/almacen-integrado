import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import StatusBadge from "../../components/StatusBadge";

const API = import.meta.env.VITE_API_URL ?? "";
const authHeaders = () => ({
  Accept: "application/json",
  Authorization: `Bearer ${localStorage.getItem("smartlynk_token") ?? ""}`,
});

function normalizeRows(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
}

function formatDate(value) {
  if (!value) return "-";
  return new Date(`${value}T00:00:00`).toLocaleDateString("es-MX", { dateStyle: "medium" });
}

function money(value) {
  return Number(value || 0).toLocaleString("es-MX", { style: "currency", currency: "MXN" });
}

function km(value) {
  if (value === null || value === undefined || value === "") return "-";
  return `${Number(value || 0).toLocaleString("es-MX")} km`;
}

function eventTypeFromMaintenance(registro) {
  if (registro.tipo === "preventivo") return "Mantenimiento preventivo";
  if (registro.tipo === "correctivo" || registro.tipo === "correctivo_mayor" || registro.tipo === "reparacion") return "Mantenimiento correctivo";
  if (registro.tipo === "lectura") return "Lectura de kilometraje";
  return "Evento vehicular";
}

function eventTypeFromExpense(gasto) {
  const tipo = String(gasto.tipo || "").toLowerCase();
  if (tipo.includes("lavado") || tipo.includes("limpieza")) return "Lavado";
  if (tipo.includes("compra") || tipo.includes("refaccion") || tipo.includes("refacción") || tipo.includes("accesorio")) {
    return "Compra de accesorio/refacción";
  }
  if (tipo.includes("diagnostico") || tipo.includes("diagnóstico")) return "Diagnóstico";
  return "Gasto extra";
}

function buildEvents(mantenimientos, gastos) {
  const maintenanceEvents = mantenimientos.map((registro) => ({
    id: `m-${registro.id}`,
    source: "mantenimiento",
    vehiculoId: registro.vehiculo_id,
    vehiculo: registro.vehiculo?.nombre || registro.nombre_vehiculo || "Sin vehículo",
    fecha: registro.fecha,
    tipo: eventTypeFromMaintenance(registro),
    detalle: registro.detalle_falla || registro.notas || "-",
    kilometraje: registro.kilometraje,
    costo: registro.costo,
    subtipo: registro.tipo_mantenimiento || "-",
    capturo: registro.usuario?.nombre_usuario || "-",
    evidencia: registro.evidencia_path,
  }));

  const expenseEvents = gastos.map((gasto) => ({
    id: `g-${gasto.id}`,
    source: "gasto",
    vehiculoId: gasto.vehiculo_id,
    vehiculo: gasto.vehiculo?.nombre || "Sin vehículo",
    fecha: gasto.fecha,
    tipo: eventTypeFromExpense(gasto),
    detalle: gasto.observaciones || gasto.tipo || "-",
    kilometraje: null,
    costo: gasto.costo,
    subtipo: gasto.tipo || "-",
    capturo: gasto.usuario?.nombre_usuario || "-",
    evidencia: gasto.evidencia_path || gasto.comprobante_fiscal,
  }));

  return [...maintenanceEvents, ...expenseEvents].sort((a, b) => String(b.fecha || "").localeCompare(String(a.fecha || "")));
}

export default function BitacoraViajes() {
  const [mantenimientos, setMantenimientos] = useState([]);
  const [gastos, setGastos] = useState([]);
  const [vehiculoFiltro, setVehiculoFiltro] = useState("todos");
  const [tipoFiltro, setTipoFiltro] = useState("todos");
  const [busqueda, setBusqueda] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [mantenimientosResponse, gastosResponse] = await Promise.all([
        fetch(`${API}/api/flotilla/registros`, { headers: authHeaders() }),
        fetch(`${API}/api/flotilla/gastos-extra`, { headers: authHeaders() }),
      ]);

      if (!mantenimientosResponse.ok || !gastosResponse.ok) {
        throw new Error("No se pudo cargar la bitácora vehicular.");
      }

      setMantenimientos(normalizeRows(await mantenimientosResponse.json()));
      setGastos(normalizeRows(await gastosResponse.json()));
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const eventos = useMemo(() => buildEvents(mantenimientos, gastos), [mantenimientos, gastos]);

  const vehiculos = useMemo(() => {
    const map = new Map();
    eventos.forEach((evento) => {
      if (evento.vehiculoId) map.set(String(evento.vehiculoId), evento.vehiculo);
    });
    return [...map.entries()].map(([id, nombre]) => ({ id, nombre })).sort((a, b) => a.nombre.localeCompare(b.nombre));
  }, [eventos]);

  const tipos = useMemo(() => [...new Set(eventos.map((evento) => evento.tipo))].sort(), [eventos]);

  const rows = eventos
    .filter((evento) => vehiculoFiltro === "todos" || String(evento.vehiculoId) === vehiculoFiltro)
    .filter((evento) => tipoFiltro === "todos" || evento.tipo === tipoFiltro)
    .filter((evento) => {
      const term = busqueda.trim().toLowerCase();
      if (!term) return true;
      return [evento.vehiculo, evento.tipo, evento.detalle, evento.subtipo, evento.capturo]
        .some((value) => String(value || "").toLowerCase().includes(term));
    });

  const resumen = {
    total: rows.length,
    mantenimientos: rows.filter((evento) => evento.tipo.includes("Mantenimiento")).length,
    lecturas: rows.filter((evento) => evento.tipo === "Lectura de kilometraje").length,
    costo: rows.reduce((sum, evento) => sum + Number(evento.costo || 0), 0),
  };

  const exportCsv = () => {
    const headers = ["Vehículo", "Fecha", "Tipo de evento", "Descripción", "Kilometraje", "Costo", "Subtipo", "Capturó", "Origen"];
    const lines = rows.map((evento) => [
      evento.vehiculo,
      evento.fecha,
      evento.tipo,
      evento.detalle,
      evento.kilometraje ?? "",
      evento.costo ?? 0,
      evento.subtipo,
      evento.capturo,
      evento.source,
    ]);
    const csv = "\uFEFF" + [headers, ...lines]
      .map((line) => line.map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "bitacora_vehicular_eventos.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Bitácora vehicular</h1>
          <p className="mt-1 text-sm text-slate-500">Historial de mantenimientos, reparaciones, lavados, compras, lecturas de kilometraje y gastos adicionales.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => window.print()} className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-bold text-white">PDF</button>
          <button onClick={exportCsv} className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white">Excel</button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Metric label="Eventos registrados" value={resumen.total} />
        <Metric label="Mantenimientos" value={resumen.mantenimientos} />
        <Metric label="Lecturas de KM" value={resumen.lecturas} />
        <Metric label="Costo acumulado" value={money(resumen.costo)} />
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid gap-3 lg:grid-cols-[220px_260px_1fr]">
          <select value={vehiculoFiltro} onChange={(event) => setVehiculoFiltro(event.target.value)} className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-medium outline-none">
            <option value="todos">Vehículo: todos</option>
            {vehiculos.map((vehiculo) => <option key={vehiculo.id} value={vehiculo.id}>{vehiculo.nombre}</option>)}
          </select>
          <select value={tipoFiltro} onChange={(event) => setTipoFiltro(event.target.value)} className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-medium outline-none">
            <option value="todos">Tipo de evento: todos</option>
            {tipos.map((tipo) => <option key={tipo} value={tipo}>{tipo}</option>)}
          </select>
          <input
            value={busqueda}
            onChange={(event) => setBusqueda(event.target.value)}
            placeholder="Buscar por vehículo, descripción, subtipo o usuario..."
            className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-medium outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-50"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-[1200px] w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Vehículo</th>
                <th className="px-4 py-3">Fecha</th>
                <th className="px-4 py-3">Tipo de evento</th>
                <th className="px-4 py-3">Descripción</th>
                <th className="px-4 py-3">Kilometraje</th>
                <th className="px-4 py-3 text-right">Costo</th>
                <th className="px-4 py-3">Subtipo</th>
                <th className="px-4 py-3">Capturó</th>
                <th className="px-4 py-3 text-center">Origen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={9} className="px-4 py-10 text-center text-slate-400">Cargando bitácora...</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={9} className="px-4 py-10 text-center text-slate-400">Sin eventos registrados.</td></tr>
              ) : rows.map((evento) => (
                <tr key={evento.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-bold text-slate-900">{evento.vehiculo}</td>
                  <td className="px-4 py-3 text-slate-500">{formatDate(evento.fecha)}</td>
                  <td className="px-4 py-3"><StatusBadge status={evento.tipo} size="compact" /></td>
                  <td className="max-w-[360px] px-4 py-3 text-slate-600">
                    <p className="line-clamp-2">{evento.detalle}</p>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">{km(evento.kilometraje)}</td>
                  <td className="px-4 py-3 text-right font-bold text-slate-800">{money(evento.costo)}</td>
                  <td className="px-4 py-3 text-slate-500">{evento.subtipo}</td>
                  <td className="px-4 py-3 text-slate-500">{evento.capturo}</td>
                  <td className="px-4 py-3 text-center">
                    <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-bold text-slate-600">
                      {evento.source === "mantenimiento" ? "Registro" : "Gasto"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-bold text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-black text-slate-900">{value}</p>
    </div>
  );
}
