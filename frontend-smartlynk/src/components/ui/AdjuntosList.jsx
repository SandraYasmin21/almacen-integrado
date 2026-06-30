import { useState, useEffect } from 'react';
import { 
    DocumentIcon, 
    PhotoIcon, 
    TrashIcon, 
    ArrowDownTrayIcon,
    ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { apiFetch } from '../../lib/auth';
import { toast } from 'sonner';

export default function AdjuntosList({ entidadTipo, entidadId, onUpdate }) {
    const [adjuntos, setAdjuntos] = useState([]);
    const [loading, setLoading] = useState(true);

    const loadAdjuntos = async () => {
        setLoading(true);
        try {
            const res = await apiFetch(`/api/adjuntos/entidad/${entidadTipo}/${entidadId}`);
            if (res.ok) {
                const data = await res.json();
                setAdjuntos(data);
            }
        } catch (error) {
            console.error(error);
            toast.error("Error al cargar archivos adjuntos.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (entidadId) loadAdjuntos();
    }, [entidadId, entidadTipo]);

    const handleDownload = async (adjunto) => {
        try {
            const res = await apiFetch(`/api/adjuntos/${adjunto.id}`);
            if (!res.ok) throw new Error("Error al descargar");
            const data = await res.json();
            window.open(data.url, '_blank');
        } catch (e) {
            toast.error("No se pudo descargar el archivo.");
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('¿Estás seguro de eliminar este adjunto?')) return;
        try {
            const res = await apiFetch(`/api/adjuntos/${id}`, { method: 'DELETE' });
            if (res.ok) {
                toast.success("Adjunto eliminado");
                loadAdjuntos();
                if (onUpdate) onUpdate();
            } else {
                toast.error("Error al eliminar");
            }
        } catch (error) {
            toast.error("Error de conexión");
        }
    };

    if (loading) {
        return <div className="text-sm text-slate-500 py-2">Cargando archivos...</div>;
    }

    if (adjuntos.length === 0) {
        return (
            <div className="text-sm text-slate-500 py-4 text-center bg-slate-50 rounded-lg border border-dashed border-slate-200">
                No hay archivos adjuntos.
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {adjuntos.map(file => (
                <div key={file.id} className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl hover:shadow-sm transition-shadow">
                    <div className="flex items-center gap-3 overflow-hidden">
                        {file.mime_type.startsWith('image/') ? (
                            <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-500 flex items-center justify-center shrink-0">
                                <PhotoIcon className="w-6 h-6" />
                            </div>
                        ) : (
                            <div className="w-10 h-10 rounded-lg bg-rose-50 text-rose-500 flex items-center justify-center shrink-0">
                                <DocumentIcon className="w-6 h-6" />
                            </div>
                        )}
                        <div className="min-w-0">
                            <p className="text-sm font-semibold text-slate-800 truncate" title={file.nombre_original}>
                                {file.nombre_original}
                            </p>
                            <p className="text-xs text-slate-500">
                                {file.categoria ? (file.categoria.charAt(0).toUpperCase() + file.categoria.slice(1)) + ' • ' : ''}
                                {(file.tamano_bytes / 1024 / 1024).toFixed(2)} MB • {new Date(file.created_at).toLocaleDateString()}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0 ml-2">
                        <button
                            onClick={(e) => { e.preventDefault(); handleDownload(file); }}
                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors focus-visible:outline-none"
                            title="Descargar"
                        >
                            <ArrowDownTrayIcon className="w-5 h-5" />
                        </button>
                        <button
                            onClick={(e) => { e.preventDefault(); handleDelete(file.id); }}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors focus-visible:outline-none"
                            title="Eliminar"
                        >
                            <TrashIcon className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
}
