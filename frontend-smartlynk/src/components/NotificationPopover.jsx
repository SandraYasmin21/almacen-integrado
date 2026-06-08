import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  BellIcon, 
  CheckIcon, 
  TrashIcon, 
  ExclamationTriangleIcon, 
  ClockIcon, 
  CheckCircleIcon,
  BellSlashIcon
} from "@heroicons/react/24/outline";

// Dummy data simulando lo que vendría de Laravel Notifications
const initialNotifications = [
  {
    id: 1,
    type: "critical",
    title: "Stock crítico alcanzado",
    description: "Quedan solo 3 unidades de Cables HDMI 2m en el Almacén.",
    time: "Hace 10 min",
    read: false,
    icon: ExclamationTriangleIcon,
    colorClass: "text-red-500",
    bgClass: "bg-red-50",
  },
  {
    id: 2,
    type: "critical",
    title: "Póliza vencida",
    description: "El seguro de la RAM Roja (Placas TMX-1234) venció hoy.",
    time: "Hace 1 hora",
    read: false,
    icon: ExclamationTriangleIcon,
    colorClass: "text-red-500",
    bgClass: "bg-red-50",
  },
  {
    id: 3,
    type: "warning",
    title: "Mantenimiento próximo",
    description: "La Ranger Blanca está a 500 km de su próximo mantenimiento.",
    time: "Hace 3 horas",
    read: true,
    icon: ClockIcon,
    colorClass: "text-amber-500",
    bgClass: "bg-amber-50",
  },
  {
    id: 4,
    type: "info",
    title: "Retorno de ruta",
    description: "La Silverado 834 regresó a base con 185 km registrados.",
    time: "Hace 5 horas",
    read: true,
    icon: CheckCircleIcon,
    colorClass: "text-blue-500",
    bgClass: "bg-blue-50",
  }
];

export default function NotificationPopover() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState(initialNotifications);
  const [filter, setFilter] = useState("all"); // 'all', 'critical', 'info'
  const popoverRef = useRef(null);

  // Cerrar al hacer click afuera
  useEffect(() => {
    function handleClickOutside(event) {
      if (popoverRef.current && !popoverRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const hasUnread = notifications.some(n => !n.read);

  const filteredNotifications = notifications.filter(n => {
    if (filter === "all") return true;
    if (filter === "critical") return n.type === "critical";
    if (filter === "info") return n.type === "info" || n.type === "warning";
    return true;
  });

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const markAsRead = (id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <div className="relative" ref={popoverRef}>
      {/* Botón de la Campana */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full hover:bg-slate-100 text-slate-500 transition-colors ml-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        aria-label="Notificaciones"
      >
        <BellIcon className="w-6 h-6" aria-hidden="true" />
        {hasUnread && (
          <span className="absolute top-1.5 right-1.5 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500 border-2 border-white"></span>
          </span>
        )}
      </button>

      {/* Popover */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="absolute right-0 mt-2 w-80 md:w-96 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-50 origin-top-right"
          >
            {/* Header del Popover */}
            <div className="p-4 border-b border-slate-100">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-bold text-slate-800">Notificaciones</h3>
                {hasUnread && (
                  <button 
                    onClick={markAllAsRead}
                    className="text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                  >
                    Marcar todas leídas
                  </button>
                )}
              </div>
              
              {/* Filtros rápidos */}
              <div className="flex gap-2">
                {['all', 'critical', 'info'].map(tab => (
                  <button
                    key={tab}
                    onClick={() => setFilter(tab)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-[background-color,color,box-shadow] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                      filter === tab ?
                         'bg-slate-800 text-white shadow-sm' 
                        : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                    }`}
                  >
                    {tab === 'all' && 'Todas'}
                    {tab === 'critical' && 'Críticas'}
                    {tab === 'info' && 'Operativas'}
                  </button>
                ))}
              </div>
            </div>

            {/* Lista de Notificaciones */}
            <div className="max-h-96 overflow-y-auto">
              <AnimatePresence initial={false}>
                {filteredNotifications.length > 0 ? (
                  filteredNotifications.map((notif) => (
                    <motion.div
                      key={notif.id}
                      layout
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 50, transition: { duration: 0.2 } }}
                      className={`group relative p-4 border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors flex gap-3 items-start ${
                        !notif.read ? 'bg-blue-50/30' : 'bg-white'
                      }`}
                    >
                      <div className={`mt-0.5 p-2 rounded-full shrink-0 ${notif.bgClass}`}>
                        <notif.icon className={`w-5 h-5 ${notif.colorClass}`} aria-hidden="true" />
                      </div>
                      
                      <div className="flex-1 min-w-0 pr-8">
                        <p className={`text-sm ${!notif.read ? 'font-bold text-slate-800' : 'font-medium text-slate-700'}`}>
                          {notif.title}
                        </p>
                        <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                          {notif.description}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-2 font-medium">
                          {notif.time}
                        </p>
                      </div>

                      {/* Botones de acción rápida (Hover) */}
                      <div className="absolute right-3 top-4 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-1">
                        {!notif.read && (
                          <button 
                            onClick={() => markAsRead(notif.id)}
                            className="p-1.5 text-blue-500 hover:bg-blue-100 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                            title="Marcar como leída"
                            aria-label="Marcar como leída"
                          >
                            <CheckIcon className="w-4 h-4" aria-hidden="true" />
                          </button>
                        )}
                        <button 
                          onClick={() => removeNotification(notif.id)}
                          className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                          title="Eliminar notificación"
                          aria-label="Eliminar notificación"
                        >
                          <TrashIcon className="w-4 h-4" aria-hidden="true" />
                        </button>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  /* Estado Vacío Elegante */
                  <motion.div 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="flex flex-col items-center justify-center p-8 text-center"
                  >
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                      <BellSlashIcon className="w-8 h-8 text-slate-300" aria-hidden="true" />
                    </div>
                    <h4 className="text-sm font-semibold text-slate-700 mb-1">Estás al día</h4>
                    <p className="text-xs text-slate-500 max-w-[200px]">
                      No hay alertas pendientes por ahora en esta categoría.
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-slate-100 bg-slate-50">
              <button className="w-full text-center text-xs font-semibold text-slate-600 hover:text-blue-600 transition-colors py-1 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
                Ver todo el historial
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
