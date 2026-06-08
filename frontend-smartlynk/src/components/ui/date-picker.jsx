import * as React from "react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { CalendarIcon } from "@heroicons/react/24/outline"

import { cn } from "../../lib/utils"
import { Calendar } from "./calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./popover"

export function DatePicker({
  value,
  onChange,
  className,
  placeholder = "Seleccionar fecha...",
  disabled = false,
}) {
  const [open, setOpen] = React.useState(false)

  // Handle value that could be string or Date object
  const dateValue = typeof value === 'string' && value ? new Date(value) : value

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          disabled={disabled}
          className={cn(
            "flex h-11 w-full items-center justify-start rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 outline-none transition-all duration-200 ease-in-out focus:border-transparent focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
            !dateValue && "text-slate-400",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4 opacity-50" />
          {dateValue ? format(dateValue, "PPP", { locale: es }) : <span>{placeholder}</span>}
        </button>
      </PopoverTrigger>
      <PopoverContent className="rdp-popup w-auto rounded-xl border border-slate-200 bg-white p-3 shadow-xl" align="start">
        <Calendar
          mode="single"
          selected={dateValue}
          onSelect={(d) => {
            onChange(d)
            setOpen(false)
          }}
          initialFocus
          locale={es}
        />
      </PopoverContent>
    </Popover>
  )
}
