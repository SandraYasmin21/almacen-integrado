export default function StatusBadge({ status, size = "default", className = "" }) {
  const label = String(status || "").trim();
  const normalizedStatus = label.toLowerCase();
  const sizeClasses =
    size === "compact"
      ? "min-w-[86px] px-2 py-0.5 text-[11px]"
      : "min-w-[112px] px-3 py-1 text-xs";

  let colorClasses = "bg-slate-100 text-slate-600 border-slate-200";

  if (["activo", "preventivo", "al corriente", "completado", "ok", "asignado", "consumido"].includes(normalizedStatus)) {
    colorClasses = "bg-emerald-50 text-emerald-700 border-emerald-200";
  } else if (["inactivo", "correctivo", "requerido", "sin unidad", "sin regreso", "atrasado"].includes(normalizedStatus)) {
    colorClasses = "bg-rose-50 text-rose-700 border-rose-200";
  } else if (["lectura", "en ruta", "prestado"].includes(normalizedStatus)) {
    colorClasses = "bg-blue-50 text-blue-700 border-blue-200";
  } else if (["revisar", "sin historial", "borrador", "pendiente"].includes(normalizedStatus)) {
    colorClasses = "bg-amber-50 text-amber-700 border-amber-200";
  }

  return (
    <span
      className={`inline-flex max-w-full shrink-0 items-center justify-center whitespace-nowrap rounded-full border font-semibold uppercase tracking-wide ${sizeClasses} ${colorClasses} ${className}`}
    >
      {label}
    </span>
  );
}
