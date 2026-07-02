import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ClockIcon, ExclamationTriangleIcon } from "@heroicons/react/24/solid";
import StatusBadge from "../../components/StatusBadge";

const API = import.meta.env.VITE_API_URL ?? "";
const authHeaders = () => ({
  Accept: "application/json",
  Authorization: `Bearer ${localStorage.getItem("smartlynk_token") ?? ""}`,
});

function fmtKm(value) {
  if (value === null || value === undefined) return "-";
  return `${Number(value || 0).toLocaleString("es-MX")} km`;
}

function fmtDate(value) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("es-MX");
}

export default function Kilometraje() {
  const [vehiculos, setVehiculos] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API}/api/flotilla/kilometraje`, { headers: authHeaders() });
      if (!response.ok) throw new Error("No se pudo cargar el control de kilometraje.");
      const data = await response.json();
      setVehiculos(data.vehiculos || []);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const mantenimientoRequerido = vehiculos.filter((vehiculo) => vehiculo.requiere_mantenimiento).length;
  const sinHistorial = vehiculos.filter((vehiculo) => vehiculo.revisar_kilometraje).length;

  const exportar = async (format) => {
    try {
      const response = await fetch(`${API}/api/exportar/kilometraje/${format}`, { headers: authHeaders() });
      if (!response.ok) throw new Error("No se pudo generar el reporte.");
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `kilometraje_vehiculos.${format === "excel" ? "xlsx" : "pdf"}`;
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
          <h1 className="text-2xl font-black text-slate-900">Kilometraje por vehículo</h1>
          <p className="mt-1 text-sm text-slate-500">Últimas lecturas, mantenimientos y alertas preventivas.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => exportar("pdf")} className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-bold text-white">PDF</button>
          <button onClick={() => exportar("excel")} className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white">Excel</button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="flex items-center gap-4 rounded-xl border-l-4 border-rose-500 bg-white p-4 shadow-sm">
          <div className="rounded-full bg-rose-100 p-3 text-rose-600">
            <ExclamationTriangleIcon className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800">Atención inmediata</h3>
            <p className="text-sm text-slate-500"><span className="font-semibold text-rose-600">{mantenimientoRequerido} vehículos</span> superaron su límite de mantenimiento.</p>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-xl border-l-4 border-amber-500 bg-white p-4 shadow-sm">
          <div className="rounded-full bg-amber-100 p-3 text-amber-600">
            <ClockIcon className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800">Revisión preventiva</h3>
            <p className="text-sm text-slate-500"><span className="font-semibold text-amber-600">{sinHistorial} vehículos</span> no tienen mantenimiento preventivo registrado.</p>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-[1100px] w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Vehículo</th>
                <th className="px-4 py-3 text-center">Max KM</th>
                <th className="px-4 py-3 text-center">Últ. correctivo</th>
                <th className="px-4 py-3 text-center">KM correctivo</th>
                <th className="px-4 py-3 text-center">Últ. preventivo</th>
                <th className="px-4 py-3 text-center">KM preventivo</th>
                <th className="px-4 py-3 text-center">KM bitácora</th>
                <th className="px-4 py-3 text-center">Próx. mant.</th>
                <th className="px-4 py-3 text-center">Req.</th>
                <th className="px-4 py-3 text-center">Revisar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={10} className="px-4 py-10 text-center text-slate-400">Cargando kilometraje...</td></tr>
              ) : vehiculos.length === 0 ? (
                <tr><td colSpan={10} className="px-4 py-10 text-center text-slate-400">Sin vehículos para mostrar.</td></tr>
              ) : vehiculos.map((vehiculo) => (
                <tr key={vehiculo.vehiculo_id} className={vehiculo.requiere_mantenimiento ? "bg-rose-50/30" : vehiculo.revisar_kilometraje ? "bg-amber-50/30" : "hover:bg-slate-50"}>
                  <td className="px-4 py-4">
                    <p className="font-bold text-slate-900">{vehiculo.nombre}</p>
                    <p className="text-xs text-slate-400">{vehiculo.placa || vehiculo.numero || "-"}</p>
                  </td>
                  <td className="px-4 py-4 text-center font-mono text-xs font-bold">{fmtKm(vehiculo.max_kilometraje)}</td>
                  <td className="px-4 py-4 text-center">{fmtDate(vehiculo.km_ultimo_correctivo?.fecha)}</td>
                  <td className="px-4 py-4 text-center font-mono text-xs">{fmtKm(vehiculo.km_ultimo_correctivo?.km)}</td>
                  <td className="px-4 py-4 text-center">{fmtDate(vehiculo.km_ultimo_preventivo?.fecha)}</td>
                  <td className="px-4 py-4 text-center font-mono text-xs">{fmtKm(vehiculo.km_ultimo_preventivo?.km)}</td>
                  <td className="px-4 py-4 text-center font-mono text-xs font-bold text-blue-600">{fmtKm(vehiculo.total_km_bitacora)}</td>
                  <td className="px-4 py-4 text-center font-mono text-xs">{fmtKm(vehiculo.proximo_mantenimiento_km)}</td>
                  <td className="px-4 py-4 text-center"><StatusBadge status={vehiculo.requiere_mantenimiento ? "Requerido" : "OK"} size="compact" /></td>
                  <td className="px-4 py-4 text-center"><StatusBadge status={vehiculo.revisar_kilometraje ? "Revisar" : "OK"} size="compact" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
