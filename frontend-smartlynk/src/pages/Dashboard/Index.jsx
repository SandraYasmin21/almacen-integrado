import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Link } from "react-router-dom";
import { Metric, ProgressBar, SparkAreaChart } from "@tremor/react";
import {
  AlertTriangle,
  ArrowDownToLine,
  ArrowRightLeft,
  ArrowUpFromLine,
  CalendarDays,
  FileSpreadsheet,
  FileText,
  Package,
  RefreshCw,
  ShoppingCart,
  X,
  ArrowUpRight,
} from "lucide-react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/auth";
import { Calendar } from "@/components/ui/calendar";

const sparklineData = {
  blue: [
    { date: "Lun", value: 18 },
    { date: "Mar", value: 31 },
    { date: "Mie", value: 24 },
    { date: "Jue", value: 46 },
    { date: "Vie", value: 39 },
    { date: "Sab", value: 58 },
  ],
  amber: [
    { date: "Lun", value: 40 },
    { date: "Mar", value: 36 },
    { date: "Mie", value: 43 },
    { date: "Jue", value: 34 },
    { date: "Vie", value: 52 },
    { date: "Sab", value: 61 },
  ],
  rose: [
    { date: "Lun", value: 6 },
    { date: "Mar", value: 11 },
    { date: "Mie", value: 20 },
    { date: "Jue", value: 16 },
    { date: "Vie", value: 28 },
    { date: "Sab", value: 34 },
  ],
  orange: [
    { date: "Lun", value: 19 },
    { date: "Mar", value: 17 },
    { date: "Mie", value: 23 },
    { date: "Jue", value: 26 },
    { date: "Vie", value: 31 },
    { date: "Sab", value: 42 },
  ],
};

const movementConfig = {
  entrada: { style: "bg-emerald-100 text-emerald-700 border-emerald-200", label: "Entrada" },
  salida: { style: "bg-rose-100 text-rose-700 border-rose-200", label: "Salida" },
  prestamo: { style: "bg-amber-100 text-amber-700 border-amber-200", label: "Préstamo" },
  devolucion: { style: "bg-blue-100 text-blue-700 border-blue-200", label: "Devolución" },
};

function Panel({ children, className = "" }) {
  return (
    <section
      className={`rounded-2xl border border-slate-200/70 bg-white shadow-[0_10px_30px_-24px_rgba(15,23,42,0.45)] ${className}`}
    >
      {children}
    </section>
  );
}

function KpiCard({ label, value, sub, color, chartData }) {
  const accents = {
    blue: "from-blue-50 text-blue-700",
    amber: "from-amber-50 text-amber-700",
    rose: "from-rose-50 text-rose-700",
    orange: "from-orange-50 text-orange-700",
  };

  return (
    <Panel className="relative min-h-[190px] overflow-hidden p-5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_45px_-28px_rgba(15,23,42,0.65)]">
      <div className={`absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t ${accents[color]} to-transparent opacity-70`} />
      <div className="relative z-10 flex h-full flex-col justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</p>
          <Metric className="mt-3 text-4xl font-extrabold text-slate-900">{value ?? "0"}</Metric>
          <p className="mt-1 text-sm text-slate-400">{sub}</p>
        </div>
        <SparkAreaChart
          data={chartData}
          categories={["value"]}
          index="date"
          colors={[color]}
          curveType="natural"
          className="mt-4 h-14 w-full"
        />
      </div>
    </Panel>
  );
}

function StockStatus({ title, helper, count, tone, onClick }) {
  const tones = {
    critical: {
      box: "border-red-100 bg-red-50 hover:bg-red-100",
      bar: "bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.35)]",
      title: "text-red-800",
      text: "text-red-600",
      metric: "text-red-700",
    },
    warning: {
      box: "border-amber-100 bg-amber-50",
      bar: "bg-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.35)]",
      title: "text-amber-800",
      text: "text-amber-600",
      metric: "text-amber-700",
    },
    healthy: {
      box: "border-emerald-100 bg-emerald-50",
      bar: "bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.35)]",
      title: "text-emerald-800",
      text: "text-emerald-600",
      metric: "text-emerald-700",
    },
  };
  const Tag = onClick ? "button" : "div";
  const t = tones[tone];

  return (
    <Tag
      onClick={onClick}
      className={`flex w-full items-center justify-between rounded-xl border p-4 text-left transition-colors ${t.box}`}
    >
      <div className="flex items-center gap-3">
        <div className={`h-10 w-3 rounded-full ${t.bar}`} />
        <div>
          <p className={`text-xs font-bold uppercase tracking-wide ${t.title}`}>{title}</p>
          <p className={`mt-1 text-xs ${t.text}`}>{helper}</p>
        </div>
      </div>
      <Metric className={`text-3xl font-black ${t.metric}`}>{count}</Metric>
    </Tag>
  );
}

function EmployeeRow({ employee, rank, max }) {
  const value = Math.max(10, max - rank * 12);

  return (
    <div className="flex items-center gap-3 py-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">
        {(employee.iniciales || employee.nombre || "US").slice(0, 2).toUpperCase()}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-3">
          <p className="truncate text-sm font-semibold text-slate-800">{employee.nombre}</p>
          <span className="shrink-0 text-xs font-bold text-slate-500">{value} movs</span>
        </div>
        <ProgressBar value={(value / max) * 100} color="blue" className="mt-2 h-1.5" />
      </div>
    </div>
  );
}

function ArticleRow({ nombre, salidas }) {
  return (
    <div className="flex items-center gap-3 py-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-100 bg-slate-50 text-slate-400">
        <Package size={18} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-slate-800">{nombre}</p>
        <p className="mt-0.5 text-xs text-slate-400">{salidas} movimientos</p>
      </div>
      <Link to={`/catalogo?q=${encodeURIComponent(nombre)}`} className="flex items-center gap-1 rounded-lg bg-emerald-100 px-2 py-1 text-xs font-bold text-emerald-700 transition-colors hover:bg-emerald-200">
        <ArrowUpRight size={14} strokeWidth={3} />
      </Link>
    </div>
  );
}

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeRange, setActiveRange] = useState("Hoy");
  const [customRange, setCustomRange] = useState();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [rangeOpen, setRangeOpen] = useState(false);
  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);

  const load = async () => {
    setIsRefreshing(true);
    try {
      const response = await apiFetch("/api/dashboard/metricas");
      const payload = await response.json();
      setData(payload);
    } catch {
      console.error("Error al cargar metricas");
    } finally {
      setLoading(false);
      setTimeout(() => setIsRefreshing(false), 450);
    }
  };

  useEffect(() => {
    load();
    const timer = setInterval(load, 30000);
    return () => clearInterval(timer);
  }, []);

  const stockItems = data?.semaforo ?? [];
  const criticalItems = useMemo(
    () => stockItems.filter((item) => item.stock_actual <= item.stock_minimo * 0.2),
    [stockItems]
  );
  const warningItems = useMemo(
    () => stockItems.filter((item) => item.stock_actual > item.stock_minimo * 0.2 && item.stock_actual <= item.stock_minimo * 0.6),
    [stockItems]
  );
  const healthyItems = useMemo(
    () => stockItems.filter((item) => item.stock_actual > item.stock_minimo * 0.6),
    [stockItems]
  );

  const handleRefresh = () => {
    setActiveRange("Hoy");
    setCustomRange(undefined);
    setRangeOpen(false);
    load();
  };

  const downloadBlob = (blob, filename) => {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  };

  const handleExport = async (format) => {
    try {
      const toastId = toast.loading(`Exportando en ${format.toUpperCase()}...`);
      const response = await apiFetch(`/api/export/${format}`);
      
      if (!response.ok) {
        toast.dismiss(toastId);
        throw new Error("Error al exportar");
      }
      
      const blob = await response.blob();
      const extension = format === "pdf" ? "pdf" : "xlsx";
      downloadBlob(blob, `dashboard_export.${extension}`);
      toast.success(`Dashboard exportado en ${format.toUpperCase()}`, { id: toastId });
    } catch (error) {
      toast.error(error.message || "Error al exportar");
    }
  };

  const formatRangeDate = (date) => (date ? format(date, "dd MMM yyyy", { locale: es }) : "--");

  return (
    <>
      <div className="w-full space-y-5 pb-10">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="inline-flex rounded-xl bg-slate-100 p-1 text-sm font-semibold text-slate-500">
              {["Hoy", "Semana", "Mes", "Anual"].map((range) => (
                <button
                  key={range}
                  onClick={() => setActiveRange(range)}
                  className={`min-w-20 rounded-lg px-4 py-2 transition-all ${
                    activeRange === range ? "bg-white text-slate-900 shadow-sm" : "hover:text-slate-700"
                  }`}
                >
                  {range}
                </button>
              ))}
            </div>

            <div className="relative">
              <button
                onClick={() => setRangeOpen((value) => !value)}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 shadow-sm transition-colors hover:bg-slate-50 sm:w-auto"
              >
                <CalendarDays size={16} />
                {activeRange === "Rango" && customRange?.from
                  ? `${formatRangeDate(customRange.from)} - ${formatRangeDate(customRange.to || customRange.from)}`
                  : "Rango personalizado"}
              </button>
              {rangeOpen && (
                <div className="rdp-popup absolute right-0 z-20 mt-2 w-[340px] rounded-xl border border-slate-200 bg-white p-3 shadow-xl">
                  <div className="mb-3 grid grid-cols-2 gap-3">
                    <div className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
                      <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Desde</p>
                      <p className="mt-1 text-sm font-semibold text-slate-700">{formatRangeDate(customRange?.from)}</p>
                    </div>
                    <div className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
                      <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Hasta</p>
                      <p className="mt-1 text-sm font-semibold text-slate-700">{formatRangeDate(customRange?.to)}</p>
                    </div>
                  </div>
                  <Calendar
                    mode="range"
                    selected={customRange}
                    onSelect={setCustomRange}
                    numberOfMonths={1}
                    locale={es}
                    showOutsideDays
                  />
                  <button
                    onClick={() => {
                      setActiveRange("Rango");
                      setRangeOpen(false);
                    }}
                    className="mt-4 w-full rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-blue-700"
                  >
                    Aplicar rango
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={handleRefresh}
              title="Actualizar y reiniciar a Hoy"
              className={`flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-400 shadow-sm transition-all hover:text-blue-500 ${
                isRefreshing ? "rotate-180 text-blue-500" : "hover:rotate-180"
              }`}
            >
              <RefreshCw size={18} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
          <KpiCard label="Total Activos" value={data?.total_activos?.toLocaleString()} sub="articulos en inventario" chartData={sparklineData.blue} color="blue" />
          <KpiCard label="Vehiculos en Ruta" value={data?.vehiculos_ruta} sub={`de ${data?.vehiculos_total ?? "0"} totales`} chartData={sparklineData.amber} color="amber" />
          <KpiCard label="Prestamos Vencidos" value={data?.prestamos_vencidos} sub="articulos sin retornar" chartData={sparklineData.rose} color="rose" />
          <KpiCard label="Por Reponer" value={data?.por_reponer} sub="bajo stock minimo" chartData={sparklineData.orange} color="orange" />
        </div>

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
          <Panel className="p-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Semaforo de Stock</h2>
              <p className="mt-1 text-sm text-slate-500">Nivel actual de inventario</p>
            </div>
            <div className="mt-6 grid gap-4">
              <StockStatus title="Critico" helper="Accion inmediata requerida" count={criticalItems.length} tone="critical" onClick={() => setIsAlertModalOpen(true)} />
              <StockStatus title="Alerta" helper="Vigilar reabastecimiento" count={warningItems.length} tone="warning" />
              <StockStatus title="Saludable" helper="Stock en niveles optimos" count={healthyItems.length} tone="healthy" />
            </div>
          </Panel>

          <Panel className="p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Top Empleados</h2>
                <p className="mt-1 text-sm text-slate-500">Mas movimientos (30 dias)</p>
              </div>
              <Link to="/empleados" className="rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-600 transition-colors hover:bg-blue-100">
                Ver todos
              </Link>
            </div>
            <div className="mt-5 divide-y divide-slate-100">
              {loading ? (
                <p className="py-10 text-center text-sm text-slate-400">Cargando...</p>
              ) : (data?.tecnicos ?? []).length === 0 ? (
                <p className="py-10 text-center text-sm text-slate-400">Sin registros recientes</p>
              ) : (
                data.tecnicos.slice(0, 5).map((employee, index) => <EmployeeRow key={employee.id ?? index} employee={employee} rank={index} max={84} />)
              )}
            </div>
          </Panel>

          <Panel className="p-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Top Articulos</h2>
              <p className="mt-1 text-sm text-slate-500">Mayor rotacion</p>
            </div>
            <div className="mt-5 divide-y divide-slate-100">
              {loading ? (
                <p className="py-10 text-center text-sm text-slate-400">Cargando...</p>
              ) : (data?.top_articulos ?? []).length === 0 ? (
                <p className="py-10 text-center text-sm text-slate-400">Sin movimientos recientes</p>
              ) : (
                data.top_articulos.map((article, index) => <ArticleRow key={`${article.nombre}-${index}`} {...article} />)
              )}
            </div>
          </Panel>
        </div>

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
          <Panel className="overflow-hidden xl:col-span-2">
            <div className="flex flex-col gap-3 border-b border-slate-100 p-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Bitacora Diaria</h2>
                <p className="mt-1 text-sm text-slate-500">Movimientos recientes del almacen</p>
              </div>
              <Link to="/mostrador/resguardos" className="rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-600 transition-colors hover:bg-blue-100">
                Ver historial
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[680px] text-sm">
                <thead className="bg-slate-50/80">
                  <tr>
                    {["Fecha", "Tipo", "Articulo", "Cant.", "Usuario"].map((heading) => (
                      <th key={heading} className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-wide text-slate-500">
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="py-10 text-center text-sm text-slate-400">Cargando...</td>
                    </tr>
                  ) : (data?.movimientos_recientes ?? []).length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-10 text-center text-sm text-slate-400">Sin movimientos</td>
                    </tr>
                  ) : (
                    data.movimientos_recientes.map((movement, index) => {
                      const config = movementConfig[movement.tipo?.toLowerCase()] || { style: "bg-slate-100 text-slate-700 border-slate-200", label: movement.tipo };
                      return (
                        <tr key={index} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/70">
                          <td className="px-5 py-3 text-xs text-slate-500">{movement.fecha_hora}</td>
                          <td className="px-5 py-3">
                            <span className={`inline-flex items-center justify-center rounded-lg border px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider ${config.style}`}>
                              {config.label}
                            </span>
                          </td>
                          <td className="max-w-xs truncate px-5 py-3 font-semibold text-slate-700">{movement.articulo}</td>
                          <td className="px-5 py-3 font-bold text-slate-900">{movement.cantidad ?? "-"}</td>
                          <td className="px-5 py-3 text-xs text-slate-600">{movement.usuario}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </Panel>

          <div className="grid gap-5">
            <Panel className="p-6">
              <h2 className="text-lg font-bold text-slate-900">Acciones Rapidas</h2>
              <div className="mt-5 grid gap-3">
                <Link to="/almacen/recepcion" className="flex items-center gap-3 rounded-xl bg-blue-50 px-4 py-3 font-bold text-blue-700 transition-colors hover:bg-blue-100">
                  <ArrowDownToLine size={20} /> Registrar Entrada
                </Link>
                <Link to="/mostrador/terminal" className="flex items-center gap-3 rounded-xl bg-rose-50 px-4 py-3 font-bold text-rose-700 transition-colors hover:bg-rose-100">
                  <ArrowUpFromLine size={20} /> Registrar Salida
                </Link>
              </div>
            </Panel>

            <Panel className="p-6">
              <h2 className="text-xs font-bold uppercase tracking-wide text-slate-400">Exportar Reportes</h2>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <button onClick={() => handleExport("pdf")} className="flex items-center justify-center gap-2 rounded-xl bg-red-600 py-3 text-sm font-bold text-white shadow-sm shadow-red-100 transition-all hover:-translate-y-0.5 hover:bg-red-700 hover:shadow-md">
                  <FileText size={18} /> PDF
                </button>
                <button onClick={() => handleExport("excel")} className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-sm font-bold text-white shadow-sm shadow-emerald-100 transition-all hover:-translate-y-0.5 hover:bg-emerald-700 hover:shadow-md">
                  <FileSpreadsheet size={18} /> Excel
                </button>
              </div>
            </Panel>
          </div>
        </div>
      </div>

      {isAlertModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="flex max-h-[82vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-red-100 bg-red-50 p-5 text-red-800">
              <div className="flex items-center gap-2">
                <AlertTriangle size={20} className="text-red-600" />
                <h3 className="text-lg font-bold">Articulos en Nivel Critico</h3>
              </div>
              <button onClick={() => setIsAlertModalOpen(false)} className="rounded-lg bg-red-100/60 p-1.5 text-red-500 transition-colors hover:bg-red-200 hover:text-red-700">
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5">
              {criticalItems.length > 0 ? (
                <div className="space-y-3">
                  {criticalItems.map((item, index) => (
                    <div key={`${item.nombre}-${index}`} className="flex items-center justify-between rounded-xl border border-red-100 bg-red-50/40 p-4">
                      <div>
                        <p className="font-bold text-slate-900">{item.nombre}</p>
                        <p className="mt-1 text-xs text-slate-500">Minimo requerido: {item.stock_minimo}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-black text-red-600">{item.stock_actual}</p>
                        <p className="text-[10px] font-bold uppercase text-red-400">Stock actual</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-10 text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-500">
                    <RefreshCw size={28} />
                  </div>
                  <p className="font-semibold text-slate-700">No hay articulos en estado critico actualmente.</p>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-3 border-t border-slate-100 bg-slate-50 p-5">
              <button onClick={() => setIsAlertModalOpen(false)} className="px-5 py-2 text-sm font-bold text-slate-500 transition-colors hover:text-slate-800">
                Cerrar
              </button>
              <Link to="/almacen/entrada" className="rounded-xl bg-red-600 px-5 py-2 text-sm font-bold text-white shadow-sm transition-colors hover:bg-red-700">
                Crear Orden de Compra
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

