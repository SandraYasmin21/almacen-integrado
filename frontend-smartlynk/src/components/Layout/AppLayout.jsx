import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";

// ── Iconos ────────────────────────────────────────
const Icon = {
  dashboard: <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>,
  catalog:   <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16"/>,
  warehouse: <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>,
  counter:   <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/>,
  employees: <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>,
  truck:     <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"/>,
  settings:  <><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></>,
  bell:      <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>,
  search:    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>,
  logout:    <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>,
  print:     <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/>,
  download:  <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>,
  x:         <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>,
};

// ── Logo SVG Smartlynk ────────────────────────────
function SmartlynkLogo() {
  return (
    <div className="flex items-center gap-2.5 px-1">
      {/* Hexágonos */}
      <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
        {/* hex arriba-izq: azul oscuro */}
        <path d="M8 2 L14 2 L17 7 L14 12 L8 12 L5 7 Z" fill="#1a3a6b"/>
        {/* hex arriba-der: azul brillante */}
        <path d="M19 2 L25 2 L28 7 L25 12 L19 12 L16 7 Z" fill="#2d8bff"/>
        {/* hex abajo-izq: gris */}
        <path d="M8 14 L14 14 L17 19 L14 24 L8 24 L5 19 Z" fill="#6b7fa3"/>
        {/* hex abajo-der: azul oscuro */}
        <path d="M19 14 L25 14 L28 19 L25 24 L19 24 L16 19 Z" fill="#1a3a6b"/>
      </svg>
      {/* Texto */}
      <div>
        <div className="flex items-baseline gap-0">
          <span className="text-white font-bold text-base leading-none tracking-tight">Smart</span>
          <span className="text-[#2d8bff] font-bold text-base leading-none tracking-tight">lynk</span>
        </div>
        <p className="text-[#6b7fa3] text-[9px] tracking-[2px] uppercase mt-0.5">Consultores</p>
      </div>
    </div>
  );
}

const NAV = [
  { label: "Dashboard",        href: "/dashboard",  icon: Icon.dashboard },
  { label: "Catálogo Central", href: "/catalogo",   icon: Icon.catalog   },
  { label: "Almacén Físico",   href: "/almacen",    icon: Icon.warehouse },
  { label: "Mostrador",        href: "/mostrador",  icon: Icon.counter   },
  { label: "Empleados",        href: "/empleados",  icon: Icon.employees },
];

function NavLink({ href, icon, label, active }) {
  return (
    <Link to={href}
      className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all
        ${active ? "bg-white/15 text-white shadow-sm" : "text-blue-200 hover:bg-white/10 hover:text-white"}`}>
      <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        {icon}
      </svg>
      {label}
    </Link>
  );
}

// ── Toast ─────────────────────────────────────────
let _addToast;
export function toast(msg, type = "info") { _addToast.(msg, type); }

function ToastContainer() {
  const [toasts, setToasts] = useState([]);
  _addToast = (msg, type) => {
    const id = Date.now();
    setToasts(p => [...p, { id, msg, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 4000);
  };
  const colors = { success:"bg-green-600", error:"bg-red-600", info:"bg-blue-700", warning:"bg-amber-500" };
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map(t => (
        <div key={t.id} className={`${colors[t.type]} text-white text-sm px-4 py-3 rounded-xl shadow-lg flex items-center gap-2`}>
          {t.msg}
        </div>
      ))}
    </div>
  );
}

// ── Google Sheets ─────────────────────────────────
async function syncSheets() {
  toast("Sincronizando con Google Sheets...", "info");
  try {
    const res = await fetch("/api/sync-sheets", {
      method: "POST",
      headers: { "X-CSRF-TOKEN": document.querySelector('meta[name="csrf-token"]').content },
    });
    const d = await res.json();
    toast(d.success ? "Google Sheets actualizado" : "Error al sincronizar", d.success ? "success" : "error");
  } catch { toast("Error de conexión", "error"); }
}

function exportExcel(section = "inventario") {
  window.location.href = `/api/export/excelsection=${section}`;
  toast("Descargando Excel...", "info");
}

// ── Buscador global ───────────────────────────────
function GlobalSearch() {
  const [q, setQ] = useState("");
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const ref = useRef();
  const timer = useRef();

  useEffect(() => {
    clearTimeout(timer.current);
    if (q.length < 2) { setResults([]); setOpen(false); return; }
    timer.current = setTimeout(async () => {
      const r = await fetch(`/api/searchq=${encodeURIComponent(q)}`);
      const d = await r.json();
      setResults(d); setOpen(true);
    }, 300);
  }, [q]);

  useEffect(() => {
    const handler = (e) => { if (!ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const typeColor = {
    articulo: "bg-blue-100 text-blue-700",
    empleado: "bg-green-100 text-green-700",
    serie:    "bg-amber-100 text-amber-700"
  };

  return (
    <div ref={ref} className="relative flex-1 max-w-xl">
      <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
        fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>{Icon.search}</svg>
      <input value={q} onChange={e => setQ(e.target.value)}
        placeholder="Buscar artículos, series, empleados, vehículos..."
        className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition"/>
      {open && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-xl border border-slate-200 z-50 max-h-80 overflow-y-auto">
          {results.map((r, i) => (
            <Link key={i} to={r.url}
              className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 transition"
              onClick={() => setOpen(false)}>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${typeColor[r.type] ? "bg-slate-100 text-slate-600"}`}>{r.type}</span>
              <span className="text-sm text-slate-700">{r.label}</span>
              <span className="text-xs text-slate-400 ml-auto">{r.sub}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Notificaciones ────────────────────────────────
function Notifications() {
  const [open, setOpen] = useState(false);
  const [notifs, setNotifs] = useState([]);
  const ref = useRef();

  useEffect(() => {
    fetch("/api/notifications").then(r => r.json()).then(setNotifs).catch(() => {});
    const interval = setInterval(() => {
      fetch("/api/notifications").then(r => r.json()).then(setNotifs).catch(() => {});
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handler = (e) => { if (!ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const dotColor = { stock:"bg-red-500", prestamo:"bg-amber-500", info:"bg-blue-500" };

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(!open)}
        className="relative p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition">
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>{Icon.bell}</svg>
        {notifs.length > 0 && <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"/>}
      </button>
      {open && (
        <div className="absolute top-full right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-200 z-50 max-h-96 overflow-y-auto">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-800">Notificaciones</p>
            <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-600">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>{Icon.x}</svg>
            </button>
          </div>
          {notifs.length === 0
             <p className="text-xs text-slate-400 px-4 py-4 text-center">Sin notificaciones pendientes</p>
            : notifs.map((n, i) => (
              <div key={i} className={`px-4 py-3 border-b border-slate-50 ${n.urgente ? "bg-red-50" : ""}`}>
                <div className="flex items-start gap-2">
                  <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${dotColor[n.tipo] ? "bg-slate-400"}`}/>
                  <div>
                    <p className="text-xs font-medium text-slate-800">{n.titulo}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{n.mensaje}</p>
                  </div>
                </div>
              </div>
            ))
          }
        </div>
      )}
    </div>
  );
}

// ── User Menu ─────────────────────────────────────
function UserMenu({ user }) {
  const [open, setOpen] = useState(false);
  const ref = useRef();
  const initials = (user.nombre_usuario ?? "U").slice(0, 2).toUpperCase();

  useEffect(() => {
    const handler = (e) => { if (!ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(!open)}
        className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-xl hover:bg-slate-100 transition group">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-xs font-bold ring-2 ring-blue-200 group-hover:ring-blue-300 transition">
          {initials}
        </div>
        <div className="text-left hidden sm:block">
          <p className="text-xs font-semibold text-slate-700 leading-none">{user.nombre_usuario ? "Usuario"}</p>
          <p className="text-xs text-slate-400 mt-0.5">{user.rol_acceso ? "Operador"}</p>
        </div>
        <svg className={`w-3.5 h-3.5 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/>
        </svg>
      </button>
      {open && (
        <div className="absolute top-full right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200 z-50 overflow-hidden">
          <div className="px-4 py-3 bg-gradient-to-br from-blue-50 to-slate-50 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-sm font-bold">
                {initials}
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800">{user.nombre_usuario ? "Usuario"}</p>
                <p className="text-xs text-slate-500">{user.email ? ""}</p>
                <span className="inline-block mt-0.5 text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full font-medium">
                  {user.rol_acceso ? "Operador"}
                </span>
              </div>
            </div>
          </div>
          <div className="py-1">
            <Link to="/perfil"
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition"
              onClick={() => setOpen(false)}>
              <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
              </svg>
              Mi perfil
            </Link>
            <Link to="/configuracion"
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition"
              onClick={() => setOpen(false)}>
              <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
              </svg>
              Configuración
            </Link>
          </div>
          <div className="border-t border-slate-100 py-1">
            <Link to="/logout" as="button"
              className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
              </svg>
              Cerrar sesión
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Toggle Tema ───────────────────────────────────
function ThemeToggle({ dark, setDark }) {
  return (
    <div className={`flex items-center rounded-2xl border p-0.5 gap-0.5 transition-colors
      ${dark ? "bg-slate-800 border-slate-700" : "bg-slate-100 border-slate-200"}`}>
      <button onClick={() => setDark(false)}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all
          ${!dark ? "bg-white text-slate-700 shadow-sm" : "text-slate-500 hover:text-slate-400"}`}>
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z"/>
        </svg>
        Claro
      </button>
      <button onClick={() => setDark(true)}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all
          ${dark ? "bg-slate-700 text-slate-200 shadow-sm" : "text-slate-500 hover:text-slate-600"}`}>
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/>
        </svg>
        Oscuro
      </button>
    </div>
  );
}

// ── Layout principal ──────────────────────────────
export default function AppLayout({ children, section }) {
  const { pathname: url } = useLocation();
  const user = typeof window !== "undefined" ? JSON.parse(localStorage.getItem("smartlynk_user") || "null") : null;

  const [dark, setDark] = useState(() => {
    if (typeof window !== "undefined") return localStorage.getItem("theme") === "dark";
    return false;
  });

  useEffect(() => {
    localStorage.setItem("theme", dark ? "dark" : "light");
    if (dark) {
      document.documentElement.classList.add("dark");
      document.documentElement.style.colorScheme = "dark";
    } else {
      document.documentElement.classList.remove("dark");
      document.documentElement.style.colorScheme = "light";
    }
  }, [dark]);

  return (
    <div className={`flex h-screen overflow-hidden font-sans transition-colors duration-200 ${dark ? "bg-slate-900" : "bg-slate-50"}`}>

      {/* SIDEBAR */}
      <aside className="w-64 flex-shrink-0 flex flex-col bg-gradient-to-b from-blue-900 to-blue-800">

        {/* LOGO SVG Smartlynk — arriba */}
        <div className="px-4 py-4 border-b border-white/10">
          <div className="bg-white/[0.06] rounded-xl px-3 py-3">
            <SmartlynkLogo />
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          <p className="text-blue-300 text-xs font-semibold uppercase tracking-wider px-3 mb-2">Principal</p>
          {NAV.map(item => (
            <NavLink key={item.href} {...item} active={url.startsWith(item.href)} />
          ))}
          <div className="pt-3 mt-1 border-t border-white/10">
            <p className="text-blue-300 text-xs font-semibold uppercase tracking-wider px-3 mb-2">Flotilla</p>
            <NavLink href="/flotilla" icon={Icon.truck} label="Flotilla Vehicular" active={url.startsWith("/flotilla")} />
          </div>
        </nav>

        {/* Configuración abajo */}
        <div className="px-3 py-3 border-t border-white/10">
          <NavLink href="/configuracion" icon={Icon.settings} label="Configuración" active={url.startsWith("/configuracion")} />
        </div>
      </aside>

      {/* MAIN */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* TOPBAR */}
        <header className={`px-6 py-3 flex items-center gap-4 flex-shrink-0 border-b transition-colors duration-200
          ${dark ? "bg-slate-900 border-slate-700" : "bg-white border-slate-200 shadow-sm"}`}>
          <GlobalSearch />

          <div className="flex items-center gap-2 ml-auto">

            {/* Google Sheets */}
            <button onClick={syncSheets}
              className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-600 bg-slate-50 hover:bg-green-50 hover:text-green-700 border border-slate-200 hover:border-green-300 rounded-xl transition">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="3" width="18" height="18" rx="2" fill="#34A853" opacity=".15"/>
                <path d="M7 8h10M7 12h10M7 16h6" stroke="#34A853" strokeWidth="1.5" strokeLinecap="round"/>
                <circle cx="19" cy="19" r="4" fill="#34A853"/>
                <path d="M17.5 19l1 1 2-2" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Google Sheets
            </button>

            {/* Exportar */}
            <button onClick={() => exportExcel(section ? "inventario")}
              className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-600 bg-slate-50 hover:bg-emerald-50 hover:text-emerald-700 border border-slate-200 hover:border-emerald-300 rounded-xl transition">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>{Icon.download}</svg>
              Exportar
            </button>

            {/* Imprimir */}
            <button onClick={() => window.print()}
              className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-600 bg-slate-50 hover:bg-blue-50 hover:text-blue-700 border border-slate-200 hover:border-blue-300 rounded-xl transition">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>{Icon.print}</svg>
              Imprimir
            </button>

            <Notifications />

            <div className="w-px h-6 bg-slate-200 mx-1" />

            {/* Toggle tema */}
            <ThemeToggle dark={dark} setDark={setDark} />

            <div className="w-px h-6 bg-slate-200 mx-1" />

            {/* Usuario */}
            <UserMenu user={user} />
          </div>
        </header>

        {/* PAGE */}
        <main className={`flex-1 overflow-y-auto p-6 transition-colors duration-200 ${dark ? "bg-slate-900" : "bg-slate-50"}`}>
          {children}
        </main>
      </div>

      <ToastContainer />
    </div>
  );
}
