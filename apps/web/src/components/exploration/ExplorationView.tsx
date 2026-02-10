"use client";

import React, { useState } from "react";
import {
    BarChart3,
    LineChart,
    PieChart as PieChartIcon,
    ScatterChart,
    Sparkles,
    Plus,
    Settings2,
    Maximize2,
    Download,
    Lightbulb,
    Table as TableIcon,
    Zap,
    TrendingUp,
    LayoutDashboard,
    ArrowUpRight,
    Cpu,
    Waves,
    RefreshCcw
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/useAppStore";
import { DataChart } from "./DataChart";
import { motion, AnimatePresence } from "framer-motion";

export function ExplorationView() {
    const { dataset, datasetName, charts, addChart, persistChart, setPhase } = useAppStore();
    const [isGenerating, setIsGenerating] = useState(false);

    const generateAutoDashboard = async () => {
        if (!dataset || dataset.length === 0) return;
        setIsGenerating(true);

        await new Promise(r => setTimeout(r, 2000));

        const columns = Object.keys(dataset[0]);
        const numCols = columns.filter(c => typeof dataset[0][c] === 'number');
        const catCols = columns.filter(c => typeof dataset[0][c] === 'string');

        // Logic for auto-gen
        if (numCols.length >= 2) {
            const scatterChart = {
                id: Math.random().toString(),
                title: `${numCols[0]} Correlation Insight`,
                type: 'scatter',
                data: [{
                    x: dataset.map(r => r[numCols[0]]),
                    y: dataset.map(r => r[numCols[1]]),
                    mode: 'markers',
                    type: 'scatter',
                    marker: {
                        color: 'rgba(59, 130, 246, 0.6)',
                        size: 8,
                        line: { color: 'rgba(255, 255, 255, 0.1)', width: 0.5 }
                    }
                }],
                layout: {
                    title: { text: `Neural Relationship: ${numCols[0]} vs ${numCols[1]}`, font: { color: '#ffffff', size: 14, family: 'Inter, sans-serif' } },
                    paper_bgcolor: 'rgba(0,0,0,0)',
                    plot_bgcolor: 'rgba(0,0,0,0)',
                    xaxis: { gridcolor: 'rgba(255,255,255,0.05)', tickfont: { color: 'rgba(255,255,255,0.4)' } },
                    yaxis: { gridcolor: 'rgba(255,255,255,0.05)', tickfont: { color: 'rgba(255,255,255,0.4)' } }
                }
            };
            addChart(scatterChart);
            persistChart(scatterChart);
        }

        if (catCols.length > 0 && numCols.length > 0) {
            const field = catCols[0];
            const valField = numCols[0];
            const counts: any = {};
            dataset.forEach(r => {
                counts[r[field]] = (counts[r[field]] || 0) + (Number(r[valField]) || 0);
            });
            const sorted = Object.entries(counts).sort((a: any, b: any) => b[1] - a[1]).slice(0, 5);

            const barChart = {
                id: Math.random().toString(),
                title: `Strategic Top 5: ${field}`,
                type: 'bar',
                data: [{
                    x: sorted.map(s => s[0]),
                    y: sorted.map(s => s[1]),
                    type: 'bar',
                    marker: {
                        color: sorted.map((_, i) => `rgba(16, 185, 129, ${1 - i * 0.15})`),
                        line: { color: 'rgba(16, 185, 129, 0.3)', width: 1 }
                    }
                }],
                layout: {
                    title: { text: `Distribution Protocol: ${field} by ${valField}`, font: { color: '#ffffff', size: 14, family: 'Inter, sans-serif' } },
                    paper_bgcolor: 'rgba(0,0,0,0)',
                    plot_bgcolor: 'rgba(0,0,0,0)',
                    xaxis: { gridcolor: 'rgba(255,255,255,0.05)', tickfont: { color: 'rgba(255,255,255,0.4)' } },
                    yaxis: { gridcolor: 'rgba(255,255,255,0.05)', tickfont: { color: 'rgba(255,255,255,0.4)' } }
                }
            };
            addChart(barChart);
            persistChart(barChart);
        }

        setIsGenerating(false);
    };

    if (!dataset) {
        return (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-12 fade-in py-20">
                <div className="w-32 h-32 rounded-[2.5rem] bg-white/5 border border-white/10 flex items-center justify-center relative overflow-hidden group shadow-2xl">
                    <LayoutDashboard className="w-12 h-12 text-white/10 group-hover:text-white/30 transition-all duration-700 group-hover:scale-110" />
                    <div className="absolute inset-0 bg-gradient-to-t from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                </div>
                <div className="space-y-6">
                    <div className="flex flex-col items-center gap-2">
                        <span className="text-[10px] font-black uppercase tracking-[0.5em] text-white/20">Visualization Core</span>
                        <h2 className="text-4xl font-black tracking-tighter text-white">Neural Hub Disconnected</h2>
                    </div>
                    <p className="text-white/30 font-medium max-w-md mx-auto leading-relaxed">
                        Exploration protocols require an active enterprise stream. Please establish a connection in the Neural Hub to begin visualization.
                    </p>
                </div>
                <button
                    onClick={() => setPhase('workspace')}
                    className="group px-12 py-5 bg-white text-black rounded-2xl text-[11px] font-black uppercase tracking-[0.3em] hover:scale-[1.05] transition-all shadow-[0_20px_40px_rgba(255,255,255,0.1)] active:scale-95 flex items-center gap-3"
                >
                    Initialize Connection
                    <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform" />
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-16 py-6 fade-in pb-32">
            {/* Enterprise Header */}
            <div className="flex flex-col gap-6">
                <div className="flex items-center gap-4">
                    <div className="px-4 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center gap-2.5">
                        <TrendingUp className="w-3.5 h-3.5 text-blue-500" />
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-500">Analysis: Active</span>
                    </div>
                    <div className="h-px w-12 bg-white/5" />
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20">Cluster: CF-TOK-NEURAL</span>
                </div>

                <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
                    <div className="space-y-4">
                        <motion.h1
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="text-7xl font-black tracking-tighter text-white"
                        >
                            Dynamics.
                        </motion.h1>
                        <p className="text-white/40 font-medium max-w-xl text-lg leading-relaxed">
                            Interacting with <span className="text-white font-bold">{datasetName}</span>. Synthesis of multi-dimensional patterns into actionable executive dashboards.
                        </p>
                    </div>

                    <div className="flex items-center gap-6">
                        <button
                            onClick={generateAutoDashboard}
                            disabled={isGenerating}
                            className="bg-white text-black px-10 py-5 rounded-[2rem] text-[11px] font-black uppercase tracking-[0.3em] flex items-center gap-4 shadow-2xl hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                        >
                            {isGenerating ? <RefreshCcw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 fill-black" />}
                            {isGenerating ? "Synthesizing..." : "Neural Auto-Gen"}
                        </button>
                    </div>
                </div>
            </div>

            {/* Content Display */}
            <div className="space-y-20">
                {/* Global Insight Overlay */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-10 rounded-[3.5rem] bg-gradient-to-br from-primary/20 via-primary/5 to-transparent border border-white/5 relative overflow-hidden group shadow-2xl"
                >
                    <div className="absolute top-0 right-0 p-12 opacity-[0.05] transform group-hover:scale-125 transition-transform duration-1000 grayscale">
                        <Waves className="w-64 h-64 text-white" />
                    </div>

                    <div className="flex flex-col md:flex-row items-center gap-12 relative z-10">
                        <div className="w-20 h-20 rounded-3xl bg-white text-black flex items-center justify-center shadow-2xl shrink-0 group-hover:rotate-6 transition-transform">
                            <Lightbulb className="w-10 h-10 fill-current" />
                        </div>
                        <div className="space-y-3 flex-1">
                            <div className="flex items-center gap-3">
                                <span className="text-[10px] font-black uppercase tracking-[0.5em] text-primary">Core Insight</span>
                                <div className="h-px flex-1 bg-white/5" />
                            </div>
                            <h3 className="text-3xl font-black text-white tracking-tight">Anomalous Growth Cluster Detected</h3>
                            <p className="text-white/40 font-medium leading-relaxed max-w-2xl text-lg">
                                Patterns indicate a strong alignment between localized variables and global KPIs. Potential for 18% optimization in resource allocation.
                            </p>
                        </div>
                        <button className="px-10 py-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 text-white text-[10px] font-black uppercase tracking-[0.3em] transition-all flex items-center gap-2 group/btn">
                            Detailed Audit
                            <ArrowUpRight className="w-4 h-4 opacity-0 group-hover/btn:opacity-100 group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-all" />
                        </button>
                    </div>
                </motion.div>

                {charts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-40 gap-10">
                        <div className="w-32 h-32 rounded-[3.5rem] bg-[#111112] border border-white/5 flex items-center justify-center relative shadow-inner">
                            <div className="absolute inset-0 rounded-full border border-dashed border-white/10 animate-[spin_10s_linear_infinite]" />
                            <Cpu className="w-10 h-10 text-white/20" />
                        </div>
                        <div className="space-y-4 text-center">
                            <h3 className="text-2xl font-black text-white px-2">Visualization Workspace Empty</h3>
                            <p className="text-white/20 text-sm font-medium max-w-sm mx-auto">
                                The neural engine is idling. Click Auto-Gen to initialize the multidimensional dashboard.
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
                        <AnimatePresence>
                            {charts.map((chart, idx) => (
                                <motion.div
                                    key={chart.id}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: idx * 0.1 }}
                                    className="p-10 rounded-[3.5rem] bg-[#111112] border border-white/5 hover:border-white/10 transition-all flex flex-col group shadow-2xl h-[550px]"
                                >
                                    <div className="flex items-center justify-between mb-8">
                                        <div className="flex items-center gap-5">
                                            <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-white/50 group-hover:text-primary transition-colors">
                                                {chart.type === 'bar' ? <BarChart3 className="w-5 h-5" /> : <ScatterChart className="w-5 h-5" />}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-lg text-white group-hover:translate-x-1 transition-transform">{chart.title}</h3>
                                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20">Operational Feed: Live</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-all">
                                            <button className="p-3 bg-white/5 hover:bg-white text-white/40 hover:text-black rounded-xl transition-all shadow-lg"><Download className="w-4 h-4" /></button>
                                            <button className="p-3 bg-white/5 hover:bg-white text-white/40 hover:text-black rounded-xl transition-all shadow-lg"><Maximize2 className="w-4 h-4" /></button>
                                        </div>
                                    </div>
                                    <div className="flex-1 min-h-0 relative">
                                        <DataChart data={chart.data} layout={chart.layout} />
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>

                        <button
                            onClick={generateAutoDashboard}
                            disabled={isGenerating}
                            className="p-20 rounded-[3.5rem] border-2 border-dashed border-white/5 hover:border-white/10 hover:bg-white/[0.02] transition-all flex flex-col items-center justify-center gap-6 group h-[550px] relative overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-gradient-to-t from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className="w-20 h-20 rounded-full border-2 border-white/10 flex items-center justify-center text-white/10 group-hover:text-white group-hover:scale-110 transition-all shadow-xl">
                                <Plus className="w-8 h-8" />
                            </div>
                            <div className="space-y-2 text-center relative z-10">
                                <span className="text-[11px] font-black uppercase tracking-[0.4em] text-white/10 group-hover:text-white/40 transition-colors">Append Protocol</span>
                                <h4 className="text-xl font-black text-white/20 group-hover:text-white transition-colors">Generate New View</h4>
                            </div>
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
