import * as React from "react";
import { format, subMonths, startOfToday, endOfToday, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarIcon } from "@heroicons/react/24/outline";
import { cn } from "../../lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { Calendar } from "./calendar";

export function DateRangePicker({
  date,
  onDateChange,
  className,
}) {
  const [isOpen, setIsOpen] = React.useState(false);

  const handleShortcut = (type) => {
    const today = new Date();
    let from, to;

    switch (type) {
      case "hoy":
        from = startOfToday();
        to = endOfToday();
        break;
      case "semana":
        from = startOfWeek(today, { weekStartsOn: 1 });
        to = endOfWeek(today, { weekStartsOn: 1 });
        break;
      case "mes":
        from = startOfMonth(today);
        to = endOfMonth(today);
        break;
      case "mes_pasado":
        const lastMonth = subMonths(today, 1);
        from = startOfMonth(lastMonth);
        to = endOfMonth(lastMonth);
        break;
      default:
        break;
    }

    onDateChange({ from, to });
    setIsOpen(false);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button
          id="date"
          className={cn(
            "flex items-center justify-start text-left bg-white border border-slate-200 hover:bg-slate-50 rounded-lg px-4 py-2 text-sm transition-colors text-slate-700 w-[260px] shadow-sm font-medium whitespace-nowrap",
            !date && "text-slate-400",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4 shrink-0 text-blue-500" />
          <span className="truncate">
            {date?.from ? (
              date.to ? (
                <>
                  {format(date.from, "dd LLL, y", { locale: es })} -{" "}
                  {format(date.to, "dd LLL, y", { locale: es })}
                </>
              ) : (
                format(date.from, "dd LLL, y", { locale: es })
              )
            ) : (
              <span>Seleccionar rango...</span>
            )}
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 rounded-xl shadow-xl border-slate-200" align="start">
        <div className="flex flex-col sm:flex-row">
          {/* Sidebar shortcuts */}
          <div className="flex flex-col gap-2 p-4 border-b sm:border-b-0 sm:border-r border-slate-100 bg-slate-50/50 min-w-[140px]">
            <div className="text-xs font-bold text-slate-400 mb-2 tracking-wider">ATAJOS</div>
            <button
              onClick={() => handleShortcut("hoy")}
              className="text-left px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200/50 rounded-md transition-colors"
            >
              Hoy
            </button>
            <button
              onClick={() => handleShortcut("semana")}
              className="text-left px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200/50 rounded-md transition-colors"
            >
              Esta semana
            </button>
            <button
              onClick={() => handleShortcut("mes")}
              className="text-left px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200/50 rounded-md transition-colors"
            >
              Este mes
            </button>
            <button
              onClick={() => handleShortcut("mes_pasado")}
              className="text-left px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200/50 rounded-md transition-colors"
            >
              Mes pasado
            </button>
          </div>
          
          {/* Calendar Range Picker */}
          <div className="p-2">
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={date?.from}
              selected={date}
              onSelect={onDateChange}
              numberOfMonths={2}
              locale={es}
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
