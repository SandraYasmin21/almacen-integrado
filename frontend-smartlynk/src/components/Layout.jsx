import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import {
  ArchiveBoxIcon,
  ArrowLeftOnRectangleIcon,
  Bars3Icon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CubeIcon,
  HomeIcon,
  MagnifyingGlassIcon,
  MoonIcon,
  ShoppingCartIcon,
  SunIcon,
  TruckIcon,
  UsersIcon,
} from "@heroicons/react/24/outline";
import { Toaster } from "sonner";

import { apiFetch, clearSession } from "@/lib/auth";
import NotificationPopover from "./NotificationPopover";

const navItems = [
  { name: "Dashboard", icon: HomeIcon, path: "/dashboard", section: "PRINCIPAL" },
  { name: "Catálogo Central", icon: ArchiveBoxIcon, path: "/catalogo", section: "MÓDULOS" },
  {
    name: "Almacén Físico",
    icon: ArchiveBoxIcon,
    path: "/almacen",
    defaultPath: "/almacen/stock",
    section: "MÓDULOS",
    subItems: [
      { name: "Estado de Stock", path: "/almacen/stock" },
      { name: "Recepción de Mercancía", path: "/almacen/recepcion" },
      { name: "Solicitud de materiales", path: "/almacen/ordenes-compra" },
      { name: "Ajustes y Auditorías", path: "/almacen/ajustes" },
      { name: "Historial y Bitácora", path: "/almacen/historial" },
    ],
  },
  {
    name: "Mostrador",
    icon: ShoppingCartIcon,
    path: "/mostrador",
    defaultPath: "/mostrador/terminal",
    section: "MÓDULOS",
    subItems: [
      { name: "Terminal de Escáner", path: "/mostrador/terminal" },
      { name: "Historial de Resguardos y prestamos", path: "/mostrador/resguardos" },
      { name: "Devoluciones", path: "/mostrador/devoluciones" },
    ],
  },
  {
    name: "Empleados",
    icon: UsersIcon,
    path: "/empleados",
    defaultPath: "/empleados/directorio",
    section: "MÓDULOS",
    subItems: [
      { name: "Directorio", path: "/empleados/directorio" },
      { name: "Resguardos", path: "/empleados/resguardos" },
      { name: "Préstamos Pendientes", path: "/empleados/prestamos" },
      { name: "Control de Usuarios", path: "/empleados/perfiles-kiosco" },
    ],
  },
  {
    name: "Operaciones Externas",
    icon: TruckIcon,
    path: "/operaciones",
    defaultPath: "/operaciones/gestor-documental",
    section: "MÓDULOS",
    subItems: [
      { name: "Ventas Ocasionales", path: "/operaciones/ventas-ocasionales" },
      { name: "Control de Facturas", path: "/operaciones/gestor-documental" },
      { name: "Hojas de entrega Externos", path: "/operaciones/hojas-entrega" },
    ],
  },
  {
    name: "Flotilla Vehicular",
    icon: TruckIcon,
    path: "/flotilla",
    defaultPath: "/flotilla/dashboard",
    section: "MÓDULOS",
    subItems: [
      { name: "Dashboard", path: "/flotilla/dashboard" },
      { name: "Catálogo Vehículos", path: "/flotilla/vehiculos" },
      { name: "Mantenimientos", path: "/flotilla/mantenimientos" },
      { name: "Gastos Extra", path: "/flotilla/gastos" },
      { name: "Bitácora Viajes", path: "/flotilla/bitacora" },
      { name: "Kilometraje", path: "/flotilla/kilometraje" },
    ],
  },
];

export default function Layout() {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem("theme") === "dark");
  const location = useLocation();

  const user = typeof window !== "undefined" ? JSON.parse(localStorage.getItem("smartlynk_user") || "null") : null;
  const initials = user?.nombre_usuario?.substring(0, 1).toUpperCase() || "U";

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDarkMode);
    localStorage.setItem("theme", isDarkMode ? "dark" : "light");
  }, [isDarkMode]);

  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    try {
      await apiFetch("/api/auth/logout", { method: "POST" });
    } catch {
      // La sesión local se limpia aunque el token ya haya expirado.
    }

    clearSession();
    window.location.href = "/login";
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 font-sans">
      <Toaster
        position="top-right"
        richColors
        visibleToasts={1}
        duration={3000}
        toastOptions={{
          className: "smartlynk-toast",
          style: {
            borderRadius: "14px",
            boxShadow: "0 20px 45px -24px rgba(15, 23, 42, 0.45), 0 8px 18px -16px rgba(15, 23, 42, 0.35)",
            fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
            zIndex: 9999,
          },
        }}
      />

      {/* Overlay para móvil */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <motion.aside
        initial={{ width: 260 }}
        animate={{ width: isExpanded ? 260 : 80 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className={`fixed inset-y-0 left-0 z-50 flex flex-col bg-[#1e1e2d] text-slate-300 shadow-xl transition-transform duration-300 lg:relative lg:translate-x-0 ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <button
          type="button"
          onClick={() => setIsExpanded((value) => !value)}
          className="absolute -right-3 top-6 z-30 hidden rounded-full bg-blue-600 p-1 text-white shadow-md transition-colors hover:bg-blue-500 lg:block"
        >
          {isExpanded ? <ChevronLeftIcon className="h-4 w-4" /> : <ChevronRightIcon className="h-4 w-4" />}
        </button>

        <div className="flex h-20 shrink-0 items-center overflow-hidden bg-[#1a1a27] px-4">
          {isExpanded ? (
            <motion.div
              key="full-logo"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex w-full items-center gap-3"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-500 shadow-lg shadow-blue-500/30">
                <CubeIcon className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-sm font-bold tracking-wide text-white">Gestión Almacén</h1>
                <p className="text-xs text-slate-500">Sistema Integrado</p>
              </div>
            </motion.div>
          ) : (
            <div className="flex w-full justify-center">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-500 shadow-lg shadow-blue-500/30">
                <CubeIcon className="h-5 w-5 text-white" />
              </div>
            </div>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto overflow-x-hidden py-4 scrollbar-thin scrollbar-thumb-slate-700">
          <ul className="space-y-1">
            {navItems.map((item, index) => {
              const isActiveGroup = location.pathname === item.path || location.pathname.startsWith(`${item.path}/`);
              const showSectionHeader = isExpanded && (index === 0 || navItems[index - 1].section !== item.section);

              return (
                <li key={item.name} className="px-3">
                  {showSectionHeader && (
                    <div className="mb-2 mt-4 px-3 text-[10px] font-semibold tracking-wider text-slate-500">
                      {item.section}
                    </div>
                  )}

                  <NavLink
                    to={item.defaultPath || item.path}
                    className={() =>
                      `group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all duration-200 ${
                        isActiveGroup ? "bg-blue-600 text-white shadow-lg shadow-blue-900/20" : "hover:bg-white/5 hover:text-white"
                      }`
                    }
                  >
                    <item.icon className={`h-5 w-5 shrink-0 ${isActiveGroup ? "text-white" : "text-slate-400 group-hover:text-blue-400"}`} />
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.span
                          initial={{ opacity: 0, width: 0 }}
                          animate={{ opacity: 1, width: "auto" }}
                          exit={{ opacity: 0, width: 0 }}
                          className="overflow-hidden whitespace-nowrap text-sm font-medium"
                        >
                          {item.name}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </NavLink>

                  <AnimatePresence>
                    {isExpanded && isActiveGroup && item.subItems && (
                      <motion.ul
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="ml-4 mt-1 space-y-1 overflow-hidden border-l border-slate-700/50 py-1"
                      >
                        {item.subItems.map((sub) => (
                          <li key={sub.name}>
                            <NavLink
                              to={sub.path}
                              end
                              className={({ isActive }) =>
                                `block w-full rounded-r-lg border-l-2 px-4 py-1.5 text-left text-xs transition-colors ${
                                  isActive
                                    ? "border-blue-500 bg-white/5 font-medium text-white"
                                    : "border-transparent text-slate-400 hover:bg-white/5 hover:text-slate-200"
                                }`
                              }
                            >
                              {sub.name}
                            </NavLink>
                          </li>
                        ))}
                      </motion.ul>
                    )}
                  </AnimatePresence>
                </li>
              );
            })}
          </ul>
        </nav>

        <button
          type="button"
          onClick={handleLogout}
          title="Cerrar Sesión"
          className="mt-auto flex w-full items-center justify-center gap-2 border-t border-slate-700/50 py-5 text-sm font-medium text-slate-400 transition-colors hover:bg-slate-800/50 hover:text-red-400"
        >
          <ArrowLeftOnRectangleIcon className="h-5 w-5 shrink-0" />
          <AnimatePresence>
            {isExpanded && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                className="overflow-hidden whitespace-nowrap text-sm font-semibold"
              >
                Cerrar Sesión
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </motion.aside>

      <main className="flex min-w-0 flex-1 flex-col overflow-hidden bg-white">
        <header className="flex h-16 shrink-0 items-center justify-between gap-4 border-b border-slate-200 bg-white px-4 md:gap-6 md:px-8">
          <div className="flex max-w-xl flex-1 items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 lg:hidden"
            >
              <Bars3Icon className="h-6 w-6" />
            </button>
            <div className="relative flex w-full items-center">
              <MagnifyingGlassIcon className="absolute left-4 h-5 w-5 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar artículos..."
                className="w-full rounded-full border-2 border-blue-200/60 bg-transparent py-2 pl-11 pr-4 text-sm text-slate-600 shadow-sm outline-none transition-all placeholder:text-slate-400 focus:border-transparent focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex flex-1 items-center justify-end gap-3">
            <NotificationPopover />

            <div className="ml-1 hidden items-center rounded-full border border-slate-200 bg-slate-50 p-1 transition-colors md:flex">
              <button
                type="button"
                onClick={() => setIsDarkMode(false)}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all ${
                  !isDarkMode ? "bg-white text-slate-700 shadow-sm" : "text-slate-500 hover:text-slate-700"
                }`}
              >
                <SunIcon className="h-4 w-4" /> Claro
              </button>
              <button
                type="button"
                onClick={() => setIsDarkMode(true)}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all ${
                  isDarkMode ? "bg-white text-slate-700 shadow-sm" : "text-slate-500 hover:text-slate-700"
                }`}
              >
                <MoonIcon className="h-4 w-4" /> Oscuro
              </button>
            </div>

            <div className="mx-2 hidden h-8 w-px bg-slate-200 md:block" />

            <div className="flex shrink-0 items-center gap-3 p-1.5 text-left">
              <div className="hidden leading-tight sm:block">
                <div className="text-sm font-bold text-slate-800">
                  {user?.nombre_usuario ? user.nombre_usuario.split(" ")[0] : "Usuario"}
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-8 pb-8 pt-5 scrollbar-thin scrollbar-thumb-slate-300">
          <div key={location.pathname} className="w-full">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}
