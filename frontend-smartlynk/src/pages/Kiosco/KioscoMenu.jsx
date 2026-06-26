import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import SignatureCanvas from "react-signature-canvas";
import {
  ArrowLeftOnRectangleIcon,
  BackspaceIcon,
  ComputerDesktopIcon,
  DevicePhoneMobileIcon,
  DocumentCheckIcon,
  MapPinIcon,
  PlusIcon,
  QrCodeIcon,
  TrashIcon,
  TruckIcon,
  WrenchScrewdriverIcon,
} from "@heroicons/react/24/outline";

const resguardosPendientes = [
  { id: 1, tipo: "laptop", nombre: "Laptop Dell Latitude 5420", sku: "LT-5420-001" },
  { id: 2, tipo: "celular", nombre: "iPhone 13", sku: "IP-13-892" },
];

export default function KioscoMenu() {
  const navigate = useNavigate();
  const signatureRef = useRef(null);
  const [session, setSession] = useState(null);
  const [sku, setSku] = useState("");
  const [carrito, setCarrito] = useState([]);
  const [km, setKm] = useState("");
  const [estadoVehiculo, setEstadoVehiculo] = useState("disponible");
  const [loading, setLoading] = useState(null);

  useEffect(() => {
    const data = localStorage.getItem("kiosco_session");
    if (!data) {
      navigate("/kiosco/login");
      return;
    }

    setSession(JSON.parse(data));
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("kiosco_session");
    navigate("/kiosco/login");
  };

  const handleAddSku = (event) => {
    event.preventDefault();
    if (!sku.trim()) return;

    setCarrito((items) => [
      ...items,
      {
        id: crypto.randomUUID(),
        sku: sku.toUpperCase(),
        nombre: "Herramienta / Material",
        tipo: "Préstamo",
      },
    ]);
    setSku("");
    toast.success("Material agregado a la bandeja");
  };

  const handleConfirmarMateriales = async () => {
    if (carrito.length === 0) {
      toast.error("Agrega al menos un material o herramienta");
      return;
    }

    setLoading("materiales");
    await new Promise((resolve) => setTimeout(resolve, 800));
    setCarrito([]);
    setLoading(null);
    toast.success("Materiales registrados correctamente");
  };

  const addKmDigit = (digit) => {
    if (km.length < 7) setKm((value) => value + digit);
  };

  const handleVehiculo = async () => {
    if (!km) {
      toast.error("Ingresa el kilometraje actual");
      return;
    }

    setLoading("vehiculo");
    await new Promise((resolve) => setTimeout(resolve, 800));
    setEstadoVehiculo((estado) => (estado === "disponible" ? "en_ruta" : "disponible"));
    setKm("");
    setLoading(null);
    toast.success(estadoVehiculo === "disponible" ? "Salida de vehículo registrada" : "Regreso de vehículo registrado");
  };

  const handleResguardo = async () => {
    if (!signatureRef.current || signatureRef.current.isEmpty()) {
      toast.error("Firma en el recuadro para aceptar los resguardos");
      return;
    }

    setLoading("resguardos");
    await new Promise((resolve) => setTimeout(resolve, 900));
    signatureRef.current.clear();
    setLoading(null);
    toast.success("Resguardos firmados correctamente");
  };

  if (!session) return null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="sticky top-0 z-20 border-b border-slate-800 bg-slate-950/95 px-6 py-4 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-blue-400">Módulo independiente</p>
            <h1 className="text-2xl font-black text-white">Autoservicio de empleado</h1>
            <p className="text-sm text-slate-400">Materiales, vehículos y resguardos en una sola pantalla</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="rounded-2xl border border-slate-800 bg-slate-900 px-4 py-2 text-right">
              <p className="text-xs text-slate-500">Gafete</p>
              <p className="font-mono text-lg font-bold text-white">{session.gafete}</p>
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
        <section className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
            <div className="mb-5 flex items-center gap-3">
              <div className="rounded-2xl bg-amber-500/15 p-3 text-amber-400">
                <WrenchScrewdriverIcon className="h-7 w-7" />
              </div>
              <div>
                <h2 className="text-xl font-black text-white">Materiales y herramientas</h2>
                <p className="text-sm text-slate-400">Escanea lo que tomas o devuelves.</p>
              </div>
            </div>

            <form onSubmit={handleAddSku} className="space-y-4">
              <div className="relative">
                <QrCodeIcon className="absolute left-4 top-1/2 h-6 w-6 -translate-y-1/2 text-slate-500" />
                <input
                  value={sku}
                  onChange={(event) => setSku(event.target.value)}
                  className="h-16 w-full rounded-2xl border-2 border-slate-700 bg-slate-950 pl-14 pr-4 font-mono text-xl text-white outline-none transition focus:border-amber-500"
                  placeholder="Escanear SKU..."
                  autoFocus
                />
              </div>
              <button className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-slate-800 font-bold text-white transition hover:bg-slate-700">
                <PlusIcon className="h-5 w-5" />
                Agregar a bandeja
              </button>
            </form>

            <div className="mt-5 max-h-64 space-y-3 overflow-y-auto">
              {carrito.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-700 p-8 text-center text-sm font-semibold text-slate-500">
                  Sin materiales en bandeja
                </div>
              ) : (
                carrito.map((item) => (
                  <div key={item.id} className="flex items-center justify-between rounded-2xl bg-slate-800 p-4">
                    <div>
                      <p className="font-bold text-white">{item.nombre}</p>
                      <p className="font-mono text-sm text-amber-400">{item.sku}</p>
                    </div>
                    <button
                      onClick={() => setCarrito((items) => items.filter((current) => current.id !== item.id))}
                      className="rounded-xl p-2 text-slate-400 transition hover:bg-red-500/10 hover:text-red-300"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                ))
              )}
            </div>

            <button
              onClick={handleConfirmarMateriales}
              disabled={loading === "materiales" || carrito.length === 0}
              className="mt-5 h-14 w-full rounded-2xl bg-amber-600 text-lg font-black text-white shadow-lg shadow-amber-600/20 transition hover:bg-amber-500 disabled:opacity-50"
            >
              {loading === "materiales" ? "Guardando..." : "Confirmar materiales"}
            </button>
          </div>

          <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
            <div className="mb-5 flex items-center gap-3">
              <div className="rounded-2xl bg-emerald-500/15 p-3 text-emerald-400">
                <TruckIcon className="h-7 w-7" />
              </div>
              <div>
                <h2 className="text-xl font-black text-white">Vehículo asignado</h2>
                <p className="text-sm text-slate-400">Salida y regreso de unidad.</p>
              </div>
            </div>

            <div className="rounded-3xl bg-slate-950 p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-4xl">🛻</p>
                  <h3 className="mt-3 text-xl font-black text-white">Ford Ranger Blanca</h3>
                  <p className="font-mono text-sm text-slate-500">PLACA: AB-123-CD</p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-black ${estadoVehiculo === "en_ruta" ? "bg-amber-500/15 text-amber-300" : "bg-emerald-500/15 text-emerald-300"}`}>
                  {estadoVehiculo === "en_ruta" ? "En ruta" : "Disponible"}
                </span>
              </div>
              <div className="mt-5 border-t border-slate-800 pt-4">
                <p className="text-xs font-bold uppercase text-slate-500">Último kilometraje</p>
                <p className="font-mono text-2xl font-black text-emerald-400">45,230 km</p>
              </div>
            </div>

            <div className="mt-5 rounded-3xl bg-slate-950 p-5">
              <label className="mb-3 block text-center text-sm font-bold text-slate-400">Kilometraje actual</label>
              <div className="mb-4 flex h-14 items-center justify-center rounded-2xl border-2 border-emerald-500/40 bg-slate-900">
                <span className="font-mono text-3xl font-black text-emerald-400">{km || "0"}</span>
                <span className="ml-2 font-bold text-emerald-700">km</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                  <button key={num} onClick={() => addKmDigit(String(num))} className="h-12 rounded-xl bg-slate-800 text-lg font-black text-white transition hover:bg-slate-700">
                    {num}
                  </button>
                ))}
                <button onClick={() => setKm((value) => value.slice(0, -1))} className="flex h-12 items-center justify-center rounded-xl bg-slate-800 text-slate-300 transition hover:bg-slate-700">
                  <BackspaceIcon className="h-6 w-6" />
                </button>
                <button onClick={() => addKmDigit("0")} className="h-12 rounded-xl bg-slate-800 text-lg font-black text-white transition hover:bg-slate-700">
                  0
                </button>
                <button onClick={() => setKm("")} className="h-12 rounded-xl bg-slate-800 text-xs font-black text-slate-300 transition hover:bg-slate-700">
                  CLR
                </button>
              </div>
              <button
                onClick={handleVehiculo}
                disabled={loading === "vehiculo" || !km}
                className={`mt-4 h-14 w-full rounded-2xl text-lg font-black text-white shadow-lg transition disabled:opacity-50 ${
                  estadoVehiculo === "disponible" ? "bg-amber-600 shadow-amber-600/20 hover:bg-amber-500" : "bg-emerald-600 shadow-emerald-600/20 hover:bg-emerald-500"
                }`}
              >
                {loading === "vehiculo" ? "Guardando..." : estadoVehiculo === "disponible" ? "Registrar salida" : "Registrar regreso"}
              </button>
            </div>
          </div>
        </section>

        <aside className="rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
          <div className="mb-5 flex items-center gap-3">
            <div className="rounded-2xl bg-blue-500/15 p-3 text-blue-400">
              <DocumentCheckIcon className="h-7 w-7" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white">Resguardos</h2>
              <p className="text-sm text-slate-400">Firma equipos asignados.</p>
            </div>
          </div>

          <div className="space-y-3">
            {resguardosPendientes.map((item) => (
              <div key={item.id} className="flex items-center gap-3 rounded-2xl bg-slate-800 p-4">
                <div className="rounded-xl bg-blue-500/15 p-3 text-blue-400">
                  {item.tipo === "laptop" ? <ComputerDesktopIcon className="h-5 w-5" /> : <DevicePhoneMobileIcon className="h-5 w-5" />}
                </div>
                <div>
                  <p className="text-sm font-bold text-white">{item.nombre}</p>
                  <p className="font-mono text-xs text-slate-500">{item.sku}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-5 overflow-hidden rounded-2xl border-4 border-slate-700 bg-white">
            <SignatureCanvas ref={signatureRef} penColor="blue" canvasProps={{ className: "h-[220px] w-full cursor-crosshair touch-none" }} />
          </div>

          <div className="mt-4 grid grid-cols-[120px_1fr] gap-3">
            <button onClick={() => signatureRef.current?.clear()} className="h-12 rounded-2xl bg-slate-800 font-bold text-white transition hover:bg-slate-700">
              Limpiar
            </button>
            <button
              onClick={handleResguardo}
              disabled={loading === "resguardos"}
              className="h-12 rounded-2xl bg-blue-600 font-black text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-500 disabled:opacity-50"
            >
              {loading === "resguardos" ? "Guardando..." : "Firmar resguardos"}
            </button>
          </div>
        </aside>
      </main>
    </div>
  );
}
