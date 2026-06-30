import { useEffect, useState } from "react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/auth";
import { TruckIcon, WrenchScrewdriverIcon, CurrencyDollarIcon, DocumentTextIcon } from "@heroicons/react/24/outline";

export default function ReportesVehiculares() {
  const [data, setData] = useState({ catalogo: [], mantenimientos_por_tipo: [], totales: {} });
  const [loading, setLoading] = useState(true);
  const [selectedVehiculo, setSelectedVehiculo] = useState(null);
  const [historial, setHistorial] = useState({ mantenimientos: [], gastos_extra: [], viajes: [] });
  const [loadingHistorial, setLoadingHistorial] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const response = await apiFetch("/api/reportes/vehiculos");
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message || "Error al cargar reporte");
      setData(payload);
    } catch (error) {
      toast.error(error.message || "Error al cargar reporte");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const loadHistorial = async (id) => {
    setLoadingHistorial(true);
    try {
      const response = await apiFetch(`/api/reportes/vehiculos/${id}/historial`);
      const payload = await response.json();
      if (!response.ok) throw new Error("Error al cargar historial");
      setHistorial(payload);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoadingHistorial(false);
    }
  };

  const handleSelectVehiculo = (vehiculo) => {
    setSelectedVehiculo(vehiculo);
    loadHistorial(vehiculo.id);
  };

  return (
    <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Reportes Vehiculares</h1>
          <p className="text-sm text-slate-500">Resumen de costos, mantenimientos y catálogo</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center gap-3 text-slate-500 mb-2"><TruckIcon className="w-5 h-5 text-blue-500" /> Vehículos Totales</div>
          <p className="text-2xl font-bold">{data.totales?.vehiculos || 0}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center gap-3 text-slate-500 mb-2"><CurrencyDollarIcon className="w-5 h-5 text-red-500" /> Costo Total</div>
          <p className="text-2xl font-bold">${parseFloat(data.totales?.costo_total || 0).toFixed(2)}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center gap-3 text-slate-500 mb-2"><WrenchScrewdriverIcon className="w-5 h-5 text-amber-500" /> Mantenimientos</div>
          <p className="text-2xl font-bold">${parseFloat(data.totales?.costo_mantenimientos || 0).toFixed(2)}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center gap-3 text-slate-500 mb-2"><DocumentTextIcon className="w-5 h-5 text-emerald-500" /> Gastos Extra</div>
          <p className="text-2xl font-bold">${parseFloat(data.totales?.costo_gastos_extra || 0).toFixed(2)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="p-4 border-b border-slate-100 bg-slate-50">
            <h2 className="font-bold text-slate-800">Catálogo de Vehículos</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs font-bold uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Vehículo</th>
                  <th className="px-4 py-3">Placas / Estado</th>
                  <th className="px-4 py-3 text-right">Mantenimientos</th>
                  <th className="px-4 py-3 text-right">Gastos Extra</th>
                  <th className="px-4 py-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.catalogo.map((v) => (
                  <tr key={v.id} onClick={() => handleSelectVehiculo(v)} className={`cursor-pointer transition-colors ${selectedVehiculo?.id === v.id ? 'bg-blue-50/50' : 'hover:bg-slate-50'}`}>
                    <td className="px-4 py-3 font-semibold text-blue-600">{v.nombre}</td>
                    <td className="px-4 py-3">
                      <div>{v.placa}</div>
                      <div className="text-xs text-slate-500">{v.estado}</div>
                    </td>
                    <td className="px-4 py-3 text-right text-slate-600">${parseFloat(v.costo_mantenimientos).toFixed(2)}</td>
                    <td className="px-4 py-3 text-right text-slate-600">${parseFloat(v.costo_gastos_extra).toFixed(2)}</td>
                    <td className="px-4 py-3 text-right font-bold text-slate-900">${parseFloat(v.costo_total).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 overflow-hidden flex flex-col h-full max-h-[600px]">
          <h2 className="font-bold text-slate-800 mb-4">
            Historial {selectedVehiculo ? `- ${selectedVehiculo.nombre}` : "(Selecciona un vehículo)"}
          </h2>
          
          {selectedVehiculo ? (
            loadingHistorial ? (
              <div className="text-slate-500 text-center py-10">Cargando...</div>
            ) : (
              <div className="overflow-y-auto pr-2 space-y-6 flex-1">
                {historial.mantenimientos.length > 0 && (
                  <div>
                    <h3 className="text-xs font-bold uppercase text-slate-400 mb-2">Mantenimientos</h3>
                    <div className="space-y-2">
                      {historial.mantenimientos.map(m => (
                        <div key={m.id} className="text-sm p-3 rounded-lg border border-slate-100 bg-slate-50">
                          <div className="flex justify-between font-semibold"><span>{m.tipo_mantenimiento}</span> <span>${m.costo}</span></div>
                          <div className="text-xs text-slate-500 mt-1">{m.fecha} - Taller: {m.taller}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {historial.gastos_extra.length > 0 && (
                  <div>
                    <h3 className="text-xs font-bold uppercase text-slate-400 mb-2">Gastos Extra</h3>
                    <div className="space-y-2">
                      {historial.gastos_extra.map(g => (
                        <div key={g.id} className="text-sm p-3 rounded-lg border border-slate-100 bg-slate-50">
                          <div className="flex justify-between font-semibold"><span>{g.concepto}</span> <span>${g.costo}</span></div>
                          <div className="text-xs text-slate-500 mt-1">{g.fecha}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {historial.mantenimientos.length === 0 && historial.gastos_extra.length === 0 && (
                  <div className="text-slate-400 text-center py-4 text-sm">Sin historial de gastos.</div>
                )}
              </div>
            )
          ) : (
            <div className="text-slate-400 text-center py-10 text-sm flex-1 flex items-center justify-center">
              Haz clic en un vehículo para ver su historial
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
