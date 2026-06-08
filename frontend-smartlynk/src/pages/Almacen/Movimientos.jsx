import { useEffect, useState } from "react";
import { toast } from "sonner";
import { DataTableShell, ExportButtons, PremiumModal, dataTableClass } from "../../components/ui/premium";

const API = import.meta.env.VITE_API_URL ?? "";
const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("smartlynk_token") ?? ""}`,
});

const TIPO_COLOR = {
  entrada: "bg-green-100 text-green-700",
  salida: "bg-red-100 text-red-700",
  prestamo: "bg-amber-100 text-amber-700",
  devolucion: "bg-blue-100 text-blue-700",
};

async function readJson(response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.success === false) {
    throw new Error(data.message || data.mensaje || "No se pudo completar la operación");
  }
  return data;
}

function MovementExportButtons() {
  const download = async (format) => {
    try {
      const response = await fetch(`${API}/api/export/${format}?section=movimientos`, { headers: authHeaders() });
      if (!response.ok) throw new Error("No se pudo generar el archivo");
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `movimientos.${format === "pdf" ? "pdf" : "xlsx"}`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success(`Exportación ${format.toUpperCase()} generada`);
    } catch (error) {
      toast.error(error.message || "No se pudo exportar");
    }
  };

  return (
    <ExportButtons onPdf={() => download("pdf")} onExcel={() => download("excel")} />
  );
}

function MovimientoModal({ movimiento, onClose, onSaved }) {
  const [notas, setNotas] = useState(movimiento?.notas ?? "");
  const [loading, setLoading] = useState(false);

  const save = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API}/api/almacen/movimientos/${movimiento.id}`, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify({ notas }),
      });
      const data = await readJson(response);
      toast.success(data.message || "Movimiento actualizado");
      onSaved();
    } catch (error) {
      toast.error(error.message || "No se pudo actualizar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <PremiumModal className="max-w-2xl p-0" onBackdropClick={onClose}>
        <div className="flex items-center justify-between border-b border-slate-100 p-5">
          <h3 className="text-lg font-bold text-slate-900">Detalle de movimiento</h3>
          <button onClick={onClose} className="rounded-lg px-2 py-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700">Cerrar</button>
        </div>
        <div className="grid gap-4 p-5 sm:grid-cols-2">
          <Info label="Tipo" value={movimiento.tipo} />
          <Info label="Fecha" value={movimiento.fecha_hora} />
          <Info label="Artículo" value={movimiento.articulo || "-"} />
          <Info label="Modelo" value={movimiento.modelo || "-"} />
          <Info label="SKU" value={movimiento.sku || "-"} />
          <Info label="Cantidad" value={movimiento.cantidad ?? "-"} />
          <Info label="Empleado" value={movimiento.empleado || "-"} />
          <Info label="Usuario" value={movimiento.nombre_usuario || "-"} />
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-sm font-bold text-slate-700">Notas</label>
            <textarea
              rows={4}
              value={notas}
              onChange={(event) => setNotas(event.target.value)}
              className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
        </div>
        <div className="flex justify-end gap-3 border-t border-slate-100 p-5">
          <button onClick={onClose} className="rounded-xl bg-slate-100 px-5 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-200">Cancelar</button>
          <button onClick={save} disabled={loading} className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-50">
            {loading ? "Guardando..." : "Guardar cambios"}
          </button>
        </div>
    </PremiumModal>
  );
}

function ConfirmDeleteModal({ movimiento, onClose, onDeleted }) {
  const [loading, setLoading] = useState(false);

  const remove = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API}/api/almacen/movimientos/${movimiento.id}`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      const data = await readJson(response);
      toast.success(data.message || "Movimiento eliminado");
      onDeleted();
    } catch (error) {
      toast.error(error.message || "No se pudo eliminar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <PremiumModal className="max-w-md" onBackdropClick={onClose}>
        <h3 className="text-lg font-bold text-slate-900">Eliminar movimiento</h3>
        <p className="mt-2 text-sm text-slate-500">
          Esta acción intentará revertir el stock de forma segura. Si provoca stock negativo o el SKU tiene movimientos posteriores, el sistema la bloqueará.
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onClose} className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-200">Cancelar</button>
          <button onClick={remove} disabled={loading} className="rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-50">
            {loading ? "Eliminando..." : "Eliminar"}
          </button>
        </div>
    </PremiumModal>
  );
}

function Info({ label, value }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
      <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-1 break-words text-sm font-semibold text-slate-800">{value}</p>
    </div>
  );
}

export default function Movimientos() {
  const [movimientos, setMovimientos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroTipo, setFiltroTipo] = useState("");
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState(null);
  const [selected, setSelected] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page) });
      if (filtroTipo) params.append("tipo", filtroTipo);
      const response = await fetch(`${API}/api/almacen/movimientos?${params.toString()}`, { headers: authHeaders() });
      const data = await response.json();
      setMovimientos(data.data ?? []);
      setMeta(data);
    } catch {
      toast.error("Error al cargar movimientos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [filtroTipo, page]);

  const openDetail = async (id) => {
    try {
      const response = await fetch(`${API}/api/almacen/movimientos/${id}`, { headers: authHeaders() });
      const data = await readJson(response);
      setSelected(data.data);
    } catch (error) {
      toast.error(error.message || "No se pudo cargar el detalle");
    }
  };

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {["", "entrada", "salida", "prestamo", "devolucion"].map((tipo) => (
              <button
                key={tipo}
                onClick={() => { setFiltroTipo(tipo); setPage(1); }}
                className={`rounded-xl border px-3 py-1.5 text-xs font-bold capitalize transition ${
                  filtroTipo === tipo ? "border-blue-600 bg-blue-600 text-white" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                {tipo === "" ? "Todos" : tipo}
              </button>
            ))}
          </div>
          <MovementExportButtons />
        </div>

        <DataTableShell>
          <table className={dataTableClass()}>
            <thead className="border-b border-slate-100 bg-slate-50">
              <tr className="text-xs uppercase tracking-wide text-slate-500">
                <th className="w-[12%] px-4 py-3 text-left font-semibold">Fecha</th>
                <th className="w-[10%] px-4 py-3 text-left font-semibold">Tipo</th>
                <th className="w-[20%] px-4 py-3 text-left font-semibold">Artículo</th>
                <th className="w-[14%] px-4 py-3 text-left font-semibold">SKU</th>
                <th className="w-[8%] px-4 py-3 text-left font-semibold">Cant.</th>
                <th className="w-[14%] px-4 py-3 text-left font-semibold">Empleado</th>
                <th className="w-[12%] px-4 py-3 text-left font-semibold">Usuario</th>
                <th className="w-[10%] px-4 py-3 text-right font-semibold">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr><td colSpan={8} className="px-5 py-8 text-center text-sm text-slate-400">Cargando...</td></tr>
              ) : movimientos.length === 0 ? (
                <tr><td colSpan={8} className="px-5 py-8 text-center text-sm text-slate-400">Sin movimientos registrados</td></tr>
              ) : movimientos.map((movimiento) => (
                <tr key={`${movimiento.id}-${movimiento.detalle_id ?? "d"}`} className="hover:bg-slate-50">
                  <td className="truncate px-4 py-3 text-xs text-slate-500">{movimiento.fecha_hora}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-bold capitalize ${TIPO_COLOR[movimiento.tipo] || "bg-slate-100 text-slate-600"}`}>
                      {movimiento.tipo}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <p className="truncate font-semibold text-slate-800">{movimiento.articulo ?? "-"}</p>
                    <p className="truncate text-xs text-slate-400">{movimiento.modelo ?? "-"}</p>
                  </td>
                  <td className="truncate px-4 py-3 font-mono text-xs text-slate-500">{movimiento.sku ?? "-"}</td>
                  <td className="px-4 py-3 font-bold text-slate-800">{movimiento.cantidad ?? "-"}</td>
                  <td className="truncate px-4 py-3 text-xs text-slate-500">{movimiento.empleado ?? "-"}</td>
                  <td className="truncate px-4 py-3 text-xs text-slate-500">{movimiento.nombre_usuario}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => openDetail(movimiento.id)} className="rounded-lg bg-blue-50 px-2 py-1 text-xs font-bold text-blue-700 hover:bg-blue-100">Ver</button>
                      <button onClick={() => setDeleteTarget(movimiento)} className="rounded-lg bg-red-50 px-2 py-1 text-xs font-bold text-red-700 hover:bg-red-100">Eliminar</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {meta && meta.last_page > 1 && (
            <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3">
              <p className="text-xs text-slate-400">Mostrando {meta.from}-{meta.to} de {meta.total} movimientos</p>
              <div className="flex gap-2">
                <button onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={page === 1} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs transition hover:bg-slate-50 disabled:opacity-40">Anterior</button>
                <button onClick={() => setPage((value) => Math.min(meta.last_page, value + 1))} disabled={page === meta.last_page} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs transition hover:bg-slate-50 disabled:opacity-40">Siguiente</button>
              </div>
            </div>
          )}
        </DataTableShell>
      </div>

      {selected && <MovimientoModal movimiento={selected} onClose={() => setSelected(null)} onSaved={() => { setSelected(null); load(); }} />}
      {deleteTarget && <ConfirmDeleteModal movimiento={deleteTarget} onClose={() => setDeleteTarget(null)} onDeleted={() => { setDeleteTarget(null); load(); }} />}
    </>
  );
}
