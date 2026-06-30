import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import SignatureCanvas from "react-signature-canvas";
import { DocumentCheckIcon, ArrowLeftIcon, DevicePhoneMobileIcon, ComputerDesktopIcon, HandRaisedIcon } from "@heroicons/react/24/outline";
import { kioscoFetch, requireKioscoProfile } from "@/lib/kioscoAuth";

export default function KioscoResguardos() {
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(false);
  const sigCanvas = useRef({});

  const [serieId, setSerieId] = useState("");

  useEffect(() => {
    requireKioscoProfile(navigate).then((profile) => {
      if (profile) setSession(profile);
    });
  }, [navigate]);

  const handleClearSignature = () => {
    sigCanvas.current.clear();
  };

  const handleConfirmar = async () => {
    if (!serieId) {
      toast.error("Por favor, ingresa el ID de la serie o escanea el código.");
      return;
    }

    if (sigCanvas.current.isEmpty()) {
      toast.error("Por favor, ingresa tu firma en el recuadro.");
      return;
    }

    const signatureBase64 = sigCanvas.current.getTrimmedCanvas().toDataURL("image/png");
    setLoading(true);

    try {
      const response = await kioscoFetch("/api/kiosco/resguardo", {
        method: "POST",
        body: JSON.stringify({
          serie_id: Number(serieId),
          firma_digital: signatureBase64
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || result.mensaje || "Error al procesar el resguardo");
      }

      toast.success("¡Firma guardada! Resguardo completado exitosamente.");
      
      setTimeout(() => {
        navigate("/kiosco/menu");
      }, 2000);

    } catch (error) {
      toast.error(error.message);
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
          <p className="text-sm font-semibold text-white">Gafete: {session.empleado?.numero_gafete || "-"}</p>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-12">
          
          {/* Listado de Activos */}
          <div className="flex flex-col">
            <h2 className="text-3xl font-extrabold mb-6">Equipos por Firmar</h2>
            <div className="rounded-3xl bg-slate-800 p-8 ring-1 ring-white/10 shadow-2xl flex-1">
              <p className="text-slate-400 mb-6">Escanea el código de barras del equipo o ingresa el ID de la serie que vas a resguardar.</p>
              
              <div className="space-y-4">
                  <div className="flex flex-col gap-2">
                      <label className="text-sm font-semibold text-slate-300">ID de Serie del Equipo</label>
                      <input 
                          type="number" 
                          value={serieId} 
                          onChange={(e) => setSerieId(e.target.value)} 
                          placeholder="Ej. 1" 
                          className="bg-slate-900 border border-slate-600 rounded-xl px-4 py-3 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none w-full text-lg"
                      />
                  </div>
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
