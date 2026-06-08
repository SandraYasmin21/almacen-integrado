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

function PrestamoModal({ items, empleado, onClose, onConfirm, onRemove, onQuantityChange, loading }) {
  return (
    <PremiumModal className="max-w-5xl p-0" onBackdropClick={onClose}>
        <div className="flex items-start justify-between border-b border-slate-100 p-5">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Confirmar préstamo</h3>
            <p className="mt-1 text-sm text-slate-500">
              {empleado ? `Empleado: ${empleado.nombre_completo}` : "Selecciona un empleado antes de confirmar."}
            </p>
          </div>
          <button onClick={onClose} className="rounded-lg px-2 py-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
            Cerrar
          </button>
        </div>

        <div className="p-5">
          <div className="grid gap-3">
            {items.map((item) => (
              <div key={item.key} className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 lg:grid-cols-[1fr_230px_120px_90px] lg:items-center">
                <div>
                  <p className="font-bold text-slate-900">{item.articulo}</p>
                  <p className="text-sm text-slate-500">{item.modelo || "Sin modelo"}</p>
                </div>
                <div className="rounded-lg bg-white p-2">
                  {item.sku ? <Barcode value={item.sku} height={36} width={1} fontSize={10} margin={3} /> : <span className="text-xs text-slate-400">Sin SKU</span>}
                </div>
                <input
                  type="number"
                  min={1}
                  value={item.cantidad}
                  disabled={Boolean(item.sku)}
                  onChange={(event) => onQuantityChange(item.key, event.target.value)}
                  className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 disabled:bg-slate-100"
                />
                <button onClick={() => onRemove(item.key)} className="rounded-xl bg-red-600 px-3 py-2 text-sm font-bold text-white transition hover:bg-red-700">
                  Eliminar
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-slate-100 p-5 sm:flex-row sm:justify-end">
          <button onClick={onClose} className="rounded-xl bg-slate-100 px-5 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-200">
            Cancelar
          </button>
          <button onClick={onConfirm} disabled={loading || !empleado || items.length === 0} className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-50">
            {loading ? "Registrando..." : "Confirmar préstamo"}
          </button>
        </div>
    </PremiumModal>
  );
}

export default function Salida() {
  const navigate = useNavigate();
  const scannerRef = useRef(null);
  const [articulos, setArticulos] = useState([]);
  const [empleados, setEmpleados] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showPrestamoModal, setShowPrestamoModal] = useState(false);
  const [scannedItem, setScannedItem] = useState(null);
  const [prestamoItems, setPrestamoItems] = useState([]);
  const [form, setForm] = useState({
    articulo_id: "",
    empleado_id: "",
    cantidad: 1,
    tipo: "salida",
    notas: "",
  });

  const articuloSeleccionado = useMemo(
    () => articulos.find((articulo) => String(articulo.id) === String(form.articulo_id)),
    [articulos, form.articulo_id]
  );
  const empleadoSeleccionado = useMemo(
    () => empleados.find((empleado) => String(empleado.id) === String(form.empleado_id)),
    [empleados, form.empleado_id]
  );

  useEffect(() => {
    const cargar = async () => {
      try {
        const [rArt, rEmp] = await Promise.all([
          fetch(`${API}/api/almacen/articulos`, { headers: authHeaders() }),
          fetch(`${API}/api/empleados`, { headers: authHeaders() }),
        ]);
        const [dArt, dEmp] = await Promise.all([readJson(rArt), rEmp.json()]);
        setArticulos(dArt.data ?? dArt ?? []);
        setEmpleados(dEmp.data ?? dEmp ?? []);
      } catch (error) {
        toast.error(error.message || "Error al cargar catálogos");
      } finally {
        setCargando(false);
      }
    };
    cargar();
  }, []);

  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleScan = async (event) => {
    event.preventDefault();
    const codigo = scannerRef.current?.value?.trim();
    if (scannerRef.current) scannerRef.current.value = "";
    if (!codigo) return;

    try {
      const response = await fetch(`${API}/api/almacen/sku/${encodeURIComponent(codigo)}`, { headers: authHeaders() });
      const data = await readJson(response);
      const item = data.data;
      if (String(item.estado).toUpperCase() !== "DISPONIBLE") {
        toast.error("El SKU no está disponible");
        return;
      }

      if (form.tipo === "prestamo") {
        if (prestamoItems.some((row) => row.sku === item.sku)) {
          toast.error("Ese SKU ya está en la lista");
          return;
        }
        setPrestamoItems((prev) => [
          ...prev,
          {
            key: item.sku,
            sku: item.sku,
            serie_id: item.serie_id,
            articulo_id: item.articulo_id,
            articulo: item.articulo,
            modelo: item.modelo,
            cantidad: 1,
          },
        ]);
        toast.success("SKU agregado al préstamo");
      } else {
        setScannedItem(item);
        set("articulo_id", String(item.articulo_id));
        toast.success("SKU listo para salida");
      }
    } catch (error) {
      toast.error(error.message || "SKU no encontrado");
    }
  };

  const addManualToPrestamo = () => {
    if (!articuloSeleccionado) return toast.error("Selecciona un artículo");
    const key = `manual-${articuloSeleccionado.id}-${Date.now()}`;
    setPrestamoItems((prev) => [
      ...prev,
      {
        key,
        articulo_id: articuloSeleccionado.id,
        articulo: articuloSeleccionado.nombre,
        modelo: articuloSeleccionado.modelo,
        cantidad: Number(form.cantidad || 1),
      },
    ]);
    toast.success("Artículo agregado al préstamo");
  };

  const submitSalida = async (event) => {
    event.preventDefault();
    if (!form.empleado_id) return toast.error("Selecciona el empleado que retira");

    if (form.tipo === "prestamo") {
      if (prestamoItems.length === 0) return toast.error("Agrega al menos un SKU o artículo al préstamo");
      setShowPrestamoModal(true);
      return;
    }

    if (!scannedItem && !form.articulo_id) return toast.error("Escanea un SKU o selecciona un artículo");
    setLoading(true);
    try {
      const response = await fetch(`${API}/api/almacen/salida`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          codigo_sku: scannedItem?.sku,
          articulo_id: scannedItem ? undefined : form.articulo_id,
          empleado_id: form.empleado_id,
          cantidad: scannedItem ? 1 : form.cantidad,
          notas: form.notas,
        }),
      });
      const data = await readJson(response);
      toast.success(data.message || "Salida registrada correctamente");
      setTimeout(() => navigate("/almacen"), 900);
    } catch (error) {
      toast.error(error.message || "Error al registrar salida");
    } finally {
      setLoading(false);
    }
  };

  const confirmPrestamo = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API}/api/almacen/prestamo`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          empleado_id: form.empleado_id,
          notas: form.notas,
          items: prestamoItems.map((item) => ({
            codigo_sku: item.sku,
            articulo_id: item.sku ? undefined : item.articulo_id,
            cantidad: item.cantidad,
          })),
        }),
      });
      const data = await readJson(response);
      toast.success(data.message || "Préstamo registrado correctamente");
      setTimeout(() => navigate("/almacen/movimientos"), 900);
    } catch (error) {
      toast.error(error.message || "Error al registrar préstamo");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="w-full space-y-6">
        <PremiumCard interactive={false} className="border-blue-100 bg-blue-50/40 p-4">
        <form onSubmit={handleScan}>
          <label className="mb-1.5 block text-sm font-bold text-blue-900">Escanear SKU</label>
          <div className="flex gap-3">
            <input
              ref={scannerRef}
              name="scanner"
              autoComplete="off"
              placeholder="Escanea con lector y presiona Enter..."
              className="h-12 flex-1 rounded-xl border border-blue-200 bg-white px-4 text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
            />
            <button className="rounded-xl bg-blue-600 px-5 py-2 text-sm font-bold text-white transition hover:bg-blue-700">
              Procesar
            </button>
          </div>
          {scannedItem && form.tipo === "salida" && (
            <div className="mt-3 rounded-xl border border-blue-200 bg-white p-3 text-sm text-blue-900">
              SKU listo: <b>{scannedItem.sku}</b> - {scannedItem.articulo} {scannedItem.modelo ? `(${scannedItem.modelo})` : ""}
            </div>
          )}
        </form>
        </PremiumCard>

        <PremiumCard interactive={false}>
        <form onSubmit={submitSalida} className="p-6">
          <div className="grid gap-5">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">Tipo de movimiento</label>
              <div className="flex gap-3">
                {[
                  { val: "salida", label: "Salida definitiva", active: "border-red-400 bg-red-50 text-red-700" },
                  { val: "prestamo", label: "Préstamo", active: "border-amber-400 bg-amber-50 text-amber-700" },
                ].map((option) => (
                  <button
                    key={option.val}
                    type="button"
                    onClick={() => {
                      set("tipo", option.val);
                      setScannedItem(null);
                    }}
                    className={`flex-1 rounded-xl border-2 py-3 text-sm font-bold transition ${
                      form.tipo === option.val ? option.active : "border-slate-200 text-slate-500 hover:bg-slate-50"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">Artículo manual</label>
              <SelectPremium 
                value={String(form.articulo_id)} 
                onChange={(value) => set("articulo_id", value)} 
                placeholder={cargando ? "Cargando artículos..." : "Seleccionar artículo..."}
                options={articulos.map((articulo) => ({ value: String(articulo.id), label: `${articulo.nombre} ${articulo.modelo ? `- ${articulo.modelo}` : ""} (Stock: ${articulo.stock ?? articulo.cantidad ?? 0})` }))}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                Empleado que retira <span className="text-red-500">*</span>
              </label>
              <SelectPremium 
                value={String(form.empleado_id)} 
                onChange={(value) => set("empleado_id", value)} 
                placeholder={cargando ? "Cargando empleados..." : "Seleccionar empleado..."}
                options={empleados.map((empleado) => ({ value: String(empleado.id), label: `${empleado.nombre_completo} - ${empleado.departamento_area}` }))}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">Cantidad manual</label>
              <input
                type="number"
                min={1}
                disabled={Boolean(scannedItem)}
                value={form.cantidad}
                onChange={(event) => set("cantidad", event.target.value)}
                className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 disabled:bg-slate-100"
              />
            </div>

            {form.tipo === "prestamo" && articuloSeleccionado && !scannedItem && (
              <button type="button" onClick={addManualToPrestamo} className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-bold text-blue-700 transition hover:bg-blue-100">
                Agregar artículo manual al préstamo
              </button>
            )}

            {form.tipo === "prestamo" && prestamoItems.length > 0 && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                {prestamoItems.length} artículo(s) listos para confirmar préstamo.
              </div>
            )}

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">Notas (opcional)</label>
              <textarea
                rows={3}
                value={form.notas}
                onChange={(event) => set("notas", event.target.value)}
                placeholder="Motivo, proyecto, observaciones..."
                className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Link to="/almacen" className="flex-1 rounded-xl bg-slate-100 px-4 py-3 text-center text-sm font-bold text-slate-700 transition hover:bg-slate-200">
                Cancelar
              </Link>
              <button type="submit" disabled={loading || cargando} className="flex-1 rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-50">
                {loading ? "Registrando..." : `Registrar ${form.tipo === "prestamo" ? "Préstamo" : "Salida"}`}
              </button>
            </div>
          </div>
        </form>
        </PremiumCard>
      </div>

      {showPrestamoModal && (
        <PrestamoModal
          items={prestamoItems}
          empleado={empleadoSeleccionado}
          loading={loading}
          onClose={() => setShowPrestamoModal(false)}
          onConfirm={confirmPrestamo}
          onRemove={(key) => setPrestamoItems((prev) => prev.filter((item) => item.key !== key))}
          onQuantityChange={(key, cantidad) => setPrestamoItems((prev) => prev.map((item) => item.key === key ? { ...item, cantidad } : item))}
        />
      )}
    </>
  );
}
