import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeftIcon, PlusIcon, QrCodeIcon, TrashIcon, WrenchScrewdriverIcon } from "@heroicons/react/24/outline";
import { kioscoFetch, requireKioscoProfile } from "@/lib/kioscoAuth";

export default function KioscoPrestamos() {
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [sku, setSku] = useState("");
  const [carrito, setCarrito] = useState([]);
  const [prestamosActivos, setPrestamosActivos] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    requireKioscoProfile(navigate).then((profile) => {
      if (profile) {
        setSession(profile);
        cargarPrestamos();
      }
    });
  }, [navigate]);

  const cargarPrestamos = async () => {
    try {
      const response = await kioscoFetch("/api/kiosco/mis-prestamos");
      const payload = await response.json().catch(() => ({}));
      if (response.ok) setPrestamosActivos(payload.prestamos || []);
    } catch {
      toast.error("No se pudieron cargar tus prestamos activos");
    }
  };

  const handleAddSku = async (event) => {
    event.preventDefault();
    if (!sku.trim()) return;

    setLoading(true);
    try {
      const response = await kioscoFetch(`/api/kiosco/sku/${encodeURIComponent(sku.toUpperCase())}`);
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "SKU no encontrado");

      const itemData = payload.data || payload;
      const newItem = {
        id: crypto.randomUUID(),
        sku: itemData.sku || itemData.codigo_interno_generado || sku.toUpperCase(),
        articulo_id: itemData.articulo_id || itemData.id,
        serie_id: itemData.serie_id || null,
        nombre: itemData.nombre || itemData.articulo || "Articulo",
        tipo: itemData.tipo_codigo === "serie" ? "Activo por serie" : "Material",
        cantidad: 1,
      };

      setCarrito((items) => [...items, newItem]);
      setSku("");
      toast.success("Articulo agregado al carrito");
    } catch (error) {
      toast.error(error.message || "SKU no valido o sin stock");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmar = async () => {
    if (carrito.length === 0) {
      toast.error("Agrega al menos un articulo");
      return;
    }

    setLoading(true);
    try {
      for (const item of carrito) {
        const response = await kioscoFetch("/api/kiosco/salida-prestamo", {
          method: "POST",
          body: JSON.stringify({
            articulo_id: item.articulo_id,
            serie_id: item.serie_id,
            cantidad: item.cantidad,
          }),
        });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(payload.error || payload.message || "Error al registrar la operacion");
      }

      toast.success("Operacion registrada correctamente");
      setCarrito([]);
      await cargarPrestamos();
    } catch (error) {
      toast.error(error.message || "Error al registrar la operacion");
    } finally {
      setLoading(false);
    }
  };

  if (!session) return null;

  return (
    <div className="flex min-h-screen flex-col bg-slate-900 text-slate-100">
      <header className="flex items-center justify-between border-b border-slate-700 bg-slate-800/50 px-8 py-6 backdrop-blur-md">
        <div className="flex items-center gap-6">
          <button onClick={() => navigate("/kiosco/menu")} className="rounded-full bg-slate-700 p-3 transition hover:bg-slate-600">
            <ArrowLeftIcon className="h-6 w-6" />
          </button>
          <div className="flex items-center gap-3 text-amber-500">
            <WrenchScrewdriverIcon className="h-8 w-8" />
            <h1 className="text-2xl font-bold text-white">Prestamos operativos</h1>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm font-semibold text-white">Gafete: {session.empleado?.numero_gafete || "-"}</p>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center p-8">
        <div className="grid w-full max-w-5xl grid-cols-1 gap-8 lg:grid-cols-2">
          <div className="flex flex-col gap-6">
            <div className="rounded-3xl bg-slate-800 p-8 shadow-2xl ring-1 ring-white/10">
              <h2 className="mb-2 text-2xl font-bold">Escanear articulo</h2>
              <p className="mb-6 text-slate-400">Usa el escaner de codigo de barras o teclea el SKU.</p>

              <form onSubmit={handleAddSku} className="flex flex-col gap-4">
                <div className="relative">
                  <QrCodeIcon className="absolute left-4 top-1/2 h-6 w-6 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    value={sku}
                    onChange={(event) => setSku(event.target.value)}
                    className="h-16 w-full rounded-2xl border-2 border-slate-700 bg-slate-900 pl-14 pr-4 font-mono text-xl text-white focus:border-amber-500 focus:outline-none focus:ring-0"
                    placeholder="Escanear SKU..."
                    autoFocus
                  />
                </div>
                <button type="submit" disabled={loading} className="flex h-14 items-center justify-center gap-2 rounded-xl bg-slate-700 font-bold text-white transition hover:bg-slate-600 disabled:opacity-50">
                  <PlusIcon className="h-5 w-5" /> Agregar
                </button>
              </form>
            </div>

            <div className="flex flex-col items-center justify-center rounded-3xl bg-slate-800 p-8 text-center shadow-2xl ring-1 ring-white/10">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-500/20 text-blue-400">
                <WrenchScrewdriverIcon className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-bold">Mis prestamos activos</h3>
              <p className="mt-2 text-sm text-slate-400">Actualmente tienes {prestamosActivos.length} articulos prestados.</p>
            </div>
          </div>

          <div className="flex h-[600px] flex-col overflow-hidden rounded-3xl bg-slate-800 shadow-2xl ring-1 ring-white/10">
            <div className="border-b border-slate-700 bg-slate-800/80 p-6">
              <h2 className="text-xl font-bold">Bandeja de operacion ({carrito.length})</h2>
            </div>

            <div className="custom-scrollbar flex-1 space-y-3 overflow-y-auto p-6">
              {carrito.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-slate-500">
                  <QrCodeIcon className="mb-4 h-16 w-16 opacity-50" />
                  <p>Escanea un articulo para comenzar.</p>
                </div>
              ) : (
                carrito.map((item) => (
                  <div key={item.id} className="flex items-center justify-between rounded-xl border border-slate-600/50 bg-slate-700/50 p-4">
                    <div>
                      <p className="font-bold text-white">{item.nombre}</p>
                      <p className="font-mono text-sm text-amber-400">{item.sku}</p>
                      <p className="text-xs text-slate-400">{item.tipo}</p>
                    </div>
                    <button onClick={() => setCarrito((items) => items.filter((current) => current.id !== item.id))} className="rounded-lg p-2 text-slate-400 transition hover:bg-red-400/10 hover:text-red-400">
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="shrink-0 border-t border-slate-700 bg-slate-800/80 p-6">
              <button
                onClick={handleConfirmar}
                disabled={loading || carrito.length === 0}
                className="w-full rounded-2xl bg-amber-600 py-4 text-lg font-bold text-white shadow-xl shadow-amber-600/20 transition hover:bg-amber-500 disabled:opacity-50"
              >
                {loading ? "Procesando..." : "Confirmar prestamo"}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
