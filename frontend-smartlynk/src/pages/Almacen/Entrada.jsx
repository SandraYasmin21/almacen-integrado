import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Barcode from "react-barcode";
import { toast } from "sonner";
import { PremiumCard, PremiumModal } from "../../components/ui/premium";
import { SelectPremium } from "../../components/ui/SelectPremium";

const API = import.meta.env.VITE_API_URL ?? "";
const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("smartlynk_token") ?? ""}`,
});

async function readJson(response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.success === false) {
    throw new Error(data.message || data.mensaje || "No se pudo completar la operación");
  }
  return data;
}

function SkusModal({ result, onClose }) {
  const printRef = useRef(null);
  const skus = result?.skus_generados ?? result?.skus ?? [];
  const isConsumible = result?.tipo === "consumible";

  const imprimirLote = () => {
    const etiquetas = printRef.current?.innerHTML;
    const printWindow = window.open("", "_blank", "width=520,height=640");

    if (!printWindow || !etiquetas) {
      toast.error("No se pudo abrir la ventana de impresión");
      return;
    }

    printWindow.document.write(`
      <html>
        <head>
          <title>Impresión de lote</title>
          <style>
            @page { size: 55mm 30mm; margin: 3mm; }
            body {
              margin: 0;
              font-family: Inter, ui-sans-serif, system-ui, sans-serif;
              color: #0f172a;
              text-align: center;
            }
            .etiqueta {
              width: 50mm;
              height: 25mm;
              page-break-after: always;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              overflow: hidden;
            }
            .titulo {
              max-width: 48mm;
              margin: 0 0 2mm;
              font-size: 9px;
              font-weight: 800;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
            }
            .sku {
              margin: 1mm 0 0;
              font-size: 8px;
              font-weight: 700;
              letter-spacing: 0.04em;
            }
            svg {
              max-width: 46mm;
              height: 14mm;
            }
          </style>
        </head>
        <body>${etiquetas}</body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    window.setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 150);
  };

  return (
    <PremiumModal className="max-w-3xl p-0" onBackdropClick={onClose}>
        <div className="flex items-start justify-between border-b border-slate-100 p-5">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Entrada registrada</h3>
            <p className="mt-1 text-sm text-slate-500">
              {isConsumible
                ? `Se sumaron ${result?.cantidad ?? 0} unidades al stock general de ${result?.articulo?.nombre}.`
                : `Se generaron ${skus.length} SKU únicos para ${result?.articulo?.nombre}.`}
            </p>
          </div>
          <button onClick={onClose} className="rounded-lg px-2 py-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
            Cerrar
          </button>
        </div>

        <div className="max-h-[55vh] overflow-y-auto p-5">
          {isConsumible ? (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-sm text-emerald-800">
              Este artículo es consumible: no se generaron series individuales. Usa su SKU maestro para salidas por cantidad.
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {skus.map((sku) => (
                <div key={sku} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">{sku}</p>
                  <div className="rounded-lg bg-white p-2">
                    <Barcode value={sku} height={46} width={1.25} fontSize={12} margin={4} />
                  </div>
                </div>
              ))}
            </div>
          )}
          <div ref={printRef} className="hidden">
            {skus.map((sku) => (
              <div key={sku} className="etiqueta">
                <p className="titulo">{result?.articulo?.nombre}</p>
                <Barcode value={sku} height={42} width={1.15} fontSize={0} margin={2} displayValue={false} />
                <p className="sku">{sku}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-slate-100 p-5 sm:flex-row sm:justify-end">
          {skus.length > 0 && (
            <button
              onClick={imprimirLote}
              className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700"
            >
              🖨️ Imprimir [{skus.length}] Etiquetas de Serie
            </button>
          )}
          <button
            onClick={onClose}
            className="rounded-xl bg-slate-100 px-5 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-200"
          >
            Finalizar
          </button>
        </div>
    </PremiumModal>
  );
}

export default function Entrada() {
  const navigate = useNavigate();
  const [articulos, setArticulos] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [ordenesCompra, setOrdenesCompra] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [vincularOC, setVincularOC] = useState(false);
  const [ordenSeleccionada, setOrdenSeleccionada] = useState("");
  const [form, setForm] = useState({
    articulo_id: "",
    modelo: "",
    tipo_articulo: "herramienta",
    proveedor_id: "",
    cantidad: 1,
    ubicacion: "",
    notas: "",
    orden_compra_id: "",
  });

  const articuloSeleccionado = useMemo(
    () => articulos.find((articulo) => String(articulo.id) === String(form.articulo_id)),
    [articulos, form.articulo_id]
  );

  useEffect(() => {
    const cargar = async () => {
      try {
        const [rArt, rProv, rOC] = await Promise.all([
          fetch(`${API}/api/almacen/articulos`, { headers: authHeaders() }),
          fetch(`${API}/api/proveedores`, { headers: authHeaders() }),
          fetch(`${API}/api/almacen/ordenes-compra?estado=enviada`, { headers: authHeaders() }),
        ]);
        const [dArt, dProv] = await Promise.all([readJson(rArt), rProv.json()]);
        const dOC = await rOC.json().catch(() => ({}));
        setArticulos(dArt.data ?? dArt ?? []);
        setProveedores(dProv.data ?? dProv ?? []);
        setOrdenesCompra(dOC.data ?? []);
      } catch (error) {
        toast.error(error.message || "Error al cargar catálogos");
      } finally {
        setCargando(false);
      }
    };
    cargar();
  }, []);

  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleOrdenChange = (id) => {
    setOrdenSeleccionada(id);
    const orden = ordenesCompra.find(o => String(o.id) === String(id));
    if (!orden) return;

    // Tomar el primer detalle pendiente (cantidad_recibida < cantidad_solicitada)
    const detallePendiente = (orden.detalles ?? []).find(
      d => (d.cantidad_recibida ?? 0) < d.cantidad_solicitada
    ) ?? (orden.detalles ?? [])[0];

    const cantidadPendiente = detallePendiente
      ? detallePendiente.cantidad_solicitada - (detallePendiente.cantidad_recibida ?? 0)
      : 1;

    // Autocompletar artículo si hay un detalle
    let articuloAutocompletado = {};
    if (detallePendiente?.articulo_id) {
      const articulo = articulos.find(a => String(a.id) === String(detallePendiente.articulo_id));
      articuloAutocompletado = {
        articulo_id: String(detallePendiente.articulo_id),
        modelo: articulo?.modelo ?? detallePendiente.modelo ?? "",
        tipo_articulo: articulo?.tipo_articulo ?? "herramienta",
      };
    }

    setForm(prev => ({
      ...prev,
      proveedor_id: String(orden.proveedor_id ?? prev.proveedor_id),
      cantidad: cantidadPendiente,
      orden_compra_id: id,
      ...articuloAutocompletado,
    }));
  };

  const handleArticuloChange = (id) => {
    const articulo = articulos.find((item) => String(item.id) === String(id));
    setForm((prev) => ({
      ...prev,
      articulo_id: id,
      modelo: articulo?.modelo ?? "",
      tipo_articulo: articulo?.tipo_articulo ?? "herramienta",
    }));
  };

  const submit = async (event) => {
    event.preventDefault();
    if (!form.articulo_id) return toast.error("Selecciona un artículo");
    if (!String(form.modelo || articuloSeleccionado?.modelo || "").trim()) return toast.error("Ingresa el modelo del artículo");

    setLoading(true);
    try {
      const response = await fetch(`${API}/api/almacen/entrada`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(form),
      });
      const data = await readJson(response);
      toast.success(data.message || "Entrada registrada correctamente");
      setResult(data.data);
    } catch (error) {
      toast.error(error.message || "Error al registrar entrada");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="w-full space-y-6">
        <PremiumCard interactive={false}>
        <form onSubmit={submit} className="p-6 space-y-6">

          {/* Toggle de OC */}
          <div className="flex items-center justify-between p-4 bg-blue-50/50 border border-blue-100 rounded-xl">
            <div>
              <h3 className="font-semibold text-slate-800 text-sm">Vincular a Orden de Compra</h3>
              <p className="text-xs text-slate-500">Autocompleta los datos con la información del pedido</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" checked={vincularOC} onChange={e => setVincularOC(e.target.checked)} />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {vincularOC && (
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 animate-in fade-in slide-in-from-top-2 space-y-3">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">Folio de Orden <span className="text-red-500">*</span></label>
                <SelectPremium 
                  value={ordenSeleccionada}
                  onChange={handleOrdenChange}
                  placeholder="Seleccionar Orden de Compra..."
                  options={ordenesCompra.map(o => ({
                    value: String(o.id),
                    label: `${o.folio ?? `OC-${o.id}`}${o.proveedor ? ` — ${o.proveedor}` : ""}`
                  }))}
                />
              </div>
              {ordenSeleccionada && (() => {
                const oc = ordenesCompra.find(o => String(o.id) === String(ordenSeleccionada));
                const detalles = oc?.detalles ?? [];
                if (detalles.length === 0) return null;
                return (
                  <div className="rounded-lg bg-blue-50 border border-blue-100 p-3 text-xs text-blue-800">
                    <p className="font-bold mb-1">Artículos en esta OC:</p>
                    <ul className="space-y-0.5">
                      {detalles.map((d, i) => {
                        const pendiente = d.cantidad_solicitada - (d.cantidad_recibida ?? 0);
                        return (
                          <li key={i} className="flex justify-between">
                            <span className="truncate mr-2">{d.articulo_nombre}</span>
                            <span className="font-semibold whitespace-nowrap">
                              {pendiente > 0
                                ? <span className="text-amber-700">{pendiente} pendientes</span>
                                : <span className="text-emerald-700">✓ Completo</span>
                              }
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                    <p className="mt-2 text-slate-500">El formulario se autocompletó con el primer artículo pendiente.</p>
                  </div>
                );
              })()}
            </div>
          )}

          {/* Tarjeta 1: Datos del Artículo */}
          <div className="bg-slate-50 p-5 rounded-xl border border-slate-100 space-y-5">
            <h4 className="font-bold text-slate-700 border-b border-slate-200 pb-2">Datos del Artículo</h4>
            
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                Artículo <span className="text-red-500">*</span>
              </label>
              <SelectPremium 
                value={String(form.articulo_id)} 
                onChange={handleArticuloChange} 
                placeholder={cargando ? "Cargando artículos..." : "Seleccionar artículo..."}
                options={articulos.map((articulo) => ({ value: String(articulo.id), label: `${articulo.nombre} ${articulo.modelo ? `- ${articulo.modelo}` : ""}` }))}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Modelo <span className="text-red-500">*</span>
                </label>
                <input
                  value={form.modelo}
                  onChange={(event) => set("modelo", event.target.value)}
                  placeholder="Ej: TAL-20V-MAX"
                  className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Clasificación <span className="text-red-500">*</span>
                </label>
                <SelectPremium 
                  value={form.tipo_articulo} 
                  onChange={(value) => set("tipo_articulo", value)}
                  options={[
                    { value: "herramienta", label: "Herramienta" },
                    { value: "venta", label: "Venta" },
                    { value: "mixto", label: "Mixto" }
                  ]}
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">Categoría</label>
                <input value={articuloSeleccionado?.categoria_nombre || ""} disabled className="h-12 w-full rounded-xl border border-slate-200 bg-slate-200/50 px-4 text-sm text-slate-500 cursor-not-allowed" placeholder="Autocompletado..." />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">Subcategoría</label>
                <input value={articuloSeleccionado?.subcategoria_nombre || ""} disabled className="h-12 w-full rounded-xl border border-slate-200 bg-slate-200/50 px-4 text-sm text-slate-500 cursor-not-allowed" placeholder="Autocompletado..." />
              </div>
            </div>
          </div>

          {/* Tarjeta 2: Datos de Recepción */}
          <div className="bg-slate-50 p-5 rounded-xl border border-slate-100 space-y-5">
            <h4 className="font-bold text-slate-700 border-b border-slate-200 pb-2">Datos de Recepción</h4>
            
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">Proveedor</label>
              {vincularOC && ordenSeleccionada ? (
                <input
                  value={ordenesCompra.find(o => String(o.id) === String(ordenSeleccionada))?.proveedor || "Sin proveedor asignado en la OC"}
                  disabled
                  className="h-12 w-full rounded-xl border border-slate-200 bg-slate-200/50 px-4 text-sm text-slate-500 cursor-not-allowed"
                />
              ) : (
                <SelectPremium 
                  value={form.proveedor_id || "ninguno"} 
                  onChange={(value) => set("proveedor_id", value === "ninguno" ? "" : value)} 
                  placeholder="Sin proveedor / No aplica"
                  options={[
                    { value: "ninguno", label: "Sin proveedor / No aplica" },
                    ...proveedores.map((proveedor) => ({ value: String(proveedor.id), label: proveedor.nombre_empresa }))
                  ]}
                />
              )}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Cantidad <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min={1}
                  value={form.cantidad}
                  onChange={(event) => set("cantidad", event.target.value)}
                  required
                  className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">Ubicación</label>
                <input
                  type="text"
                  value={form.ubicacion}
                  onChange={(event) => set("ubicacion", event.target.value)}
                  placeholder="Ej: Estante A-3"
                  className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">Notas (opcional)</label>
              <textarea
                rows={3}
                value={form.notas}
                onChange={(event) => set("notas", event.target.value)}
                placeholder="Observaciones, número de factura, etc."
                className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Link to="/almacen" className="flex-1 rounded-xl bg-slate-100 px-4 py-3 text-center text-sm font-bold text-slate-700 transition hover:bg-slate-200">
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={loading || cargando}
              className="flex-1 rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "Registrando..." : "Registrar Entrada"}
            </button>
          </div>
        </form>
        </PremiumCard>
      </div>

      {result && <SkusModal result={result} onClose={() => navigate("/almacen")} />}
    </>
  );
}
