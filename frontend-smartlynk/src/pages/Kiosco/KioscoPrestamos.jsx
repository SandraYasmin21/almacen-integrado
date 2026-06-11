import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { WrenchScrewdriverIcon, ArrowLeftIcon, PlusIcon, TrashIcon, QrCodeIcon } from "@heroicons/react/24/outline";

export default function KioscoPrestamos() {
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [sku, setSku] = useState("");
  const [carrito, setCarrito] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const data = localStorage.getItem("kiosco_session");
    if (!data) {
      navigate("/kiosco/login");
      return;
    }
    setSession(JSON.parse(data));
  }, [navigate]);

  const handleAddSku = (e) => {
    e.preventDefault();
    if (!sku.trim()) return;
    
    // Simulate finding item
    const newItem = {
      id: Math.random().toString(),
      sku: sku.toUpperCase(),
      nombre: "Herramienta Simulada",
      tipo: "Préstamo"
    };

    setCarrito([...carrito, newItem]);
    setSku("");
    toast.success("Artículo agregado al carrito");
  };

  const handleRemoveItem = (id) => {
    setCarrito(carrito.filter(item => item.id !== id));
  };

  const handleConfirmar = async () => {
    if (carrito.length === 0) {
      toast.error("Agrega al menos un artículo");
      return;
    }

    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success("Operación registrada correctamente.");
      setCarrito([]);
    } catch (error) {
      toast.error("Error al registrar la operación");
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
          <div className="flex items-center gap-3 text-amber-500">
            <WrenchScrewdriverIcon className="h-8 w-8" />
            <h1 className="text-2xl font-bold text-white">Préstamos Operativos</h1>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm font-semibold text-white">Gafete: {session.gafete}</p>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Input Side */}
          <div className="flex flex-col gap-6">
            <div className="rounded-3xl bg-slate-800 p-8 ring-1 ring-white/10 shadow-2xl">
              <h2 className="text-2xl font-bold mb-2">Escanear Artículo</h2>
              <p className="text-slate-400 mb-6">Usa el escáner de código de barras o teclea el SKU para Préstamo o Devolución.</p>
              
              <form onSubmit={handleAddSku} className="flex flex-col gap-4">
                <div className="relative">
                  <QrCodeIcon className="absolute left-4 top-1/2 h-6 w-6 -translate-y-1/2 text-slate-500" />
                  <input 
                    type="text" 
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    className="h-16 w-full rounded-2xl bg-slate-900 border-2 border-slate-700 pl-14 pr-4 text-xl font-mono text-white focus:border-amber-500 focus:outline-none focus:ring-0"
                    placeholder="Escanear SKU..."
                    autoFocus
                  />
                </div>
                <button type="submit" className="h-14 rounded-xl bg-slate-700 font-bold text-white hover:bg-slate-600 transition flex items-center justify-center gap-2">
                  <PlusIcon className="h-5 w-5" /> Agregar Manualmente
                </button>
              </form>
            </div>

            <div className="rounded-3xl bg-slate-800 p-8 ring-1 ring-white/10 shadow-2xl flex flex-col justify-center items-center text-center">
               <div className="h-16 w-16 bg-blue-500/20 text-blue-400 rounded-full flex items-center justify-center mb-4">
                 <WrenchScrewdriverIcon className="h-8 w-8" />
               </div>
               <h3 className="text-lg font-bold">Mis Préstamos Activos</h3>
               <p className="text-slate-400 text-sm mt-2">Actualmente tienes 2 herramientas prestadas.</p>
               <button className="mt-4 text-blue-400 font-semibold hover:text-blue-300">Ver Detalles</button>
            </div>
          </div>

          {/* Cart Side */}
          <div className="rounded-3xl bg-slate-800 flex flex-col ring-1 ring-white/10 shadow-2xl overflow-hidden h-[600px]">
            <div className="p-6 border-b border-slate-700 bg-slate-800/80">
              <h2 className="text-xl font-bold">Bandeja de Operación ({carrito.length})</h2>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-3 custom-scrollbar">
              {carrito.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-500">
                  <QrCodeIcon className="h-16 w-16 mb-4 opacity-50" />
                  <p>Escanea un artículo para comenzar.</p>
                </div>
              ) : (
                carrito.map((item) => (
                  <div key={item.id} className="flex items-center justify-between bg-slate-700/50 rounded-xl p-4 border border-slate-600/50">
                    <div>
                      <p className="font-bold text-white">{item.nombre}</p>
                      <p className="text-sm font-mono text-amber-400">{item.sku}</p>
                    </div>
                    <button onClick={() => handleRemoveItem(item.id)} className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition">
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="p-6 border-t border-slate-700 bg-slate-800/80 shrink-0">
              <button 
                onClick={handleConfirmar}
                disabled={loading || carrito.length === 0}
                className="w-full rounded-2xl bg-amber-600 py-4 text-lg font-bold text-white shadow-xl shadow-amber-600/20 transition hover:bg-amber-500 disabled:opacity-50"
              >
                {loading ? "Procesando..." : "Confirmar Préstamo / Devolución"}
              </button>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
