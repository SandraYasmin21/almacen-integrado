import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import SignatureCanvas from "react-signature-canvas";
import { DocumentCheckIcon, ArrowLeftIcon, DevicePhoneMobileIcon, ComputerDesktopIcon, HandRaisedIcon } from "@heroicons/react/24/outline";

export default function KioscoResguardos() {
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(false);
  const sigCanvas = useRef({});

  // Simular resguardos pendientes
  const resguardosPendientes = [
    { id: 1, tipo: "laptop", nombre: "Laptop Dell Latitude 5420", sku: "LT-5420-001" },
    { id: 2, tipo: "celular", nombre: "iPhone 13", sku: "IP-13-892" }
  ];

  useEffect(() => {
    const data = localStorage.getItem("kiosco_session");
    if (!data) {
      navigate("/kiosco/login");
      return;
    }
    setSession(JSON.parse(data));
  }, [navigate]);

  const handleClearSignature = () => {
    sigCanvas.current.clear();
  };

  const handleConfirmar = async () => {
    if (sigCanvas.current.isEmpty()) {
      toast.error("Por favor, ingresa tu firma en el recuadro.");
      return;
    }

    const signatureBase64 = sigCanvas.current.getTrimmedCanvas().toDataURL("image/png");
    setLoading(true);

    try {
      // Simular envío de firma
      await new Promise(resolve => setTimeout(resolve, 1500));
      toast.success("¡Firma guardada! Resguardo completado exitosamente.");
      
      // Limpiar y volver al menú
      setTimeout(() => {
        navigate("/kiosco/menu");
      }, 2000);

    } catch (error) {
      toast.error("Error al guardar la firma.");
    } finally {
      setLoading(false);
    }
  };

  if (!session) return null;

  return (
    <div className="flex min-h-screen flex-col bg-slate-900 text-slate-100">
      <header className="flex items-center justify-between px-8 py-6 bg-slate-800/50 backdrop-blur-md border-b border-slate-700">
        <div className="flex items-center gap-6">
          <button onClick={() => navigate("/kiosco/menu")} className="rounded-full bg-slate-700 p-3 hover:bg-slate-600 transition">
            <ArrowLeftIcon className="h-6 w-6" />
          </button>
          <div className="flex items-center gap-3 text-blue-500">
            <DocumentCheckIcon className="h-8 w-8" />
            <h1 className="text-2xl font-bold text-white">Firma de Resguardos</h1>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm font-semibold text-white">Gafete: {session.gafete}</p>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-12">
          
          {/* Listado de Activos */}
          <div className="flex flex-col">
            <h2 className="text-3xl font-extrabold mb-6">Equipos por Firmar</h2>
            <div className="rounded-3xl bg-slate-800 p-8 ring-1 ring-white/10 shadow-2xl flex-1">
              <p className="text-slate-400 mb-6">Revisa los siguientes equipos que te han sido asignados y confirma de recibido.</p>
              
              <div className="space-y-4">
                {resguardosPendientes.map((item) => (
                  <div key={item.id} className="flex items-center gap-4 bg-slate-700/50 p-4 rounded-2xl border border-slate-600">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/20 text-blue-400">
                      {item.tipo === 'laptop' ? <ComputerDesktopIcon className="h-6 w-6" /> : <DevicePhoneMobileIcon className="h-6 w-6" />}
                    </div>
                    <div>
                      <h3 className="font-bold text-white">{item.nombre}</h3>
                      <p className="font-mono text-sm text-slate-400">{item.sku}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 bg-blue-900/30 border border-blue-500/30 p-4 rounded-xl flex gap-4 text-sm text-blue-200">
                 <HandRaisedIcon className="h-6 w-6 shrink-0 text-blue-400" />
                 <p>Al firmar este documento, aceptas ser responsable por el cuidado y buen uso del equipo detallado anteriormente.</p>
              </div>
            </div>
          </div>

          {/* Signature Panel */}
          <div className="flex flex-col">
            <h2 className="text-3xl font-extrabold mb-6">Firma Digital</h2>
            <div className="rounded-3xl bg-slate-800 p-8 ring-1 ring-white/10 shadow-2xl flex-1 flex flex-col">
              
              <div className="bg-white rounded-2xl overflow-hidden border-4 border-slate-600 flex-1 relative mb-6">
                <SignatureCanvas 
                  ref={sigCanvas} 
                  penColor="blue"
                  canvasProps={{ className: "w-full h-[300px] cursor-crosshair touch-none" }} 
                />
                <p className="absolute bottom-4 w-full text-center text-slate-300 font-medium pointer-events-none uppercase tracking-widest opacity-50">
                  Firma aquí
                </p>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={handleClearSignature}
                  className="w-1/3 rounded-2xl bg-slate-700 py-4 font-bold text-white transition hover:bg-slate-600"
                >
                  Limpiar
                </button>
                <button
                  onClick={handleConfirmar}
                  disabled={loading}
                  className="w-2/3 rounded-2xl bg-blue-600 py-4 text-lg font-bold text-white shadow-xl shadow-blue-600/30 transition hover:bg-blue-500 disabled:opacity-50"
                >
                  {loading ? "Procesando..." : "Confirmar Firma y Aceptar"}
                </button>
              </div>

            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
