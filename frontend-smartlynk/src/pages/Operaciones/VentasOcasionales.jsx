import { useState } from "react";
import { toast } from "sonner";
import { CurrencyDollarIcon, ShoppingBagIcon } from "@heroicons/react/24/outline";

export default function VentasOcasionales() {
  const [loading, setLoading] = useState(false);

  return (
    <div className="mx-auto max-w-5xl p-4 sm:p-6 lg:p-8">
      <div className="mb-8">
        <div className="mb-2 flex items-center gap-2 text-sm font-medium text-emerald-600">
          <CurrencyDollarIcon className="h-5 w-5" />
          <span>Módulo Administrativo</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Ventas Ocasionales (Liquidación)</h1>
        <p className="mt-2 text-sm text-slate-500">
          Registra la salida definitiva de artículos vendidos. Se descontarán permanentemente del inventario.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-1 space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <ShoppingBagIcon className="h-5 w-5 text-emerald-500" />
              Nueva Venta
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Buscar Artículo (SKU/Nombre)</label>
                <input type="text" className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-emerald-500" placeholder="Ej. Taladro Makita" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Cantidad</label>
                <input type="number" min="1" defaultValue="1" className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-emerald-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Precio Final de Venta</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">$</span>
                  <input type="number" min="0" step="0.01" className="w-full rounded-xl border border-slate-300 pl-7 pr-3 py-2 text-sm focus:border-emerald-500 focus:ring-emerald-500" placeholder="0.00" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Cliente / Comprador (Opcional)</label>
                <input type="text" className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-emerald-500" placeholder="Nombre de la persona o empresa" />
              </div>
              <button
                className="mt-4 w-full rounded-xl bg-emerald-600 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:ring-offset-2 transition-colors"
                onClick={() => toast.success("Venta registrada. El artículo ha salido del inventario.")}
              >
                Confirmar Venta y Descontar
              </button>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
              <h3 className="font-semibold text-slate-800">Historial de Ventas</h3>
            </div>
            <div className="p-6 text-center text-slate-500 text-sm">
              No hay ventas registradas recientemente.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
