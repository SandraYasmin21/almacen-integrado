import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  UserGroupIcon,
  KeyIcon,
  NoSymbolIcon,
  CheckCircleIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";
import { apiFetch } from "@/lib/auth";
import StatusBadge from "../../components/StatusBadge";

export default function PerfilesKiosco() {
  const [perfiles, setPerfiles] = useState([]);
  const [loading, setLoading] = useState(true);

  const mapUsuario = (usuario) => ({
    id: usuario.id,
    empleado: {
      nombre_completo: usuario.nombre_usuario,
      numero_gafete: usuario.rol_acceso,
    },
    kioscos_autorizados: [usuario.rol_acceso],
    ultimo_acceso: usuario.ultimo_acceso,
    estado: usuario.activo ? "activo" : "suspendido",
    email: usuario.email,
  });

  const loadUsuarios = async () => {
    setLoading(true);
    try {
      const response = await apiFetch("/api/admin/usuarios");
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message || "No se pudo cargar usuarios");
      setPerfiles((payload.data || payload).map(mapUsuario));
    } catch (error) {
      toast.error(error.message || "No se pudo cargar usuarios");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsuarios();
  }, []);

  const handleCreate = async () => {
    const nombre_usuario = window.prompt("Nombre de usuario");
    if (!nombre_usuario) return;

    const email = window.prompt("Correo");
    if (!email) return;

    const rol_acceso = window.prompt("Rol: Admin, Almacen, Proyecto, Solicitante o Direccion", "Solicitante");
    if (!rol_acceso) return;

    try {
      const response = await apiFetch("/api/admin/usuarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre_usuario, email, rol_acceso }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message || "No se pudo crear usuario");

      toast.success(`Usuario creado. Password temporal: ${payload.password_temporal}`);
      await loadUsuarios();
    } catch (error) {
      toast.error(error.message || "No se pudo crear usuario");
    }
  };

  const handleResetPIN = async (id) => {
    try {
      const response = await apiFetch(`/api/admin/usuarios/${id}/reset-password`, { method: "POST" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message || "No se pudo restablecer password");
      toast.success(`Password temporal: ${payload.password_temporal}`);
    } catch (error) {
      toast.error(error.message || "No se pudo restablecer password");
    }
  };

  const handleToggleStatus = async (perfil) => {
    const activo = perfil.estado !== "activo";

    try {
      const response = await apiFetch(`/api/admin/usuarios/${perfil.id}/activar`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activo }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message || "No se pudo actualizar estado");

      toast.success(`Perfil ${activo ? "activado" : "suspendido"} correctamente.`);
      setPerfiles((prev) => prev.map((p) => (p.id === perfil.id ? mapUsuario(payload) : p)));
    } catch (error) {
      toast.error(error.message || "No se pudo actualizar estado");
    }
  };

  const handleChangeRole = async (perfil) => {
    const nuevoRol = window.prompt("Nuevo Rol (Admin, Almacen, Proyecto, Solicitante, Direccion):", perfil.kioscos_autorizados[0]);
    if (!nuevoRol || nuevoRol === perfil.kioscos_autorizados[0]) return;

    try {
      const response = await apiFetch(`/api/admin/usuarios/${perfil.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rol_acceso: nuevoRol }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message || "No se pudo actualizar rol");
      
      toast.success("Rol actualizado correctamente");
      setPerfiles((prev) => prev.map((p) => (p.id === perfil.id ? mapUsuario(payload.data || payload) : p)));
    } catch (error) {
      toast.error(error.message || "No se pudo actualizar rol");
    }
  };

  const activos = perfiles.filter((p) => p.estado === "activo").length;
  const suspendidos = perfiles.filter((p) => p.estado === "suspendido").length;

  return (
    <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Control de Usuarios</h1>
        </div>
        <button
          type="button"
          onClick={handleCreate}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-blue-500 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2"
        >
          <UserGroupIcon className="h-5 w-5" />
          Nuevo Usuario
        </button>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <UserGroupIcon className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Total Usuarios</p>
              <p className="text-2xl font-bold text-slate-900">{perfiles.length}</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <CheckCircleIcon className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Perfiles Activos</p>
              <p className="text-2xl font-bold text-slate-900">{activos}</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
              <NoSymbolIcon className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Suspendidos</p>
              <p className="text-2xl font-bold text-slate-900">{suspendidos}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="border-b border-slate-200 bg-slate-50 text-slate-500">
              <tr>
                <th className="px-6 py-4 font-semibold">Usuario</th>
                <th className="px-6 py-4 font-semibold">Rol</th>
                <th className="px-6 py-4 font-semibold">Ultimo Acceso</th>
                <th className="px-6 py-4 font-semibold">Estado</th>
                <th className="px-6 py-4 text-right font-semibold">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400">Cargando perfiles...</td>
                </tr>
              ) : perfiles.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400">No hay perfiles registrados</td>
                </tr>
              ) : (
                perfiles.map((perfil) => (
                  <tr key={perfil.id} className="transition-colors hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-800">{perfil.empleado.nombre_completo}</div>
                      <div className="text-xs text-slate-500">{perfil.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {perfil.kioscos_autorizados.map((k) => (
                          <span key={k} className="inline-flex items-center rounded-md bg-slate-100 px-2 py-1 text-xs font-medium uppercase text-slate-600 ring-1 ring-inset ring-slate-500/10">
                            {k}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      {perfil.ultimo_acceso ? new Date(perfil.ultimo_acceso).toLocaleString("es-MX") : "Nunca"}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={perfil.estado === "activo" ? "entregado" : "cancelado"} size="compact" />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => handleChangeRole(perfil)}
                          className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-indigo-50 hover:text-indigo-600"
                          title="Cambiar Rol"
                        >
                          <UserGroupIcon className="h-5 w-5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleResetPIN(perfil.id)}
                          className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-amber-50 hover:text-amber-600"
                          title="Restablecer password"
                        >
                          <KeyIcon className="h-5 w-5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(perfil)}
                          className={`rounded-lg p-2 transition-colors ${
                            perfil.estado === "activo"
                              ? "text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                              : "text-slate-400 hover:bg-emerald-50 hover:text-emerald-600"
                          }`}
                          title={perfil.estado === "activo" ? "Suspender Usuario" : "Activar Usuario"}
                        >
                          {perfil.estado === "activo" ? <NoSymbolIcon className="h-5 w-5" /> : <ArrowPathIcon className="h-5 w-5" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
