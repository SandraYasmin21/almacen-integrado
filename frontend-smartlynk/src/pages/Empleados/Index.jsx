import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  ArrowDownTrayIcon,
  BriefcaseIcon,
  ClockIcon,
  ComputerDesktopIcon,
  DocumentTextIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  PrinterIcon,
  TruckIcon,
  UserGroupIcon,
  WrenchScrewdriverIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { apiFetch } from "@/lib/auth";
import StatusBadge from "../../components/StatusBadge";
import { SelectPremium } from "../../components/ui/SelectPremium";

function initials(name = "") {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "U") + (parts[1]?.[0] ?? "")).toUpperCase();
}

function formatDuration(minutes) {
  if (minutes == null) return "Sin salida";
  if (minutes < 60) return `${minutes} min`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} h`;

  const days = Math.floor(hours / 24);
  const rest = hours % 24;
  return rest ? `${days} d ${rest} h` : `${days} d`;
}

function formatDateTime(value) {
  if (!value) return "Sin registro";

  return new Intl.DateTimeFormat("es-MX", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function getFixedAssets(employee) {
  return employee.resguardos_fijos ?? [];
}

function getOperationalLoans(employee) {
  return [...(employee.prestamos_operacion ?? []), ...(employee.vehiculos_operacion ?? [])];
}

function getVehicleLabel(employee) {
  const vehicle = employee.vehiculo_asignado ?? employee.vehiculos_operacion?.[0];
  if (!vehicle) return "Sin vehículo";
  return `${vehicle.nombre ?? vehicle.alias ?? "Vehículo"}${vehicle.placa ? ` - ${vehicle.placa}` : ""}`;
}

function KpiCard({ label, value, helper, icon: Icon, accent = "blue", danger = false }) {
  const colors = {
    blue: "bg-blue-50 text-blue-700",
    indigo: "bg-indigo-50 text-indigo-700",
    amber: "bg-amber-50 text-amber-700",
    rose: "bg-rose-50 text-rose-700",
  };
  const palette = danger ? colors.rose : colors[accent];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-300 ease-out hover:-translate-y-1.5 hover:shadow-lg hover:shadow-slate-200/60">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-500">{label}</p>
          <p className={`mt-1 truncate text-xl font-bold ${danger ? "text-rose-700" : "text-slate-800"}`}>{value}</p>
          <p className="mt-1 truncate text-xs text-slate-400">{helper}</p>
        </div>
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${palette}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

function AssetBadge({ type, label }) {
  const styles = {
    fixed: "bg-blue-50 text-blue-700 border-blue-100",
    vehicle: "bg-emerald-50 text-emerald-700 border-emerald-100",
    tool: "bg-amber-50 text-amber-700 border-amber-100",
  };
  const Icon = type === "fixed" ? ComputerDesktopIcon : type === "vehicle" ? TruckIcon : WrenchScrewdriverIcon;

  return (
    <span className={`inline-flex min-w-[112px] items-center justify-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${styles[type]}`}>
      <Icon className="h-3.5 w-3.5" />
      <span className="truncate">{label}</span>
    </span>
  );
}

function ExportButtons() {
  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={() => toast.success("Preparando PDF...")}
        className="inline-flex items-center gap-2 rounded-full bg-rose-500 px-5 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-rose-600 hover:shadow-md"
      >
        <ArrowDownTrayIcon className="h-4 w-4" />
        Exportar PDF
      </button>
      <button
        type="button"
        onClick={() => toast.success("Preparando Excel...")}
        className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-5 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-emerald-600 hover:shadow-md"
      >
        <ArrowDownTrayIcon className="h-4 w-4" />
        Exportar Excel
      </button>
    </div>
  );
}

function AssignmentModal({ open, onClose, empleados }) {
  const navigate = useNavigate();
  const [empleadoId, setEmpleadoId] = useState("");
  const [tipo, setTipo] = useState("prestamo");

  if (!open) return null;

  const submit = () => {
    if (!empleadoId) {
      toast.error("Selecciona un empleado");
      return;
    }

    const destino = tipo === "resguardo" ? "/almacen/recepcion" : "/mostrador/resguardos";
    navigate(`${destino}?empleado_id=${empleadoId}`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg rounded-2xl border border-slate-100 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 p-5">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Nueva asignación</h2>
            <p className="mt-0.5 text-sm text-slate-500">Selecciona empleado y flujo operativo</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600">
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 p-5">
          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700">Empleado</label>
            <SelectPremium
              value={empleadoId}
              onChange={setEmpleadoId}
              placeholder="Seleccionar empleado"
              options={empleados.map((empleado) => ({ value: String(empleado.id), label: empleado.nombre_completo }))}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700">Tipo de movimiento</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: "prestamo", label: "Préstamo operativo", icon: ClockIcon },
                { value: "resguardo", label: "Resguardo fijo", icon: BriefcaseIcon },
              ].map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setTipo(item.value)}
                  className={`flex items-center gap-2 rounded-xl border px-3 py-3 text-left text-sm font-semibold transition ${
                    tipo === item.value ? "border-blue-200 bg-blue-50 text-blue-700" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-100 p-5">
          <button onClick={onClose} className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-200">
            Cancelar
          </button>
          <button onClick={submit} className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700">
            Continuar
          </button>
        </div>
      </div>
    </div>
  );
}

function EmployeeSlideOver({ employee, onClose }) {
  const fixed = employee ? getFixedAssets(employee) : [];
  const loans = employee ? getOperationalLoans(employee) : [];
  const pendingCount = employee?.prestamos_activos_count ?? loans.length;
  const history = [
    ...fixed.slice(0, 2).map((item) => ({
      tipo: "Resguardo",
      articulo: item.articulo,
      fecha: item.fecha_entrega,
      estado: "Completado",
    })),
    ...loans.slice(0, 3).map((item) => ({
      tipo: "Préstamo",
      articulo: item.item ?? item.nombre ?? "Activo operativo",
      fecha: item.fecha_salida ?? employee?.hora_salida,
      estado: employee?.pendiente_critico ? "Atrasado" : "Pendiente",
    })),
  ];

  return (
    <AnimatePresence>
      {employee && (
        <div className="fixed inset-0 z-50">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="absolute inset-y-0 right-0 flex w-full max-w-2xl flex-col overflow-hidden border-l border-slate-200 bg-white shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-slate-100 p-6">
              <div className="flex min-w-0 items-center gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-blue-100 text-lg font-bold text-blue-700">
                  {initials(employee.nombre_completo)}
                </div>
                <div className="min-w-0">
                  <h2 className="truncate text-xl font-bold text-slate-900">{employee.nombre_completo}</h2>
                  <p className="truncate text-sm text-slate-500">{employee.departamento_area || "Sin departamento"}</p>
                  <p className="mt-1 text-xs font-semibold text-slate-400">Gafete {employee.numero_gafete || "sin registro"}</p>
                </div>
              </div>
              <button onClick={onClose} className="rounded-full border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-50 hover:text-slate-700">
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 space-y-6 overflow-y-auto p-6">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <KpiCard label="Vehículo" value={getVehicleLabel(employee)} helper="Asignación vigente" icon={TruckIcon} accent="blue" />
                <KpiCard label="Equipos fijos" value={`${fixed.length} activo(s)`} helper="Largo plazo" icon={ComputerDesktopIcon} accent="indigo" />
                <KpiCard label="Herramienta pendiente" value={`${pendingCount} pendiente(s)`} helper="Requiere retorno" icon={WrenchScrewdriverIcon} accent="rose" danger={pendingCount > 0} />
              </div>

              <section>
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500">Activos fijos</h3>
                  <button className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50">
                    <PrinterIcon className="h-4 w-4" />
                    Imprimir responsiva
                  </button>
                </div>
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                  {fixed.length === 0 ? (
                    <p className="p-5 text-sm text-slate-400">Sin activos fijos asignados.</p>
                  ) : (
                    fixed.map((item, index) => (
                      <div key={`${item.codigo || item.articulo}-${index}`} className="flex items-center justify-between gap-4 border-b border-slate-100 p-4 last:border-0">
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-slate-800">{item.articulo}</p>
                          <p className="truncate text-xs text-slate-500">{item.codigo || "Sin SKU único"}</p>
                        </div>
                        <StatusBadge status="Asignado" size="compact" />
                      </div>
                    ))
                  )}
                </div>
              </section>

              <section>
                <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500">Bitácora de movimientos</h3>
                    <p className="mt-1 text-xs text-slate-400">Hoy, mes y año disponibles para filtros operativos.</p>
                  </div>
                  <div className="flex rounded-full bg-slate-100 p-1 text-xs font-semibold text-slate-500">
                    {["Hoy", "Mes", "Año"].map((label, index) => (
                      <button key={label} className={`rounded-full px-3 py-1 ${index === 0 ? "bg-white text-slate-900 shadow-sm" : ""}`}>
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                  <table className="w-full table-fixed text-left text-sm text-slate-600">
                    <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
                      <tr>
                        <th className="w-[25%] px-4 py-3">Tipo</th>
                        <th className="w-[35%] px-4 py-3">Artículo</th>
                        <th className="w-[20%] px-4 py-3">Fecha</th>
                        <th className="w-[20%] px-4 py-3 text-center">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {history.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-4 py-8 text-center text-sm text-slate-400">
                            Sin movimientos recientes.
                          </td>
                        </tr>
                      ) : (
                        history.map((item, index) => (
                          <tr key={`${item.tipo}-${index}`} className="hover:bg-slate-50">
                            <td className="truncate px-4 py-3 font-semibold text-slate-800">{item.tipo}</td>
                            <td className="truncate px-4 py-3">{item.articulo}</td>
                            <td className="truncate px-4 py-3 text-xs text-slate-500">{formatDateTime(item.fecha)}</td>
                            <td className="px-4 py-3 text-center">
                              <StatusBadge status={item.estado} size="compact" />
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}

function useEmployees() {
  const [empleados, setEmpleados] = useState([]);
  const [stats, setStats] = useState({
    total_empleados: 0,
    con_resguardos_fijos: 0,
    con_prestamos_activos: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    apiFetch("/api/empleados")
      .then(async (response) => {
        if (!response.ok) throw new Error("No se pudo cargar empleados");
        return response.json();
      })
      .then((payload) => {
        if (!active) return;
        setEmpleados(payload.data ?? []);
        setStats(payload.stats ?? {});
      })
      .catch(() => toast.error("No se pudo cargar el módulo de empleados"))
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return { empleados, stats, loading };
}

export default function Empleados({ view = "directorio" }) {
  const { empleados, stats, loading } = useEmployees();
  const [searchTerm, setSearchTerm] = useState("");
  const [department, setDepartment] = useState("todos");
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  const departments = useMemo(
    () => [...new Set(empleados.map((employee) => employee.departamento_area).filter(Boolean))].sort(),
    [empleados]
  );

  const filteredEmployees = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return empleados.filter((employee) => {
      const matchesSearch =
        !normalizedSearch ||
        String(employee.nombre_completo ?? "").toLowerCase().includes(normalizedSearch) ||
        String(employee.numero_gafete ?? "").toLowerCase().includes(normalizedSearch);
      const matchesDepartment = department === "todos" || employee.departamento_area === department;

      return matchesSearch && matchesDepartment;
    });
  }, [department, empleados, searchTerm]);

  const resguardosRows = useMemo(
    () =>
      filteredEmployees.flatMap((employee) =>
        getFixedAssets(employee).map((item, index) => ({
          id: `${employee.id}-fixed-${index}`,
          employee,
          articulo: item.articulo,
          sku: item.codigo || "Sin SKU",
          fecha: item.fecha_entrega,
          estado: item.estado || "Asignado",
        }))
      ),
    [filteredEmployees]
  );

  const prestamosRows = useMemo(
    () =>
      filteredEmployees.flatMap((employee) =>
        getOperationalLoans(employee).map((item, index) => {
          const minutes = employee.tiempo_prestado_minutos ?? item.tiempo_prestado_minutos ?? null;
          const atrasado = minutes != null && minutes >= 1440;
          return {
            id: `${employee.id}-loan-${index}`,
            employee,
            herramienta: item.item ?? item.nombre ?? "Activo operativo",
            sku: item.codigo ?? item.sku ?? item.placa ?? "Sin SKU",
            fecha: item.fecha_salida ?? employee.hora_salida,
            tiempo: minutes,
            estado: atrasado || employee.pendiente_critico ? "Atrasado" : "Pendiente",
          };
        })
      ),
    [filteredEmployees]
  );

  const pageTitle = {
    directorio: "Directorio",
    resguardos: "Resguardos",
    prestamos: "Préstamos Pendientes",
  }[view];

  return (
    <div className="pb-20">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{pageTitle}</h1>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700"
        >
          <PlusIcon className="h-4 w-4" />
          Nueva asignación
        </button>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <KpiCard label="Total de Empleados" value={loading ? "-" : stats.total_empleados ?? empleados.length} helper="Personal activo registrado" icon={UserGroupIcon} accent="blue" />
        <KpiCard label="Con Resguardos Fijos" value={loading ? "-" : stats.con_resguardos_fijos ?? 0} helper="Equipos de largo plazo" icon={ComputerDesktopIcon} accent="indigo" />
        <KpiCard label="Con Préstamos Activos" value={loading ? "-" : stats.con_prestamos_activos ?? 0} helper="Pendientes de retorno" icon={ClockIcon} accent="amber" />
      </div>

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <div className="w-[230px]">
            <SelectPremium
              value={department}
              onChange={setDepartment}
              placeholder="Departamento"
              options={[{ value: "todos", label: "Todos los departamentos" }, ...departments.map((item) => ({ value: item, label: item }))]}
            />
          </div>
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Buscar empleado o gafete..."
              className="h-11 w-80 rounded-xl border border-slate-200 bg-white py-2 pl-10 pr-4 text-sm text-slate-600 shadow-sm outline-none transition-all focus:ring-2 focus:ring-blue-500"
            />
            <MagnifyingGlassIcon className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
          </div>
        </div>
        {view !== "directorio" && <ExportButtons />}
      </div>

      {view === "directorio" && (
        <DirectorioTable loading={loading} empleados={filteredEmployees} onSelect={setSelectedEmployee} />
      )}
      {view === "resguardos" && (
        <ResguardosTable loading={loading} rows={resguardosRows} onSelect={setSelectedEmployee} />
      )}
      {view === "prestamos" && (
        <PrestamosTable loading={loading} rows={prestamosRows} onSelect={setSelectedEmployee} />
      )}

      <div className="mt-4 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500 shadow-sm">
        Mostrando {view === "resguardos" ? resguardosRows.length : view === "prestamos" ? prestamosRows.length : filteredEmployees.length} registro(s)
      </div>

      <AssignmentModal open={modalOpen} onClose={() => setModalOpen(false)} empleados={empleados} />
      <EmployeeSlideOver employee={selectedEmployee} onClose={() => setSelectedEmployee(null)} />
    </div>
  );
}

function DirectorioTable({ loading, empleados, onSelect }) {
  return (
    <div className="w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-600 whitespace-nowrap">
        <thead className="border-b border-slate-200 bg-slate-50 text-slate-500">
          <tr>
            <th className="w-[30%] px-5 py-4 font-semibold">Empleado</th>
            <th className="w-[22%] px-5 py-4 font-semibold">Vehículo Asignado</th>
            <th className="w-[18%] px-5 py-4 text-center font-semibold">Activos Fijos</th>
            <th className="w-[18%] px-5 py-4 text-center font-semibold">Préstamos Pendientes</th>
            <th className="w-[12%] px-5 py-4"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {loading ? (
            <EmptyRow label="Cargando empleados..." colSpan={5} />
          ) : empleados.length === 0 ? (
            <EmptyRow label="No hay empleados para esta vista" colSpan={5} />
          ) : (
            empleados.map((employee) => {
              const fixedCount = employee.resguardos_fijos_count ?? getFixedAssets(employee).length;
              const loanCount = employee.prestamos_activos_count ?? getOperationalLoans(employee).length;

              return (
                <tr key={employee.id} onClick={() => onSelect(employee)} className="cursor-pointer transition-colors hover:bg-slate-50">
                  <td className="px-5 py-4">
                    <EmployeeCell employee={employee} />
                  </td>
                  <td className="truncate px-5 py-4 font-semibold text-slate-700">{getVehicleLabel(employee)}</td>
                  <td className="px-5 py-4 text-center">
                    <AssetBadge type="fixed" label={`${fixedCount} activo(s)`} />
                  </td>
                  <td className="px-5 py-4 text-center">
                    <AssetBadge type="tool" label={`${loanCount} pendiente(s)`} />
                  </td>
                  <td className="px-5 py-4 text-right">
                    <button className="rounded-lg border border-blue-200 px-3 py-1.5 text-xs font-semibold text-blue-600 transition-colors hover:bg-blue-50">
                      Expediente
                    </button>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
      </div>
    </div>
  );
}

function ResguardosTable({ loading, rows, onSelect }) {
  return (
    <div className="w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-600 whitespace-nowrap">
        <thead className="border-b border-slate-200 bg-slate-50 text-slate-500">
          <tr>
            <th className="w-[28%] px-5 py-4 font-semibold">Empleado</th>
            <th className="w-[25%] px-5 py-4 font-semibold">Artículo</th>
            <th className="w-[17%] px-5 py-4 font-semibold">SKU Único</th>
            <th className="w-[15%] px-5 py-4 font-semibold">Fecha de Entrega</th>
            <th className="w-[15%] px-5 py-4 text-center font-semibold">Estado</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {loading ? (
            <EmptyRow label="Cargando resguardos..." colSpan={5} />
          ) : rows.length === 0 ? (
            <EmptyRow label="No hay resguardos activos" colSpan={5} />
          ) : (
            rows.map((row) => (
              <tr key={row.id} onClick={() => onSelect(row.employee)} className="cursor-pointer transition-colors hover:bg-slate-50">
                <td className="px-5 py-4">
                  <EmployeeCell employee={row.employee} />
                </td>
                <td className="truncate px-5 py-4 font-semibold text-slate-800">{row.articulo}</td>
                <td className="truncate px-5 py-4 font-mono text-xs text-slate-500">{row.sku}</td>
                <td className="truncate px-5 py-4 text-xs text-slate-500">{formatDateTime(row.fecha)}</td>
                <td className="px-5 py-4 text-center">
                  <StatusBadge status={row.estado} size="compact" />
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
      </div>
    </div>
  );
}

function PrestamosTable({ loading, rows, onSelect }) {
  return (
    <div className="w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-600 whitespace-nowrap">
        <thead className="border-b border-slate-200 bg-slate-50 text-slate-500">
          <tr>
            <th className="w-[25%] px-5 py-4 font-semibold">Empleado</th>
            <th className="w-[23%] px-5 py-4 font-semibold">Herramienta</th>
            <th className="w-[16%] px-5 py-4 font-semibold">SKU</th>
            <th className="w-[15%] px-5 py-4 font-semibold">Fecha/Hora Salida</th>
            <th className="w-[11%] px-5 py-4 font-semibold">Tiempo</th>
            <th className="w-[10%] px-5 py-4 text-center font-semibold">Estado</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {loading ? (
            <EmptyRow label="Cargando préstamos..." colSpan={6} />
          ) : rows.length === 0 ? (
            <EmptyRow label="No hay préstamos pendientes" colSpan={6} />
          ) : (
            rows.map((row) => (
              <tr key={row.id} onClick={() => onSelect(row.employee)} className="cursor-pointer transition-colors hover:bg-slate-50">
                <td className="px-5 py-4">
                  <EmployeeCell employee={row.employee} />
                </td>
                <td className="truncate px-5 py-4 font-semibold text-slate-800">{row.herramienta}</td>
                <td className="truncate px-5 py-4 font-mono text-xs text-slate-500">{row.sku}</td>
                <td className="truncate px-5 py-4 text-xs text-slate-500">{formatDateTime(row.fecha)}</td>
                <td className="truncate px-5 py-4 font-semibold text-slate-700">{formatDuration(row.tiempo)}</td>
                <td className="px-5 py-4 text-center">
                  <StatusBadge status={row.estado} size="compact" />
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
      </div>
    </div>
  );
}

function EmployeeCell({ employee }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">
        {initials(employee.nombre_completo)}
      </div>
      <div className="min-w-0">
        <div className="truncate font-bold text-slate-800">{employee.nombre_completo}</div>
        <div className="truncate text-xs text-slate-500">
          {employee.departamento_area || "Sin departamento"}
          {employee.numero_gafete ? ` - Gafete ${employee.numero_gafete}` : ""}
        </div>
      </div>
    </div>
  );
}

function EmptyRow({ label, colSpan }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-6 py-12 text-center text-sm text-slate-400">
        {label}
      </td>
    </tr>
  );
}
