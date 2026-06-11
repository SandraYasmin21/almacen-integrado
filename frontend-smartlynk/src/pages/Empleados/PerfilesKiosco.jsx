import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  ShieldCheckIcon,
  UserGroupIcon,
  KeyIcon,
  NoSymbolIcon,
  CheckCircleIcon,
  ArrowPathIcon
} from "@heroicons/react/24/outline";
import { apiFetch } from "@/lib/auth";
import StatusBadge from "../../components/StatusBadge";

export default function PerfilesKiosco() {
  const [perfiles, setPerfiles] = useState([]);
  const [loading, setLoading] = useState(true);

  // Simular la carga de datos por ahora
  useEffect(() => {
    setTimeout(() => {
      setPerfiles([
        {
          id: 1,
          empleado: { nombre_completo: "Juan Pérez", numero_gafete: "14502" },
          kioscos_autorizados: ["prestamos", "vehiculos"],
          ultimo_acceso: "2026-06-10T08:30:00",
          estado: "activo",
        },
        {
          id: 2,
          empleado: { nombre_completo: "María Gómez", numero_gafete: "89012" },
          kioscos_autorizados: ["resguardos"],
          ultimo_acceso: null,
          estado: "suspendido",
        }
      ]);
      setLoading(false);
    }, 1000);
  }, []);

  const handleResetPIN = (id) => {
    toast.success("Se ha enviado un nuevo PIN temporal al empleado.");
  };

  const handleToggleStatus = (perfil) => {
    toast.success(`Perfil ${perfil.estado === 'activo' ? 'suspendido' : 'activado'} correctamente.`);
    setPerfiles(prev => prev.map(p => p.id === perfil.id ? { ...p, estado: p.estado === 'activo' ? 'suspendido' : 'activo' } : p));
  };

  const activos = perfiles.filter(p => p.estado === 'activo').length;
  const suspendidos = perfiles.filter(p => p.estado === 'suspendido').length;

  return (
    <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm font-medium text-blue-600">
            <ShieldCheckIcon className="h-5 w-5" />
            <span>Módulo de Seguridad</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Perfiles de Kiosco</h1>
          <p className="mt-2 text-sm text-slate-500">
            Administra los accesos de los empleados a los Kioscos de Autoservicio.
          </p>
        </div>
        <button
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-blue-500 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2"
        >
          <UserGroupIcon className="h-5 w-5" />
          Generar Nuevo Perfil
        </button>
      </div>

      {/* Tarjetas de resumen */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <UserGroupIcon className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Total Perfiles</p>
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

      {/* Tabla de Perfiles */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="border-b border-slate-200 bg-slate-50 text-slate-500">
              <tr>
                <th className="px-6 py-4 font-semibold">Empleado</th>
                <th className="px-6 py-4 font-semibold">Kioscos Autorizados</th>
                <th className="px-6 py-4 font-semibold">Último Acceso</th>
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
                      <div className="text-xs text-slate-500">Gafete: {perfil.empleado.numero_gafete}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {perfil.kioscos_autorizados.map((k) => (
                          <span key={k} className="inline-flex items-center rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600 ring-1 ring-inset ring-slate-500/10 uppercase">
                            {k}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      {perfil.ultimo_acceso ? new Date(perfil.ultimo_acceso).toLocaleString('es-MX') : "Nunca"}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={perfil.estado === 'activo' ? 'entregado' : 'cancelado'} size="compact" />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleResetPIN(perfil.id)}
                          className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-amber-50 hover:text-amber-600"
                          title="Restablecer PIN"
                        >
                          <KeyIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleToggleStatus(perfil)}
                          className={`rounded-lg p-2 transition-colors ${
                            perfil.estado === 'activo' 
                              ? 'text-slate-400 hover:bg-rose-50 hover:text-rose-600' 
                              : 'text-slate-400 hover:bg-emerald-50 hover:text-emerald-600'
                          }`}
                          title={perfil.estado === 'activo' ? "Suspender Perfil" : "Activar Perfil"}
                        >
                          {perfil.estado === 'activo' ? <NoSymbolIcon className="h-5 w-5" /> : <ArrowPathIcon className="h-5 w-5" />}
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
