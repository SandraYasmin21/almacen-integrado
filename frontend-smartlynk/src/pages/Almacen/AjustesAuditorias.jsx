import { ClipboardCheck, Minus, Plus, ShieldCheck } from "lucide-react";
import { DataTableShell, PremiumCard, dataTableClass } from "../../components/ui/premium";

export default function AjustesAuditorias() {
  return (
    <div className="space-y-6 px-6 py-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">Ajustes y Auditorías</h1>
        <p className="mt-1 text-sm text-slate-500">Corrección controlada de stock, mermas y hallazgos de inventario físico.</p>
      </div>

      <div className="grid gap-4 xl:grid-cols-[420px_1fr]">
        <PremiumCard className="p-6" interactive={false}>
          <div className="mb-5 flex items-center gap-3">
            <div className="rounded-2xl bg-blue-50 p-3 text-blue-700">
              <ClipboardCheck className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-slate-900">Nuevo ajuste</h2>
              <p className="text-sm text-slate-500">Requiere justificación obligatoria.</p>
            </div>
          </div>

          <div className="space-y-4">
            <input className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:ring-4 focus:ring-blue-100" placeholder="Buscar artículo o SKU..." />
            <div className="flex flex-col gap-3 sm:grid sm:grid-cols-2">
              <button className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
                <Plus className="h-4 w-4" />
                Sumar
              </button>
              <button className="inline-flex items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">
                <Minus className="h-4 w-4" />
                Restar
              </button>
            </div>
            <input type="number" min="1" className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:ring-4 focus:ring-blue-100" placeholder="Cantidad" />
            <textarea className="min-h-28 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:ring-4 focus:ring-blue-100" placeholder="Motivo detallado del ajuste..." />
            <button className="w-full rounded-full bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-blue-100 transition hover:-translate-y-0.5 hover:bg-blue-700">
              Registrar ajuste
            </button>
          </div>
        </PremiumCard>

        <div className="space-y-4">
          <PremiumCard className="p-5">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-slate-50 p-3 text-blue-700">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-500">Auditoría inalterable</p>
                <p className="text-xl font-extrabold text-slate-900">Usuario, fecha y motivo quedan registrados</p>
              </div>
            </div>
          </PremiumCard>

          <DataTableShell>
            <table className={dataTableClass()}>
              <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="w-[18%] px-5 py-4">Fecha</th>
                  <th className="w-[24%] px-5 py-4">Artículo</th>
                  <th className="w-[12%] px-5 py-4">Tipo</th>
                  <th className="w-[12%] px-5 py-4">Cantidad</th>
                  <th className="w-[20%] px-5 py-4">Usuario</th>
                  <th className="w-[14%] px-5 py-4">Motivo</th>
                </tr>
              </thead>
            </table>
            <div className="flex min-h-48 items-center justify-center border-t border-slate-100 px-6 py-10 text-sm font-semibold text-slate-500">
              Sin ajustes registrados
            </div>
          </DataTableShell>
        </div>
      </div>
    </div>
  );
}
