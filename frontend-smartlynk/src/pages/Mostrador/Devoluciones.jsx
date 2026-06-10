import { RotateCcw, ScanLine, Wrench } from "lucide-react";
import { DataTableShell, PremiumCard, dataTableClass } from "../../components/ui/premium";

export default function Devoluciones() {
  return (
    <div className="space-y-6 px-6 py-6">


      <div className="grid gap-4 xl:grid-cols-[420px_1fr]">
        <PremiumCard className="p-6" interactive={false}>
          <div className="mb-5 flex items-center gap-3">
            <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-700">
              <RotateCcw className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-slate-900">Registrar retorno</h2>
              <p className="text-sm text-slate-500">Escanea el SKU del artículo devuelto.</p>
            </div>
          </div>
          <div className="space-y-4">
            <div className="relative">
              <ScanLine className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input className="h-14 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-12 pr-4 text-lg font-semibold outline-none focus:ring-4 focus:ring-blue-100" placeholder="Escanear SKU..." autoComplete="off" />
            </div>
            <textarea className="min-h-28 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:ring-4 focus:ring-blue-100" placeholder="Notas de daño o mantenimiento preventivo..." />
            <button className="w-full rounded-full bg-emerald-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-100 transition hover:-translate-y-0.5 hover:bg-emerald-700">
              Confirmar devolución
            </button>
          </div>
        </PremiumCard>

        <div className="space-y-4">
          <PremiumCard className="p-5">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-amber-50 p-3 text-amber-700">
                <Wrench className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-500">Mantenimiento</p>
                <p className="text-xl font-extrabold text-slate-900">Registra notas si el equipo vuelve con daño</p>
              </div>
            </div>
          </PremiumCard>

          <DataTableShell>
            <table className={dataTableClass()}>
              <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="w-[22%] px-5 py-4">SKU</th>
                  <th className="w-[24%] px-5 py-4">Artículo</th>
                  <th className="w-[22%] px-5 py-4">Empleado</th>
                  <th className="w-[18%] px-5 py-4">Estado</th>
                  <th className="w-[14%] px-5 py-4">Notas</th>
                </tr>
              </thead>
            </table>
            <div className="flex min-h-48 items-center justify-center border-t border-slate-100 px-6 py-10 text-sm font-semibold text-slate-500">
              Sin devoluciones registradas
            </div>
          </DataTableShell>
        </div>
      </div>
    </div>
  );
}
