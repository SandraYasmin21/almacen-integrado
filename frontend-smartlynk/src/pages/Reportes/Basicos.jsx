import { useEffect, useState } from "react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/auth";
import { ArrowDownTrayIcon, DocumentTextIcon } from "@heroicons/react/24/outline";

const labels = {
  "activos-registrados": "Activos registrados",
  "activos-estado": "Activos por estado",
  "activos-ubicacion": "Activos por ubicacion",
  "activos-responsable": "Activos por responsable",
  "activos-proyecto": "Activos por proyecto",
  "materiales-consumibles": "Materiales / consumibles",
  vehiculos: "Vehiculos",
  movimientos: "Movimientos",
  "activos-categoria": "Activos por categoria",
};

export default function ReportesBasicos() {
  const [tipo, setTipo] = useState("activos-registrados");
  const [rows, setRows] = useState([]);
  const [columns, setColumns] = useState([]);
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");

  const load = async (selected = tipo) => {
    try {
      const params = new URLSearchParams();
      if (selected === "movimientos") {
        if (fechaDesde) params.append("fecha_desde", fechaDesde);
        if (fechaHasta) params.append("fecha_hasta", fechaHasta);
      }
      const response = await apiFetch(`/api/reportes/basicos/${selected}?${params.toString()}`);
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message || "No se pudo cargar reporte");
      const data = payload.data?.data || payload.data || [];
      const normalized = Array.isArray(data) ? data : [];
      setRows(normalized);
      setColumns(Object.keys(normalized[0] || {}));
    } catch (error) {
      toast.error(error.message || "No se pudo cargar reporte");
      setRows([]);
      setColumns([]);
    }
  };

  useEffect(() => {
    load(tipo);
  }, [tipo, fechaDesde, fechaHasta]);

  const handleExport = async (format) => {
    try {
      const params = new URLSearchParams({ format });
      if (tipo === "movimientos") {
        if (fechaDesde) params.append("fecha_desde", fechaDesde);
        if (fechaHasta) params.append("fecha_hasta", fechaHasta);
      }
      
      const response = await apiFetch(`/api/reportes/basicos/${tipo}/export?${params.toString()}`);
      if (!response.ok) throw new Error("No se pudo exportar el reporte");
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `reporte-${tipo}-${new Date().toISOString().split('T')[0]}.${format === 'excel' ? 'xlsx' : 'pdf'}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (error) {
      toast.error(error.message || "Error al exportar");
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900">Reportes Básicos</h1>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {tipo === "movimientos" && (
            <div className="flex gap-2">
              <input type="date" className="h-11 rounded-xl border border-slate-200 px-3 text-sm" value={fechaDesde} onChange={(e) => setFechaDesde(e.target.value)} title="Fecha Desde" />
              <input type="date" className="h-11 rounded-xl border border-slate-200 px-3 text-sm" value={fechaHasta} onChange={(e) => setFechaHasta(e.target.value)} title="Fecha Hasta" />
            </div>
          )}
          <select className="h-11 rounded-xl border border-slate-200 px-3 text-sm" value={tipo} onChange={(e) => setTipo(e.target.value)}>
            {Object.entries(labels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
          </select>
          <button onClick={() => handleExport('excel')} className="inline-flex h-11 items-center gap-2 rounded-xl bg-green-600 px-4 text-sm font-semibold text-white shadow-sm hover:bg-green-500 transition-colors">
            <ArrowDownTrayIcon className="w-5 h-5" />
            Excel
          </button>
          <button onClick={() => handleExport('pdf')} className="inline-flex h-11 items-center gap-2 rounded-xl bg-red-600 px-4 text-sm font-semibold text-white shadow-sm hover:bg-red-500 transition-colors">
            <DocumentTextIcon className="w-5 h-5" />
            PDF
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-slate-50 text-xs font-bold uppercase text-slate-500">
              <tr>
                {columns.map((column) => <th key={column} className="px-4 py-3">{column}</th>)}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.length === 0 ? (
                <tr><td className="px-4 py-10 text-center text-slate-400" colSpan={Math.max(columns.length, 1)}>Sin datos</td></tr>
              ) : rows.map((row, index) => (
                <tr key={index}>
                  {columns.map((column) => (
                    <td key={column} className="px-4 py-3 text-slate-700">{String(row[column] ?? "-")}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
