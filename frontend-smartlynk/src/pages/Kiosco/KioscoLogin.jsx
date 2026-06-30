import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { BackspaceIcon, UserIcon, LockClosedIcon } from "@heroicons/react/24/outline";
import { setKioscoSession } from "@/lib/kioscoAuth";

export default function KioscoLogin() {
  const navigate = useNavigate();
  const [gafete, setGafete] = useState("");
  const [pin, setPin] = useState("");
  const [activeInput, setActiveInput] = useState("gafete"); // "gafete" o "pin"
  const [loading, setLoading] = useState(false);

  const handleNumpadClick = (num) => {
    if (activeInput === "gafete") {
      setGafete((prev) => {
        if (prev.length >= 5) return prev;
        const nextGafete = prev + num;
        if (nextGafete.length === 5) setActiveInput("pin");
        return nextGafete;
      });
    } else {
      if (pin.length < 6) setPin((prev) => prev + num);
    }
  };

  const handleBackspace = () => {
    if (activeInput === "gafete") {
      setGafete((prev) => prev.slice(0, -1));
    } else {
      setPin((prev) => prev.slice(0, -1));
    }
  };

  const handleLogin = async () => {
    if (!gafete || !pin) {
      toast.error("Por favor ingresa tu gafete y PIN");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/kiosco/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({
          numero_gafete: gafete,
          pin: pin
        })
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(`Bienvenido ${data.empleado.nombre_completo}`);
        // Guardar sesión de kiosco (real)
        setKioscoSession({
          token: data.token,
          empleado: data.empleado,
          permisos: data.permisos,
        });
        navigate("/kiosco/menu");
      } else {
        toast.error(data.error || "Credenciales incorrectas o perfil suspendido");
        setPin("");
      }
    } catch (error) {
      toast.error("Error de conexión con el servidor");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-900 text-slate-100 selection:bg-blue-500/30">
      <div className="flex w-full flex-col lg:flex-row">
        
        {/* Left Side - Info */}
        <div className="flex flex-col justify-center px-8 py-12 lg:w-1/2 xl:px-24">
          <div className="mx-auto w-full max-w-md">
            <div className="mb-8">
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 shadow-lg shadow-blue-600/30">
                <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
              Kiosco de <span className="text-blue-500">Autoservicio</span>
            </h1>
            <p className="mt-4 text-lg text-slate-400">
              Ingresa tu número de gafete y tu PIN de seguridad para acceder a tus herramientas y vehículos asignados.
            </p>
          </div>
        </div>

        {/* Right Side - Login Panel */}
        <div className="flex items-center justify-center p-8 lg:w-1/2">
          <div className="w-full max-w-md rounded-3xl bg-slate-800 p-8 shadow-2xl ring-1 ring-white/10">
            <div className="space-y-6">
              
              {/* Inputs */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">Número de Gafete</label>
                <div 
                  className={`flex h-14 cursor-text items-center rounded-xl border-2 px-4 transition-colors ${activeInput === 'gafete' ? 'border-blue-500 bg-slate-900' : 'border-slate-700 bg-slate-900/50 hover:border-slate-600'}`}
                  onClick={() => setActiveInput("gafete")}
                >
                  <UserIcon className={`h-6 w-6 mr-3 ${activeInput === 'gafete' ? 'text-blue-500' : 'text-slate-500'}`} />
                  <span className="text-xl font-bold tracking-widest text-white">{gafete || <span className="text-slate-600">_ _ _ _ _</span>}</span>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">PIN de Seguridad</label>
                <div 
                  className={`flex h-14 cursor-text items-center rounded-xl border-2 px-4 transition-colors ${activeInput === 'pin' ? 'border-blue-500 bg-slate-900' : 'border-slate-700 bg-slate-900/50 hover:border-slate-600'}`}
                  onClick={() => setActiveInput("pin")}
                >
                  <LockClosedIcon className={`h-6 w-6 mr-3 ${activeInput === 'pin' ? 'text-blue-500' : 'text-slate-500'}`} />
                  <div className="flex gap-2">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className={`h-4 w-4 rounded-full ${i < pin.length ? 'bg-blue-500' : 'bg-slate-700'}`} />
                    ))}
                  </div>
                </div>
              </div>

              {/* Numpad */}
              <div className="mt-8 grid grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                  <button
                    key={num}
                    onClick={() => handleNumpadClick(num.toString())}
                    className="flex h-16 items-center justify-center rounded-2xl bg-slate-700 text-2xl font-bold text-white shadow-sm transition-all hover:bg-slate-600 active:scale-95"
                  >
                    {num}
                  </button>
                ))}
                <button
                  onClick={handleBackspace}
                  className="flex h-16 items-center justify-center rounded-2xl bg-slate-700/50 text-slate-300 transition-all hover:bg-slate-600 hover:text-white active:scale-95"
                >
                  <BackspaceIcon className="h-8 w-8" />
                </button>
                <button
                  onClick={() => handleNumpadClick("0")}
                  className="flex h-16 items-center justify-center rounded-2xl bg-slate-700 text-2xl font-bold text-white shadow-sm transition-all hover:bg-slate-600 active:scale-95"
                >
                  0
                </button>
                <button
                  onClick={handleLogin}
                  disabled={loading}
                  className="flex h-16 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-500/30 transition-all hover:bg-blue-500 active:scale-95 disabled:opacity-50"
                >
                  {loading ? (
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  ) : (
                    <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              </div>

            </div>
          </div>
        </div>
        
      </div>
    </div>
  );
}
