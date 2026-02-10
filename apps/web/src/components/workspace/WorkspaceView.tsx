"use client";

import React, { useEffect, useRef, useState } from "react";
import {
    Plus,
    FileSpreadsheet,
    Database as DbIcon,
    Globe,
    ArrowRight,
    Table as TableIcon,
    Wand2,
    Trash2,
    Cloud,
    Server,
    X,
    CheckCircle2
} from "lucide-react";
import { FileUploader } from "./FileUploader";
import { useAppStore } from "@/store/useAppStore";
import { analyzeDataset } from "@/lib/dataProcessor";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import Papa from "papaparse";
import * as XLSX from "xlsx";

function parseFile(file: File, onDone: (data: any[], name: string, raw: File) => void) {
    const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');
    if (isExcel) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const bytes = new Uint8Array(e.target?.result as ArrayBuffer);
            const wb = XLSX.read(bytes, { type: 'array' });
            const json = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
            onDone(json, file.name, file);
        };
        reader.readAsArrayBuffer(file);
    } else {
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                if (results.data.length > 0) onDone(results.data, file.name, file);
            },
        });
    }
}

const sourceTypes = [
    { id: 'file', name: 'File Storage', icon: FileSpreadsheet, description: 'CSV, XLSX, JSON', color: 'bg-white text-black' },
    { id: 'sheets', name: 'Cloud Sheets', icon: Cloud, description: 'Google, Microsoft 365', color: 'bg-white/5 text-white' },
    { id: 'db', name: 'Structured DB', icon: DbIcon, description: 'Postgres, MySQL, Snowflake', color: 'bg-white/5 text-white' },
    { id: 'api', name: 'REST/GraphQL', icon: Server, description: 'Neural Endpoints', color: 'bg-white/5 text-white' },
];

export function WorkspaceView() {
    const { dataset, datasetName, setDataset, setIssues, setPhase, setRawFile, uploadDataset, projectId, initProject } = useAppStore();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const pendingUploadRef = useRef<File | null>(null);
    const [connectingSource, setConnectingSource] = useState<string | null>(null);
    const [isMockConnecting, setIsMockConnecting] = useState(false);

    useEffect(() => {
        if (!projectId) {
            initProject();
        }
    }, [projectId, initProject]);

    useEffect(() => {
        if (projectId && pendingUploadRef.current) {
            const file = pendingUploadRef.current;
            pendingUploadRef.current = null;
            uploadDataset(file).catch(console.error);
        }
    }, [projectId, uploadDataset]);

    const handleDataUploaded = (data: any[], name: string, rawFile: File) => {
        const analysis = analyzeDataset(data);
        setDataset(data, name);
        setIssues(analysis);
        setRawFile(rawFile);
        if (projectId) {
            uploadDataset(rawFile).catch(console.error);
        } else {
            pendingUploadRef.current = rawFile;
        }
    };

    const handleSourceClick = (sourceId: string) => {
        if (sourceId === 'file') {
            fileInputRef.current?.click();
        } else {
            setConnectingSource(sourceId);
        }
    };

    const handleMockConnect = async () => {
        setIsMockConnecting(true);
        await new Promise(r => setTimeout(r, 2000));

        // Mock data for other sources
        const mockData = Array.from({ length: 150 }).map((_, i) => ({
            id: i + 1,
            account_id: `ACC-${Math.floor(Math.random() * 9000) + 1000}`,
            revenue: Math.floor(Math.random() * 50000),
            status: Math.random() > 0.2 ? 'Active' : 'Churned',
            region: ['EMEA', 'APAC', 'US-EAST', 'US-WEST'][Math.floor(Math.random() * 4)],
            last_login: new Date(Date.now() - Math.random() * 10000000000).toISOString()
        }));

        handleDataUploaded(mockData, `Enterprise_${connectingSource?.toUpperCase()}_Feed`, new File([], "mock.csv"));
        setIsMockConnecting(false);
        setConnectingSource(null);
    };

    const handleHiddenFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        parseFile(file, handleDataUploaded);
        e.target.value = '';
    };

    const handleClear = () => {
        if (confirm("Terminate active data stream? All local changes will be lost.")) {
            setDataset(null, null);
            setIssues([]);
        }
    };

    return (
        <div className="space-y-16 py-6 fade-in pb-32">
            <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xls,.xlsx"
                className="hidden"
                onChange={handleHiddenFileChange}
            />

            {/* Corporate Welcome Header */}
            <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-1.5 h-6 bg-white rounded-full" />
                    <span className="text-xs font-black uppercase tracking-[0.4em] text-white/30">Intelligence Node</span>
                </div>
                <motion.h1
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="text-6xl font-black tracking-tighter text-white"
                >
                    Neural Hub.
                </motion.h1>
                <p className="text-white/40 font-medium max-w-2xl text-lg leading-relaxed">
                    Connect distributed enterprise data sources to the DataFlow Edge cluster for real-time semantic indexing and predictive modeling.
                </p>
            </div>

            {/* Source Connection Cards */}
            <section className="space-y-8">
                <div className="flex items-center justify-between">
                    <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20">Protocol Selection</h2>
                    <div className="h-px flex-1 bg-white/5 mx-6" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                    {sourceTypes.map((type, i) => {
                        const Icon = type.icon;
                        return (
                            <motion.button
                                key={type.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                                onClick={() => handleSourceClick(type.id)}
                                className={cn(
                                    "group p-8 rounded-3xl border border-white/5 bg-white/[0.01] hover:bg-white/[0.03] transition-all text-left space-y-6 relative overflow-hidden",
                                    "hover:border-white/10 hover:shadow-2xl hover:shadow-white/5"
                                )}
                            >
                                <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transition-transform group-hover:scale-110 duration-500", type.color)}>
                                    <Icon className="w-7 h-7" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-base tracking-tight text-white mb-1">{type.name}</h3>
                                    <p className="text-[10px] text-white/30 font-black uppercase tracking-widest leading-none">{type.description}</p>
                                </div>
                                <Plus className="absolute top-8 right-8 w-5 h-5 text-white/10 group-hover:text-white transition-all" />
                            </motion.button>
                        );
                    })}
                </div>
            </section>

            {/* Active Dataset or Uploader */}
            <AnimatePresence mode="wait">
                {!dataset ? (
                    <motion.section
                        key="uploader"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="space-y-8"
                    >
                        <div className="flex items-center justify-between">
                            <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20">Data Ingress</h2>
                            <div className="h-px flex-1 bg-white/5 mx-6" />
                        </div>
                        <FileUploader onDataParsed={handleDataUploaded} />
                    </motion.section>
                ) : (
                    <motion.section
                        key="active-source"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-10"
                    >
                        <div className="flex items-center justify-between">
                            <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20 flex items-center gap-4">
                                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                Active Enterprise Connection
                            </h2>
                            <button
                                onClick={handleClear}
                                className="text-[9px] font-black uppercase tracking-[0.2em] text-white/20 hover:text-red-500 flex items-center gap-2 transition-all px-4 py-2 rounded-lg border border-white/5 hover:border-red-500/20"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                                Terminate Feed
                            </button>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* Dataset Info Card */}
                            <div className="lg:col-span-2 p-10 rounded-[3rem] bg-[#111112] border border-white/5 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-12 opacity-5 scale-150 rotate-12 group-hover:scale-[1.6] group-hover:rotate-6 transition-transform duration-1000">
                                    <FileSpreadsheet className="w-64 h-64 text-white" />
                                </div>

                                <div className="flex flex-col h-full justify-between relative z-10 gap-12">
                                    <div className="flex items-start justify-between">
                                        <div className="space-y-4">
                                            <div className="w-14 h-14 rounded-2xl bg-white text-black flex items-center justify-center">
                                                <FileSpreadsheet className="w-7 h-7" />
                                            </div>
                                            <div>
                                                <h4 className="text-3xl font-black tracking-tighter text-white">{datasetName}</h4>
                                                <p className="text-[10px] font-bold text-white/20 uppercase tracking-[0.3em] mt-2">Source Protocol: Secure File System</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2.5 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                            <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Feed Optimal</span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-3 gap-12 pt-10 border-t border-white/5">
                                        <div className="space-y-2">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-white/20">Data Volume</p>
                                            <p className="text-3xl font-black text-white">{dataset.length.toLocaleString()}</p>
                                        </div>
                                        <div className="space-y-2">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-white/20">Data Points</p>
                                            <p className="text-3xl font-black text-white">{(dataset.length * Object.keys(dataset[0]).length).toLocaleString()}</p>
                                        </div>
                                        <div className="space-y-2">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-white/20">Dimensions</p>
                                            <p className="text-3xl font-black text-white">{Object.keys(dataset[0]).length}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Action Card */}
                            <div className="p-10 rounded-[3rem] bg-white text-black flex flex-col justify-between shadow-2xl shadow-white/5">
                                <div className="space-y-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-black/5 flex items-center justify-center">
                                            <Wand2 className="w-4 h-4" />
                                        </div>
                                        <h3 className="text-xl font-black tracking-tight">Next Step</h3>
                                    </div>
                                    <p className="text-sm font-medium leading-relaxed opacity-60">
                                        Your dataset has been indexed at the edge. Proceed to diagnostics to validate semantic integrity and apply transformations.
                                    </p>
                                </div>

                                <button
                                    onClick={() => setPhase('preparation')}
                                    className="w-full py-5 bg-black text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] hover:scale-[1.03] transition-all flex items-center justify-center gap-3 active:scale-95"
                                >
                                    Proceed to Integrity
                                    <ArrowRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </motion.section>
                )}
            </AnimatePresence>

            {/* Connection Modal (Mock) */}
            <AnimatePresence>
                {connectingSource && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/90 backdrop-blur-md">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="w-full max-w-lg bg-[#0F0F10] border border-white/10 rounded-[2.5rem] overflow-hidden p-10 space-y-8 shadow-3xl"
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center">
                                        {sourceTypes.find(s => s.id === connectingSource)?.icon && React.createElement(sourceTypes.find(s => s.id === connectingSource)!.icon, { className: "w-6 h-6" })}
                                    </div>
                                    <h2 className="text-2xl font-black tracking-tight uppercase tracking-[0.1em]">Connect {connectingSource}</h2>
                                </div>
                                <button onClick={() => setConnectingSource(null)} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                                    <X className="w-6 h-6 text-white/30" />
                                </button>
                            </div>

                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-white/30">Protocol Endpoint</label>
                                    <input
                                        type="text"
                                        placeholder={`https://api.enterprise.com/${connectingSource}/v1`}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 focus:border-white/20 outline-none text-sm font-medium"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-white/30">Authentication Token</label>
                                    <input
                                        type="password"
                                        placeholder="df_live_••••••••••••••••"
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 focus:border-white/20 outline-none text-sm font-medium"
                                    />
                                </div>
                            </div>

                            <button
                                onClick={handleMockConnect}
                                disabled={isMockConnecting}
                                className="w-full py-5 bg-white text-black rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] hover:scale-[1.02] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                            >
                                {isMockConnecting ? <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" /> : "Establish Connection"}
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

