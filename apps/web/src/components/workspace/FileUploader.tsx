"use client";

import React, { useState, useCallback } from "react";
import { Upload, X, FileCheck, Loader2, Database, ShieldCheck, LucideIcon, ArrowUp } from "lucide-react";
import { useDropzone } from "react-dropzone";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface FileUploaderProps {
    onDataParsed: (data: any[], fileName: string, rawFile: File) => void;
}

export function FileUploader({ onDataParsed }: FileUploaderProps) {
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const onDrop = useCallback((acceptedFiles: File[]) => {
        const file = acceptedFiles[0];
        if (!file) return;

        setIsUploading(true);
        setError(null);

        const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');

        if (isExcel) {
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
                    setError("Error parsing Excel file.");
                }
            };
            reader.readAsArrayBuffer(file);
        } else {
            Papa.parse(file, {
                header: true,
                skipEmptyLines: true,
                complete: (results) => {
                    setIsUploading(false);
                    if (results.errors.length > 0) {
                        setError("There was an error parsing the file.");
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
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
        },
        multiple: false
    });

    return (
        <div
            {...getRootProps()}
            className={cn(
                "group relative border-2 border-dashed rounded-[3.5rem] p-24 flex flex-col items-center justify-center text-center gap-10 transition-all cursor-pointer overflow-hidden",
                isDragActive ? "border-white/40 bg-white/5 scale-[1.01]" : "border-white/5 hover:border-white/20 hover:bg-white/[0.02]",
                isUploading && "pointer-events-none opacity-60"
            )}
        >
            <input {...getInputProps()} />

            {/* Background elements */}
            <div className="absolute inset-0 opacity-[0.02] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')] bg-repeat" />
            <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 blur-[100px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />

            <div className={cn(
                "w-24 h-24 rounded-3xl flex items-center justify-center transition-all duration-700 relative z-10",
                isDragActive ? "bg-white text-black rotate-12" : "bg-white/5 text-white/20 group-hover:text-white group-hover:scale-110 group-hover:-rotate-6"
            )}>
                {isUploading ? (
                    <Loader2 className="w-10 h-10 animate-spin" />
                ) : (
                    <ArrowUp className={cn("w-10 h-10 group-hover:translate-y-[-4px] transition-transform", isDragActive && "animate-bounce")} />
                )}
            </div>

            <div className="space-y-4 relative z-10 px-4">
                <h3 className="text-3xl font-black text-white tracking-tighter">
                    {isDragActive ? "Engage." : "Initialize Feed."}
                </h3>
                <p className="text-white/30 font-medium max-w-sm mx-auto leading-relaxed italic uppercase text-[10px] tracking-[0.2em]">
                    {isUploading
                        ? "Indexing dimensional vectors..."
                        : "Drop enterprise payload here or select from global file cluster."
                    }
                </p>
            </div>

            {error && (
                <div className="bg-red-500/10 text-red-500 text-[10px] font-black uppercase tracking-widest px-6 py-2.5 rounded-full border border-red-500/20 mt-2 z-10 animate-shake">
                    {error}
                </div>
            )}

            {!isUploading && !isDragActive && (
                <div className="flex items-center gap-10 mt-6 relative z-10">
                    <div className="flex items-center gap-3 text-[9px] font-black text-white/10 uppercase tracking-[0.3em] group-hover:text-white/30 transition-colors">
                        <ShieldCheck className="w-3.5 h-3.5" /> Security Tier 4
                    </div>
                    <div className="w-1 h-1 rounded-full bg-white/5" />
                    <div className="flex items-center gap-3 text-[9px] font-black text-white/10 uppercase tracking-[0.3em] group-hover:text-white/30 transition-colors">
                        <Database className="w-3.5 h-3.5" /> High Velocity
                    </div>
                </div>
            )}
        </div>
    );
}
