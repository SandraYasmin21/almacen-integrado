import { useState } from "react";
import { toast } from "sonner";
import { DocumentArrowDownIcon, PlusIcon, TrashIcon } from "@heroicons/react/24/outline";
import { authHeaders } from "@/lib/auth";

const API = import.meta.env.VITE_API_URL ?? "";

const formatos = [
  { value: "hoja-entrega", label: "Hoja de entrega bajo resguardo temporal" },
  { value: "asignacion-equipo", label: "Asignación de equipo" },
  { value: "prestamo-externo", label: "Préstamo de equipo externo" },
];

const itemInicial = {
  cantidad: "1 pieza",
  equipo: "Laptop Dell",
  modelo: "Latitude 5490",
  serie: "GDKGNV2",
  unidad: "PZA",
};

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.open(url, "_blank", "noopener,noreferrer");
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}

export default function HojasEntrega() {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    tipo: "hoja-entrega",
    fecha: new Date().toISOString().slice(0, 10),
    recibe: "Mario Alberto Garcia Vega",
    destinatario: "Mario Alberto Garcia Vega",
    entrega: "Ing. Dacia Edith Quintanilla Zuniga",
    cargo_entrega: "Encargada de Almacen",
    motivo: "Entrega de equipo",
    items: [itemInicial],
  });

  const updateForm = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const updateItem = (index, field, value) => {
    setForm((current) => ({
      ...current,
      items: current.items.map((item, itemIndex) => (
        itemIndex === index ? { ...item, [field]: value } : item
      )),
    }));
  };

  const addItem = () => {
    setForm((current) => ({
      ...current,
      items: [...current.items, { cantidad: "1 pieza", equipo: "", modelo: "N/A", serie: "N/A", unidad: "PZA" }],
    }));
  };

  const removeItem = (index) => {
    setForm((current) => ({
      ...current,
      items: current.items.filter((_, itemIndex) => itemIndex !== index),
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (form.items.some((item) => !item.equipo.trim())) {
      toast.error("Cada fila necesita nombre de equipo o artículo.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API}/api/documentos-operacion/${form.tipo}/pdf`, {
        method: "POST",
        headers: authHeaders({ "Content-Type": "application/json", Accept: "application/json" }),
        body: JSON.stringify({
          fecha: form.fecha,
          recibe: form.recibe,
          entrega: form.entrega,
          cargo_entrega: form.cargo_entrega,
          destinatario: form.destinatario,
          motivo: form.motivo,
          items: form.items,
        }),
      });

      if (response.status === 401) {
        throw new Error("Tu sesión expiró. Vuelve a iniciar sesión.");
      }
      if (!response.ok) throw new Error("No se pudo generar el PDF");

      const blob = await response.blob();
      downloadBlob(blob, `${form.tipo}-${Date.now()}.pdf`);
      toast.success("PDF generado correctamente");
    } catch (error) {
      toast.error(error.message || "Error al generar el PDF");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl p-4 sm:p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Formatos de entrega</h1>
        <p className="mt-2 text-sm text-slate-500">Genera PDFs con los formatos de asignación, resguardo temporal y préstamo externo.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Formato</label>
            <select
              value={form.tipo}
              onChange={(event) => updateForm("tipo", event.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500"
            >
              {formatos.map((formato) => (
                <option key={formato.value} value={formato.value}>{formato.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Fecha</label>
            <input
              type="date"
              value={form.fecha}
              onChange={(event) => updateForm("fecha", event.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Motivo o referencia</label>
            <input
              value={form.motivo}
              onChange={(event) => updateForm("motivo", event.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="Entrega de equipo"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Recibe</label>
            <input
              value={form.recibe}
              onChange={(event) => {
                updateForm("recibe", event.target.value);
                if (form.tipo !== "prestamo-externo") updateForm("destinatario", event.target.value);
              }}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="Nombre de quien recibe"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Destinatario externo</label>
            <input
              value={form.destinatario}
              onChange={(event) => updateForm("destinatario", event.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="Empresa o persona externa"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Entrega</label>
            <input
              value={form.entrega}
              onChange={(event) => updateForm("entrega", event.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="Nombre de quien entrega"
            />
          </div>
        </div>

        <div className="border-t border-slate-200 pt-6">
          <div className="mb-4 flex items-center justify-between gap-4">
            <h2 className="text-lg font-semibold text-slate-900">Equipos o artículos</h2>
            <button
              type="button"
              onClick={addItem}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
            >
              <PlusIcon className="h-4 w-4" />
              Agregar fila
            </button>
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-200">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-3 py-3">Cantidad</th>
                  <th className="px-3 py-3">Equipo</th>
                  <th className="px-3 py-3">Modelo</th>
                  <th className="px-3 py-3">Numero de serie</th>
                  <th className="px-3 py-3">Unidad</th>
                  <th className="w-12 px-3 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {form.items.map((item, index) => (
                  <tr key={index} className="border-t border-slate-100">
                    {["cantidad", "equipo", "modelo", "serie", "unidad"].map((field) => (
                      <td key={field} className="px-3 py-2">
                        <input
                          value={item[field]}
                          onChange={(event) => updateItem(index, field, event.target.value)}
                          className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm outline-none focus:border-blue-500"
                        />
                      </td>
                    ))}
                    <td className="px-3 py-2 text-right">
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        disabled={form.items.length === 1}
                        className="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex justify-end border-t border-slate-200 pt-6">
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-500 disabled:cursor-wait disabled:opacity-70"
          >
            <DocumentArrowDownIcon className="h-5 w-5" />
            {loading ? "Generando PDF..." : "Guardar y generar PDF"}
          </button>
        </div>
      </form>
    </div>
  );
}
