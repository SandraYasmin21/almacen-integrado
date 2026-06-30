import { Navigate } from "react-router-dom";
import Entrada from "../Almacen/Entrada";
import Inventario from "../Almacen/Index";
import Movimientos from "../Almacen/Movimientos";
import AjustesAuditorias from "../Almacen/AjustesAuditorias";

const sections = [
  {
    key: "recepcion",
  },
  {
    key: "inventario",
  },
  {
    key: "movimientos",
  },
];

function MovimientosYAjustes() {
  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-5">
          <h2 className="text-lg font-bold text-slate-900">Historial y bitácora</h2>
          <p className="mt-1 text-sm text-slate-500">
            Consulta de entradas, salidas, préstamos, devoluciones y movimientos auditables.
          </p>
        </div>
        <Movimientos />
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-5">
          <h2 className="text-lg font-bold text-slate-900">Ajustes de inventario</h2>
          <p className="mt-1 text-sm text-slate-500">
            Correcciones físicas controladas con registro en la bitácora del almacén.
          </p>
        </div>
        <AjustesAuditorias />
      </section>
    </div>
  );
}

export default function AdministracionActivos({ section = "inventario" }) {
  if (!sections.some((item) => item.key === section)) {
    return <Navigate to="/activos/recepcion" replace />;
  }

  const content = {
    inventario: <Inventario />,
    recepcion: <Entrada />,
    movimientos: <MovimientosYAjustes />,
  }[section];

  return <div className="min-w-0">{content}</div>;
}
