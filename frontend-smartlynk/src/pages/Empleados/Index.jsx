import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  ArrowDownTrayIcon,
  BriefcaseIcon,
  ClockIcon,
  ComputerDesktopIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  TruckIcon,
  UserGroupIcon,
  WrenchScrewdriverIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { apiFetch } from "@/lib/auth";
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

function KpiCard({ label, value, helper, icon: Icon, accent }) {
  const colors = {
    blue: "border-l-blue-500 bg-blue-50 text-blue-700",
    indigo: "border-l-indigo-500 bg-indigo-50 text-indigo-700",
    amber: "border-l-amber-500 bg-amber-50 text-amber-700",
  };

  return (
    <div className={`rounded-xl border border-slate-200 border-l-4 ${colors[accent]} bg-white p-4 shadow-sm`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-slate-500">{label}</p>
          <p className="mt-1 text-2xl font-bold text-slate-800">{value}</p>
          <p className="mt-1 text-xs text-slate-400">{helper}</p>
        </div>
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${colors[accent].split(" ").slice(1).join(" ")}`}>
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
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${styles[type]}`}>
      <Icon className="h-3.5 w-3.5" />
      {label}
    </span>
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

    const destino = tipo === "resguardo" ? "/almacen/entrada" : "/almacen/salida";
    navigate(`${destino}empleado_id=${empleadoId}`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 p-5">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Nueva asignacion</h2>
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
                { value: "prestamo", label: "Prestamo operativo", icon: ClockIcon },
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
          <button onClick={onClose} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50">
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

function EmployeeDetailModal({ employee, onClose }) {
  if (!employee) return null;

  const fixed = employee.resguardos_fijos ?? [];
  const tools = employee.prestamos_operacion ?? [];
  const vehicles = employee.vehiculos_operacion ?? [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 flex max-h-[88vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">
              {initials(employee.nombre_completo)}
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">{employee.nombre_completo}</h2>
              <p className="text-sm text-slate-500">{employee.departamento_area || "Sin departamento"}</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600">
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-5 overflow-y-auto p-5">
          <section>
            <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">Resguardos fijos</h3>
            <div className="rounded-xl border border-slate-200">
              {fixed.length === 0 ? (
                <p className="p-4 text-sm text-slate-400">Sin resguardos fijos activos</p>
              ) : (
                fixed.map((item, index) => (
                  <div key={`${item.codigo}-${index}`} className="flex items-center justify-between border-b border-slate-100 p-4 last:border-0">
                    <div>
                      <p className="font-semibold text-slate-800">{item.articulo}</p>
                      <p className="text-xs text-slate-500">{item.codigo || "Sin codigo interno"}</p>
                    </div>
                    <span className="text-xs font-semibold text-slate-500">{formatDateTime(item.fecha_entrega)}</span>
                  </div>
                ))
              )}
            </div>
          </section>

          <section>
            <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">Prestamos de operacion</h3>
            <div className="rounded-xl border border-slate-200">
              {tools.length === 0 && vehicles.length === 0 ? (
                <p className="p-4 text-sm text-slate-400">Sin prestamos operativos activos</p>
              ) : (
                <>
                  {tools.map((item, index) => (
                    <div key={`tool-${index}`} className="flex items-center justify-between border-b border-slate-100 p-4 last:border-0">
                      <div>
                        <p className="font-semibold text-slate-800">{item.item}</p>
                        <p className="text-xs text-slate-500">{item.notas || "Herramienta o material operativo"}</p>
                      </div>
                      <span className="text-xs font-semibold text-amber-700">{formatDateTime(item.fecha_salida)}</span>
                    </div>
                  ))}
                  {vehicles.map((item, index) => (
                    <div key={`vehicle-${index}`} className="flex items-center justify-between border-b border-slate-100 p-4 last:border-0">
                      <div>
                        <p className="font-semibold text-slate-800">{item.nombre}</p>
                        <p className="text-xs text-slate-500">{item.placa || "Sin placa registrada"}</p>
                      </div>
                      <span className="text-xs font-semibold text-emerald-700">{formatDateTime(item.fecha_salida)}</span>
                    </div>
                  ))}
                </>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

export default function Empleados() {
  const [empleados, setEmpleados] = useState([]);
  const [stats, setStats] = useState({
    total_empleados: 0,
    con_resguardos_fijos: 0,
    con_prestamos_activos: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [department, setDepartment] = useState("todos");
  const [activeTab, setActiveTab] = useState("resguardos");
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);

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
      .catch(() => toast.error("No se pudo cargar el modulo de empleados"))
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const departments = useMemo(
    () => [...new Set(empleados.map((employee) => employee.departamento_area).filter(Boolean))].sort(),
    [empleados]
  );

  const filtered = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return empleados.filter((employee) => {
      const matchesSearch =
        !normalizedSearch ||
        employee.nombre_completo.toLowerCase().includes(normalizedSearch) ||
        employee.numero_gafete.toLowerCase().includes(normalizedSearch);
      const matchesDepartment = department === "todos" || employee.departamento_area === department;
      const matchesTab =
        activeTab === "resguardos"
          ? employee.resguardos_fijos_count > 0
          : employee.prestamos_activos_count > 0;

      return matchesSearch && matchesDepartment && matchesTab;
    });
  }, [activeTab, department, empleados, searchTerm]);

  const tabs = [
    {
      value: "resguardos",
      label: "Resguardos Fijos",
      helper: "Largo plazo",
      icon: ComputerDesktopIcon,
      count: stats.con_resguardos_fijos ?? 0,
    },
    {
      value: "prestamos",
      label: "Prestamos de Operacion",
      helper: "Corto plazo",
      icon: WrenchScrewdriverIcon,
      count: stats.con_prestamos_activos ?? 0,
    },
  ];

  return (
      <div className="pb-20">
        <div className="mb-4 flex justify-end">
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700"
          >
            <PlusIcon className="h-4 w-4" />
            Nueva asignacion
          </button>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          <KpiCard label="Total de Empleados" value={loading ? "-" : stats.total_empleados ?? 0} helper="Personal activo registrado" icon={UserGroupIcon} accent="blue" />
          <KpiCard label="Con Resguardos Fijos" value={loading ? "-" : stats.con_resguardos_fijos ?? 0} helper="Equipos de largo plazo" icon={ComputerDesktopIcon} accent="indigo" />
          <KpiCard label="Con Prestamos Activos" value={loading ? "-" : stats.con_prestamos_activos ?? 0} helper="Pendientes de retorno" icon={ClockIcon} accent="amber" />
        </div>

        <div className="mb-6 flex flex-col gap-3">
          <div className="flex flex-wrap gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                className={`flex items-center gap-3 rounded-full border px-4 py-2 text-sm font-semibold shadow-sm transition ${
                  activeTab === tab.value ?
                     "border-blue-200 bg-blue-600 text-white"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                <tab.icon className="h-4 w-4" />
                <span>{tab.label}</span>
                <span className={`rounded-full px-2 py-0.5 text-xs ${activeTab === tab.value ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"}`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              <div className="w-[220px]">
                <SelectPremium 
                  value={department} 
                  onChange={setDepartment}
                  placeholder="Departamento"
                  options={[
                    { value: "todos", label: "Todos los departamentos" },
                    ...departments.map(item => ({ value: item, label: item }))
                  ]}
                />
              </div>
            </div>

            <div className="flex gap-3">
              <div className="relative">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Buscar empleado o gafete..."
                  className="w-72 rounded-lg border border-slate-200 bg-white py-2 pl-10 pr-4 text-sm text-slate-600 shadow-sm outline-none transition-all focus:ring-2 focus:ring-blue-500"
                />
                <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
              </div>

              <button className="flex items-center gap-2 rounded-full bg-emerald-500 px-5 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-emerald-600 hover:shadow-md">
                <ArrowDownTrayIcon className="h-4 w-4" />
                Exportar reporte
              </button>
            </div>
          </div>
        </div>

        <div className="mb-4 w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full table-fixed text-left text-sm text-slate-600">
              <thead className="border-b border-slate-200 bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-6 py-4 font-semibold">Empleado</th>
                  <th className="px-6 py-4 font-semibold">Indicadores</th>
                  <th className="px-6 py-4 font-semibold">{activeTab === "resguardos" ? "Resguardos fijos" : "Deuda / pendiente"}</th>
                  <th className="px-6 py-4 font-semibold">{activeTab === "resguardos" ? "Ultima entrega" : "Tiempo prestado"}</th>
                  <th className="px-6 py-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-sm text-slate-400">
                      Cargando empleados...
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-sm text-slate-400">
                      No hay empleados para esta vista
                    </td>
                  </tr>
                ) : (
                  filtered.map((employee) => {
                    const fixed = employee.resguardos_fijos ?? [];
                    const operation = [...(employee.prestamos_operacion ?? []), ...(employee.vehiculos_operacion ?? [])];
                    const firstFixed = fixed[0];
                    const firstOperation = operation[0];

                    return (
                      <tr key={employee.id} className="transition-colors hover:bg-slate-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">
                              {initials(employee.nombre_completo)}
                            </div>
                            <div className="min-w-0">
                              <div className="truncate font-bold text-slate-800">{employee.nombre_completo}</div>
                              <div className="text-xs text-slate-500">
                                {employee.departamento_area || "Sin departamento"}
                                {employee.numero_gafete ? ` - Gafete ${employee.numero_gafete}` : ""}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-2">
                            {employee.resguardos_fijos_count > 0 && <AssetBadge type="fixed" label={`${employee.resguardos_fijos_count} equipo(s)`} />}
                            {(employee.vehiculos_operacion ?? []).slice(0, 1).map((vehicle) => (
                              <AssetBadge key={vehicle.nombre} type="vehicle" label={vehicle.nombre} />
                            ))}
                            {employee.prestamos_activos_count > 0 && <AssetBadge type="tool" label={`${employee.prestamos_activos_count} prestamo(s)`} />}
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          {activeTab === "resguardos" ? (
                            <div>
                              <div className="font-semibold text-slate-800">{firstFixed?.articulo ?? "Sin detalle"}</div>
                              <div className="text-xs text-slate-500">{firstFixed?.codigo ?? "Sin codigo interno"}</div>
                            </div>
                          ) : (
                            <div>
                              <div className={`font-semibold ${employee.pendiente_critico ? "text-red-600" : "text-slate-800"}`}>
                                {firstOperation?.item ?? firstOperation?.nombre ?? "Sin detalle"}
                              </div>
                              <div className="text-xs text-slate-500">{formatDateTime(employee.hora_salida)}</div>
                            </div>
                          )}
                        </td>

                        <td className="px-6 py-4">
                          {activeTab === "resguardos" ? (
                            <span className="text-sm text-slate-500">{formatDateTime(firstFixed?.fecha_entrega)}</span>
                          ) : (
                            <span className={`rounded-md px-2 py-1 text-xs font-bold ${employee.pendiente_critico ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700"}`}>
                              {formatDuration(employee.tiempo_prestado_minutos)}
                            </span>
                          )}
                        </td>

                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => setSelectedEmployee(employee)}
                            className="rounded-lg border border-blue-200 px-3 py-1.5 text-xs font-semibold text-blue-600 transition-colors hover:bg-blue-50"
                          >
                            Detalle de activos
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500 shadow-sm">
          Mostrando {filtered.length} empleado(s) en {activeTab === "resguardos" ? "resguardos fijos" : "prestamos de operacion"}
        </div>

        <AssignmentModal open={modalOpen} onClose={() => setModalOpen(false)} empleados={empleados} />
        <EmployeeDetailModal employee={selectedEmployee} onClose={() => setSelectedEmployee(null)} />
      </div>
  );
}
