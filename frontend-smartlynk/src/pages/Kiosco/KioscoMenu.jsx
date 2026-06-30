import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeftOnRectangleIcon,
  ComputerDesktopIcon,
  DocumentCheckIcon,
  TruckIcon,
  WrenchScrewdriverIcon,
} from "@heroicons/react/24/outline";
import { clearKioscoSession, kioscoFetch, requireKioscoProfile } from "@/lib/kioscoAuth";

export default function KioscoMenu() {
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [prestamos, setPrestamos] = useState([]);

  useEffect(() => {
    requireKioscoProfile(navigate).then((profile) => {
      if (profile) setSession(profile);
    });
  }, [navigate]);

  useEffect(() => {
    if (session) cargarPrestamos();
  }, [session]);

  const cargarPrestamos = async () => {
    try {
      const response = await kioscoFetch("/api/kiosco/mis-prestamos");
      const payload = await response.json().catch(() => ({}));
      if (response.ok) setPrestamos(payload.prestamos || []);
    } catch {
      setPrestamos([]);
    }
  };

  const handleLogout = async () => {
    try {
      await kioscoFetch("/api/kiosco/logout", { method: "POST" });
    } finally {
      clearKioscoSession();
      navigate("/kiosco/login");
    }
  };

  if (!session) return null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="sticky top-0 z-20 border-b border-slate-800 bg-slate-950/95 px-6 py-4 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-blue-400">Modulo independiente</p>
            <h1 className="text-2xl font-black text-white">Autoservicio de empleado</h1>
            <p className="text-sm text-slate-400">Materiales, vehiculos y resguardos con sesion de kiosco real</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="rounded-2xl border border-slate-800 bg-slate-900 px-4 py-2 text-right">
              <p className="text-xs text-slate-500">Gafete</p>
              <p className="font-mono text-lg font-bold text-white">{session.empleado?.numero_gafete || "-"}</p>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 rounded-2xl bg-slate-800 px-4 py-3 text-sm font-bold text-slate-200 transition hover:bg-red-500/20 hover:text-red-300"
            >
              <ArrowLeftOnRectangleIcon className="h-5 w-5" />
              Salir
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl gap-6 px-6 py-6 xl:grid-cols-[1fr_380px]">
        <section className="grid gap-6 lg:grid-cols-3">
          <ActionCard
            title="Prestamos operativos"
            description="Escanear SKU y registrar salida real de material o herramienta."
            icon={WrenchScrewdriverIcon}
            color="amber"
            onClick={() => navigate("/kiosco/prestamos")}
          />
          <ActionCard
            title="Flotilla vehicular"
            description="Registrar salida o regreso del vehiculo asignado."
            icon={TruckIcon}
            color="emerald"
            onClick={() => navigate("/kiosco/vehiculos")}
          />
          <ActionCard
            title="Firma de resguardos"
            description="Capturar firma digital y guardar el resguardo contra API."
            icon={DocumentCheckIcon}
            color="blue"
            onClick={() => navigate("/kiosco/resguardos")}
          />
        </section>

        <aside className="rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
          <div className="mb-5 flex items-center gap-3">
            <div className="rounded-2xl bg-blue-500/15 p-3 text-blue-400">
              <DocumentCheckIcon className="h-7 w-7" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white">Mis prestamos</h2>
              <p className="text-sm text-slate-400">{prestamos.length} activos</p>
            </div>
          </div>

          <div className="space-y-3">
            {prestamos.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-700 p-8 text-center text-sm font-semibold text-slate-500">
                Sin prestamos activos
              </div>
            ) : (
              prestamos.map((item) => (
                <div key={item.asignacion_id} className="flex items-center gap-3 rounded-2xl bg-slate-800 p-4">
                  <div className="rounded-xl bg-blue-500/15 p-3 text-blue-400">
                    <ComputerDesktopIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">{item.articulo}</p>
                    <p className="font-mono text-xs text-slate-500">{item.codigo_serie} (Folio: {item.folio || "-"})</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </aside>
      </main>
    </div>
  );
}

function ActionCard({ title, description, icon: Icon, color, onClick }) {
  const colors = {
    amber: "bg-amber-500/15 text-amber-400 hover:border-amber-500/50",
    emerald: "bg-emerald-500/15 text-emerald-400 hover:border-emerald-500/50",
    blue: "bg-blue-500/15 text-blue-400 hover:border-blue-500/50",
  };

  return (
    <button
      onClick={onClick}
      className="min-h-64 rounded-3xl border border-slate-800 bg-slate-900 p-6 text-left shadow-2xl transition hover:-translate-y-0.5 hover:bg-slate-800"
    >
      <div className={`mb-5 inline-flex rounded-2xl p-4 ${colors[color]}`}>
        <Icon className="h-8 w-8" />
      </div>
      <h2 className="text-xl font-black text-white">{title}</h2>
      <p className="mt-3 text-sm leading-6 text-slate-400">{description}</p>
    </button>
  );
}
