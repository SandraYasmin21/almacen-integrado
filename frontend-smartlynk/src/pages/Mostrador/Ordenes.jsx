import { useNavigate } from "react-router-dom";
import { ArrowLeft, FileText, Plus } from "lucide-react";
import { DataTableShell, PremiumCard, dataTableClass } from "../../components/ui/premium";

export default function OrdenesMostrador() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6 px-6 py-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Órdenes de Mostrador</h1>
          <p className="mt-1 text-sm text-slate-500">Seguimiento de órdenes y solicitudes pendientes.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => navigate("/mostrador")}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-100 transition hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-md"
          >
            <Plus className="h-4 w-4" />
            Nueva orden
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <PremiumCard className="p-5">
          <p className="text-sm font-semibold text-slate-500">Pendientes</p>
          <p className="mt-2 text-3xl font-extrabold text-slate-900">0</p>
        </PremiumCard>
        <PremiumCard className="p-5">
          <p className="text-sm font-semibold text-slate-500">En proceso</p>
          <p className="mt-2 text-3xl font-extrabold text-slate-900">0</p>
        </PremiumCard>
        <PremiumCard className="p-5">
          <p className="text-sm font-semibold text-slate-500">Completadas</p>
          <p className="mt-2 text-3xl font-extrabold text-slate-900">0</p>
        </PremiumCard>
      </div>

      <DataTableShell>
        <table className={dataTableClass()}>
          <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="w-[18%] px-5 py-4">Folio</th>
              <th className="w-[26%] px-5 py-4">Proyecto</th>
              <th className="w-[18%] px-5 py-4">Estado</th>
              <th className="w-[18%] px-5 py-4">Artículos</th>
              <th className="w-[20%] px-5 py-4">Actualización</th>
            </tr>
          </thead>
        </table>
        <div className="flex min-h-48 flex-col items-center justify-center gap-2 border-t border-slate-100 px-6 py-10 text-center text-slate-500">
          <FileText className="h-10 w-10 text-slate-300" />
          <p className="font-semibold">Sin órdenes registradas</p>
        </div>
      </DataTableShell>
    </div>
  );
}
