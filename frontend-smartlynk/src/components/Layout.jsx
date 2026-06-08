import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation, Outlet } from 'react-router-dom';
import {
  HomeIcon,
  ArchiveBoxIcon,
  ShoppingCartIcon,
  UsersIcon,
  TruckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CubeIcon,
  MagnifyingGlassIcon,
  ArrowLeftOnRectangleIcon,
  SunIcon,
  MoonIcon,
} from '@heroicons/react/24/outline';
import { Toaster } from 'sonner';
import NotificationPopover from './NotificationPopover';
import { apiFetch, clearSession } from '@/lib/auth';

const navItems = [
  { name: 'Dashboard', icon: HomeIcon, path: '/dashboard', section: 'PRINCIPAL' },
  { name: 'Catálogo Central', icon: ArchiveBoxIcon, path: '/catalogo', section: 'MÓDULOS' },
  { name: 'Almacén Físico', icon: ArchiveBoxIcon, path: '/almacen', defaultPath: '/almacen/articulos', section: 'MÓDULOS',
    subItems: [
      { name: 'Artículos', path: '/almacen/articulos' },
      { name: 'Registrar Entrada', path: '/almacen/entrada' },
      { name: 'Registrar Salida', path: '/almacen/salida' },
      { name: 'Movimientos', path: '/almacen/movimientos' },
    ]
  },
  { name: 'Mostrador', icon: ShoppingCartIcon, path: '/mostrador', section: 'MÓDULOS' },
  { name: 'Empleados', icon: UsersIcon, path: '/empleados', section: 'MÓDULOS' },

  { name: 'Flotilla Vehicular', icon: TruckIcon, path: '/flotilla', defaultPath: '/flotilla/dashboard', section: 'MÓDULOS',
    subItems: [
      { name: 'Dashboard', path: '/flotilla/dashboard' },
      { name: 'Catálogo Vehículos', path: '/flotilla/vehiculos' },
      { name: 'Mantenimientos', path: '/flotilla/mantenimientos' },
      { name: 'Gastos Extra', path: '/flotilla/gastos' },
      { name: 'Bitácora Viajes', path: '/flotilla/bitacora' },
      { name: 'Kilometraje', path: '/flotilla/kilometraje' }
    ]
  },
];

export default function Layout({ children }) {
  const [isExpanded, setIsExpanded] = useState(true);
  const location = useLocation();

  const user = typeof window !== "undefined" ? JSON.parse(localStorage.getItem("smartlynk_user") || "null") : null;
  const initials = user?.nombre_usuario?.substring(0, 1).toUpperCase() || "U";

  const handleLogout = async () => {
    try {
      await apiFetch("/api/auth/logout", { method: "POST" });
    } catch {
      // La sesion local se limpia aunque el token ya haya expirado.
    }

    clearSession();
    window.location.href = "/login";
  };

  // Dark mode state
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark';
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
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
      
      {/* Sidebar */}
      <motion.aside
        initial={{ width: 260 }}
        animate={{ width: isExpanded ? 260 : 80 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="relative bg-[#1e1e2d] text-slate-300 flex flex-col shadow-xl z-20"
      >
        {/* Toggle Button */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="absolute -right-3 top-6 bg-blue-600 text-white rounded-full p-1 shadow-md hover:bg-blue-500 transition-colors z-30"
        >
          {isExpanded ? <ChevronLeftIcon className="w-4 h-4" /> : <ChevronRightIcon className="w-4 h-4" />}
        </button>

        {/* Logo Area */}
        <div className="h-20 flex items-center px-4 shrink-0 overflow-hidden bg-[#1a1a27]">
           <AnimatePresence mode="wait">
            {isExpanded ? (
                <motion.div 
                    key="full-logo"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                    className="flex items-center gap-3 w-full"
                >
                    <div className="w-8 h-8 rounded-lg bg-blue-500 flex-shrink-0 flex items-center justify-center shadow-lg shadow-blue-500/30">
                        <CubeIcon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-white font-bold text-sm tracking-wide">Gestión Almacén</h1>
                        <p className="text-xs text-slate-500">Sistema Integrado</p>
                    </div>
                </motion.div>
            ) : (
                <motion.div
                    key="icon-logo"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="w-full flex justify-center"
                >
                    <div className="w-8 h-8 rounded-lg bg-blue-500 flex-shrink-0 flex items-center justify-center shadow-lg shadow-blue-500/30">
                        <CubeIcon className="w-5 h-5 text-white" />
                    </div>
                </motion.div>
            )}
           </AnimatePresence>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 overflow-x-hidden scrollbar-thin scrollbar-thumb-slate-700">
          <ul className="space-y-1">
            {navItems.map((item, index) => {
              const isActive = location.pathname.startsWith(item.path);
              
              // Group Headers (only show if expanded)
              const showSectionHeader = isExpanded && (index === 0 || navItems[index - 1].section !== item.section);

              return (
                <li key={item.name} className="px-3">
                  {showSectionHeader && (
                    <div className="px-3 mb-2 mt-4 text-[10px] font-semibold text-slate-500 tracking-wider">
                      {item.section}
                    </div>
                  )}

                  <Link
                    to={item.defaultPath || item.path}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group ${
                      isActive ?
                         'bg-blue-600 text-white shadow-lg shadow-blue-900/20' 
                        : 'hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <item.icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-blue-400'}`} />
                    
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.span
                          initial={{ opacity: 0, width: 0 }}
                          animate={{ opacity: 1, width: 'auto' }}
                          exit={{ opacity: 0, width: 0 }}
                          className="text-sm font-medium whitespace-nowrap overflow-hidden"
                        >
                          {item.name}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </Link>

                  {/* Sub-items (only visible if expanded and active) */}
                  <AnimatePresence>
                    {isExpanded && isActive && item.subItems && (
                      <motion.ul
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-1 ml-4 border-l border-slate-700/50 space-y-1 py-1 overflow-hidden"
                      >
                        {item.subItems.map(sub => {
                          const isSubActive = location.pathname === sub.path;
                          return (
                            <li key={sub.name}>
                              <Link
                                to={sub.path}
                                className={`block px-4 py-1.5 text-xs rounded-r-lg border-l-2 transition-colors ${
                                  isSubActive ?
                                     'border-blue-500 text-white bg-white/5 font-medium' 
                                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/5'
                                }`}
                              >
                                {sub.name}
                              </Link>
                            </li>
                          );
                        })}
                      </motion.ul>
                    )}
                  </AnimatePresence>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Logout Footer */}
        <button
          type="button"
          onClick={handleLogout}
          title="Cerrar Sesión"
          className="mt-auto flex w-full items-center justify-center gap-2 border-t border-slate-700/50 py-5 text-sm font-medium text-slate-400 transition-colors hover:text-red-400 hover:bg-slate-800/50"
        >
          <ArrowLeftOnRectangleIcon className="h-5 w-5 shrink-0" />
          <AnimatePresence>
            {isExpanded && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                className="overflow-hidden whitespace-nowrap text-sm font-semibold"
              >
                Cerrar Sesión
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </motion.aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-white">
        {/* Top Header Placeholder */}
        <header className="h-16 border-b border-slate-200 bg-white flex items-center justify-between px-8 shrink-0 gap-6">
            {/* Left side: Search */}
            <div className="flex-1 max-w-xl">
                <div className="relative flex items-center w-full">
                    <MagnifyingGlassIcon className="w-5 h-5 text-slate-400 absolute left-4" />
                    <input 
                        type="text" 
                        placeholder="Buscar artículos, series, empleados, vehículos..." 
                        className="w-full bg-transparent border-2 border-blue-200/60 rounded-full pl-11 pr-4 py-2 text-sm text-slate-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all shadow-sm placeholder:text-slate-400"
                    />
                </div>
            </div>

            {/* Right side */}
            <div className="flex items-center justify-end gap-3 flex-1">
                {/* Notifications */}
                <NotificationPopover />

                {/* Theme Toggle */}
                <div className="flex items-center bg-slate-50 p-1 rounded-full border border-slate-200 ml-1 hidden md:flex transition-colors">
                    <button 
                        onClick={() => setIsDarkMode(false)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${!isDarkMode ? 'bg-white shadow-sm text-slate-700' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <SunIcon className="w-4 h-4" /> Claro
                    </button>
                    <button 
                        onClick={() => setIsDarkMode(true)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${isDarkMode ? 'bg-white shadow-sm text-slate-700' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <MoonIcon className="w-4 h-4" /> Oscuro
                    </button>
                </div>

                {/* Divider */}
                <div className="w-px h-8 bg-slate-200 mx-2 hidden md:block"></div>

                {/* Profile */}
                <div className="flex items-center gap-3 p-1.5 text-left shrink-0">
                  <div className="flex items-center gap-3 text-left shrink-0">
                      <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold shadow-sm">
                          {initials}
                      </div>
                      <div className="hidden sm:block leading-tight">
                          <div className="text-sm font-bold text-slate-800">{user?.nombre_usuario ? user.nombre_usuario.split(" ")[0] : "Usuario"}</div>
                      </div>
                  </div>

                  <AnimatePresence>
                    {false && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden z-50"
                      >
                        <button 
                          onClick={handleLogout}
                          className="w-full text-left px-4 py-3 text-sm text-red-600 font-medium hover:bg-red-50 transition-colors flex items-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                          </svg>
                          Cerrar Sesión
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
            </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto px-8 pt-5 pb-8 scrollbar-thin scrollbar-thumb-slate-300">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="w-full"
            >
              {children || <Outlet />}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

