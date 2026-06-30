import { useState, useRef } from 'react';
import { DocumentArrowUpIcon, XMarkIcon, DocumentIcon, PhotoIcon } from '@heroicons/react/24/outline';
import { cn } from '../../lib/utils';

export default function FileUpload({ 
    onFileChange, 
    accept = "image/*,application/pdf", 
    maxSizeMB = 20,
    label = "Adjuntar evidencia",
    error = null,
    required = false
}) {
    const [file, setFile] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef(null);

    const handleFile = (selectedFile) => {
        if (!selectedFile) return;
        
        if (selectedFile.size > maxSizeMB * 1024 * 1024) {
            alert(`El archivo excede el tamaño máximo de ${maxSizeMB}MB.`);
            return;
        }

        setFile(selectedFile);
        if (onFileChange) onFileChange(selectedFile);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFile(e.dataTransfer.files[0]);
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const removeFile = (e) => {
        e.stopPropagation();
        setFile(null);
        if (onFileChange) onFileChange(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const getFileIcon = () => {
        if (!file) return null;
        if (file.type.startsWith('image/')) return <PhotoIcon className="w-8 h-8 text-blue-500" />;
        return <DocumentIcon className="w-8 h-8 text-rose-500" />;
    };

    return (
        <div className="w-full">
            <label className="block text-sm font-semibold text-slate-700 mb-1">
                {label} {required && <span className="text-red-500">*</span>}
            </label>
            <div 
                onClick={() => fileInputRef.current?.click()}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                className={cn(
                    "relative flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-xl cursor-pointer transition-all bg-slate-50",
                    isDragging ? "border-blue-500 bg-blue-50" : "border-slate-300 hover:bg-slate-100 hover:border-slate-400",
                    error && "border-red-500 bg-red-50",
                    file && "border-solid border-slate-200 bg-white shadow-sm"
                )}
            >
                <input 
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept={accept}
                    onChange={(e) => handleFile(e.target.files[0])}
                />
                
                {!file ? (
                    <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center">
                        <DocumentArrowUpIcon className="w-8 h-8 text-slate-400 mb-2" />
                        <p className="mb-1 text-sm text-slate-500 font-semibold">
                            Haz clic o arrastra un archivo
                        </p>
                        <p className="text-xs text-slate-400">
                            PDF, JPG, PNG (Max. {maxSizeMB}MB)
                        </p>
                    </div>
                ) : (
                    <div className="flex items-center gap-4 w-full p-4">
                        {getFileIcon()}
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-slate-800 truncate">
                                {file.name}
                            </p>
                            <p className="text-xs text-slate-500">
                                {(file.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                        </div>
                        <button 
                            type="button" 
                            onClick={removeFile}
                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                        >
                            <XMarkIcon className="w-5 h-5" />
                        </button>
                    </div>
                )}
            </div>
            {error && <p className="text-red-500 text-xs mt-1 font-medium">{error}</p>}
        </div>
    );
}
