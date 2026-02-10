"use client";

import React, { useState, useMemo } from "react";
import {
    AlertCircle,
    CheckCircle2,
    Sparkles,
    ArrowRight,
    ShieldCheck,
    Database,
    Zap,
    RefreshCcw,
    FileCode,
    Activity,
    Shield,
    Trash2,
    Lock,
    Cpu
} from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { applyTransformation, analyzeDataset } from "@/lib/dataProcessor";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export function PreparationView() {
    const {
        dataset,
        datasetName,
        issues,
        setIssues,
        setDataset,
        setPhase,
        addTransformation,
        persistTransformation,
        setLoading
    } = useAppStore();

    const [isCleaning, setIsCleaning] = useState(false);

    const healthScore = useMemo(() => {
        if (!dataset || dataset.length === 0) return 100;
        const totalPossiblePoints = dataset.length * Object.keys(dataset[0]).length;
        const totalIssues = (issues || []).reduce((acc, issue) => acc + issue.count, 0);
        return Math.round(Math.max(0, Math.min(100, 100 - (totalIssues / totalPossiblePoints) * 500)));
    }, [dataset, issues]);

    if (!dataset) {
        return (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-12 fade-in py-20">
                <div className="w-32 h-32 rounded-[2.5rem] bg-white/5 border border-white/10 flex items-center justify-center relative overflow-hidden group shadow-2xl">
                    <Database className="w-12 h-12 text-white/10 group-hover:text-white/30 transition-all duration-700 group-hover:scale-110" />
                    <div className="absolute inset-0 bg-gradient-to-t from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                </div>
                <div className="space-y-6">
                    <div className="flex flex-col items-center gap-2">
                        <span className="text-[10px] font-black uppercase tracking-[0.5em] text-white/20">System Status</span>
                        <h2 className="text-4xl font-black tracking-tighter text-white">Neural Hub Disconnected</h2>
                    </div>
                    <p className="text-white/30 font-medium max-w-md mx-auto leading-relaxed">
                        Data Integrity protocols require an active enterprise stream. Please establish a connection in the Neural Hub to begin.
                    </p>
                </div>
                <button
                    onClick={() => setPhase('workspace')}
                    className="group px-12 py-5 bg-white text-black rounded-2xl text-[11px] font-black uppercase tracking-[0.3em] hover:scale-[1.05] transition-all shadow-[0_20px_40px_rgba(255,255,255,0.1)] active:scale-95 flex items-center gap-3"
                >
                    Initialize Connection
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
            </div>
        );
    }

    const handleAutoClean = async () => {
        setIsCleaning(true);
        setLoading(true);
        await new Promise(r => setTimeout(r, 2500));

        let currentData = [...dataset];
        (issues || []).forEach(issue => {
            const transformationType = issue.type === 'duplicate' ? 'remove_duplicates' :
                issue.type === 'null' ? 'impute_nulls' :
                    issue.type === 'outlier' ? 'remove_outliers' : issue.type;

            currentData = applyTransformation(currentData, transformationType, { field: issue.field, value: 'N/A' });
            const t = {
                id: Math.random().toString(),
                type: transformationType,
                params: { field: issue.field },
                timestamp: new Date()
            };
            addTransformation(t);
            persistTransformation(t);
        });

        setDataset(currentData, datasetName);
        setIssues(analyzeDataset(currentData));
        setLoading(false);
        setIsCleaning(false);
    };

    const handleResolve = (issueId: string) => {
        const issue = (issues || []).find(i => i.id === issueId);
        if (!issue) return;

        const transformationType = issue.type === 'duplicate' ? 'remove_duplicates' :
            issue.type === 'null' ? 'impute_nulls' :
                issue.type === 'outlier' ? 'remove_outliers' : issue.type;

        const newData = applyTransformation(dataset, transformationType, { field: issue.field, value: 'N/A' });
        setDataset(newData, datasetName);
        setIssues(analyzeDataset(newData));

        const t = {
            id: Math.random().toString(),
            type: transformationType,
            params: { field: issue.field },
            timestamp: new Date()
        };
        addTransformation(t);
        persistTransformation(t);
    };

    return (
        <div className="space-y-16 py-6 fade-in pb-32">
            {/* Enterprise Header */}
            <div className="flex flex-col gap-6">
                <div className="flex items-center gap-4">
                    <div className="px-4 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2.5">
                        <Shield className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-500">Security: Tier 4</span>
                    </div>
                    <div className="h-px w-12 bg-white/5" />
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20">Cluster: CF-SYD-NEST</span>
                </div>

                <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
                    <div className="space-y-4">
                        <motion.h1
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="text-7xl font-black tracking-tighter text-white"
                        >
                            Integrity.
                        </motion.h1>
                        <p className="text-white/40 font-medium max-w-xl text-lg leading-relaxed">
                            Autonomous diagnostic engine scanning <span className="text-white font-bold">{datasetName}</span> for structural anomalies and semantic drift.
                        </p>
                    </div>

                    <div className="flex items-center gap-10 bg-[#111112] border border-white/5 p-8 px-10 rounded-[2.5rem] shadow-2xl">
                        <div className="relative">
                            <svg className="w-24 h-24 transform -rotate-90">
                                <circle cx="48" cy="48" r="44" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-white/5" />
                                <motion.circle
                                    cx="48" cy="48" r="44" stroke="currentColor" strokeWidth="4" fill="transparent"
                                    strokeDasharray={276.4}
                                    initial={{ strokeDashoffset: 276.4 }}
                                    animate={{ strokeDashoffset: 276.4 - (276.4 * healthScore) / 100 }}
                                    className={cn(
                                        "transition-all duration-1000",
                                        healthScore > 80 ? "text-emerald-500" : healthScore > 50 ? "text-amber-500" : "text-red-500"
                                    )}
                                />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-2xl font-black text-white">{healthScore}%</span>
                            </div>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20">Audit Score</p>
                            <p className="text-xl font-bold text-white tracking-tight">System {healthScore > 80 ? 'Operational' : 'Compromised'}</p>
                            <p className="text-[10px] text-white/30 uppercase font-bold mt-1">Found {(issues || []).length} Potential disrupting factors</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                {/* Diagnostic Feed */}
                <div className="lg:col-span-2 space-y-10">
                    <div className="flex items-center justify-between px-4">
                        <div className="flex items-center gap-4">
                            <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20 italic">Global Anomaly Feed</h2>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="flex -space-x-2">
                                {[1, 2, 3].map(i => <div key={i} className="w-6 h-6 rounded-full border-2 border-[#111112] bg-white/5 flex items-center justify-center text-[8px] font-black italic">AI</div>)}
                            </div>
                            <span className="text-[9px] font-bold text-white/30">Llama Cluster Monitoring</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-5">
                        <AnimatePresence mode="popLayout">
                            {(!issues || issues.length === 0) ? (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.98 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="p-20 rounded-[4rem] bg-emerald-500/[0.02] border border-emerald-500/10 flex flex-col items-center justify-center text-center gap-8 shadow-inner"
                                >
                                    <div className="w-24 h-24 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 relative">
                                        <div className="absolute inset-0 rounded-full animate-ping bg-emerald-500/10" />
                                        <ShieldCheck className="w-12 h-12 relative z-10" />
                                    </div>
                                    <div className="space-y-3">
                                        <p className="text-2xl font-black text-white tracking-tight">Semantical Integrity Verified</p>
                                        <p className="text-sm text-white/30 font-medium max-w-sm">Global audit complete. No disruptive patterns identified in the primary data stream.</p>
                                    </div>
                                    <button
                                        onClick={() => setPhase('exploration')}
                                        className="mt-4 px-12 py-4 bg-white text-black rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] hover:scale-105 transition-all shadow-xl"
                                    >
                                        Proceed to Deep Insights
                                    </button>
                                </motion.div>
                            ) : (
                                issues.map((issue, i) => (
                                    <motion.div
                                        key={issue.id}
                                        initial={{ opacity: 0, y: 15 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        transition={{ delay: i * 0.05 }}
                                        className="group p-10 rounded-[2.5rem] bg-[#111112] border border-white/5 hover:border-white/20 transition-all flex items-center justify-between shadow-2xl"
                                    >
                                        <div className="flex items-center gap-8">
                                            <div className={cn(
                                                "w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 shadow-lg transition-transform group-hover:scale-110 duration-500",
                                                issue.severity === 'high' ? "bg-red-500/10 text-red-500" :
                                                    issue.severity === 'medium' ? "bg-amber-500/10 text-amber-500" : "bg-blue-500/10 text-blue-500"
                                            )}>
                                                <AlertCircle className="w-8 h-8" />
                                            </div>
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-4">
                                                    <h3 className="font-bold text-lg text-white tracking-tight">{issue.field}</h3>
                                                    <span className={cn(
                                                        "text-[9px] font-black uppercase tracking-[0.2em] px-3 py-1.5 rounded-full border",
                                                        issue.severity === 'high' ? "bg-red-500/5 border-red-500/20 text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.1)]" :
                                                            issue.severity === 'medium' ? "bg-amber-500/5 border-amber-500/20 text-amber-500" : "bg-blue-500/5 border-blue-500/20 text-blue-500"
                                                    )}>{issue.type} detected</span>
                                                </div>
                                                <p className="text-xs text-white/30 font-medium">Neural core identified <span className="text-white/60 font-bold">{issue.count} anomalies</span>. <span className="italic block mt-1">{issue.suggestion}</span></p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleResolve(issue.id)}
                                            className="px-8 py-3.5 rounded-xl bg-white/5 hover:bg-white text-white hover:text-black transition-all text-[10px] font-black uppercase tracking-[0.2em] border border-white/5"
                                        >
                                            Resolve Anomaly
                                        </button>
                                    </motion.div>
                                ))
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* Automation Sidebar */}
                <div className="space-y-10">
                    <div className="p-12 rounded-[3.5rem] bg-white text-black flex flex-col justify-between min-h-[500px] shadow-[0_30px_60px_rgba(255,255,255,0.05)] relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-12 opacity-[0.03] group-hover:scale-125 transition-transform duration-1000">
                            <Cpu className="w-64 h-64 text-black" />
                        </div>

                        <div className="space-y-12 relative z-10">
                            <div className="flex items-center gap-5">
                                <div className="w-14 h-14 rounded-2xl bg-black text-white flex items-center justify-center shadow-2xl">
                                    <Sparkles className="w-6 h-6" />
                                </div>
                                <div className="space-y-1">
                                    <h3 className="text-2xl font-black tracking-tighter leading-none">Global Heal.</h3>
                                    <p className="text-[10px] text-black/30 font-black uppercase tracking-[0.2em]">Neural Auto-Resolution</p>
                                </div>
                            </div>

                            <div className="space-y-8">
                                <p className="text-base font-semibold leading-relaxed text-black/60">
                                    Initiate high-velocity dataset rectification. Our core engine will prune duplicates, impute latent values, and normalize distributions across the cluster.
                                </p>
                                <div className="space-y-5">
                                    {[
                                        { label: "Semantic Deduplication", icon: Lock },
                                        { label: "Predictive Imputation", icon: Shield },
                                        { label: "Outlier Neutralization", icon: Activity }
                                    ].map((item, idx) => (
                                        <div key={idx} className="flex items-center gap-4">
                                            <div className="w-8 h-8 rounded-full bg-black/5 flex items-center justify-center">
                                                <item.icon className="w-4 h-4 text-black/40" />
                                            </div>
                                            <span className="text-xs font-black uppercase tracking-widest text-black/80">{item.label}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={handleAutoClean}
                            disabled={isCleaning || !issues || issues.length === 0}
                            className="w-full py-6 bg-black text-white rounded-[2rem] text-[11px] font-black uppercase tracking-[0.3em] hover:scale-[1.03] transition-all flex items-center justify-center gap-3 disabled:opacity-10 active:scale-95 shadow-2xl relative z-10"
                        >
                            {isCleaning ? <RefreshCcw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4 fill-white" />}
                            {isCleaning ? "Rectifying Context..." : "Execute Global Heal"}
                        </button>
                    </div>

                    <div className="p-10 rounded-[3rem] bg-[#111112] border border-white/5 space-y-8">
                        <div className="flex items-center justify-between px-2">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20">Operational Ledger</h3>
                            <FileCode className="w-4 h-4 text-white/10" />
                        </div>
                        <div className="space-y-6">
                            <p className="text-xs font-medium text-white/20 italic text-center py-4 border border-dashed border-white/5 rounded-2xl">
                                No cryptographic transformations registered in current stream.
                            </p>
                            <div className="pt-6 border-t border-white/5 flex items-center justify-between">
                                <span className="text-[9px] font-black uppercase text-white/10 tracking-[0.2em]">Safety mode active</span>
                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
