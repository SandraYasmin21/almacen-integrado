import { cn } from "../../lib/utils";

export function PremiumCard({ children, className = "", interactive = true, ...props }) {
  return (
    <section
      className={cn(
        "rounded-2xl border border-slate-200 bg-white shadow-sm ring-0",
        interactive && "transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-lg hover:shadow-slate-200/60",
        className
      )}
      {...props}
    >
      {children}
    </section>
  );
}

export function PremiumModal({ children, className = "", onBackdropClick }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onBackdropClick} />
      <div
        className={cn(
          "relative z-10 w-full rounded-3xl border border-slate-100 bg-white p-6 shadow-2xl transition-all",
          className
        )}
      >
        {children}
      </div>
    </div>
  );
}

export function DataTableShell({ children, className = "" }) {
  return (
    <div className={cn("w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm", className)}>
      {children}
    </div>
  );
}

export function dataTableClass(className = "") {
  return cn("w-full table-fixed text-left text-sm text-slate-600", className);
}

export function ExportButtons({ onPdf, onExcel, pdfLabel = "Exportar PDF", excelLabel = "Exportar Excel", className = "" }) {
  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <button
        type="button"
        onClick={onPdf}
        className="flex items-center gap-2 rounded-full bg-rose-500 px-5 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-rose-600 hover:shadow-md"
      >
        {pdfLabel}
      </button>
      <button
        type="button"
        onClick={onExcel}
        className="flex items-center gap-2 rounded-full bg-emerald-500 px-5 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-emerald-600 hover:shadow-md"
      >
        {excelLabel}
      </button>
    </div>
  );
}
