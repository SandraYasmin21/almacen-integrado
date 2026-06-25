import { FileSignature, Search, ShieldCheck } from "lucide-react";
import { DataTableShell, ExportButtons, dataTableClass } from "../../components/ui/premium";

export default function ResguardosPrestamos() {
  return (
    <div className="space-y-6 px-6 py-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Historial de Resguardos y prestamos</h1>
        </div>
        <ExportButtons onPdf={() => {}} onExcel={() => {}} pdfLabel="Ticket PDF" excelLabel="Exportar Excel" />
      </div>

      <div className="grid gap-4 xl:grid-cols-1">
        <DataTableShell>
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-white">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-blue-100" placeholder="Buscar por empleado o SKU..." />
            </div>
            <div className="text-sm font-medium text-slate-500 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-md flex items-center gap-2">
              <ShieldCheck className="h-4 w-4" /> Modo Auditoría
            </div>
          </div>
          <table className={dataTableClass()}>
            <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="w-[20%] px-5 py-4">Empleado</th>
                <th className="w-[25%] px-5 py-4">Artículo</th>
                <th className="w-[15%] px-5 py-4">SKU / Serie</th>
                <th className="w-[15%] px-5 py-4">Fecha Asignación</th>
                <th className="w-[15%] px-5 py-4">Tipo</th>
                <th className="w-[10%] px-5 py-4 text-right">Firma Digital</th>
              </tr>
            </thead>
            <tbody>
              {/* Filas simuladas */}
              <tr className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                <td className="px-5 py-4 font-medium text-slate-800">Juan Pérez</td>
                <td className="px-5 py-4 text-slate-600">Laptop Dell Latitude 5420</td>
                <td className="px-5 py-4 font-mono text-sm text-slate-500">LT-5420-001</td>
                <td className="px-5 py-4 text-sm text-slate-500">10 Jun 2026 08:30</td>
                <td className="px-5 py-4">
                  <span className="bg-indigo-50 text-indigo-700 border border-indigo-100 px-2 py-1 rounded text-xs font-semibold">Resguardo Fijo</span>
                </td>
                <td className="px-5 py-4 text-right">
                  <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">Ver Firma</button>
                </td>
              </tr>
              <tr className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                <td className="px-5 py-4 font-medium text-slate-800">María Gómez</td>
                <td className="px-5 py-4 text-slate-600">Taladro Inalámbrico Makita</td>
                <td className="px-5 py-4 font-mono text-sm text-slate-500">TM-18V-105</td>
                <td className="px-5 py-4 text-sm text-slate-500">10 Jun 2026 09:15</td>
                <td className="px-5 py-4">
                  <span className="bg-amber-50 text-amber-700 border border-amber-100 px-2 py-1 rounded text-xs font-semibold">Préstamo Operativo</span>
                </td>
                <td className="px-5 py-4 text-right text-slate-400 text-sm">
                  N/A
                </td>
              </tr>
            </tbody>
          </table>
        </DataTableShell>
      </div>
    </div>
  );
}
