import { useEffect, useState } from "react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/auth";

const tipos = [
  "estados_fisicos",
  "estatus_operativos",
  "tipos_movimiento",
  "tipos_control",
  "tipos_activo",
  "marcas",
  "tipos_ubicacion",
  "estatus_vehiculo",
  "tipos_mantenimiento",
];

export default function CatalogosConfigurables() {
  const [catalogos, setCatalogos] = useState({});
  const [form, setForm] = useState({ tipo: "estados_fisicos", clave: "", nombre: "" });

  const load = async () => {
    try {
      const response = await apiFetch("/api/catalogos-configurables");
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message || "No se pudieron cargar catalogos");
      setCatalogos(payload);
    } catch (error) {
      toast.error(error.message || "No se pudieron cargar catalogos");
    }
  };

  useEffect(() => {
    load();
  }, []);

  const submit = async (event) => {
    event.preventDefault();
    try {
      const response = await apiFetch("/api/catalogos-configurables", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message || "No se pudo crear catalogo");
      toast.success("Catalogo agregado");
      setForm({ ...form, clave: "", nombre: "" });
      await load();
    } catch (error) {
      toast.error(error.message || "No se pudo crear catalogo");
    }
  };

  const deactivate = async (item) => {
    try {
      const response = await apiFetch(`/api/catalogos-configurables/${item.id}`, {
        method: "DELETE",
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message || "No se pudo desactivar catalogo");
      toast.success("Catalogo desactivado");
      await load();
    } catch (error) {
      toast.error(error.message || "No se pudo desactivar catalogo");
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <form onSubmit={submit} className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:grid-cols-[220px_1fr_1fr_160px]">
        <select className="h-11 rounded-xl border border-slate-200 px-3 text-sm" value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })}>
          {tipos.map((tipo) => <option key={tipo}>{tipo}</option>)}
        </select>
        <input className="h-11 rounded-xl border border-slate-200 px-3 text-sm" placeholder="Clave" value={form.clave} onChange={(e) => setForm({ ...form, clave: e.target.value.toUpperCase().replace(/\s+/g, "_") })} required />
        <input className="h-11 rounded-xl border border-slate-200 px-3 text-sm" placeholder="Nombre visible" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} required />
        <button className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700">Agregar</button>
      </form>

      <div className="grid gap-4 lg:grid-cols-2">
        {tipos.map((tipo) => (
          <section key={tipo} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="font-extrabold text-slate-900">{tipo}</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {(catalogos[tipo] || []).map((item) => (
                <span key={item.id} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-bold text-slate-600">
                  <span>{item.nombre}</span>
                  <button type="button" onClick={() => deactivate(item)} className="rounded border border-slate-200 px-1.5 py-0.5 text-[10px] font-bold text-red-600 hover:bg-red-50">
                    Baja
                  </button>
                </span>
              ))}
              {(catalogos[tipo] || []).length === 0 && <p className="text-sm text-slate-400">Sin valores</p>}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
