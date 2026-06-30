import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import {
  ArchiveBoxIcon,
  ExclamationTriangleIcon,
  CubeIcon,
  ArrowsRightLeftIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon
} from "@heroicons/react/24/outline";

const API = import.meta.env.VITE_API_URL ?? "";
const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("smartlynk_token") ?? ""}`,
});

export default function AlmacenDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    try {
      const response = await fetch(`${API}/api/almacen/dashboard`, {
        headers: authHeaders(),
      });
      const payload = await response.json();
      if (payload.success) {
        setStats(payload.data);
      } else {
        toast.error("Error al cargar las estadísticas");
      }
    } catch (error) {
      toast.error("Error de conexión al servidor");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div className="p-8 text-center text-slate-500 font-bold">Cargando métricas del almacén...</div>;
  }

  if (!stats) return null;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      
      {/* ENCABEZADO */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Dashboard de Almacén</h1>
          <p className="text-sm text-slate-500 mt-1">Resumen general del inventario y alertas en tiempo real.</p>
        </div>
        <div className="flex gap-3">
          <Link to="/activos/recepcion" className="px-4 py-2 bg-emerald-100 text-emerald-700 font-bold rounded-xl text-sm hover:bg-emerald-200 transition">
            + Registrar Entrada
          </Link>
          <button onClick={loadDashboard} className="px-4 py-2 border border-slate-200 text-slate-600 font-bold rounded-xl text-sm hover:bg-slate-50 transition">
            Actualizar
          </button>
        </div>
      </div>

      {/* TARJETAS DE KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard 
          title="Artículos en Catálogo" 
          value={stats.kpis.total_catalogo} 
          icon={<ArchiveBoxIcon className="w-6 h-6 text-blue-600" />} 
          color="bg-blue-50" 
        />
        <KpiCard 
          title="Unidades Físicas Totales" 
          value={Number(stats.kpis.total_fisico).toLocaleString()} 
          subtitle={`${stats.kpis.total_consumibles} consumibles · ${stats.kpis.total_series} con serie`}
          icon={<CubeIcon className="w-6 h-6 text-indigo-600" />} 
          color="bg-indigo-50" 
        />
        <KpiCard 
          title="Alertas de Stock" 
          value={stats.kpis.total_alertas} 
          subtitle="Artículos por debajo del mínimo"
          icon={<ExclamationTriangleIcon className="w-6 h-6 text-rose-600" />} 
          color="bg-rose-50" 
          textColor="text-rose-700"
        />
        <KpiCard 
          title="Movimientos Hoy" 
          value={stats.movimientos_recientes.length} 
          icon={<ArrowsRightLeftIcon className="w-6 h-6 text-emerald-600" />} 
          color="bg-emerald-50" 
        />
      </div>

      {/* SECCIÓN MEDIA: Alertas y Categorías */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Panel Izquierdo: Artículos Críticos */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
          <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <ExclamationTriangleIcon className="w-5 h-5 text-rose-500" />
            Stock Crítico o Bajo
          </h2>
          {stats.bajo_stock.length === 0 ? (
            <div className="text-center p-6 bg-emerald-50 rounded-2xl border border-emerald-100">
              <span className="text-emerald-700 font-bold text-sm">¡Todo en orden! No hay alertas de stock.</span>
            </div>
          ) : (
            <div className="space-y-3">
              {stats.bajo_stock.map((item) => (
                <div key={item.id} className="flex justify-between items-center p-4 rounded-2xl bg-rose-50/50 border border-rose-100">
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm">{item.nombre}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Stock Mínimo Requerido: {item.stock_minimo}</p>
                  </div>
                  <div className="text-right">
                    <span className="block text-lg font-extrabold text-rose-600">{item.stock_actual}</span>
                    <span className="text-[10px] font-bold text-rose-400 uppercase">{item.unidad_medida}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Panel Derecho: Categorías */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
          <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <ArchiveBoxIcon className="w-5 h-5 text-blue-500" />
            Distribución del Catálogo
          </h2>
          <div className="space-y-4 mt-6">
            {stats.categorias.map((cat, idx) => {
              // Calculamos el porcentaje para la barra visual (basado en el total del catálogo)
              const percent = Math.round((cat.total_articulos / stats.kpis.total_catalogo) * 100);
              return (
                <div key={idx}>
                  <div className="flex justify-between text-sm font-semibold text-slate-700 mb-1">
                    <span>{cat.nombre}</span>
                    <span>{cat.total_articulos} arts. ({percent}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                    <div className="bg-blue-500 h-2.5 rounded-full" style={{ width: `${percent}%` }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* SECCIÓN INFERIOR: Últimos movimientos */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
        <h2 className="text-lg font-bold text-slate-800 mb-4">Últimos Movimientos Registrados</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-slate-500 border-b border-slate-100">
              <tr>
                <th className="pb-3 font-semibold">Tipo</th>
                <th className="pb-3 font-semibold">Fecha y Hora</th>
                <th className="pb-3 font-semibold">Usuario</th>
                <th className="pb-3 font-semibold">Notas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {stats.movimientos_recientes.map((mov) => {
                const isEntrada = mov.tipo.toLowerCase() === 'entrada' || mov.tipo.toLowerCase() === 'devolucion';
                return (
                  <tr key={mov.id} className="hover:bg-slate-50 transition">
                    <td className="py-3">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold uppercase ${isEntrada ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                        {isEntrada ? <ArrowTrendingUpIcon className="w-3 h-3" /> : <ArrowTrendingDownIcon className="w-3 h-3" />}
                        {mov.tipo}
                      </span>
                    </td>
                    <td className="py-3 font-mono text-slate-600">{new Date(mov.fecha_hora).toLocaleString()}</td>
                    <td className="py-3 font-semibold text-slate-800">{mov.usuario || "Sistema"}</td>
                    <td className="py-3 text-slate-500 truncate max-w-xs">{mov.notas || "-"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}

// Componente Tarjeta KPI
function KpiCard({ title, value, subtitle, icon, color, textColor = "text-slate-900" }) {
  return (
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 flex items-center gap-4">
      <div className={`p-4 rounded-2xl ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-sm font-bold text-slate-500">{title}</p>
        <p className={`text-2xl font-extrabold ${textColor}`}>{value}</p>
        {subtitle && <p className="text-xs font-semibold text-slate-400 mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
}
