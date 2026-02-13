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
    CheckCircle2,
    Sparkles
} from "lucide-react";
import { FileUploader } from "./FileUploader";
import { useAppStore } from "@/store/useAppStore";
import { analyzeDataset } from "@/lib/dataProcessor";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { useMemo } from "react";
import { detectColumnTypes } from "@/lib/dataProcessor";
import { useT } from "@/lib/i18n";
import { PatternDiscovery } from "./PatternDiscovery";

function parseFile(file: File, onDone: (data: any[], name: string, raw: File) => void) {
    const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');
    const isJSON = file.name.endsWith('.json');
    if (isJSON) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const parsed = JSON.parse(e.target?.result as string);
                const jsonData = Array.isArray(parsed) ? parsed :
                    (parsed.data && Array.isArray(parsed.data)) ? parsed.data : [parsed];
                if (jsonData.length > 0) onDone(jsonData, file.name, file);
            } catch (err) {
                console.error('JSON parse error:', err);
            }
        };
        reader.readAsText(file);
    } else if (isExcel) {
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

export function WorkspaceView() {
    const {
        dataset,
        datasetName,
        setDataset,
        setIssues,
        setPhase,
        setRawFile,
        uploadDataset,
        projectId,
        initProject,
        addChart
    } = useAppStore();
    const t = useT();

    const sourceTypes = [
        { id: 'file', name: t('fileStorage'), icon: FileSpreadsheet, description: 'CSV, XLS, XLSX, JSON', color: 'bg-primary text-white' },
        { id: 'sheets', name: t('cloudSheets'), icon: Cloud, description: t('cloudSheetsDesc'), color: 'bg-gray-100 text-gray-600' },
        { id: 'db', name: t('structuredDb'), icon: DbIcon, description: t('structuredDbDesc'), color: 'bg-gray-100 text-gray-600' },
        { id: 'api', name: t('restGraphql'), icon: Server, description: t('restGraphqlDesc'), color: 'bg-gray-100 text-gray-600' },
    ];
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
        if (confirm(t('removeConfirm'))) {
            setDataset(null, null);
            setIssues([]);
        }
    };


    return (
        <div className="space-y-8 py-6 fade-in pb-16">
            <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xls,.xlsx,.json"
                className="hidden"
                onChange={handleHiddenFileChange}
            />

            {/* Corporate Welcome Header */}
            <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-1.5 h-5 bg-primary rounded-full" />
                    <span className="text-xs font-black uppercase tracking-wider text-gray-400">{t('dataPlatform')}</span>
                </div>
                <motion.h1
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="text-3xl font-black tracking-tighter text-gray-900"
                >
                    {t('uploadData')}
                </motion.h1>
                <p className="text-gray-500 font-medium max-w-2xl text-base leading-relaxed">
                    {t('uploadDataDesc')}
                </p>
            </div>

            {/* Source Connection Cards */}
            <section className="space-y-8">
                <div className="flex items-center justify-between">
                    <h2 className="text-[10px] font-black uppercase tracking-wider text-gray-400">{t('chooseSource')}</h2>
                    <div className="h-px flex-1 bg-gray-200 mx-6" />
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
                                    "group p-5 rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 transition-all text-left space-y-4 relative overflow-hidden",
                                    "hover:border-gray-300 hover:shadow-lg"
                                )}
                            >
                                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shadow-lg transition-transform group-hover:scale-110 duration-500", type.color)}>
                                    <Icon className="w-7 h-7" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-base tracking-tight text-gray-900 mb-1">{type.name}</h3>
                                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest leading-none">{type.description}</p>
                                </div>
                                <Plus className="absolute top-8 right-8 w-5 h-5 text-gray-300 group-hover:text-gray-600 transition-all" />
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
                            <h2 className="text-[10px] font-black uppercase tracking-wider text-gray-400">{t('fileUpload')}</h2>
                            <div className="h-px flex-1 bg-gray-200 mx-6" />
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
                            <h2 className="text-[10px] font-black uppercase tracking-wider text-gray-400 flex items-center gap-4">
                                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                {t('activeConnection')}
                            </h2>
                            <button
                                onClick={handleClear}
                                className="text-[9px] font-black uppercase tracking-wide text-gray-400 hover:text-red-500 flex items-center gap-2 transition-all px-4 py-2 rounded-lg border border-gray-200 hover:border-red-500/20"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                                {t('removeDataset')}
                            </button>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                            {/* Dataset Info Card */}
                            <div className="lg:col-span-2 p-6 rounded-2xl bg-white shadow-sm border border-gray-200 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-12 opacity-5 scale-150 rotate-12 group-hover:scale-[1.6] group-hover:rotate-6 transition-transform duration-1000">
                                    <FileSpreadsheet className="w-48 h-48 text-gray-900" />
                                </div>

                                <div className="flex flex-col h-full justify-between relative z-10 gap-6">
                                    <div className="flex items-start justify-between">
                                        <div className="space-y-4">
                                            <div className="w-14 h-14 rounded-2xl bg-primary text-white flex items-center justify-center">
                                                <FileSpreadsheet className="w-7 h-7" />
                                            </div>
                                            <div>
                                                <h4 className="text-2xl font-black tracking-tighter text-gray-900">{datasetName}</h4>
                                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-2">{t('sourceFileUpload')}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2.5 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                            <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">{t('connected')}</span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-3 gap-6 pt-10 border-t border-gray-200">
                                        <div className="space-y-2">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">{t('rows')}</p>
                                            <p className="text-2xl font-black text-gray-900">{dataset.length.toLocaleString()}</p>
                                        </div>
                                        <div className="space-y-2">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">{t('columns')}</p>
                                            <p className="text-2xl font-black text-gray-900">{Object.keys(dataset[0]).length}</p>
                                        </div>
                                        <div className="space-y-2">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">{t('dataTypes')}</p>
                                            <div className="flex flex-wrap gap-2 mt-2">
                                                {Object.values(useMemo(() => detectColumnTypes(dataset || []), [dataset])).slice(0, 4).map((t, i) => (
                                                    <span key={i} className="px-2 py-1 rounded bg-gray-100 text-[8px] font-black text-gray-500 border border-gray-200 uppercase tracking-tighter">{t}</span>
                                                ))}
                                                {Object.keys(dataset[0]).length > 4 && <span className="text-[8px] font-black text-gray-400">+{Object.keys(dataset[0]).length - 4} {t('more')}</span>}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Action Card */}
                            <div className="p-6 rounded-2xl bg-primary text-white flex flex-col justify-between shadow-lg">
                                <div className="space-y-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                                            <Wand2 className="w-4 h-4" />
                                        </div>
                                        <h3 className="text-xl font-black tracking-tight">{t('nextStep')}</h3>
                                    </div>
                                    <p className="text-sm font-medium leading-relaxed opacity-90">
                                        {t('nextStepDesc')}
                                    </p>
                                </div>

                                <button
                                    onClick={() => setPhase('preparation')}
                                    className="w-full py-3 bg-white text-primary rounded-xl text-[11px] font-black uppercase tracking-wide hover:scale-[1.03] transition-all flex items-center justify-center gap-3 active:scale-95"
                                >
                                    {t('continuePrep')}
                                    <ArrowRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Neural Segmentation Section */}
                        <PatternDiscovery />

                        <div className="p-6 rounded-2xl bg-white shadow-sm border border-gray-200 space-y-8 overflow-hidden">
                            <div className="flex items-center justify-between px-2">
                                <h3 className="text-[10px] font-black uppercase tracking-wider text-gray-400 text-center">{t('dataPreview')}</h3>
                                <div className="flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">{t('preview')}</span>
                                </div>
                            </div>
                            <div className="overflow-x-auto border border-gray-200 rounded-2xl">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-gray-50">
                                            {Object.entries(useMemo(() => detectColumnTypes(dataset || []), [dataset])).slice(0, 8).map(([col, type]) => (
                                                <th key={col} className="p-4 text-[10px] font-black uppercase tracking-widest text-gray-500 border-b border-gray-200">
                                                    <div className="flex flex-col gap-1">
                                                        <span>{col}</span>
                                                        <span className="text-[7px] text-primary px-1.5 py-0.5 rounded bg-primary/10 border border-primary/20 w-fit leading-none">{type}</span>
                                                    </div>
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="text-[11px]">
                                        {dataset.slice(0, 5).map((row, i) => (
                                            <tr key={i} className="hover:bg-gray-50 transition-colors">
                                                {Object.keys(dataset[0]).slice(0, 8).map(col => (
                                                    <td key={col} className="p-4 text-gray-600 border-b border-gray-100 truncate max-w-[150px]">
                                                        {String(row[col])}
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </motion.section>
                )}
            </AnimatePresence>

            {/* Connection Modal (Mock) */}
            <AnimatePresence>
                {connectingSource && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/30 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="w-full max-w-lg bg-white border border-gray-200 rounded-2xl overflow-hidden p-6 space-y-6 shadow-3xl"
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center">
                                        {sourceTypes.find(s => s.id === connectingSource)?.icon && React.createElement(sourceTypes.find(s => s.id === connectingSource)!.icon, { className: "w-6 h-6" })}
                                    </div>
                                    <h2 className="text-2xl font-black tracking-tight uppercase tracking-[0.1em]">{t('connect')} {connectingSource}</h2>
                                </div>
                                <button onClick={() => setConnectingSource(null)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                                    <X className="w-6 h-6 text-gray-400" />
                                </button>
                            </div>

                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">{t('endpointUrl')}</label>
                                    <input
                                        type="text"
                                        placeholder={`https://api.enterprise.com/${connectingSource}/v1`}
                                        className="w-full bg-gray-100 border border-gray-200 rounded-xl px-5 py-4 focus:border-gray-300 outline-none text-sm font-medium"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">{t('apiKey')}</label>
                                    <input
                                        type="password"
                                        placeholder="df_live_••••••••••••••••"
                                        className="w-full bg-gray-100 border border-gray-200 rounded-xl px-5 py-4 focus:border-gray-300 outline-none text-sm font-medium"
                                    />
                                </div>
                            </div>

                            <button
                                onClick={handleMockConnect}
                                disabled={isMockConnecting}
                                className="w-full py-3 bg-primary text-white rounded-xl text-[11px] font-black uppercase tracking-wide hover:scale-[1.02] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                            >
                                {isMockConnecting ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : t('connect')}
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
