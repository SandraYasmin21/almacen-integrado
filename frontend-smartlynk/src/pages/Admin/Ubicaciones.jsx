import { useEffect, useState } from "react";
import { MapPin, Plus, Power } from "lucide-react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/auth";

const emptyForm = { nombre: "", tipo: "Almacen", activo: true };

export default function Ubicaciones() {
  const [ubicaciones, setUbicaciones] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const response = await apiFetch("/api/ubicaciones?per_page=100");
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message || "No se pudieron cargar las ubicaciones");
      setUbicaciones(payload.data || payload);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const submit = async (event) => {
    event.preventDefault();
    try {
      const response = await apiFetch(`/api/ubicaciones${editing ? `/${editing.id}` : ""}`, {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message || "No se pudo guardar la ubicacion");
      toast.success(editing ? "Ubicacion actualizada" : "Ubicacion registrada");
      setForm(emptyForm);
      setEditing(null);
      await load();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const toggle = async (ubicacion) => {
    try {
      const response = await apiFetch(`/api/ubicaciones/${ubicacion.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre: ubicacion.nombre, tipo: ubicacion.tipo, activo: !ubicacion.activo }),
      });
      if (!response.ok) throw new Error("No se pudo cambiar el estado");
      await load();
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div><h1 className="text-2xl font-black text-slate-900">Ubicaciones</h1><p className="text-sm text-slate-500">Administra almacenes, áreas, niveles y zonas donde se encuentran los activos.</p></div>
      <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
        <form onSubmit={submit} className="h-fit rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="font-bold text-slate-900">{editing ? "Editar ubicacion" : "Nueva ubicacion"}</h2>
          <div className="mt-4 space-y-3">
            <input required value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} placeholder="Ej. Almacen principal, Estante A, Nivel 1" className="h-11 w-full rounded-lg border border-slate-200 px-3 text-sm" />
            <select value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })} className="h-11 w-full rounded-lg border border-slate-200 px-3 text-sm"><option>Almacen</option><option>Area</option><option>Estante</option><option>Nivel</option><option>Proyecto</option><option>Reparacion</option></select>
            <label className="flex items-center gap-2 text-sm text-slate-600"><input type="checkbox" checked={form.activo} onChange={(e) => setForm({ ...form, activo: e.target.checked })} /> Ubicacion activa</label>
            <button className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-bold text-white"><Plus className="h-4 w-4" />{editing ? "Guardar cambios" : "Agregar ubicacion"}</button>
          </div>
        </form>
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-5 py-3">Ubicacion</th><th className="px-5 py-3">Tipo</th><th className="px-5 py-3">Estado</th><th className="px-5 py-3 text-right">Acciones</th></tr></thead>
            <tbody className="divide-y divide-slate-100">{loading ? <tr><td colSpan={4} className="p-10 text-center text-slate-400">Cargando...</td></tr> : ubicaciones.map((u) => <tr key={u.id}><td className="px-5 py-4 font-semibold text-slate-800"><span className="flex items-center gap-2"><MapPin className="h-4 w-4 text-blue-500" />{u.nombre}</span></td><td className="px-5 py-4">{u.tipo || "-"}</td><td className="px-5 py-4">{u.activo ? "Activa" : "Inactiva"}</td><td className="px-5 py-4 text-right"><button onClick={() => { setEditing(u); setForm({ nombre: u.nombre, tipo: u.tipo || "Almacen", activo: u.activo }); }} className="mr-2 rounded-md border px-3 py-1.5 text-xs">Editar</button><button onClick={() => toggle(u)} title={u.activo ? "Desactivar" : "Activar"} className="rounded-md border p-1.5"><Power className="h-4 w-4" /></button></td></tr>)}</tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
