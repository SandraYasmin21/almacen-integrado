import { CheckSquare, PackageCheck, ShoppingBag } from "lucide-react";
import { DataTableShell, PremiumCard, dataTableClass } from "../../components/ui/premium";

export default function DespachoVentas() {
  return (
    <div className="space-y-6 px-6 py-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">

        <button className="rounded-full bg-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-100 transition hover:-translate-y-0.5 hover:bg-blue-700">
          Actualizar bandeja
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {["Pendientes", "En surtido", "Despachadas hoy"].map((label, index) => (
          <PremiumCard key={label} className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-500">{label}</p>
                <p className="mt-2 text-3xl font-extrabold text-slate-900">0</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-3 text-blue-600">
                {index === 0 ? <ShoppingBag className="h-5 w-5" /> : index === 1 ? <CheckSquare className="h-5 w-5" /> : <PackageCheck className="h-5 w-5" />}
              </div>
            </div>
          </PremiumCard>
        ))}
      </div>

      <DataTableShell>
        <table className={dataTableClass()}>
          <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="w-[16%] px-5 py-4">Folio</th>
              <th className="w-[26%] px-5 py-4">Cliente</th>
              <th className="w-[22%] px-5 py-4">Checklist</th>
              <th className="w-[18%] px-5 py-4">Estado</th>
              <th className="w-[18%] px-5 py-4 text-right">Acción</th>
            </tr>
          </thead>
        </table>
        <div className="flex min-h-48 items-center justify-center border-t border-slate-100 px-6 py-10 text-sm font-semibold text-slate-500">
          Sin ventas pendientes de despacho
        </div>
      </DataTableShell>
    </div>
  );
}
