import { Dialog, Transition } from '@headlessui/react';
import { Fragment, useState } from 'react';
import Barcode from 'react-barcode';
import { toast } from 'sonner';
import { XMarkIcon, PrinterIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';

export default function GafeteModal({ isOpen, onClose, empleado }) {
  const [printMode, setPrintMode] = useState('full'); // 'full' or 'barcode'

  if (!empleado) return null;

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-4xl transform overflow-hidden rounded-2xl bg-slate-50 text-left align-middle shadow-2xl transition-all flex flex-col md:flex-row">
                
                {/* Lado Izquierdo: Vista Previa Gafete */}
                <div className="bg-slate-200 p-8 flex-1 flex flex-col items-center justify-center relative">
                    <div className="absolute top-4 left-6">
                        <p className="text-sm font-semibold text-slate-700">Vista previa del gafete físico</p>
                        <p className="text-xs text-slate-500">Exactamente como saldrála impresora</p>
                    </div>

                    {/* TARJETA GAFETE (Estilo vertical CR80) */}
                    <div className="mt-12 bg-[#1a1a24] w-[260px] h-[410px] rounded-2xl shadow-xl overflow-hidden flex flex-col relative border border-slate-700">
                        {printMode === 'full' ? (
                            <>
                                {/* Header Tarjeta */}
                                <div className="bg-blue-600 h-24 p-4 text-white flex justify-center">
                                    <h3 className="font-bold text-xl tracking-tight leading-tight mt-2">SmartLynk</h3>
                                </div>
                                
                                {/* Foto Perfil */}
                                <div className="absolute top-16 left-1/2 -translate-x-1/2 w-24 h-24 bg-white rounded-full border-4 border-[#1a1a24] shadow-md flex items-center justify-center overflow-hidden z-10">
                                    {empleado.foto_perfil ? (
                                        <img src={empleado.foto_perfil} alt="Perfil" className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-3xl font-bold text-blue-600">
                                            {empleado.nombre_completo.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                                        </span>
                                    )}
                                </div>

                                {/* Info Empleado */}
                                <div className="flex-1 mt-20 px-5 text-center flex flex-col relative z-0">
                                    <h2 className="text-white font-bold text-lg leading-tight">{empleado.nombre_completo}</h2>
                                    <p className="text-blue-400 text-xs mt-1 font-medium">{empleado.puesto_cargo} • {empleado.departamento_area}</p>
                                    
                                    <div className="mt-auto mb-4 space-y-1.5 text-left bg-white/5 p-3 rounded-lg border border-white/10">
                                        <div className="flex justify-between text-[10px]">
                                            <span className="text-slate-400">No. Gafete</span>
                                            <span className="text-white font-bold">{empleado.numero_gafete}</span>
                                        </div>
                                        <div className="flex justify-between text-[10px]">
                                            <span className="text-slate-400">SKU</span>
                                            <span className="text-blue-400 font-bold">{empleado.código_sku_gafete}</span>
                                        </div>
                                    </div>

                                    {/* Zona código Barras */}
                                    <div className="bg-white p-2 rounded flex justify-center mb-2">
                                        <Barcode 
                                            value={empleado.código_sku_gafete} 
                                            width={1.2} 
                                            height={30} 
                                            fontSize={10} 
                                            margin={0}
                                            displayValue={true}
                                        />
                                    </div>
                                </div>
                            </>
                        ) : (
                            // Vista de solo código de barras
                            <div className="bg-white w-full h-full flex flex-col items-center justify-center p-6">
                                <h3 className="font-bold text-slate-800 text-lg mb-2 text-center">{empleado.nombre_completo}</h3>
                                <p className="text-slate-500 text-xs mb-8 text-center">{empleado.puesto_cargo} • {empleado.numero_gafete}</p>
                                <Barcode 
                                    value={empleado.código_sku_gafete} 
                                    width={1.8} 
                                    height={60} 
                                    fontSize={14} 
                                    margin={0}
                                    displayValue={true}
                                />
                            </div>
                        )}
                    </div>
                    <p className="mt-4 text-xs font-medium text-amber-600 bg-amber-100 px-3 py-1 rounded-full border border-amber-200">
                        Escala: 85.6 x 54mm - Formato tarjeta CR80 estándar
                    </p>
                </div>

                {/* Lado Derecho: Controles */}
                <div className="p-8 w-full md:w-[400px] flex flex-col bg-white">
                  <div className="flex justify-between items-center mb-6">
                    <Dialog.Title as="h3" className="text-xl font-bold leading-6 text-slate-900">
                      Opciones de impresión
                    </Dialog.Title>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                  </div>
                  
                  <p className="text-sm text-slate-500 mb-6">
                    Configura el formato antes de enviar a la impresora de tarjetas o generar el documento final.
                  </p>

                  <div className="space-y-3 flex-1">
                    <label 
                        onClick={() => setPrintMode('full')}
                        className={`flex items-start gap-3 p-4 border-2 rounded-xl cursor-pointer transition-colors ${printMode === 'full' ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-slate-300'}`}
                    >
                        <div className={`mt-1 w-4 h-4 rounded-full border-2 shrink-0 ${printMode === 'full' ? 'border-4 border-blue-600 bg-white' : 'border-slate-300 bg-white'}`} />
                        <div>
                            <p className={`text-sm font-bold ${printMode === 'full' ? 'text-blue-900' : 'text-slate-700'}`}>Gafete completo (recomendado)</p>
                            <p className={`text-xs mt-0.5 ${printMode === 'full' ? 'text-blue-700/70' : 'text-slate-500'}`}>Con foto, nombre, SKU y código de barras.</p>
                        </div>
                    </label>

                    <label 
                        onClick={() => setPrintMode('barcode')}
                        className={`flex items-start gap-3 p-4 border-2 rounded-xl cursor-pointer transition-colors ${printMode === 'barcode' ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-slate-300'}`}
                    >
                        <div className={`mt-1 w-4 h-4 rounded-full border-2 shrink-0 ${printMode === 'barcode' ? 'border-4 border-blue-600 bg-white' : 'border-slate-300 bg-white'}`} />
                        <div>
                            <p className={`text-sm font-bold ${printMode === 'barcode' ? 'text-blue-900' : 'text-slate-700'}`}>Solo etiqueta de código de barras</p>
                            <p className={`text-xs mt-0.5 ${printMode === 'barcode' ? 'text-blue-700/70' : 'text-slate-500'}`}>Para impresoras Zebra/Dymo de reemplazo rápido.</p>
                        </div>
                    </label>
                  </div>

                  <div className="mt-8 pt-6 border-t border-slate-100 space-y-3">
                    <button
                      type="button"
                      className="w-full flex items-center justify-center gap-2 rounded-xl border border-transparent bg-emerald-600 px-4 py-3.5 text-sm font-bold text-white hover:bg-emerald-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 transition-colors shadow-sm"
                      onClick={() => toast('Conectando con servicio de impresión local...')}
                    >
                      <PrinterIcon className="w-5 h-5" />
                      Imprimir ahora
                    </button>
                    
                    <div className="flex gap-3">
                        <button
                        type="button"
                        className="flex-1 flex justify-center items-center gap-2 rounded-xl border border-red-200 bg-red-50 text-red-700 px-4 py-2.5 text-sm font-medium hover:bg-red-100 transition-colors"
                        onClick={onClose}
                        >
                        <ArrowDownTrayIcon className="w-4 h-4" />
                        Guardar PDF
                        </button>
                        <button
                        type="button"
                        className="flex-1 justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                        onClick={onClose}
                        >
                        Cerrar sin imprimir
                        </button>
                    </div>
                  </div>
                </div>

              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}

