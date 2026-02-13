"use client";

import React, { useMemo, useState, useEffect, useCallback } from "react";
import {
    Table as TableIcon,
    BarChart3,
    TrendingUp,
    PieChart,
    Search,
    Download,
    Cpu,
    CheckCircle2,
    LayoutGrid,
    Binary,
    Activity,
    BrainCircuit,
    X,
    ChevronDown,
    ArrowRightLeft,
    Layers,
    AlertTriangle,
    Info,
    Hash,
    Type,
    Loader2
} from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { BivariateResult } from "@/lib/bivariateAnalysis";
import { DataChart } from "../exploration/DataChart";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n";

type TabKey = "overview" | "univariate" | "bivariate" | "correlation";

interface TabDef {
    key: TabKey;
    label: string;
    icon: React.ReactNode;
}

function fmt(v: number | string | undefined | null, decimals = 2): string {
    if (v === null || v === undefined) return "N/A";
    const n = typeof v === "string" ? parseFloat(v) : v;
    if (isNaN(n)) return String(v);
    if (Number.isInteger(n)) return n.toLocaleString();
    return n.toFixed(decimals);
}

export function EDAView() {
    const { dataset, datasetName, setPhase, runWorkerTask } = useAppStore();
    const t = useT();

    const [activeTab, setActiveTab] = useState<TabKey>("overview");
    const [selectedCols, setSelectedCols] = useState<string[]>([]);
    const [univariateCol, setUnivariateCol] = useState<string | null>(null);
    const [biColA, setBiColA] = useState<string>("");
    const [biColB, setBiColB] = useState<string>("");
    const [biResult, setBiResult] = useState<BivariateResult | null>(null);
    const [biLoading, setBiLoading] = useState(false);

    // Asynchronous state for heavy computations
    const [edaStats, setEdaStats] = useState<Record<string, any>>({});
    const [correlationMatrix, setCorrelationMatrix] = useState<any>(null);
    const [isStatsLoading, setIsStatsLoading] = useState(false);

    const columns = useMemo(() => dataset && dataset.length > 0 ? Object.keys(dataset[0]) : [], [dataset]);

    // Perform heavy calculations in background
    useEffect(() => {
        if (!dataset || dataset.length === 0) return;

        const loadStats = async () => {
            setIsStatsLoading(true);
            try {
                const [stats, corr] = await Promise.all([
                    runWorkerTask('COMPUTE_EDA_STATS', dataset),
                    runWorkerTask('COMPUTE_CORRELATION', dataset)
                ]);
                setEdaStats(stats);
                setCorrelationMatrix(corr);
            } catch (error) {
                console.error("Failed to compute stats in worker:", error);
            } finally {
                setIsStatsLoading(false);
            }
        };

        loadStats();
    }, [dataset, runWorkerTask]);

    const dataQuality = useMemo(() => {
        if (!dataset || dataset.length === 0) return { totalRows: 0, totalCols: 0, missingPct: 0, duplicatePct: 0, totalMissing: 0, totalDuplicates: 0 };
        const totalRows = dataset.length;
        const totalCols = columns.length;
        let totalMissing = 0;
        const totalCells = totalRows * totalCols;
        for (const row of dataset) {
            for (const col of columns) {
                if (row[col] === null || row[col] === undefined || row[col] === "") totalMissing++;
            }
        }
        return {
            totalRows,
            totalCols,
            missingPct: totalCells > 0 ? (totalMissing / totalCells) * 100 : 0,
            totalMissing,
            // Duplicates are checked by analyzeDataset usually, but we keep this simple here or move to worker if needed
            duplicatePct: 0,
            totalDuplicates: 0
        };
    }, [dataset, columns]);

    const topCorrelations = useMemo(() => {
        if (!correlationMatrix) return [];
        const keys = Object.keys(correlationMatrix);
        const pairs: { col1: string; col2: string; r: number }[] = [];
        for (let i = 0; i < keys.length; i++) {
            for (let j = i + 1; j < keys.length; j++) {
                const r = correlationMatrix[keys[i]][keys[j]];
                if (typeof r === "number" && !isNaN(r)) {
                    pairs.push({ col1: keys[i], col2: keys[j], r });
                }
            }
        }
        pairs.sort((a, b) => Math.abs(b.r) - Math.abs(a.r));
        return pairs;
    }, [correlationMatrix]);

    useEffect(() => {
        if (columns.length > 0 && selectedCols.length === 0) setSelectedCols(columns.slice(0, 8));
        if (columns.length > 0 && !univariateCol) setUnivariateCol(columns[0]);
        if (columns.length >= 2 && !biColA) {
            setBiColA(columns[0]);
            setBiColB(columns[1]);
        }
    }, [columns]);

    const runBivariate = useCallback(async () => {
        if (!dataset || !biColA || !biColB || biColA === biColB) return;
        setBiLoading(true);
        setBiResult(null);
        try {
            const result = await runWorkerTask('ANALYZE_BIVARIATE', dataset, { col1: biColA, col2: biColB });
            setBiResult(result);
        } catch (error) {
            console.error("Bivariate worker error:", error);
        } finally {
            setBiLoading(false);
        }
    }, [dataset, biColA, biColB, runWorkerTask]);

    if (!dataset || dataset.length === 0) {
        return (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-12 fade-in py-20 px-10">
                <div className="w-20 h-20 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center relative group">
                    <div className="absolute inset-0 bg-primary/5 blur-3xl rounded-full animate-pulse" />
                    <BrainCircuit className="w-10 h-10 text-gray-200 group-hover:text-gray-400 transition-all duration-1000" />
                </div>
                <div className="space-y-6">
                    <h2 className="text-2xl font-black tracking-tighter text-gray-900 uppercase">{t('noDataEda')}</h2>
                    <p className="text-gray-500 font-medium max-w-md mx-auto text-lg leading-relaxed">{t('noDataEdaDesc')}</p>
                    <button onClick={() => setPhase('preparation')} className="px-8 py-3 bg-primary text-white rounded-2xl text-[11px] font-black uppercase tracking-wider hover:scale-110 transition-all shadow-lg active:scale-95">{t('goToPreparation')}</button>
                </div>
            </div>
        );
    }

    const tabs: TabDef[] = [
        { key: "overview", label: t('overview'), icon: <LayoutGrid className="w-3.5 h-3.5" /> },
        { key: "univariate", label: t('univariate'), icon: <BarChart3 className="w-3.5 h-3.5" /> },
        { key: "bivariate", label: t('bivariate'), icon: <ArrowRightLeft className="w-3.5 h-3.5" /> },
        { key: "correlation", label: t('correlation'), icon: <TrendingUp className="w-3.5 h-3.5" /> },
    ];

    const issueTypeHelp: Record<string, string> = {
        null: t('nullHelp'),
        outlier: t('outlierHelp'),
        duplicate: t('duplicateHelp'),
    };

    function buildHistogramData(col: string) {
        const values = dataset!.map(r => Number(r[col])).filter(v => !isNaN(v));
        if (values.length === 0) return [];
        const min = Math.min(...values);
        const max = Math.max(...values);
        const binCount = Math.min(20, Math.ceil(Math.sqrt(values.length)));
        const binSize = (max - min) / binCount || 1;
        const bins: Record<string, number> = {};
        for (let i = 0; i < binCount; i++) bins[(min + i * binSize).toFixed(1)] = 0;
        values.forEach(v => {
            const binIdx = Math.min(Math.floor((v - min) / binSize), binCount - 1);
            const label = (min + binIdx * binSize).toFixed(1);
            bins[label] = (bins[label] || 0) + 1;
        });
        return Object.entries(bins).map(([name, value]) => ({ name, value }));
    }

    function buildBoxplotData(col: string) {
        const values = dataset!.map(r => Number(r[col])).filter(v => !isNaN(v)).sort((a, b) => a - b);
        if (values.length === 0) return { data: [[0, 0, 0, 0, 0]], categories: [col] };
        const n = values.length;
        const q1 = values[Math.floor(n * 0.25)];
        const med = values[Math.floor(n * 0.5)];
        const q3 = values[Math.floor(n * 0.75)];
        return { data: [[values[0], q1, med, q3, values[n - 1]]], categories: [col] };
    }

    function buildCategoryData(col: string, limit = 10) {
        const counts: Record<string, number> = {};
        dataset!.forEach(r => {
            const v = r[col];
            if (v !== null && v !== undefined && v !== "") counts[String(v)] = (counts[String(v)] || 0) + 1;
        });
        return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, limit).map(([name, value]) => ({ name, value }));
    }

    return (
        <div className="space-y-8 py-6 fade-in pb-16">
            <div className="flex flex-col gap-6">
                <div className="flex items-center gap-4">
                    <div className="px-4 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="text-[10px] font-black uppercase tracking-wider text-emerald-500">{t('integrityVerified')}</span>
                    </div>
                    {isStatsLoading && (
                        <div className="flex items-center gap-2 text-primary animate-pulse">
                            <Loader2 className="w-3 h-3 animate-spin" />
                            <span className="text-[9px] font-black uppercase tracking-widest">Background analysis in progress...</span>
                        </div>
                    )}
                </div>

                <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
                    <div className="space-y-4">
                        <motion.h1 initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="text-4xl font-black tracking-tighter text-gray-900">{t('exploratoryAnalysis')}</motion.h1>
                        <p className="text-gray-500 font-medium max-w-xl text-lg leading-relaxed">{t('edaDesc', { name: datasetName || '' })}</p>
                    </div>
                </div>
            </div>

            <div className="flex items-center p-1 bg-gray-100 rounded-2xl border border-gray-200 w-fit">
                {tabs.map(tab => (
                    <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={cn("px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-2", activeTab === tab.key ? "bg-white text-gray-900 shadow-sm" : "text-gray-400 hover:text-gray-600")}>
                        {tab.icon} {tab.label}
                    </button>
                ))}
            </div>

            <AnimatePresence mode="wait">
                {activeTab === "overview" && (
                    <motion.div key="overview" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="space-y-8">
                        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {[
                                { label: t('totalRows'), value: dataQuality.totalRows.toLocaleString(), accent: "text-primary" },
                                { label: t('totalColumns'), value: String(dataQuality.totalCols), accent: "text-primary" },
                                { label: t('missingCells'), value: `${fmt(dataQuality.missingPct, 1)}%`, accent: dataQuality.missingPct > 5 ? "text-red-500" : "text-emerald-500", help: t('nullHelp') },
                                { label: t('duplicateRows'), value: `${fmt(dataQuality.duplicatePct, 1)}%`, accent: dataQuality.duplicatePct > 2 ? "text-red-500" : "text-emerald-500", help: t('duplicateHelp') },
                            ].map((item, idx) => (
                                <div key={idx} className="p-5 rounded-xl bg-white shadow-sm border border-gray-200">
                                    <p className="text-[10px] font-black uppercase tracking-wider text-gray-400 mb-2">{item.label}</p>
                                    <p className={cn("text-2xl font-black tracking-tight", item.accent)}>{item.value}</p>
                                    {'help' in item && item.help && <p className="text-[9px] text-gray-400 mt-1.5 leading-relaxed">{item.help}</p>}
                                </div>
                            ))}
                        </section>

                        <section className="p-5 rounded-xl bg-gray-50 border border-gray-200 space-y-4">
                            <div className="flex items-center justify-between">
                                <h2 className="text-[10px] font-black uppercase tracking-wider text-gray-400">{t('columnSelector')}</h2>
                                <span className="text-[10px] font-bold text-primary">{selectedCols.length} {t('selected')}</span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {columns.map(col => (
                                    <button key={col} onClick={() => setSelectedCols(prev => prev.includes(col) ? prev.filter(c => c !== col) : [...prev, col])} className={cn("px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border", selectedCols.includes(col) ? "bg-primary text-white border-primary shadow-lg scale-105" : "bg-gray-100 text-gray-500 border-gray-200 hover:border-gray-300")}>
                                        {col}
                                    </button>
                                ))}
                            </div>
                        </section>

                        <section className="space-y-5">
                            <div className="flex items-center justify-between px-2">
                                <h2 className="text-[10px] font-black uppercase tracking-wider text-gray-400">{t('summaryStatistics')}</h2>
                                <Binary className="w-4 h-4 text-gray-300" />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                {selectedCols.map((col, idx) => {
                                    const stats = edaStats[col];
                                    if (!stats) return null;
                                    return (
                                        <div key={col} className="group p-5 rounded-xl bg-white shadow-sm border border-gray-200 h-[200px] relative overflow-hidden">
                                            <div>
                                                <div className="flex items-center justify-between mb-6">
                                                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", stats.type === 'numeric' ? "bg-primary/10 text-primary" : "bg-emerald-500/10 text-emerald-500")}>
                                                        {stats.type === 'numeric' ? <Activity className="w-5 h-5" /> : <LayoutGrid className="w-5 h-5" />}
                                                    </div>
                                                    <span className="text-[9px] font-black uppercase tracking-widest text-gray-400 px-3 py-1 bg-gray-100 rounded-full">{stats.type === 'numeric' ? t('numeric') : t('categorical')}</span>
                                                </div>
                                                <h3 className="font-bold text-base text-gray-900 mb-4 truncate">{col}</h3>
                                                <div className="space-y-2 text-[10px]">
                                                    {stats.type === 'numeric' ? (
                                                        <>
                                                            <div className="flex justify-between" title={t('meanHelp')}><span>{t('mean')}</span><span className="font-black">{stats.mean}</span></div>
                                                            <div className="flex justify-between" title={t('medianHelp')}><span>{t('median')}</span><span className="font-black">{stats.median}</span></div>
                                                            <div className="flex justify-between" title={t('stdDevHelp')}><span>{t('stdDev')}</span><span className="font-black">{stats.std}</span></div>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <div className="flex justify-between"><span>{t('unique')}</span><span className="font-black">{stats.unique}</span></div>
                                                            <div className="flex justify-between"><span>{t('topEntry')}</span><span className="font-black truncate max-w-[100px]">{stats.top}</span></div>
                                                            <div className="flex justify-between"><span>{t('frequency')}</span><span className="font-black">{stats.freq}</span></div>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                            <button onClick={() => { setUnivariateCol(col); setActiveTab("univariate"); }} className="absolute inset-x-0 bottom-0 py-3 bg-primary text-white text-[8px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all translate-y-full group-hover:translate-y-0">{t('viewDetails')}</button>
                                        </div>
                                    );
                                })}
                            </div>
                        </section>
                    </motion.div>
                )}

                {activeTab === "univariate" && (
                    <motion.div key="univariate" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="space-y-8">
                        <section className="p-5 rounded-xl bg-gray-50 border border-gray-200">
                            <h2 className="text-[10px] font-black uppercase tracking-wider text-gray-400 mb-4">Select Column</h2>
                            <div className="flex flex-wrap gap-2">
                                {columns.map(col => (
                                    <button key={col} onClick={() => setUnivariateCol(col)} className={cn("px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border flex items-center gap-2", univariateCol === col ? "bg-primary text-white border-primary" : "bg-gray-100 text-gray-500")}>
                                        {typeof dataset[0][col] === "number" ? <Hash className="w-3 h-3" /> : <Type className="w-3 h-3" />} {col}
                                    </button>
                                ))}
                            </div>
                        </section>

                        {univariateCol && edaStats[univariateCol] && (
                            <div className="space-y-6">
                                <h2 className="text-2xl font-black text-gray-900">{univariateCol}</h2>
                                {edaStats[univariateCol].type === 'numeric' ? (
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                        <div className="h-[350px] bg-white p-6 rounded-2xl border border-gray-200">
                                            <DataChart data={buildHistogramData(univariateCol)} layout={{}} type="bar" title={t('histogram')} isLoading={isStatsLoading} />
                                        </div>
                                        <div className="h-[350px] bg-white p-6 rounded-2xl border border-gray-200">
                                            {(() => { const bp = buildBoxplotData(univariateCol); return <DataChart data={bp.data} layout={{ xAxis: { data: bp.categories } }} type="boxplot" title={t('boxPlot')} isLoading={isStatsLoading} /> })()}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="h-[380px] bg-white p-6 rounded-2xl border border-gray-200">
                                        <DataChart data={buildCategoryData(univariateCol)} layout={{}} type="pie" title={t('breakdown')} isLoading={isStatsLoading} />
                                    </div>
                                )}
                            </div>
                        )}
                    </motion.div>
                )}

                {activeTab === "bivariate" && (
                    <motion.div key="bivariate" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="space-y-8">
                        <section className="p-8 rounded-2xl bg-white border border-gray-200 shadow-sm space-y-8">
                            <p className="text-sm text-gray-500 leading-relaxed">{t('bivariateGuide')}</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">{t('selectColumnA')}</label>
                                    <select value={biColA} onChange={(e) => setBiColA(e.target.value)} className="w-full p-4 rounded-xl bg-gray-50 border border-gray-200 font-bold text-sm outline-none focus:border-primary transition-all">
                                        {columns.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">{t('selectColumnB')}</label>
                                    <select value={biColB} onChange={(e) => setBiColB(e.target.value)} className="w-full p-4 rounded-xl bg-gray-50 border border-gray-200 font-bold text-sm outline-none focus:border-primary transition-all">
                                        {columns.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                            </div>
                            <button onClick={runBivariate} disabled={biLoading || biColA === biColB} className="w-full py-4 bg-primary text-white rounded-xl text-[11px] font-black uppercase tracking-widest shadow-lg flex items-center justify-center gap-3 disabled:opacity-50">
                                {biLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Activity className="w-4 h-4" />} {t('runBivariate')}
                            </button>
                        </section>
                        {biResult && (
                            <div className="p-8 bg-white border border-gray-200 rounded-2xl h-[500px]">
                                <DataChart data={biResult.chartConfig.series[0].data} layout={biResult.chartConfig} type={biResult.type === 'numeric-numeric' ? 'scatter' : 'bar'} title={`${biColA} vs ${biColB}`} isLoading={biLoading} />
                            </div>
                        )}
                    </motion.div>
                )}

                {activeTab === "correlation" && (
                    <motion.div key="correlation" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="space-y-8">
                        <div className="p-4 rounded-xl bg-blue-50 border border-blue-100 flex items-start gap-3">
                            <Info className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                            <p className="text-xs text-blue-700 leading-relaxed">{t('correlationHelp')}</p>
                        </div>
                        <div className="p-8 bg-white border border-gray-200 rounded-2xl overflow-auto">
                            {correlationMatrix ? (
                                <table className="w-full border-collapse">
                                    <thead>
                                        <tr>
                                            <th className="p-3"></th>
                                            {Object.keys(correlationMatrix).map(c => <th key={c} className="p-3 text-[10px] font-black uppercase rotate-45 h-20">{c}</th>)}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {Object.keys(correlationMatrix).map(r => (
                                            <tr key={r}>
                                                <td className="p-3 font-black text-[10px] uppercase text-gray-500 whitespace-nowrap">{r}</td>
                                                {Object.keys(correlationMatrix).map(c => {
                                                    const val = correlationMatrix[r][c];
                                                    return <td key={c} className="p-3 text-center text-[10px] font-black" style={{ backgroundColor: `rgba(59, 130, 246, ${Math.abs(val)})`, color: Math.abs(val) > 0.5 ? 'white' : 'black' }}>{val.toFixed(2)}</td>
                                                })}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : <p className="text-center text-gray-400">Computing correlation matrix...</p>}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
