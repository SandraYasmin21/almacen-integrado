import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

const API = import.meta.env.VITE_API_URL ?? "";
const authHeaders = () => ({
  Accept: "application/json",
  Authorization: `Bearer ${localStorage.getItem("smartlynk_token") ?? ""}`,
});

function money(value) {
  return `$${Number(value || 0).toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function DashboardFlotilla() {
  const [data, setData] = useState({ resumen: {}, mantenimientos_por_tipo: [], costo_por_vehiculo: [] });
  const [loading, setLoading] = useState(true);
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (fechaInicio) params.append("fecha_inicio", fechaInicio);
      if (fechaFin) params.append("fecha_fin", fechaFin);
      const response = await fetch(`${API}/api/flotilla/dashboard?${params.toString()}`, { headers: authHeaders() });
      if (!response.ok) throw new Error("No se pudo cargar el dashboard vehicular.");
      setData(await response.json());
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const resumen = data.resumen || {};
  const totalTipos = (data.mantenimientos_por_tipo || []).reduce((sum, item) => sum + Number(item.total || 0), 0);
  const tipoRows = useMemo(() => (data.mantenimientos_por_tipo || []).map((item) => ({
    ...item,
    percent: totalTipos ? Math.round((Number(item.total || 0) / totalTipos) * 100) : 0,
  })), [data.mantenimientos_por_tipo, totalTipos]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Dashboard vehicular</h1>
          <p className="mt-1 text-sm text-slate-500">Indicadores básicos de vehículos, mantenimientos, costos y kilometraje.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} className="h-10 rounded-xl border border-slate-200 px-3 text-sm" />
          <input type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} className="h-10 rounded-xl border border-slate-200 px-3 text-sm" />
          <button onClick={load} className="h-10 rounded-xl bg-blue-600 px-4 text-sm font-bold text-white hover:bg-blue-700">Aplicar</button>
        </div>
      </div>

      <div className={`space-y-6 ${loading ? "opacity-60" : ""}`}>
        <div className="grid gap-4 md:grid-cols-4">
          <Metric label="Vehículos registrados" value={resumen.total_vehiculos || 0} />
          <Metric label="Disponibles" value={resumen.vehiculos_disponibles || 0} />
          <Metric label="Asignados" value={resumen.vehiculos_asignados || 0} />
          <Metric label="En mantenimiento" value={resumen.vehiculos_en_mantenimiento || 0} />
          <Metric label="Preventivos" value={resumen.mantenimientos_preventivos || 0} />
          <Metric label="Correctivos" value={resumen.mantenimientos_correctivos || 0} />
          <Metric label="Costo mantenimientos" value={money(resumen.costo_total_mantenimientos)} />
          <Metric label="Costo total" value={money(resumen.gasto_total_general)} />
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="font-black text-slate-900">Mantenimientos por tipo</h2>
            <div className="mt-5 space-y-4">
              {tipoRows.length === 0 ? <p className="text-sm text-slate-400">Sin mantenimientos registrados.</p> : tipoRows.map((item) => (
                <div key={item.tipo}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="font-bold capitalize text-slate-700">{item.tipo}</span>
                    <span className="font-bold text-blue-700">{item.total}</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100">
                    <div className="h-2 rounded-full bg-blue-600" style={{ width: `${item.percent}%` }} />
                  </div>
                  <p className="mt-1 text-xs text-slate-400">{money(item.costo_total)}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
            <h2 className="font-black text-slate-900">Costo por vehículo</h2>
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-[760px] w-full text-left text-sm">
                <thead className="border-b border-slate-100 text-xs uppercase text-slate-400">
                  <tr>
                    <th className="py-3">Vehículo</th>
                    <th className="py-3">Estatus</th>
                    <th className="py-3">Últ. mantenimiento</th>
                    <th className="py-3">Últ. km</th>
                    <th className="py-3 text-right">Mantenimientos</th>
                    <th className="py-3 text-right">Gastos extra</th>
                    <th className="py-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {(data.costo_por_vehiculo || []).map((row) => (
                    <tr key={row.vehiculo_id}>
                      <td className="py-3 font-bold text-slate-800">{row.nombre}</td>
                      <td className="py-3 text-slate-500">{row.estado || "-"}</td>
                      <td className="py-3 text-slate-500">{row.ultimo_mantenimiento || "-"}</td>
                      <td className="py-3 font-mono text-xs">{Number(row.ultimo_kilometraje_registrado || 0).toLocaleString("es-MX")} km</td>
                      <td className="py-3 text-right">{money(row.costo_mantenimientos)}</td>
                      <td className="py-3 text-right">{money(row.costo_gastos_extra)}</td>
                      <td className="py-3 text-right font-black text-slate-900">{money(row.costo_total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-bold text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-black text-slate-900">{value}</p>
    </div>
  );
}
