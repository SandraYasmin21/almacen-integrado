import { useState, useRef } from "react";
import { toast } from "sonner";
import { DocumentTextIcon, ArrowUpTrayIcon, DocumentArrowDownIcon, TrashIcon } from "@heroicons/react/24/outline";

export default function GestorDocumental() {
  const [dragActive, setDragActive] = useState(false);
  const [archivos, setArchivos] = useState([]);
  const fileInputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files);
    }
  };

  const handleFiles = (files) => {
    const newFiles = Array.from(files).map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      size: (file.size / 1024 / 1024).toFixed(2) + ' MB',
      type: file.type,
      date: new Date().toLocaleDateString('es-MX'),
      file
    }));
    setArchivos(prev => [...prev, ...newFiles]);
    toast.success(`${files.length} archivo(s) agregado(s) a la cola.`);
  };

  const removeFile = (id) => {
    setArchivos(prev => prev.filter(f => f.id !== id));
  };

  return (
    <div className="mx-auto max-w-6xl p-4 sm:p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Control de Facturas</h1>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Panel de Subida */}
        <div className="lg:col-span-1 space-y-6">
          <form 
            className={`flex h-48 w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed transition-colors ${dragActive ? 'border-indigo-500 bg-indigo-50' : 'border-slate-300 bg-slate-50 hover:bg-slate-100'}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input 
              ref={fileInputRef} 
              type="file" 
              multiple 
              accept=".pdf,.jpg,.jpeg,.png" 
              className="hidden" 
              onChange={handleChange} 
            />
            <ArrowUpTrayIcon className={`mb-3 h-10 w-10 ${dragActive ? 'text-indigo-500' : 'text-slate-400'}`} />
            <p className="text-sm font-medium text-slate-600">Arrastra archivos aquí o haz clic</p>
            <p className="mt-1 text-xs text-slate-400">PDF, JPG, PNG hasta 10MB</p>
          </form>

          {archivos.length > 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <h4 className="mb-3 text-sm font-semibold text-slate-700">Cola de Subida ({archivos.length})</h4>
              <ul className="space-y-2">
                {archivos.map(file => (
                  <li key={file.id} className="flex items-center justify-between rounded-lg bg-slate-50 p-2 text-sm">
                    <div className="truncate pr-4 flex-1">
                      <p className="truncate font-medium text-slate-700">{file.name}</p>
                      <p className="text-xs text-slate-500">{file.size}</p>
                    </div>
                    <button onClick={() => removeFile(file.id)} className="text-slate-400 hover:text-red-500">
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
              <button className="mt-4 w-full rounded-xl bg-indigo-600 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500">
                Subir al Servidor
              </button>
            </div>
          )}
        </div>

        {/* Panel de Visualización */}
        <div className="lg:col-span-2">
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden h-[600px] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
              <h3 className="font-semibold text-slate-800">Repositorio de Archivos</h3>
              <button className="inline-flex items-center gap-2 rounded-lg bg-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-300">
                <DocumentArrowDownIcon className="h-4 w-4" />
                Descargar Seleccionados (.zip)
              </button>
            </div>
            <div className="flex-1 p-6 flex flex-col items-center justify-center text-slate-500">
              <DocumentTextIcon className="h-16 w-16 text-slate-200 mb-4" />
              <p>El repositorio está vacío.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
