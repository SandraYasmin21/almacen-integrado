import Movimientos from "../Movimientos";

export default function RegistroMovimientosPage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-black text-slate-900">Historial y bitácora</h1>
        <p className="mt-1 text-sm text-slate-500">
          Consulta de movimientos registrada contra la API real de almacén.
        </p>
      </div>
      <Movimientos />
    </div>
  );
}
