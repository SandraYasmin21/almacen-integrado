import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeftIcon, BackspaceIcon, MapPinIcon, TruckIcon } from "@heroicons/react/24/outline";
import { kioscoFetch, requireKioscoProfile } from "@/lib/kioscoAuth";

export default function KioscoFlotilla() {
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [vehiculo, setVehiculo] = useState(null);
  const [estadoActual, setEstadoActual] = useState("sin_asignacion");
  const [km, setKm] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    requireKioscoProfile(navigate).then((profile) => {
      if (profile) {
        setSession(profile);
        cargarVehiculo();
      }
    });
  }, [navigate]);

  const cargarVehiculo = async () => {
    try {
      const response = await kioscoFetch("/api/kiosco/mi-vehiculo");
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "No se pudo cargar el vehiculo asignado");

      setVehiculo(payload.vehiculo || null);
      setEstadoActual(payload.estado_operacion || "sin_asignacion");
    } catch (error) {
      toast.error(error.message || "No se pudo cargar el vehiculo asignado");
    }
  };

  const handleAction = async () => {
    if (!vehiculo?.id) {
      toast.error("No tienes un vehiculo asignado para operar.");
      return;
    }
    if (!km) {
      toast.error("Ingresa el kilometraje actual del vehiculo.");
      return;
    }

    setLoading(true);
    try {
      const endpoint = estadoActual === "en_ruta" ? "/api/kiosco/regreso-vehiculo" : "/api/kiosco/salida-vehiculo";
      const payload = estadoActual === "en_ruta"
        ? { vehiculo_id: vehiculo.id, km_final: Number(km), observaciones_retorno: "Registrado desde kiosco" }
        : { vehiculo_id: vehiculo.id, km_inicial: Number(km), motivo_viaje: "Uso operativo desde kiosco" };

      const response = await kioscoFetch(endpoint, {
        method: "POST",
        body: JSON.stringify(payload),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || result.message || "Ocurrio un error al registrar");

      toast.success(estadoActual === "en_ruta" ? "Regreso registrado correctamente" : "Salida registrada correctamente");
      setKm("");
      await cargarVehiculo();
    } catch (error) {
      toast.error(error.message || "Ocurrio un error al registrar");
    } finally {
      setLoading(false);
    }
  };

  const handleNumpadClick = (num) => {
    if (km.length < 7) setKm((prev) => prev + num);
  };

  if (!session) return null;

  const placa = vehiculo?.placa || vehiculo?.placas || "-";
  const kilometrajeActual = Number(vehiculo?.kilometraje_actual || 0).toLocaleString("es-MX");
  const disponible = estadoActual !== "en_ruta";

  return (
    <div className="flex min-h-screen flex-col bg-slate-900 text-slate-100">
      <header className="flex items-center justify-between border-b border-slate-700 bg-slate-800/50 px-8 py-6 backdrop-blur-md">
        <div className="flex items-center gap-6">
          <button onClick={() => navigate("/kiosco/menu")} className="rounded-full bg-slate-700 p-3 transition hover:bg-slate-600">
            <ArrowLeftIcon className="h-6 w-6" />
          </button>
          <div className="flex items-center gap-3 text-emerald-500">
            <TruckIcon className="h-8 w-8" />
            <h1 className="text-2xl font-bold text-white">Flotilla vehicular</h1>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm font-semibold text-white">Gafete: {session.empleado?.numero_gafete || "-"}</p>
          <p className="text-xs text-slate-400">{session.empleado?.nombre || session.empleado?.nombre_completo || ""}</p>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center p-8">
        <div className="grid w-full max-w-4xl grid-cols-1 gap-12 lg:grid-cols-2">
          <div className="flex flex-col justify-center">
            <h2 className="mb-6 text-3xl font-extrabold">Vehiculo asignado</h2>
            <div className="relative overflow-hidden rounded-3xl bg-slate-800 p-8 shadow-2xl ring-1 ring-white/10">
              <div className="absolute right-0 top-0 p-6">
                {estadoActual === "en_ruta" ? (
                  <span className="inline-flex items-center gap-2 rounded-full bg-amber-500/20 px-4 py-2 text-sm font-bold text-amber-400">
                    <MapPinIcon className="h-4 w-4" /> En ruta
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-2 rounded-full bg-emerald-500/20 px-4 py-2 text-sm font-bold text-emerald-400">
                    <TruckIcon className="h-4 w-4" /> {vehiculo ? "Disponible" : "Sin asignacion"}
                  </span>
                )}
              </div>
              <TruckIcon className="mb-4 h-16 w-16 text-emerald-400" />
              <h3 className="mb-1 text-2xl font-bold text-white">{vehiculo?.nombre || "Sin vehiculo asignado"}</h3>
              <p className="mb-8 font-mono text-slate-400">PLACA: {placa}</p>

              <div className="space-y-4 border-t border-slate-700 pt-6">
                <div>
                  <p className="text-sm text-slate-500">Ultimo kilometraje registrado</p>
                  <p className="font-mono text-2xl font-bold text-emerald-400">{kilometrajeActual} km</p>
                </div>
                {vehiculo?.codigo_vehiculo && <p className="font-mono text-xs text-slate-500">Codigo: {vehiculo.codigo_vehiculo}</p>}
              </div>
            </div>
          </div>

          <div className="flex flex-col justify-center">
            <div className="rounded-3xl bg-slate-800 p-8 shadow-2xl ring-1 ring-white/10">
              <h3 className="mb-6 text-center text-xl font-bold">{disponible ? "Registrar salida" : "Registrar regreso"}</h3>

              <div className="mb-8">
                <label className="mb-2 block text-center text-sm font-medium text-slate-400">Ingresa el kilometraje actual</label>
                <div className="flex h-16 w-full items-center justify-center rounded-2xl border-2 border-emerald-500/50 bg-slate-900 px-6 text-center shadow-inner">
                  <span className="font-mono text-3xl font-bold tracking-wider text-emerald-400">{km || "0"}</span>
                  <span className="ml-2 font-bold text-emerald-600">km</span>
                </div>
              </div>

              <div className="mb-8 grid grid-cols-3 gap-3">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                  <button key={num} onClick={() => handleNumpadClick(num.toString())} className="h-14 rounded-xl bg-slate-700 text-xl font-bold text-white transition-all hover:bg-slate-600 active:scale-95">
                    {num}
                  </button>
                ))}
                <button onClick={() => setKm((prev) => prev.slice(0, -1))} className="flex h-14 items-center justify-center rounded-xl bg-slate-700/50 text-slate-300 transition-all hover:bg-slate-600 hover:text-white active:scale-95">
                  <BackspaceIcon className="h-6 w-6" />
                </button>
                <button onClick={() => handleNumpadClick("0")} className="h-14 rounded-xl bg-slate-700 text-xl font-bold text-white transition-all hover:bg-slate-600 active:scale-95">
                  0
                </button>
                <button onClick={() => setKm("")} className="h-14 rounded-xl bg-slate-700/50 text-sm font-bold uppercase text-slate-300 transition-all hover:bg-slate-600 hover:text-white active:scale-95">
                  CLR
                </button>
              </div>

              <button
                onClick={handleAction}
                disabled={loading || !km || !vehiculo}
                className={`w-full rounded-2xl py-4 text-lg font-bold text-white shadow-xl transition-all active:scale-95 ${
                  disponible ? "bg-amber-600 shadow-amber-600/30 hover:bg-amber-500" : "bg-emerald-600 shadow-emerald-600/30 hover:bg-emerald-500"
                } disabled:opacity-50 disabled:active:scale-100`}
              >
                {loading ? "Procesando..." : disponible ? "Confirmar salida" : "Confirmar regreso"}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
