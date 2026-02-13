"use client";

import React, { useState, useCallback } from "react";
import { Upload, X, FileCheck, Loader2, Database, ShieldCheck, LucideIcon, ArrowUp } from "lucide-react";
import { useDropzone } from "react-dropzone";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useT } from "@/lib/i18n";

interface FileUploaderProps {
    onDataParsed: (data: any[], fileName: string, rawFile: File) => void;
}

export function FileUploader({ onDataParsed }: FileUploaderProps) {
    const t = useT();
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const onDrop = useCallback((acceptedFiles: File[]) => {
        const file = acceptedFiles[0];
        if (!file) return;

        setIsUploading(true);
        setError(null);

        const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');
        const isJSON = file.name.endsWith('.json');

        if (isJSON) {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const parsed = JSON.parse(e.target?.result as string);
                    const jsonData = Array.isArray(parsed) ? parsed :
                        (parsed.data && Array.isArray(parsed.data)) ? parsed.data : [parsed];
                    setIsUploading(false);
                    if (jsonData.length > 0 && typeof jsonData[0] === 'object') {
                        onDataParsed(jsonData, file.name, file);
                    } else {
                        setError(t('jsonArrayRequired'));
                    }
                } catch (err) {
                    setIsUploading(false);
                    setError(t('errorParsingJson'));
                }
            };
            reader.readAsText(file);
        } else if (isExcel) {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = new Uint8Array(e.target?.result as ArrayBuffer);
                    const workbook = XLSX.read(data, { type: 'array' });
                    const sheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[sheetName];
                    const json = XLSX.utils.sheet_to_json(worksheet);
                    setIsUploading(false);
                    onDataParsed(json, file.name, file);
                } catch (err) {
                    setIsUploading(false);
                    setError(t('errorParsingExcel'));
                }
            };
            reader.readAsArrayBuffer(file);
        } else {
            Papa.parse(file, {
                header: true,
                skipEmptyLines: true,
                dynamicTyping: true,
                complete: (results) => {
                    setIsUploading(false);
                    if (results.errors.length > 0) {
                        setError(t('errorParsingFile'));
                    } else {
                        onDataParsed(results.data, file.name, file);
                    }
                },
                error: (error) => {
                    setIsUploading(false);
                    setError("Error: " + error.message);
                }
            });
        }
    }, [onDataParsed]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'text/csv': ['.csv'],
            'application/vnd.ms-excel': ['.xls'],
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
            'application/json': ['.json']
        },
        multiple: false
    });

    return (
        <div
            {...getRootProps()}
            className={cn(
                "group relative border-2 border-dashed rounded-2xl p-12 flex flex-col items-center justify-center text-center gap-6 transition-all cursor-pointer overflow-hidden",
                isDragActive ? "border-primary bg-primary/5 scale-[1.01]" : "border-gray-300 hover:border-primary hover:bg-primary/5",
                isUploading && "pointer-events-none opacity-60"
            )}
        >
            <input {...getInputProps()} />

            <div className={cn(
                "w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-700 relative z-10",
                isDragActive ? "bg-primary text-white rotate-12" : "bg-gray-100 text-gray-400 group-hover:text-primary group-hover:scale-110"
            )}>
                {isUploading ? (
                    <Loader2 className="w-8 h-8 animate-spin" />
                ) : (
                    <ArrowUp className={cn("w-8 h-8 group-hover:translate-y-[-4px] transition-transform", isDragActive && "animate-bounce")} />
                )}
            </div>

            <div className="space-y-4 relative z-10 px-4">
                <h3 className="text-xl font-black text-gray-900 tracking-tighter">
                    {isDragActive ? t('dropHere') : t('uploadFile')}
                </h3>
                <p className="text-gray-500 font-medium max-w-sm mx-auto leading-relaxed text-xs">
                    {isUploading
                        ? t('processingFile')
                        : t('dragDrop')
                    }
                </p>
            </div>

            {error && (
                <div className="bg-red-500/10 text-red-500 text-[10px] font-black uppercase tracking-widest px-6 py-2.5 rounded-full border border-red-500/20 mt-2 z-10 animate-shake">
                    {error}
                </div>
            )}

            {!isUploading && !isDragActive && (
                <div className="flex items-center gap-6 mt-4 relative z-10">
                    <div className="flex items-center gap-3 text-[9px] font-black text-gray-400 uppercase tracking-wider group-hover:text-gray-500 transition-colors">
                        <ShieldCheck className="w-3.5 h-3.5" /> {t('secureUpload')}
                    </div>
                    <div className="w-1 h-1 rounded-full bg-gray-200" />
                    <div className="flex items-center gap-3 text-[9px] font-black text-gray-400 uppercase tracking-wider group-hover:text-gray-500 transition-colors">
                        <Database className="w-3.5 h-3.5" /> CSV, XLS, XLSX, JSON
                    </div>
                </div>
            )}
        </div>
    );
}
