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

function fmtDate(value) {
  if (!value) return "-";
  return new Date(value).toLocaleString("es-MX", { dateStyle: "short", timeStyle: "short" });
}

function fmtKm(value) {
  return value === null || value === undefined ? "-" : Number(value).toLocaleString("es-MX");
}

export default function BitacoraPerfilVehicular() {
  const [viajes, setViajes] = useState([]);
  const [vehiculoFiltro, setVehiculoFiltro] = useState("todos");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API}/api/flotilla/bitacora-viajes`, { headers: authHeaders() });
      if (!response.ok) throw new Error("No se pudo cargar la bitácora de perfil.");
      setViajes(normalizeRows(await response.json()));
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const vehiculos = useMemo(() => {
    const map = new Map();
    viajes.forEach((viaje) => {
      if (viaje.vehiculo_id && viaje.vehiculo?.nombre) map.set(String(viaje.vehiculo_id), viaje.vehiculo.nombre);
    });
    return [...map.entries()].map(([id, nombre]) => ({ id, nombre }));
  }, [viajes]);

  const rows = viajes.filter((viaje) => vehiculoFiltro === "todos" || String(viaje.vehiculo_id) === vehiculoFiltro);
  const hoy = new Date().toISOString().slice(0, 10);
  const viajesHoy = viajes.filter((viaje) => String(viaje.fecha_hora_salida || "").startsWith(hoy)).length;
  const enRuta = viajes.filter((viaje) => !viaje.fecha_hora_regreso).length;
  const kmHoy = viajes
    .filter((viaje) => String(viaje.fecha_hora_salida || "").startsWith(hoy) && viaje.km_final !== null)
    .reduce((sum, viaje) => sum + Math.max(0, Number(viaje.km_final || 0) - Number(viaje.km_inicial || 0)), 0);
  const sinRegreso8h = viajes.filter((viaje) => {
    if (viaje.fecha_hora_regreso || !viaje.fecha_hora_salida) return false;
    return Date.now() - new Date(viaje.fecha_hora_salida).getTime() > 8 * 60 * 60 * 1000;
  }).length;

  const exportar = async (format) => {
    try {
      const response = await fetch(`${API}/api/exportar/bitacora/${format}`, { headers: authHeaders() });
      if (!response.ok) throw new Error("No se pudo generar el reporte.");
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `bitacora_perfil_vehicular.${format === "excel" ? "xlsx" : "pdf"}`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Bitácora de perfil vehicular</h1>
          <p className="mt-1 text-sm text-slate-500">Salidas, regresos y lecturas registradas desde kiosco o mostrador.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => exportar("pdf")} className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-bold text-white">PDF</button>
          <button onClick={() => exportar("excel")} className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white">Excel</button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Metric label="Viajes hoy" value={viajesHoy} />
        <Metric label="En ruta ahora" value={enRuta} />
        <Metric label="KM recorridos hoy" value={kmHoy.toLocaleString("es-MX")} />
        <Metric label="Sin regreso >8h" value={sinRegreso8h} danger />
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <select value={vehiculoFiltro} onChange={(event) => setVehiculoFiltro(event.target.value)} className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-medium outline-none">
          <option value="todos">Vehículo: todos</option>
          {vehiculos.map((vehiculo) => <option key={vehiculo.id} value={vehiculo.id}>{vehiculo.nombre}</option>)}
        </select>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-[1000px] w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Vehículo</th>
                <th className="px-4 py-3">Empleado</th>
                <th className="px-4 py-3">Salida</th>
                <th className="px-4 py-3">KM inicial</th>
                <th className="px-4 py-3">Motivo</th>
                <th className="px-4 py-3">Regreso</th>
                <th className="px-4 py-3">KM final</th>
                <th className="px-4 py-3">Recorrido</th>
                <th className="px-4 py-3 text-center">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={9} className="px-4 py-10 text-center text-slate-400">Cargando bitácora...</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={9} className="px-4 py-10 text-center text-slate-400">Sin viajes registrados.</td></tr>
              ) : rows.map((viaje) => {
                const recorrido = viaje.km_final === null || viaje.km_final === undefined ? null : Math.max(0, Number(viaje.km_final) - Number(viaje.km_inicial || 0));
                const estado = viaje.fecha_hora_regreso ? "Completado" : "En ruta";
                return (
                  <tr key={viaje.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-bold text-slate-900">{viaje.vehiculo?.nombre || "-"}</td>
                    <td className="px-4 py-3">{viaje.empleado?.nombre_completo || "-"}</td>
                    <td className="px-4 py-3">{fmtDate(viaje.fecha_hora_salida)}</td>
                    <td className="px-4 py-3 font-mono text-xs">{fmtKm(viaje.km_inicial)}</td>
                    <td className="max-w-72 truncate px-4 py-3">{viaje.motivo_viaje || viaje.motivo_uso || "-"}</td>
                    <td className="px-4 py-3">{fmtDate(viaje.fecha_hora_regreso)}</td>
                    <td className="px-4 py-3 font-mono text-xs">{fmtKm(viaje.km_final)}</td>
                    <td className="px-4 py-3 font-bold text-emerald-700">{recorrido === null ? "-" : `${recorrido.toLocaleString("es-MX")} km`}</td>
                    <td className="px-4 py-3 text-center"><StatusBadge status={estado} size="compact" /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value, danger }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className={`text-sm font-bold ${danger ? "text-red-500" : "text-slate-500"}`}>{label}</p>
      <p className="mt-2 text-3xl font-black text-slate-900">{value}</p>
    </div>
  );
}
