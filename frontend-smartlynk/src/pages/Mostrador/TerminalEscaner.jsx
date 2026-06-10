import { ScanLine, Zap } from "lucide-react";
import AlmacenSalida from "../Almacen/Salida";
import { PremiumCard } from "../../components/ui/premium";

export default function TerminalEscaner() {
  return (
    <div className="space-y-5">
      <PremiumCard className="p-5" interactive={false}>
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-blue-50 p-3 text-blue-700">
              <ScanLine className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900">Terminal de Escáner</h1>
              <p className="text-sm text-slate-500">Salida rápida con lector de código de barras y validación por SKU.</p>
            </div>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-700">
            <Zap className="h-4 w-4" />
            Foco automático para operación diaria
          </div>
        </div>
      </PremiumCard>

      <AlmacenSalida />
    </div>
  );
}
