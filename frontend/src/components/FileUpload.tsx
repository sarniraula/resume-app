import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';

interface FileUploadProps {
    label: string;
    accept: Record<string, string[]>;
    value: File | null;
    onChange: (file: File | null) => void;
    disabled?: boolean;
}

export function FileUpload({ label, accept, value, onChange, disabled }: FileUploadProps) {
    const onDrop = useCallback((acceptedFiles: File[]) => {
        if (acceptedFiles?.[0]) {
            onChange(acceptedFiles[0]);
        }
    }, [onChange]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept,
        maxFiles: 1,
        disabled
    });

    return (
        <div className="w-full">
            <label className="block text-sm font-medium text-gray-300 mb-2 ml-1">{label}</label>

            <AnimatePresence mode="wait">
                {!value ? (
                    <div
                        {...getRootProps()}
                        className={clsx(
                            "glass-card relative rounded-xl border-2 border-dashed p-8 transition-all duration-300 cursor-pointer group flex flex-col items-center justify-center text-center h-48",
                            isDragActive ? "border-blue-500 bg-blue-500/10" : "border-white/10 hover:border-white/30 hover:bg-white/5",
                            disabled && "opacity-50 cursor-not-allowed"
                        )}
                    >
                        <input {...getInputProps()} />
                        <div className="p-4 rounded-full bg-white/5 mb-4 group-hover:scale-110 transition-transform">
                            <Upload className="w-8 h-8 text-blue-400" />
                        </div>
                        <p className="text-gray-300 font-medium">
                            {isDragActive ? "Drop it here!" : "Drag & drop or click to browse"}
                        </p>
                        <p className="text-xs text-gray-500 mt-2">
                            Supports: {Object.values(accept).flat().join(', ')}
                        </p>
                    </div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, y: -10 }}
                        key="file-preview"
                        className="glass-panel rounded-xl p-4 flex items-center justify-between border-l-4 border-l-green-500"
                    >
                        <div className="flex items-center space-x-4">
                            <div className="p-2 bg-green-500/20 rounded-lg">
                                <FileText className="w-6 h-6 text-green-400" />
                            </div>
                            <div className="overflow-hidden">
                                <p className="text-sm font-semibold text-white truncate max-w-[200px]">{value.name}</p>
                                <p className="text-xs text-gray-400">{(value.size / 1024).toFixed(1)} KB</p>
                            </div>
                        </div>
                        <button
                            onClick={() => onChange(null)}
                            className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-red-400"
                            disabled={disabled}
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
