import { useState, useEffect } from "react";
import { ClipboardCheck, Minus, Plus, ShieldCheck } from "lucide-react";
import { DataTableShell, PremiumCard, dataTableClass } from "../../components/ui/premium";
import { toast } from "sonner";
import { SelectPremium } from "../../components/ui/SelectPremium";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const API = import.meta.env.VITE_API_URL ?? "";

export default function AjustesAuditorias() {
  const [articulos, setArticulos] = useState([]);
  const [historial, setHistorial] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const [articuloId, setArticuloId] = useState("");
  const [operacion, setOperacion] = useState("sumar");
  const [cantidad, setCantidad] = useState("");
  const [motivo, setMotivo] = useState("");

  const authHeaders = () => ({
    "Content-Type": "application/json",
    Accept: "application/json",
    Authorization: `Bearer ${localStorage.getItem("smartlynk_token") ?? ""}`,
  });

  const loadData = async () => {
    try {
      const resArticulos = await fetch(`${API}/api/almacen/articulos`, { headers: authHeaders() });
      if (resArticulos.ok) {
        const data = await resArticulos.json();
        setArticulos(data.data || []);
      }
      
      const resMov = await fetch(`${API}/api/almacen/movimientos?tipo=ajuste`, { headers: authHeaders() });
      if (resMov.ok) {
        const data = await resMov.json();
        // Filtrar localmente si el backend no lo hace
        const ajustes = (data.data || []).filter(m => m.tipo === 'ajuste' || m.tipo_movimiento === 'ajuste');
        setHistorial(ajustes);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRegistrar = async () => {
    if (!articuloId || !cantidad || !motivo) {
      toast.error("Por favor completa todos los campos (Artículo, cantidad y motivo).");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API}/api/almacen/ajuste-fisico`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          articulo_id: Number(articuloId),
          cantidad: Number(cantidad),
          operacion,
          motivo
        })
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Error al registrar ajuste");
      
      toast.success(result.message || "Ajuste registrado exitosamente");
      setArticuloId("");
      setCantidad("");
      setMotivo("");
      setOperacion("sumar");
      await loadData();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="space-y-6 px-6 py-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">Ajustes y Auditorías</h1>
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
            <SelectPremium
                value={articuloId}
                onChange={setArticuloId}
                options={articulos.map(a => ({ value: a.id, label: `${a.nombre} (Stock: ${a.cantidad || a.stock || 0})` }))}
                placeholder="Buscar artículo..."
            />
            
            <div className="flex flex-col gap-3 sm:grid sm:grid-cols-2">
              <button 
                onClick={() => setOperacion('sumar')}
                className={`inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-bold transition ${operacion === 'sumar' ? 'bg-emerald-500 text-white border-emerald-500 shadow-lg shadow-emerald-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'}`}>
                <Plus className="h-4 w-4" />
                Sumar
              </button>
              <button 
                onClick={() => setOperacion('restar')}
                className={`inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-bold transition ${operacion === 'restar' ? 'bg-rose-500 text-white border-rose-500 shadow-lg shadow-rose-200' : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'}`}>
                <Minus className="h-4 w-4" />
                Restar
              </button>
            </div>
            <input 
              type="number" 
              min="1" 
              value={cantidad}
              onChange={(e) => setCantidad(e.target.value)}
              className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:ring-4 focus:ring-blue-100" 
              placeholder="Cantidad a ajustar..." 
            />
            <textarea 
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              className="min-h-28 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:ring-4 focus:ring-blue-100 resize-none" 
              placeholder="Motivo detallado del ajuste (obligatorio)..." 
            />
            <button 
              onClick={handleRegistrar}
              disabled={loading}
              className="w-full rounded-full bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-blue-100 transition hover:-translate-y-0.5 hover:bg-blue-700 disabled:opacity-50">
              {loading ? "Procesando..." : "Registrar ajuste"}
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
              <tbody className="divide-y divide-slate-100">
                {historial.length > 0 ? (
                  historial.map((mov) => (
                    <tr key={mov.id} className="transition hover:bg-slate-50/50">
                      <td className="px-5 py-4 whitespace-nowrap text-sm text-slate-500 font-medium">
                        {format(new Date(mov.fecha_hora), "dd MMM yyyy, HH:mm", { locale: es })}
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-900 font-semibold max-w-[200px] truncate">
                        {mov.articulo || "Varios artículos"}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700 ring-1 ring-inset ring-blue-500/20">
                          {mov.tipo || mov.tipo_movimiento}
                        </span>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-sm font-bold text-slate-900">
                        {mov.cantidad || "-"}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-sm text-slate-600">
                        {mov.usuario || "Sistema"}
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-500 max-w-[250px] truncate">
                        {mov.notas || "Sin observaciones"}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6">
                      <div className="flex min-h-48 items-center justify-center border-t border-slate-100 px-6 py-10 text-sm font-semibold text-slate-500">
                        Sin ajustes registrados
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </DataTableShell>
        </div>
      </div>
    </div>
  );
}
