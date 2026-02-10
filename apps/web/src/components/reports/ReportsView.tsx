"use client";

import React from "react";
import {
    FileText,
    Download,
    Share2,
    CheckCircle2,
    Presentation,
    FileSpreadsheet,
    FileJson,
    Crown,
    Cloud,
    Shield,
    Globe,
    ArrowUpRight,
    Search,
    Clock,
    Zap,
    Cpu
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/useAppStore";
import { exportToPDF, exportToCSV } from "@/lib/exporters";
import { motion } from "framer-motion";

const exportFormats = [
    { id: 'pdf', name: 'Executive Intelligence (PDF)', description: 'Synthesized diagnostic results and strategic visualizations.', icon: FileText, premium: false },
    { id: 'pptx', name: 'Strategy Deck (PPTX)', description: 'High-fidelity slides for executive alignment.', icon: Presentation, premium: true },
    { id: 'csv', name: 'Structural Feed (CSV)', description: 'Sanitized and optimized multi-dimensional dataset.', icon: FileSpreadsheet, premium: false },
    { id: 'json', name: 'Neural Snapshot (JSON)', description: 'Complete state and logic tree exports.', icon: FileJson, premium: true },
];

export function ReportsView() {
    const { dataset, datasetName, transformations, charts, setPhase } = useAppStore();

    const handleExport = (formatId: string) => {
        if (formatId === 'pdf') {
            exportToPDF({
                projectName: datasetName || 'Intelligence Phase Output',
                transformations,
                chartsCount: charts.length
            });
        } else if (formatId === 'csv') {
            if (!dataset) return;
            exportToCSV(dataset, `${datasetName || 'dataflow'}_optimized.csv`);
        } else {
            // Mock premium behavior
        }
    };

    if (!dataset) {
        return (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-12 fade-in py-20">
                <div className="w-32 h-32 rounded-[2.5rem] bg-[#111112] border border-white/5 flex items-center justify-center relative group">
                    <div className="absolute inset-0 bg-primary/5 blur-3xl rounded-full" />
                    <Cloud className="w-12 h-12 text-white/10 group-hover:text-white/30 transition-all duration-700" />
                </div>
                <div className="space-y-6">
                    <h2 className="text-4xl font-black tracking-tighter text-white">Reports Engine Idle</h2>
                    <p className="text-white/30 font-medium max-w-md mx-auto leading-relaxed">
                        Data dissemination protocols require an established stream. Initialize your Neural Hub to generate executive intelligence reports.
                    </p>
                </div>
                <button
                    onClick={() => setPhase('workspace')}
                    className="px-12 py-5 bg-white text-black rounded-2xl text-[11px] font-black uppercase tracking-[0.3em] hover:scale-[1.05] transition-all"
                >
                    Connect Data Stream
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-20 py-6 fade-in pb-32">
            {/* Enterprise Header */}
            <div className="flex flex-col gap-6">
                <div className="flex items-center gap-4">
                    <div className="px-4 py-1.5 rounded-lg bg-primary/10 border border-primary/20 flex items-center gap-2.5">
                        <Globe className="w-3.5 h-3.5 text-primary" />
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Global Distribution</span>
                    </div>
                    <div className="h-px w-12 bg-white/5" />
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20">Protocol: SEC-RP-4</span>
                </div>

                <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
                    <div className="space-y-4">
                        <motion.h1
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="text-7xl font-black tracking-tighter text-white"
                        >
                            Intelligence.
                        </motion.h1>
                        <p className="text-white/40 font-medium max-w-xl text-lg leading-relaxed">
                            Finalizing <span className="text-white font-bold">{datasetName}</span>. Generating high-fidelity communication assets for executive distribution and alignment.
                        </p>
                    </div>

                    <div className="bg-[#111112] border border-white/5 p-8 px-10 rounded-[2.5rem] flex items-center gap-10">
                        <div className="flex -space-x-3">
                            {[1, 2, 3].map(i => <div key={i} className="w-10 h-10 rounded-full border-4 border-[#111112] bg-white/5 flex items-center justify-center text-[8px] font-black">AI</div>)}
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20">Sync Status</p>
                            <p className="text-base font-bold text-emerald-500 tracking-tight flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4" /> Cloud Verified
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
                {/* Export Protocols */}
                <div className="lg:col-span-8 space-y-10">
                    <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20 italic px-4">Dissemination Protocols</h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {exportFormats.map((format, idx) => {
                            const Icon = format.icon;
                            return (
                                <motion.div
                                    key={format.id}
                                    initial={{ opacity: 0, scale: 0.98 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: idx * 0.1 }}
                                    className="p-10 rounded-[3rem] bg-[#111112] border border-white/5 hover:border-white/20 transition-all flex flex-col justify-between group h-[340px] shadow-2xl"
                                >
                                    <div className="space-y-8">
                                        <div className="flex items-center justify-between">
                                            <div className="w-16 h-16 rounded-[1.5rem] bg-white text-black flex items-center justify-center shadow-lg group-hover:rotate-6 transition-transform">
                                                <Icon className="w-8 h-8" />
                                            </div>
                                            {format.premium && (
                                                <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20">
                                                    <Crown className="w-3 h-3 text-primary fill-primary" />
                                                    <span className="text-[9px] font-black uppercase tracking-widest text-primary">PREMIUM</span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="space-y-2">
                                            <h3 className="text-xl font-black text-white">{format.name}</h3>
                                            <p className="text-sm text-white/30 font-medium leading-relaxed">{format.description}</p>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => handleExport(format.id)}
                                        className={cn(
                                            "w-full py-5 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-3 active:scale-95",
                                            format.premium
                                                ? "bg-white/5 text-white/20 cursor-not-allowed"
                                                : "bg-white text-black hover:bg-white/90 shadow-xl"
                                        )}
                                    >
                                        <Download className="w-4 h-4" />
                                        Initialize Export
                                    </button>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>

                {/* Audit & Sharing */}
                <div className="lg:col-span-4 space-y-12">
                    <div className="p-12 rounded-[3.5rem] bg-white text-black space-y-10 shadow-2xl group overflow-hidden relative">
                        <div className="absolute top-0 right-0 p-12 opacity-[0.03] group-hover:scale-125 transition-transform duration-1000">
                            <Zap className="w-64 h-64 text-black" />
                        </div>

                        <div className="space-y-3 relative z-10">
                            <h2 className="text-3xl font-black tracking-tighter italic">Global Share.</h2>
                            <p className="text-black/40 font-semibold leading-relaxed">
                                Establish a secure cryptographic tunnel to distribute interactive analytics to stakeholders across the cluster.
                            </p>
                        </div>

                        <div className="space-y-6 relative z-10">
                            {[
                                { label: "Multi-Factor Access", icon: Shield },
                                { label: "Global CDN Edge", icon: Globe },
                            ].map((item, i) => (
                                <div key={i} className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-black/5 flex items-center justify-center">
                                        <item.icon className="w-5 h-5 text-black/30" />
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-black/60">{item.label}</span>
                                </div>
                            ))}
                        </div>

                        <button
                            className="w-full py-6 bg-black text-white rounded-[2rem] text-[11px] font-black uppercase tracking-[0.3em] flex items-center justify-center gap-4 hover:scale-[1.03] transition-all shadow-xl active:scale-95 relative z-10"
                        >
                            Generate Tunnel Link
                            <ArrowUpRight className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="p-10 rounded-[3rem] bg-[#111112] border border-white/5 space-y-10">
                        <div className="flex items-center justify-between">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20 italic">Final Audit Log</h3>
                            <Clock className="w-4 h-4 text-white/20" />
                        </div>

                        <div className="space-y-8">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-1">
                                    <span className="text-[9px] font-black uppercase text-white/10 tracking-[0.2em]">Transformations</span>
                                    <p className="text-2xl font-black text-white">{transformations.length}</p>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-[9px] font-black uppercase text-white/10 tracking-[0.2em]">Insights</span>
                                    <p className="text-2xl font-black text-white">{charts.length}</p>
                                </div>
                            </div>

                            <div className="space-y-5 pt-6 border-t border-white/5">
                                {transformations.slice(-2).reverse().map((t) => (
                                    <div key={t.id} className="flex items-center gap-4">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                        <span className="text-[11px] font-bold text-white/60">{t.type}</span>
                                        <span className="ml-auto text-[9px] font-black text-white/20">SUCCESS</span>
                                    </div>
                                ))}
                                {transformations.length === 0 && <p className="text-xs text-white/10 italic">Audit log initialized...</p>}
                            </div>

                            <div className="pt-6 border-t border-white/5 flex items-center justify-between gap-3">
                                <span className="text-[9px] font-black uppercase text-white/20 tracking-[0.1em] px-3 py-1 bg-white/5 rounded-full">SECURED BY LLAMA-3</span>
                                <Cpu className="w-4 h-4 text-white/10" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
