import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '../../lib/utils';

export function SelectPremium({ 
    options = [], 
    value, 
    defaultValue,
    onChange, 
    placeholder = 'Selecciona una opción',
    className = ''
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [internalValue, setInternalValue] = useState(defaultValue || "");
    const selectRef = useRef(null);

    const isControlled = value !== undefined;
    const currentValue = isControlled ? value : internalValue;

    useEffect(() => {
        const handleClickOutside = (event) => {
            // Si haces clic afuera del contenedor principal, ciérralo.
            if (selectRef.current && !selectRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Encontrar la opción seleccionada
    const selectedOption = options.find(opt => String(opt.value) === String(currentValue));

    const handleSelect = (val) => {
        if (!isControlled) {
            setInternalValue(val);
        }
        if (onChange) {
            onChange(val);
        }
        setIsOpen(false);
    };

    return (
        <div ref={selectRef} className={cn("relative w-full", className)}>
            <div 
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "flex items-center justify-between px-3 py-2 bg-white border cursor-pointer select-none transition-all duration-200 outline-none",
                    isOpen ? "border-blue-500 ring-2 ring-blue-500/20 rounded-t-xl rounded-b-none" : "border-slate-200 rounded-xl hover:border-slate-300 shadow-sm",
                    !selectedOption ? "text-slate-400" : "text-slate-700 font-medium"
                )}
            >
                <span className="text-sm truncate mr-2">
                    {selectedOption ? selectedOption.label : placeholder}
                </span>
                <ChevronDown 
                    className={`w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0 ${isOpen ? 'rotate-180' : ''}`} 
                />
            </div>

            {isOpen && (
                <div className="absolute top-full left-0 w-full mt-1 bg-white border border-slate-100 rounded-xl shadow-xl z-50 overflow-y-auto max-h-60 animate-in fade-in zoom-in-95 duration-100">
                    <div className="p-1 space-y-0.5">
                        {options.map((opt) => (
                            <div
                                key={opt.value}
                                onClick={() => handleSelect(opt.value)}
                                className={cn(
                                    "px-3 py-2 text-sm rounded-lg cursor-pointer transition-colors duration-150 flex items-center gap-2",
                                    String(currentValue) === String(opt.value)
                                        ? "bg-blue-50 text-blue-700 font-bold" 
                                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium"
                                )}
                            >
                                {opt.label}
                            </div>
                        ))}
                        {options.length === 0 && (
                            <div className="px-3 py-2 text-sm text-slate-400 text-center">
                                No hay opciones
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
