import { useEffect, useMemo, useState } from "react";
import { Search, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { DataTableShell, ExportButtons, dataTableClass } from "../../components/ui/premium";

const API = import.meta.env.VITE_API_URL ?? "";
const authHeaders = () => ({
  Accept: "application/json",
  Authorization: `Bearer ${localStorage.getItem("smartlynk_token") ?? ""}`,
});

export default function ResguardosPrestamos() {
  const [movimientos, setMovimientos] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadMovimientos = async () => {
      try {
        const response = await fetch(`${API}/api/almacen/movimientos?per_page=100`, { headers: authHeaders() });
        if (!response.ok) throw new Error("No se pudo cargar el historial");
        const result = await response.json();
        setMovimientos(result.data || []);
      } catch (error) {
        toast.error(error.message);
      } finally {
        setLoading(false);
      }
    };
    loadMovimientos();
  }, []);

  const rows = useMemo(() => {
    const query = search.trim().toLowerCase();
    return movimientos.filter((item) => !query || [item.empleado, item.articulo, item.sku, item.modelo]
      .some((value) => String(value || "").toLowerCase().includes(query)));
  }, [movimientos, search]);

  const download = async (format) => {
    try {
      const response = await fetch(`${API}/api/almacen/export/${format}`, { headers: authHeaders() });
      if (!response.ok) throw new Error("No se pudo generar el reporte");
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `resguardos-prestamos.${format === "excel" ? "xlsx" : "pdf"}`;
      anchor.click();
      URL.revokeObjectURL(url);
      toast.success("Reporte descargado correctamente");
    } catch (error) {
      toast.error(error.message);
    }
  };

  const movementType = (item) => {
    const text = `${item.tipo || ""} ${item.notas || ""}`.toLowerCase();
    if (text.includes("resguardo")) return "Resguardo fijo";
    if (text.includes("prestamo") || text.includes("préstamo")) return "Prestamo operativo";
    return item.tipo || "Movimiento";
  };

  return (
    <div className="space-y-6 px-6 py-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Historial de Resguardos y prestamos</h1>
        <ExportButtons onPdf={() => download("pdf")} onExcel={() => download("excel")} pdfLabel="Ticket PDF" excelLabel="Exportar Excel" />
      </div>

      <DataTableShell>
        <div className="flex items-center justify-between border-b border-slate-100 bg-white p-4">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={(event) => setSearch(event.target.value)} className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-blue-100" placeholder="Buscar por empleado o SKU..." />
          </div>
          <div className="flex items-center gap-2 rounded-md bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-700">
            <ShieldCheck className="h-4 w-4" /> Modo Auditoria
          </div>
        </div>
        <table className={dataTableClass()}>
          <thead className="bg-slate-50 text-xs font-bold uppercase text-slate-500">
            <tr>
              <th className="px-5 py-4">Empleado</th><th className="px-5 py-4">Articulo</th>
              <th className="px-5 py-4">SKU / Serie</th><th className="px-5 py-4">Fecha asignacion</th>
              <th className="px-5 py-4">Tipo</th><th className="px-5 py-4">Cantidad</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((item) => (
              <tr key={`${item.id}-${item.detalle_id}`} className="border-b border-slate-50 hover:bg-slate-50">
                <td className="px-5 py-4 font-medium text-slate-800">{item.empleado || "Sin empleado"}</td>
                <td className="px-5 py-4 text-slate-600"><div>{item.articulo}</div><div className="text-xs text-slate-400">{item.modelo}</div></td>
                <td className="px-5 py-4 font-mono text-sm text-slate-500">{item.sku || "-"}</td>
                <td className="px-5 py-4 text-sm text-slate-500">{item.fecha_hora}</td>
                <td className="px-5 py-4"><span className="rounded border border-indigo-100 bg-indigo-50 px-2 py-1 text-xs font-semibold text-indigo-700">{movementType(item)}</span></td>
                <td className="px-5 py-4 text-center text-slate-600">{Number(item.cantidad || 0).toLocaleString("es-MX")}</td>
              </tr>
            ))}
            {!loading && rows.length === 0 && <tr><td colSpan={6} className="px-5 py-10 text-center text-slate-500">No hay movimientos registrados.</td></tr>}
          </tbody>
        </table>
      </DataTableShell>
    </div>
  );
}
