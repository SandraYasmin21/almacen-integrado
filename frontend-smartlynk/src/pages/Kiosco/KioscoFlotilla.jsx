import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { TruckIcon, ArrowLeftIcon, MapPinIcon } from "@heroicons/react/24/outline";

export default function KioscoFlotilla() {
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [estadoActual, setEstadoActual] = useState(null); // null, "disponible" o "en_ruta"
  const [km, setKm] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const data = localStorage.getItem("kiosco_session");
    if (!data) {
      navigate("/kiosco/login");
      return;
    }
    setSession(JSON.parse(data));
    
    // Simular que el empleado tiene un vehículo "Disponible" (no ha salido)
    setEstadoActual("disponible");
  }, [navigate]);

  const handleAction = async () => {
    if (!km) {
      toast.error("Ingresa el kilometraje actual del vehículo.");
      return;
    }

    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      if (estadoActual === "disponible") {
        toast.success("¡Salida registrada! Buen viaje.");
        setEstadoActual("en_ruta");
      } else {
        toast.success("¡Regreso registrado! Bienvenido.");
        setEstadoActual("disponible");
      }
      setKm("");
    } catch (error) {
      toast.error("Ocurrió un error al registrar.");
    } finally {
      setLoading(false);
    }
  };

  const handleNumpadClick = (num) => {
    if (km.length < 7) setKm((prev) => prev + num);
  };

  const handleBackspace = () => {
    setKm((prev) => prev.slice(0, -1));
  };

  if (!session) return null;

  return (
    <div className="flex min-h-screen flex-col bg-slate-900 text-slate-100">
      {/* Header */}
      <header className="flex items-center justify-between px-8 py-6 bg-slate-800/50 backdrop-blur-md border-b border-slate-700">
        <div className="flex items-center gap-6">
          <button onClick={() => navigate("/kiosco/menu")} className="rounded-full bg-slate-700 p-3 hover:bg-slate-600 transition">
            <ArrowLeftIcon className="h-6 w-6" />
          </button>
          <div className="flex items-center gap-3 text-emerald-500">
            <TruckIcon className="h-8 w-8" />
            <h1 className="text-2xl font-bold text-white">Flotilla Vehicular</h1>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm font-semibold text-white">Gafete: {session.gafete}</p>
          <p className="text-xs text-slate-400">Usuario Demo</p>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-2 gap-12">
          
          {/* Info Side */}
          <div className="flex flex-col justify-center">
            <h2 className="text-3xl font-extrabold mb-6">Vehículo Asignado</h2>
            <div className="rounded-3xl bg-slate-800 p-8 ring-1 ring-white/10 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-6">
                {estadoActual === 'en_ruta' ? (
                   <span className="inline-flex items-center gap-2 rounded-full bg-amber-500/20 px-4 py-2 text-sm font-bold text-amber-400">
                   <MapPinIcon className="h-4 w-4" /> En Ruta
                 </span>
                ) : (
                  <span className="inline-flex items-center gap-2 rounded-full bg-emerald-500/20 px-4 py-2 text-sm font-bold text-emerald-400">
                    <TruckIcon className="h-4 w-4" /> Disponible
                  </span>
                )}
              </div>
              <div className="text-6xl mb-4">🛻</div>
              <h3 className="text-2xl font-bold text-white mb-1">Ford Ranger Blanca</h3>
              <p className="text-slate-400 font-mono mb-8">PLACA: AB-123-CD</p>
              
              <div className="space-y-4 border-t border-slate-700 pt-6">
                <div>
                  <p className="text-sm text-slate-500">Último Kilometraje Registrado</p>
                  <p className="text-2xl font-mono font-bold text-emerald-400">45,230 km</p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Panel */}
          <div className="flex flex-col justify-center">
            <div className="rounded-3xl bg-slate-800 p-8 ring-1 ring-white/10 shadow-2xl">
              <h3 className="text-xl font-bold mb-6 text-center">
                {estadoActual === 'disponible' ? "Registrar Salida" : "Registrar Regreso"}
              </h3>
              
              <div className="mb-8">
                <label className="block text-sm font-medium text-slate-400 mb-2 text-center">Ingresa el Kilometraje Actual</label>
                <div className="flex h-16 w-full items-center justify-center rounded-2xl border-2 border-emerald-500/50 bg-slate-900 px-6 text-center shadow-inner">
                  <span className="text-3xl font-mono font-bold tracking-wider text-emerald-400">{km || "0"}</span>
                  <span className="ml-2 text-emerald-600 font-bold">km</span>
                </div>
              </div>

              {/* Numpad Inline */}
              <div className="grid grid-cols-3 gap-3 mb-8">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                  <button
                    key={num}
                    onClick={() => handleNumpadClick(num.toString())}
                    className="h-14 rounded-xl bg-slate-700 text-xl font-bold text-white hover:bg-slate-600 active:scale-95 transition-all"
                  >
                    {num}
                  </button>
                ))}
                <button
                  onClick={handleBackspace}
                  className="h-14 rounded-xl bg-slate-700/50 text-slate-300 hover:bg-slate-600 hover:text-white active:scale-95 transition-all flex items-center justify-center"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M3 12l6.414 6.414a2 2 0 001.414.586H19a2 2 0 002-2V7a2 2 0 00-2-2h-8.172a2 2 0 00-1.414.586L3 12z" />
                  </svg>
                </button>
                <button
                  onClick={() => handleNumpadClick("0")}
                  className="h-14 rounded-xl bg-slate-700 text-xl font-bold text-white hover:bg-slate-600 active:scale-95 transition-all"
                >
                  0
                </button>
                <button
                  onClick={() => setKm("")}
                  className="h-14 rounded-xl bg-slate-700/50 text-slate-300 hover:bg-slate-600 hover:text-white active:scale-95 transition-all text-sm font-bold uppercase"
                >
                  CLR
                </button>
              </div>

              <button
                onClick={handleAction}
                disabled={loading || !km}
                className={`w-full rounded-2xl py-4 text-lg font-bold text-white shadow-xl transition-all active:scale-95 ${
                  estadoActual === 'disponible' 
                  ? 'bg-amber-600 hover:bg-amber-500 shadow-amber-600/30' 
                  : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/30'
                } disabled:opacity-50 disabled:active:scale-100`}
              >
                {loading ? "Procesando..." : (estadoActual === 'disponible' ? "Confirmar Salida" : "Confirmar Regreso")}
              </button>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
