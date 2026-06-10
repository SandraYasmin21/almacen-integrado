import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  FileText, Send, PackageCheck, CheckCircle2,
  Plus, ChevronRight, Printer, X, Loader2,
  AlertTriangle, ShoppingCart
} from "lucide-react";
import * as XLSX from "xlsx";
import {
  DataTableShell, PremiumCard, dataTableClass,
  PremiumModal
} from "../../components/ui/premium";
import { SelectPremium } from "../../components/ui/SelectPremium";

const API = import.meta.env.VITE_API_URL ?? "";
const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("smartlynk_token") ?? ""}`,
});

async function apiFetch(url, opts = {}) {
  const res = await fetch(`${API}${url}`, { headers: authHeaders(), ...opts });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.success === false)
    throw new Error(data.message || "Error en la petición");
  return data;
}

// ── Badge de estado ───────────────────────────────────────────
const ESTADO_MAP = {
  borrador:              { label: "Borrador",        color: "bg-slate-100 text-slate-600" },
  enviada:               { label: "Enviada",          color: "bg-blue-100 text-blue-700" },
  recibida_parcialmente: { label: "Rec. Parcial",     color: "bg-amber-100 text-amber-700" },
  completada:            { label: "Completada",       color: "bg-emerald-100 text-emerald-700" },
};
function EstadoBadge({ estado }) {
  const { label, color } = ESTADO_MAP[estado] ?? { label: estado, color: "bg-slate-100 text-slate-500" };
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${color}`}>
      {label}
    </span>
  );
}

// ── Slide-over de Requisiciones ───────────────────────────────
function RequisicionesPanel({ onClose, onAgregarArticulo }) {
  const [articulos, setArticulos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch("/api/almacen/requisiciones")
      .then(d => setArticulos(d.data ?? []))
      .catch(e => toast.error(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 flex h-full w-full max-w-lg flex-col bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <h3 className="font-bold text-slate-900">Requisiciones Pendientes</h3>
            <p className="text-xs text-slate-500 mt-0.5">Artículos con stock agotado</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5">
          {loading ? (
            <div className="flex h-40 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
            </div>
          ) : articulos.length === 0 ? (
            <div className="flex h-40 flex-col items-center justify-center gap-2 text-slate-400">
              <CheckCircle2 className="h-10 w-10 text-emerald-400" />
              <p className="font-semibold">¡Sin artículos agotados!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {articulos.map(art => (
                <div key={art.id} className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-slate-800 text-sm truncate">{art.nombre}</p>
                    <p className="text-xs text-slate-500">{art.categoria_nombre ?? "Sin categoría"}</p>
                  </div>
                  <div className="ml-2 flex items-center gap-2">
                    <span className="rounded-full bg-rose-100 px-2 py-0.5 text-xs font-bold text-rose-600">Agotado</span>
                    {onAgregarArticulo && (
                      <button
                        onClick={() => { onAgregarArticulo(art); onClose(); }}
                        className="rounded-lg bg-blue-600 px-2.5 py-1 text-xs font-bold text-white hover:bg-blue-700"
                      >
                        + OC
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Modal Nueva Orden (2 pasos) ────────────────────────────────
function ModalNuevaOrden({ proveedores, articuloInicial, onClose, onSuccess }) {
  const [paso, setPaso] = useState(1);
  const [proveedorId, setProveedorId] = useState("");
  const [fechaEsperada, setFechaEsperada] = useState("");
  const [notas, setNotas] = useState("");
  const [articulos, setArticulos] = useState(
    articuloInicial ? [{ articulo_id: articuloInicial.id, nombre: articuloInicial.nombre, cantidad: 1, precio: "" }] : []
  );
  const [catalogoArticulos, setCatalogoArticulos] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    apiFetch("/api/almacen/articulos")
      .then(d => setCatalogoArticulos(d.data ?? d ?? []))
      .catch(() => {});
  }, []);

  const agregarFila = () =>
    setArticulos(prev => [...prev, { articulo_id: "", nombre: "", cantidad: 1, precio: "" }]);

  const quitarFila = (idx) =>
    setArticulos(prev => prev.filter((_, i) => i !== idx));

  const setFila = (idx, key, value) =>
    setArticulos(prev =>
      prev.map((r, i) => {
        if (i !== idx) return r;
        if (key === "articulo_id") {
          const art = catalogoArticulos.find(a => String(a.id) === String(value));
          return { ...r, articulo_id: value, nombre: art?.nombre ?? "" };
        }
        return { ...r, [key]: value };
      })
    );

  const guardar = async () => {
    if (!proveedorId) return toast.error("Selecciona un proveedor");
    const validArticulos = articulos.filter(a => a.articulo_id && a.cantidad >= 1);
    if (validArticulos.length === 0) return toast.error("Agrega al menos un artículo");

    setLoading(true);
    try {
      const data = await apiFetch("/api/almacen/ordenes-compra", {
        method: "POST",
        body: JSON.stringify({
          proveedor_id: proveedorId,
          fecha_esperada: fechaEsperada || null,
          notas: notas || null,
          articulos: validArticulos.map(a => ({
            articulo_id: a.articulo_id,
            cantidad: Number(a.cantidad),
            precio: a.precio ? Number(a.precio) : null,
          })),
        }),
      });
      toast.success(data.message || "Orden creada correctamente");
      onSuccess();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <PremiumModal className="max-w-2xl p-0" onBackdropClick={onClose}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 p-5">
        <div>
          <h3 className="text-lg font-bold text-slate-900">Nueva Orden de Compra</h3>
          <p className="mt-0.5 text-xs text-slate-500">Paso {paso} de 2</p>
        </div>
        <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100">
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Steps indicator */}
      <div className="flex gap-2 px-5 pt-4">
        {[1, 2].map(s => (
          <div key={s} className={`h-1.5 flex-1 rounded-full transition ${s <= paso ? "bg-blue-600" : "bg-slate-200"}`} />
        ))}
      </div>

      <div className="p-5 space-y-4 max-h-[65vh] overflow-y-auto">
        {paso === 1 && (
          <>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                Proveedor <span className="text-red-500">*</span>
              </label>
              <SelectPremium
                value={proveedorId}
                onChange={setProveedorId}
                placeholder="Seleccionar proveedor..."
                options={proveedores.map(p => ({ value: String(p.id), label: p.nombre_empresa }))}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">Fecha esperada</label>
                <input
                  type="date"
                  value={fechaEsperada}
                  onChange={e => setFechaEsperada(e.target.value)}
                  className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">Notas</label>
                <input
                  value={notas}
                  onChange={e => setNotas(e.target.value)}
                  placeholder="Observaciones..."
                  className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>
          </>
        )}

        {paso === 2 && (
          <>
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-700">Artículos a pedir</p>
              <button onClick={agregarFila} className="flex items-center gap-1 rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-600 hover:bg-blue-100">
                <Plus className="h-3.5 w-3.5" /> Agregar fila
              </button>
            </div>

            {articulos.length === 0 && (
              <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500">
                Sin artículos. Agrega una fila o selecciona desde el panel de Requisiciones.
              </div>
            )}

            <div className="space-y-2">
              {articulos.map((fila, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 rounded-xl border border-slate-100 bg-slate-50 p-3">
                  <div className="col-span-5">
                    <SelectPremium
                      value={String(fila.articulo_id)}
                      onChange={v => setFila(idx, "articulo_id", v)}
                      placeholder="Artículo..."
                      options={catalogoArticulos.map(a => ({ value: String(a.id), label: a.nombre }))}
                    />
                  </div>
                  <div className="col-span-3">
                    <input
                      type="number"
                      min={1}
                      value={fila.cantidad}
                      onChange={e => setFila(idx, "cantidad", e.target.value)}
                      placeholder="Cant."
                      className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-400"
                    />
                  </div>
                  <div className="col-span-3">
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      value={fila.precio}
                      onChange={e => setFila(idx, "precio", e.target.value)}
                      placeholder="$ Precio"
                      className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-400"
                    />
                  </div>
                  <div className="col-span-1 flex items-center justify-center">
                    <button onClick={() => quitarFila(idx)} className="text-slate-400 hover:text-rose-500">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      <div className="flex gap-3 border-t border-slate-100 p-5">
        {paso === 1 ? (
          <>
            <button onClick={onClose} className="flex-1 rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-200">
              Cancelar
            </button>
            <button
              onClick={() => { if (!proveedorId) return toast.error("Selecciona un proveedor"); setPaso(2); }}
              className="flex-1 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-blue-700 flex items-center justify-center gap-2"
            >
              Siguiente <ChevronRight className="h-4 w-4" />
            </button>
          </>
        ) : (
          <>
            <button onClick={() => setPaso(1)} className="flex-1 rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-200">
              Atrás
            </button>
            <button
              onClick={guardar}
              disabled={loading}
              className="flex-1 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              {loading ? "Guardando..." : "Guardar Borrador"}
            </button>
          </>
        )}
      </div>
    </PremiumModal>
  );
}

// ── Modal PDF de una OC (para enviar al proveedor) ─────────────
function ModalImprimirOC({ oc, onClose }) {
  const ref = useRef(null);

  const imprimir = () => {
    const w = window.open("", "_blank", "width=800,height=600");
    if (!w || !ref.current) return;
    w.document.write(`
      <html><head><title>${oc.folio}</title>
      <style>
        body { font-family: sans-serif; font-size: 12px; color: #0f172a; padding: 24px; }
        h1 { font-size: 20px; margin: 0 0 4px; }
        .meta { color: #64748b; margin-bottom: 16px; font-size: 11px; }
        table { width: 100%; border-collapse: collapse; }
        th, td { border-bottom: 1px solid #e2e8f0; padding: 7px 8px; text-align: left; }
        th { background: #f8fafc; font-size: 10px; text-transform: uppercase; color: #475569; }
      </style></head><body>${ref.current.innerHTML}</body></html>
    `);
    w.document.close();
    setTimeout(() => { w.print(); w.close(); }, 150);
  };

  const proveedor = oc.proveedor ?? "Sin proveedor";
  const fecha     = new Date(oc.created_at).toLocaleDateString("es-MX");

  return (
    <PremiumModal className="max-w-2xl p-0" onBackdropClick={onClose}>
      <div className="flex items-center justify-between border-b border-slate-100 p-5">
        <h3 className="font-bold text-slate-900">{oc.folio} — Vista de Impresión</h3>
        <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"><X className="h-5 w-5" /></button>
      </div>

      <div className="max-h-[65vh] overflow-y-auto p-5">
        <div ref={ref}>
          <h1>Orden de Compra — {oc.folio}</h1>
          <div className="meta">
            <p>Proveedor: <strong>{proveedor}</strong></p>
            <p>Fecha: {fecha}</p>
            {oc.fecha_esperada && <p>Entrega esperada: {new Date(oc.fecha_esperada).toLocaleDateString("es-MX")}</p>}
            {oc.notas && <p>Notas: {oc.notas}</p>}
          </div>
          <table>
            <thead>
              <tr>
                <th>Artículo</th>
                <th>Modelo</th>
                <th>U/M</th>
                <th>Cant. Sol.</th>
                <th>Precio U.</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {(oc.detalles ?? []).map(d => (
                <tr key={d.id}>
                  <td>{d.articulo_nombre}</td>
                  <td>{d.modelo ?? "—"}</td>
                  <td>{d.unidad_medida ?? "—"}</td>
                  <td>{d.cantidad_solicitada}</td>
                  <td>{d.precio_unitario ? `$${Number(d.precio_unitario).toFixed(2)}` : "—"}</td>
                  <td>{d.precio_unitario ? `$${(d.precio_unitario * d.cantidad_solicitada).toFixed(2)}` : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex gap-3 border-t border-slate-100 p-5 justify-end">
        <button onClick={onClose} className="rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-200">Cerrar</button>
        <button onClick={imprimir} className="flex items-center gap-2 rounded-xl bg-rose-500 px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-rose-600">
          <Printer className="h-4 w-4" /> Imprimir / Enviar
        </button>
      </div>
    </PremiumModal>
  );
}

// ── Página principal ──────────────────────────────────────────
const ESTADO_STATS = [
  { key: "borrador",              label: "Borrador",       icon: FileText,      color: "border-l-slate-400"   },
  { key: "enviada",               label: "Enviada",        icon: Send,          color: "border-l-blue-500"    },
  { key: "recibida_parcialmente", label: "Rec. Parcial",   icon: PackageCheck,  color: "border-l-amber-500"   },
  { key: "completada",            label: "Completada",     icon: CheckCircle2,  color: "border-l-emerald-500" },
];

export default function OrdenesCompra() {
  const location  = useLocation();
  const navigate  = useNavigate();

  const [ordenes,       setOrdenes]       = useState([]);
  const [stats,         setStats]         = useState({});
  const [proveedores,   setProveedores]   = useState([]);
  const [loading,       setLoading]       = useState(true);

  const [showRequisiciones, setShowRequisiciones] = useState(false);
  const [showNuevaOrden,    setShowNuevaOrden]    = useState(false);
  const [articuloInicial,   setArticuloInicial]   = useState(null);
  const [ocImpresion,       setOcImpresion]       = useState(null);

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const [dOC, dProv] = await Promise.all([
        apiFetch("/api/almacen/ordenes-compra"),
        apiFetch("/api/proveedores"),
      ]);
      setOrdenes(dOC.data ?? []);
      setStats(dOC.stats ?? {});
      setProveedores(dProv.data ?? dProv ?? []);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  // Precarga desde Almacen/Index (botón "Comprar")
  useEffect(() => {
    if (location.state?.precargarArticulo) {
      setArticuloInicial(location.state.precargarArticulo);
      setShowNuevaOrden(true);
      toast.info(`Generando orden para: ${location.state.precargarArticulo.nombre}`);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);

  // ── Exportar Excel ──
  const exportExcel = () => {
    const rows = ordenes.map(o => ({
      Folio:           o.folio,
      Proveedor:       o.proveedor ?? "—",
      Estado:          ESTADO_MAP[o.estado]?.label ?? o.estado,
      Fecha:           new Date(o.created_at).toLocaleDateString("es-MX"),
      "Fecha Esperada":o.fecha_esperada ? new Date(o.fecha_esperada).toLocaleDateString("es-MX") : "—",
      Total:           `$${o.total?.toFixed(2) ?? "0.00"}`,
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Órdenes de Compra");
    XLSX.writeFile(wb, "ordenes_compra.xlsx");
  };

  // ── Exportar PDF (print) ──
  const exportPdf = async () => {
    try {
      const res = await fetch(`${API}/api/almacen/ordenes-compra/export/pdf`, { headers: authHeaders() });
      if (!res.ok) throw new Error("Error al generar PDF");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "ordenes_compra.pdf";
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      toast.error(e.message);
    }
  };

  const cambiarEstado = async (id, estado) => {
    try {
      await apiFetch(`/api/almacen/ordenes-compra/${id}/estado`, {
        method: "PUT",
        body: JSON.stringify({ estado }),
      });
      toast.success("Estado actualizado");
      cargar();
    } catch (e) {
      toast.error(e.message);
    }
  };

  return (
    <div className="space-y-6 px-6 py-6 print:px-0 print:py-0">
      {/* Header */}
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between print:hidden">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Órdenes de Compra</h1>
          <p className="mt-1 text-sm text-slate-500">Pedidos a proveedores para reabastecimiento de almacén.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {/* Requisiciones */}
          <button
            onClick={() => setShowRequisiciones(true)}
            className="flex items-center gap-2 rounded-full border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-bold text-amber-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-amber-100"
          >
            <AlertTriangle className="h-4 w-4" /> Ver Requisiciones
          </button>
          {/* Exportar Excel */}
          <button
            onClick={exportExcel}
            className="rounded-full bg-emerald-500 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-emerald-600"
          >
            Exportar Excel
          </button>
          {/* Exportar PDF */}
          <button
            onClick={exportPdf}
            className="rounded-full bg-rose-500 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-rose-600"
          >
            Exportar PDF
          </button>
          {/* Nueva Orden */}
          <button
            onClick={() => { setArticuloInicial(null); setShowNuevaOrden(true); }}
            className="flex items-center gap-2 rounded-full bg-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-100 transition hover:-translate-y-0.5 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" /> Nueva orden
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4 print:hidden">
        {ESTADO_STATS.map(({ key, label, icon: Icon }) => (
          <PremiumCard key={key} className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-500">{label}</p>
                <p className="mt-2 text-3xl font-extrabold text-slate-900">
                  {loading ? "—" : (stats[key] ?? 0)}
                </p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-3 text-blue-600">
                <Icon className="h-5 w-5" />
              </div>
            </div>
          </PremiumCard>
        ))}
      </div>

      {/* Tabla */}
      <DataTableShell>
        <table className={dataTableClass()}>
          <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wide text-slate-500" style={{ display: "table-header-group" }}>
            <tr>
              <th className="w-[14%] px-5 py-4">Folio</th>
              <th className="w-[24%] px-5 py-4">Proveedor</th>
              <th className="w-[16%] px-5 py-4">Estado</th>
              <th className="w-[16%] px-5 py-4">Fecha</th>
              <th className="w-[14%] px-5 py-4">Total</th>
              <th className="w-[16%] px-5 py-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="px-5 py-10 text-center text-sm text-slate-400">
                <Loader2 className="mx-auto mb-2 h-6 w-6 animate-spin text-blue-400" />Cargando órdenes...
              </td></tr>
            ) : ordenes.length === 0 ? (
              <tr><td colSpan={6} className="px-5 py-10 text-center text-sm font-semibold text-slate-500">
                Sin órdenes de compra registradas
              </td></tr>
            ) : ordenes.map(oc => (
              <tr key={oc.id} style={{ pageBreakInside: "avoid" }} className="border-t border-slate-100 hover:bg-slate-50/60 transition">
                <td className="px-5 py-3.5">
                  <span className="font-bold text-slate-800">{oc.folio}</span>
                </td>
                <td className="px-5 py-3.5 text-slate-600">{oc.proveedor ?? "—"}</td>
                <td className="px-5 py-3.5"><EstadoBadge estado={oc.estado} /></td>
                <td className="px-5 py-3.5 text-sm text-slate-500">
                  {new Date(oc.created_at).toLocaleDateString("es-MX")}
                </td>
                <td className="px-5 py-3.5 font-semibold text-slate-700">
                  ${(oc.total ?? 0).toFixed(2)}
                </td>
                <td className="px-5 py-3.5">
                  <div className="flex items-center justify-end gap-2">
                    {/* Imprimir OC individual */}
                    <button
                      onClick={() => setOcImpresion(oc)}
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                      title="Imprimir orden"
                    >
                      <Printer className="h-4 w-4" />
                    </button>
                    {/* Cambiar estado rápido */}
                    {oc.estado === "borrador" && (
                      <button
                        onClick={() => cambiarEstado(oc.id, "enviada")}
                        className="flex items-center gap-1 rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-600 hover:bg-blue-100"
                        title="Marcar como Enviada"
                      >
                        <Send className="h-3.5 w-3.5" /> Enviar
                      </button>
                    )}
                    {oc.estado === "enviada" && (
                      <button
                        onClick={() => cambiarEstado(oc.id, "completada")}
                        className="flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-600 hover:bg-emerald-100"
                        title="Marcar como Completada"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" /> Completar
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </DataTableShell>

      {/* Slide-over Requisiciones */}
      {showRequisiciones && (
        <RequisicionesPanel
          onClose={() => setShowRequisiciones(false)}
          onAgregarArticulo={art => { setArticuloInicial(art); setShowNuevaOrden(true); }}
        />
      )}

      {/* Modal Nueva Orden */}
      {showNuevaOrden && (
        <ModalNuevaOrden
          proveedores={proveedores}
          articuloInicial={articuloInicial}
          onClose={() => { setShowNuevaOrden(false); setArticuloInicial(null); }}
          onSuccess={() => { setShowNuevaOrden(false); setArticuloInicial(null); cargar(); }}
        />
      )}

      {/* Modal Impresión de OC individual */}
      {ocImpresion && (
        <ModalImprimirOC oc={ocImpresion} onClose={() => setOcImpresion(null)} />
      )}
    </div>
  );
}
