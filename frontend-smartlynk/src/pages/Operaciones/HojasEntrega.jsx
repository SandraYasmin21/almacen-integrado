import { useState } from "react";
import { toast } from "sonner";
import { TruckIcon, DocumentArrowDownIcon } from "@heroicons/react/24/outline";

export default function HojasEntrega() {
  const [loading, setLoading] = useState(false);

  return (
    <div className="mx-auto max-w-5xl p-4 sm:p-6 lg:p-8">
      <div className="mb-8">
        <div className="mb-2 flex items-center gap-2 text-sm font-medium text-blue-600">
          <TruckIcon className="h-5 w-5" />
          <span>Control Logístico</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Hojas de Entrega a Externos</h1>
        <p className="mt-2 text-sm text-slate-500">
          Registra salidas de mercancía entregada a personal externo (contratistas, paqueterías, clientes) y genera el acuse en PDF.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="p-6">
          <form className="space-y-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nombre de quien recibe</label>
                <input type="text" className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500" placeholder="Juan Pérez" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Empresa / Razón Social</label>
                <input type="text" className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500" placeholder="Transportes XYZ S.A. de C.V." />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Motivo de Entrega</label>
                <input type="text" className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500" placeholder="Entrega de refacciones para proyecto Centro" />
              </div>
            </div>

            <hr className="border-slate-200" />

            <div>
              <h4 className="text-sm font-medium text-slate-700 mb-4">Artículos a entregar</h4>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm text-slate-500 text-center">Utiliza el escáner o busca el artículo para añadirlo a la lista de entrega.</p>
                <div className="mt-4 flex gap-2">
                  <input type="text" className="flex-1 rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500" placeholder="Buscar por código..." />
                  <button type="button" className="rounded-xl bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700">Agregar</button>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 transition-colors"
                onClick={() => toast.success("Hoja de entrega registrada. El PDF se descargará automáticamente.")}
              >
                <DocumentArrowDownIcon className="h-5 w-5" />
                Guardar y Generar PDF
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
