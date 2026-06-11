import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { WrenchScrewdriverIcon, TruckIcon, DocumentCheckIcon, ArrowLeftOnRectangleIcon } from "@heroicons/react/24/outline";

export default function KioscoMenu() {
  const navigate = useNavigate();
  const [session, setSession] = useState(null);

  useEffect(() => {
    const data = localStorage.getItem("kiosco_session");
    if (!data) {
      navigate("/kiosco/login");
      return;
    }
    const parsedData = JSON.parse(data);
    setSession(parsedData);

    // Auto-redirect if only 1 permission
    if (parsedData.modulos && parsedData.modulos.length === 1) {
      const module = parsedData.modulos[0];
      navigate(`/kiosco/${module}`);
    }
  }, [navigate]);

  if (!session) return null;

  const getModuleIcon = (mod) => {
    switch (mod) {
      case "prestamos": return <WrenchScrewdriverIcon className="h-20 w-20 mb-6 text-amber-500" />;
      case "vehiculos": return <TruckIcon className="h-20 w-20 mb-6 text-emerald-500" />;
      case "resguardos": return <DocumentCheckIcon className="h-20 w-20 mb-6 text-blue-500" />;
      default: return null;
    }
  };

  const getModuleTitle = (mod) => {
    switch (mod) {
      case "prestamos": return "Préstamos Operativos";
      case "vehiculos": return "Flotilla Vehicular";
      case "resguardos": return "Resguardos y Entregas";
      default: return "";
    }
  };

  const getModuleDescription = (mod) => {
    switch (mod) {
      case "prestamos": return "Solicita o devuelve herramientas de uso temporal.";
      case "vehiculos": return "Registra la salida o regreso de tu vehículo asignado.";
      case "resguardos": return "Firma la recepción de tus equipos fijos (Laptops, Celulares, etc).";
      default: return "";
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("kiosco_session");
    navigate("/kiosco/login");
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-900 text-slate-100">
      
      {/* Header */}
      <header className="flex items-center justify-between px-8 py-6 bg-slate-800/50 backdrop-blur-md border-b border-slate-700">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 shadow-lg shadow-blue-600/30">
            <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold">Autoservicio</h1>
            <p className="text-sm text-slate-400">Gafete: {session.gafete}</p>
          </div>
        </div>
        <button 
          onClick={handleLogout}
          className="flex items-center gap-2 rounded-xl bg-slate-700/50 px-6 py-3 font-semibold text-slate-300 transition-colors hover:bg-red-500/20 hover:text-red-400"
        >
          <ArrowLeftOnRectangleIcon className="h-6 w-6" />
          Cerrar Sesión
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-8">
        <h2 className="text-4xl font-extrabold mb-4 text-center">¿Qué deseas hacer hoy?</h2>
        <p className="text-xl text-slate-400 mb-12 text-center max-w-2xl">
          Selecciona el módulo al que deseas acceder.
        </p>

        <div className="flex flex-wrap justify-center gap-8 w-full max-w-6xl">
          {session.modulos?.map((mod) => (
            <button
              key={mod}
              onClick={() => navigate(`/kiosco/${mod}`)}
              className="group flex w-full sm:w-[340px] flex-col items-center rounded-3xl bg-slate-800 p-10 text-center shadow-2xl ring-1 ring-white/10 transition-all hover:-translate-y-2 hover:bg-slate-700 hover:ring-blue-500/50"
            >
              <div className="transition-transform group-hover:scale-110">
                {getModuleIcon(mod)}
              </div>
              <h3 className="text-2xl font-bold mb-3">{getModuleTitle(mod)}</h3>
              <p className="text-slate-400 text-sm">{getModuleDescription(mod)}</p>
            </button>
          ))}
        </div>
      </main>

    </div>
  );
}
