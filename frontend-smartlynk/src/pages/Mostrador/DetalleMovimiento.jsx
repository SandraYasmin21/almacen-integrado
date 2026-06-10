import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, FileText } from "lucide-react";
import { DataTableShell, PremiumCard } from "../../components/ui/premium";

export default function DetalleMovimientoMostrador() {
  const navigate = useNavigate();
  const { id } = useParams();

  return (
    <div className="space-y-6 px-6 py-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Detalle de Movimiento</h1>
          <p className="mt-1 text-sm text-slate-500">Movimiento #{id}</p>
        </div>
        <button
          type="button"
          onClick={() => navigate("/mostrador/historial")}
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver al historial
        </button>
      </div>

      <PremiumCard className="p-6">
        <div className="flex min-h-48 flex-col items-center justify-center gap-2 text-center text-slate-500">
          <FileText className="h-10 w-10 text-slate-300" />
          <p className="font-semibold">Detalle no disponible todavía</p>
          <p className="max-w-md text-sm">
            La ruta ya está conectada para que la navegación no se rompa. El detalle completo puede enlazarse al endpoint de movimientos.
          </p>
        </div>
      </PremiumCard>
    </div>
  );
}
