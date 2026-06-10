import { FileSignature, Search, ShieldCheck } from "lucide-react";
import { DataTableShell, ExportButtons, PremiumCard, dataTableClass } from "../../components/ui/premium";

export default function ResguardosPrestamos() {
  return (
    <div className="space-y-6 px-6 py-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">

        <ExportButtons onPdf={() => {}} onExcel={() => {}} pdfLabel="Ticket PDF" excelLabel="Exportar Excel" />
      </div>

      <div className="grid gap-4 xl:grid-cols-[420px_1fr]">
        <PremiumCard className="p-6" interactive={false}>
          <div className="mb-5 flex items-center gap-3">
            <div className="rounded-2xl bg-blue-50 p-3 text-blue-700">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-slate-900">Nuevo resguardo</h2>
              <p className="text-sm text-slate-500">Busca empleado y acumula SKUs.</p>
            </div>
          </div>
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm outline-none focus:ring-4 focus:ring-blue-100" placeholder="Buscar empleado activo..." />
            </div>
            <input className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:ring-4 focus:ring-blue-100" placeholder="Escanear SKU a entregar..." autoComplete="off" />
            <button className="w-full rounded-full bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-blue-100 transition hover:-translate-y-0.5 hover:bg-blue-700">
              Confirmar préstamo
            </button>
          </div>
        </PremiumCard>

        <DataTableShell>
          <table className={dataTableClass()}>
            <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="w-[28%] px-5 py-4">Empleado</th>
                <th className="w-[22%] px-5 py-4">Artículo</th>
                <th className="w-[20%] px-5 py-4">SKU</th>
                <th className="w-[18%] px-5 py-4">Fecha</th>
                <th className="w-[12%] px-5 py-4 text-right">Ticket</th>
              </tr>
            </thead>
          </table>
          <div className="flex min-h-48 flex-col items-center justify-center gap-2 border-t border-slate-100 px-6 py-10 text-center text-slate-500">
            <FileSignature className="h-10 w-10 text-slate-300" />
            <p className="font-semibold">Sin SKUs agregados al resguardo</p>
          </div>
        </DataTableShell>
      </div>
    </div>
  );
}
