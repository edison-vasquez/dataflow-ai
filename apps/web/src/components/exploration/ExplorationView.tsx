"use client";

import React, { useState, useRef, useMemo, useCallback } from "react";
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
    RefreshCcw,
    Trash2,
    X,
    AreaChart,
    Radar,
    Grid3X3,
    BoxSelect,
    TreePine,
    Filter,
    Gauge,
    Sun,
    Star,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/useAppStore";
import { DataChart } from "./DataChart";
import { SimulationPanel } from "./SimulationPanel";
import { InsightBubble } from "./InsightBubble";
import { motion, AnimatePresence } from "framer-motion";
import { calculateForecast } from "@/lib/analytics";
import { applySimulations } from "@/lib/dataProcessor";
import { exportToCSV } from "@/lib/exporters";
import {
    useT
} from "@/lib/i18n";
import { recommendCharts, ChartRecommendation } from "@/lib/chartRecommender";
import { detectColumnTypes } from "@/lib/dataProcessor";

// Map chart type to icon component
const chartTypeIcons: Record<string, React.ElementType> = {
    bar: BarChart3,
    line: LineChart,
    area: AreaChart,
    pie: PieChartIcon,
    scatter: ScatterChart,
    radar: Radar,
    heatmap: Grid3X3,
    boxplot: BoxSelect,
    treemap: TreePine,
    funnel: Filter,
    gauge: Gauge,
    sunburst: Sun,
};

// All supported chart types for the builder
const allChartTypes = [
    { id: 'bar', label: 'Bar' },
    { id: 'line', label: 'Line' },
    { id: 'area', label: 'Area' },
    { id: 'pie', label: 'Pie' },
    { id: 'scatter', label: 'Scatter' },
    { id: 'radar', label: 'Radar' },
    { id: 'heatmap', label: 'Heatmap' },
    { id: 'boxplot', label: 'Boxplot' },
    { id: 'treemap', label: 'Treemap' },
    { id: 'funnel', label: 'Funnel' },
    { id: 'gauge', label: 'Gauge' },
    { id: 'sunburst', label: 'Sunburst' },
];

/**
 * Build chart data from dataset for a given chart type and columns.
 * Returns { data, layout } ready for DataChart.
 */
function buildChartData(
    dataset: any[],
    chartType: string,
    xCol: string,
    yCol?: string | null,
    simulations: any[] = []
): { data: any; layout: any } {
    const layout: any = {};

    if (chartType === 'pie') {
        // Pie needs [{name, value}] pairs -- aggregate by x, sum y
        const counts: Record<string, number> = {};
        dataset.forEach(r => {
            const key = String(r[xCol]);
            counts[key] = (counts[key] || 0) + (yCol ? (Number(r[yCol]) || 0) : 1);
        });
        const data = Object.entries(counts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([name, value]) => ({ name, value }));
        return { data, layout };
    }

    if (chartType === 'treemap') {
        const counts: Record<string, number> = {};
        dataset.forEach(r => {
            const key = String(r[xCol]);
            counts[key] = (counts[key] || 0) + (yCol ? (Number(r[yCol]) || 0) : 1);
        });
        const data = Object.entries(counts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 20)
            .map(([name, value]) => ({ name, value }));
        return { data, layout };
    }

    if (chartType === 'funnel') {
        const counts: Record<string, number> = {};
        dataset.forEach(r => {
            const key = String(r[xCol]);
            counts[key] = (counts[key] || 0) + (yCol ? (Number(r[yCol]) || 0) : 1);
        });
        const data = Object.entries(counts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 8)
            .map(([name, value]) => ({ name, value }));
        return { data, layout };
    }

    if (chartType === 'gauge') {
        // Single metric gauge: compute mean of numeric column
        const values = dataset.map(r => Number(r[xCol])).filter(v => !isNaN(v));
        const mean = values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
        const max = values.length > 0 ? Math.max(...values) : 1;
        const normalized = max > 0 ? Math.round((mean / max) * 100) / 100 : 0;
        const data = [{ value: normalized, name: xCol }];
        return { data, layout };
    }

    if (chartType === 'radar') {
        // Multi-metric radar: use numeric columns from a single record or aggregate
        const numCols = Object.keys(dataset[0]).filter(c => typeof dataset[0][c] === 'number');
        const cols = numCols.slice(0, 8);
        const maxVals = cols.map(c => {
            const vals = dataset.map(r => Number(r[c]) || 0);
            return Math.max(...vals, 1);
        });
        const indicator = cols.map((c, i) => ({ name: c, max: maxVals[i] }));
        // Average values across all rows
        const avgValues = cols.map(c => {
            const vals = dataset.map(r => Number(r[c]) || 0);
            return Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 100) / 100;
        });
        const data = [{ value: avgValues, name: 'Average Profile' }];
        layout.radar = { indicator };
        return { data, layout };
    }

    if (chartType === 'heatmap') {
        // Correlation heatmap between numeric columns
        const numCols = Object.keys(dataset[0]).filter(c => typeof dataset[0][c] === 'number').slice(0, 8);
        const data = numCols.map((col1, _i) => ({
            data: numCols.map(col2 => {
                if (col1 === col2) return 1;
                const vals1 = dataset.map(r => Number(r[col1]) || 0);
                const vals2 = dataset.map(r => Number(r[col2]) || 0);
                const n = vals1.length;
                const mean1 = vals1.reduce((a, b) => a + b, 0) / n;
                const mean2 = vals2.reduce((a, b) => a + b, 0) / n;
                const cov = vals1.reduce((acc, v, i) => acc + (v - mean1) * (vals2[i] - mean2), 0) / n;
                const std1 = Math.sqrt(vals1.reduce((acc, v) => acc + (v - mean1) ** 2, 0) / n);
                const std2 = Math.sqrt(vals2.reduce((acc, v) => acc + (v - mean2) ** 2, 0) / n);
                return std1 > 0 && std2 > 0 ? Math.round((cov / (std1 * std2)) * 1000) / 1000 : 0;
            })
        }));
        layout.xAxis = { data: numCols };
        layout.yAxis = { data: numCols };
        return { data, layout };
    }

    if (chartType === 'boxplot') {
        // Box plot for a single numeric column
        const values = dataset.map(r => Number(r[xCol])).filter(v => !isNaN(v)).sort((a, b) => a - b);
        const n = values.length;
        const min = values[0] || 0;
        const max = values[n - 1] || 0;
        const q1 = values[Math.floor(n * 0.25)] || 0;
        const median = values[Math.floor(n * 0.5)] || 0;
        const q3 = values[Math.floor(n * 0.75)] || 0;
        const data = [[min, q1, median, q3, max]];
        layout.xAxis = { data: [xCol] };
        return { data, layout };
    }

    if (chartType === 'sunburst') {
        const counts: Record<string, number> = {};
        dataset.forEach(r => {
            const key = String(r[xCol]);
            counts[key] = (counts[key] || 0) + (yCol ? (Number(r[yCol]) || 0) : 1);
        });
        const data = Object.entries(counts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 12)
            .map(([name, value]) => ({ name, value }));
        return { data, layout };
    }

    if (chartType === 'sankey') {
        const catCols = Object.keys(dataset[0]).filter(c => typeof dataset[0][c] === 'string');
        const sourceCol = xCol;
        const targetCol = yCol || catCols[1] || catCols[0];

        const linksMap: Record<string, number> = {};
        const nodesSet = new Set<string>();

        dataset.slice(0, 100).forEach(r => {
            const source = String(r[sourceCol]);
            const target = String(r[targetCol]);
            if (source === target) return;
            const key = `${source} -> ${target}`;
            linksMap[key] = (linksMap[key] || 0) + 1;
            nodesSet.add(source);
            nodesSet.add(target);
        });

        const nodes = Array.from(nodesSet).map(name => ({ name }));
        const links = Object.entries(linksMap).map(([key, value]) => {
            const [source, target] = key.split(' -> ');
            return { source, target, value };
        });

        return { data: { nodes, links }, layout };
    }

    // bar / line / area / scatter -- default XY chart types
    if (chartType === 'scatter') {
        const data = [{
            x: dataset.map(r => r[xCol]),
            y: yCol ? dataset.map(r => r[yCol]) : dataset.map(r => r[xCol]),
        }];
        return { data, layout };
    }

    // bar / line / area
    const series = [{
        name: 'Actual',
        x: dataset.map(r => r[xCol]),
        y: yCol ? dataset.map(r => r[yCol]) : dataset.map(r => r[xCol]),
    }];

    // Apply simulations if any match targetColumn
    simulations.filter(s => s.isActive && (s.targetColumn === yCol || s.targetColumn === xCol)).forEach(sim => {
        const isTargetY = sim.targetColumn === yCol;
        series.push({
            name: `Projected (${Math.round((sim.adjustment - 1) * 100)}%)`,
            x: dataset.map(r => r[xCol]),
            y: dataset.map(r => {
                const val = Number(r[sim.targetColumn]) || 0;
                return val * sim.adjustment;
            }),
            // @ts-ignore
            lineStyle: { type: 'dashed', opacity: 0.5 }
        });
    });

    return { data: series, layout };
}

/**
 * Apply forecast projection to a series.
 */
function applyForecast(series: any[], xData: any[]) {
    return series.map(s => {
        if (s.name !== 'Actual') return s;
        const yVals = s.y as number[];
        const forecast = calculateForecast(yVals);

        // Extended X labels
        const lastX = xData[xData.length - 1];
        const nextX = new Array(forecast.length).fill(0).map((_, i) => `${lastX} (+${i + 1})`);

        return [
            s,
            {
                name: 'Forecast',
                x: nextX,
                y: forecast,
                type: s.type || 'line',
                lineStyle: { type: 'dotted', width: 2 },
                areaStyle: { opacity: 0.05, color: '#6366f1' },
                itemStyle: { color: '#6366f1' }
            }
        ];
    }).flat();
}

export function ExplorationView() {
    const { dataset, datasetName, charts, addChart, persistChart, setPhase, removeChart, simulations, updateChart } = useAppStore();
    const t = useT();
    const [isGenerating, setIsGenerating] = useState(false);
    const [isBuilderOpen, setIsBuilderOpen] = useState(false);
    const [isSimulationOpen, setIsSimulationOpen] = useState(false);
    const [clickedPoint, setClickedPoint] = useState<any | null>(null);
    const [builderChartType, setBuilderChartType] = useState<string>('bar');
    const [builderX, setBuilderX] = useState<string | null>(null);
    const [builderY, setBuilderY] = useState<string | null>(null);
    const { globalFilters, setGlobalFilter } = useAppStore();
    const hasAutoGenerated = useRef(false);

    const handleExportProjected = useCallback(() => {
        if (!dataset) return;
        const projected = applySimulations(dataset, simulations);
        exportToCSV(projected, `${datasetName || 'data'}_simulated_projection.csv`);
    }, [dataset, simulations, datasetName]);

    // Store ECharts instances keyed by chart id for PNG export
    const chartInstancesRef = useRef<Map<string, any>>(new Map());

    // Smart chart recommendations
    const recommendations = useMemo(() => {
        if (!dataset || dataset.length === 0) return [];
        const columnTypes = detectColumnTypes(dataset);
        return recommendCharts(dataset, columnTypes);
    }, [dataset]);

    const handleChartReady = useCallback((chartId: string, instance: any) => {
        chartInstancesRef.current.set(chartId, instance);
    }, []);

    const handleDownloadPng = useCallback((chartId: string, chartTitle: string) => {
        const instance = chartInstancesRef.current.get(chartId);
        if (!instance) return;
        try {
            const url = instance.getDataURL({
                type: 'png',
                pixelRatio: 2,
                backgroundColor: '#ffffff',
            });
            const link = document.createElement('a');
            link.download = `${chartTitle.replace(/[^a-zA-Z0-9]/g, '_')}.png`;
            link.href = url;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (err) {
            console.error('Failed to export chart as PNG:', err);
        }
    }, []);

    const filteredDataset = useMemo(() => {
        if (!dataset || Object.keys(globalFilters).length === 0) return dataset || [];
        return dataset.filter(row => {
            return Object.entries(globalFilters).every(([col, val]) => String(row[col]) === String(val));
        });
    }, [dataset, globalFilters]);

    const handleRecommendationClick = useCallback((rec: ChartRecommendation) => {
        if (!dataset || dataset.length === 0) return;
        const { data, layout } = buildChartData(filteredDataset, rec.type, rec.xColumn, rec.yColumn, simulations);
        const newChart = {
            id: Math.random().toString(),
            title: rec.title,
            type: rec.type,
            data,
            layout,
            // Store meta for re-calculating on simulation change
            xColumn: rec.xColumn,
            yColumn: rec.yColumn
        };
        addChart(newChart);
        persistChart(newChart);
    }, [dataset, addChart, persistChart, simulations]);

    const generateAutoDashboard = async (isAuto = false) => {
        if (!dataset || dataset.length === 0) return;
        setIsGenerating(true);

        // Clear existing charts before generating new ones (only when manually triggered)
        if (!isAuto) {
            charts.forEach(c => removeChart(c.id));
        }

        await new Promise(r => setTimeout(r, 1500));

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
                        line: { color: 'rgba(0, 0, 0, 0.1)', width: 0.5 }
                    }
                }],
                layout: {
                    title: { text: `Correlation: ${numCols[0]} vs ${numCols[1]}`, font: { color: '#1f2937', size: 14, family: 'Inter, sans-serif' } },
                    paper_bgcolor: 'rgba(0,0,0,0)',
                    plot_bgcolor: 'rgba(0,0,0,0)',
                    xaxis: { gridcolor: 'rgba(0,0,0,0.06)', tickfont: { color: 'rgba(0,0,0,0.5)' } },
                    yaxis: { gridcolor: 'rgba(0,0,0,0.06)', tickfont: { color: 'rgba(0,0,0,0.5)' } }
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
                    title: { text: `Distribution: ${field} by ${valField}`, font: { color: '#1f2937', size: 14, family: 'Inter, sans-serif' } },
                    paper_bgcolor: 'rgba(0,0,0,0)',
                    plot_bgcolor: 'rgba(0,0,0,0)',
                    xaxis: { gridcolor: 'rgba(0,0,0,0.06)', tickfont: { color: 'rgba(0,0,0,0.5)' } },
                    yaxis: { gridcolor: 'rgba(0,0,0,0.06)', tickfont: { color: 'rgba(0,0,0,0.5)' } }
                }
            };
            addChart(barChart);
            persistChart(barChart);
        }

        setIsGenerating(false);
    };

    // Auto-generate once on mount if no charts exist
    React.useEffect(() => {
        if (dataset && charts.length === 0 && !hasAutoGenerated.current) {
            hasAutoGenerated.current = true;
            generateAutoDashboard(true);
        }
    }, [dataset]);

    if (!dataset) {
        return (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-12 fade-in py-20">
                <div className="w-20 h-20 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center relative overflow-hidden group shadow-2xl">
                    <LayoutDashboard className="w-12 h-12 text-gray-300 group-hover:text-gray-500 transition-all duration-700 group-hover:scale-110" />
                    <div className="absolute inset-0 bg-gradient-to-t from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-gray-300 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                </div>
                <div className="space-y-6">
                    <div className="flex flex-col items-center gap-2">
                        <span className="text-[10px] font-black uppercase tracking-wide text-gray-400">{t('charts')}</span>
                        <h2 className="text-2xl font-black tracking-tighter text-gray-900">{t('noDataAvailable')}</h2>
                    </div>
                    <p className="text-gray-500 font-medium max-w-md mx-auto leading-relaxed">
                        {t('noDataExplorationDesc')}
                    </p>
                </div>
                <button
                    onClick={() => setPhase('preparation')}
                    className="group px-8 py-3 bg-primary text-white rounded-2xl text-[11px] font-black uppercase tracking-wider hover:scale-[1.05] transition-all shadow-lg active:scale-95 flex items-center gap-3"
                >
                    {t('goToPreparation')}
                    <Zap className="w-4 h-4 fill-white group-hover:scale-125 transition-transform" />
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-8 py-6 fade-in pb-16">
            {/* Enterprise Header */}
            <div className="flex flex-col gap-6">
                <div className="flex items-center gap-4">
                    <div className="px-4 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center gap-2.5">
                        <TrendingUp className="w-3.5 h-3.5 text-blue-500" />
                        <span className="text-[10px] font-black uppercase tracking-wider text-blue-500">{t('analysisActive')}</span>
                    </div>
                    <div className="h-px w-12 bg-gray-200" />
                    <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">{t('visualization')}</span>
                </div>

                <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
                    <div className="space-y-4">
                        <motion.h1
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="text-4xl font-black tracking-tighter text-gray-900"
                        >
                            {t('chartsExploration')}
                        </motion.h1>
                        <p className="text-gray-500 font-medium max-w-xl text-lg leading-relaxed">
                            {t('createExploreCharts', { name: datasetName || '' })}
                        </p>
                    </div>

                    <div className="flex items-center gap-6">
                        {Object.keys(globalFilters).length > 0 && (
                            <button
                                onClick={() => setGlobalFilter(null, null)}
                                className="bg-red-500/10 text-red-500 border border-red-500/20 px-6 py-3 rounded-xl text-[11px] font-black uppercase tracking-wider flex items-center gap-4 hover:bg-red-500 hover:text-white active:scale-95 transition-all"
                            >
                                <X className="w-4 h-4" />
                                {t('clearFilters')} ({Object.keys(globalFilters).length})
                            </button>
                        )}
                        <button
                            onClick={() => setIsBuilderOpen(true)}
                            className="bg-gray-100 border border-gray-200 text-gray-700 px-6 py-3 rounded-xl text-[11px] font-black uppercase tracking-wider flex items-center gap-4 hover:bg-gray-200 active:scale-95 transition-all"
                        >
                            <Settings2 className="w-4 h-4" />
                            {t('customChart')}
                        </button>
                        <button
                            onClick={() => setIsSimulationOpen(true)}
                            className="bg-gray-900 text-white px-6 py-3 rounded-xl text-[11px] font-black uppercase tracking-wider flex items-center gap-4 hover:brightness-125 active:scale-95 transition-all shadow-xl"
                        >
                            <Zap className="w-4 h-4 fill-primary text-primary" />
                            {t('whatIfLab')}
                        </button>
                        <button
                            onClick={handleExportProjected}
                            disabled={simulations.filter(s => s.isActive).length === 0}
                            className="bg-emerald-500 text-white px-6 py-3 rounded-xl text-[11px] font-black uppercase tracking-wider flex items-center gap-4 hover:bg-emerald-600 active:scale-95 transition-all disabled:opacity-30"
                        >
                            <Download className="w-4 h-4" />
                            {t('exportProjections')}
                        </button>
                        <button
                            onClick={() => generateAutoDashboard()}
                            disabled={isGenerating}
                            className="bg-primary text-white px-6 py-3 rounded-xl text-[11px] font-black uppercase tracking-wider flex items-center gap-4 shadow-2xl hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                        >
                            {isGenerating ? <RefreshCcw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 fill-white" />}
                            {isGenerating ? t('generating') : t('autoGenerate')}
                        </button>
                    </div>
                </div>
            </div>

            {/* Manual Builder Sidebar */}
            <AnimatePresence>
                {isBuilderOpen && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-end p-6 bg-black/30 backdrop-blur-sm">
                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            className="w-full max-w-xl h-full bg-white border-l border-gray-200 p-8 overflow-y-auto space-y-6 shadow-3xl"
                        >
                            <div className="flex items-center justify-between">
                                <div className="space-y-2">
                                    <span className="text-[10px] font-black uppercase tracking-wide text-primary">{t('chartBuilder')}</span>
                                    <h2 className="text-2xl font-black text-gray-900 tracking-tighter">{t('newChart')}</h2>
                                </div>
                                <button
                                    onClick={() => setIsBuilderOpen(false)}
                                    className="p-3 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors border border-gray-200"
                                >
                                    <X className="w-6 h-6 text-gray-500" />
                                </button>
                            </div>

                            <div className="space-y-5">
                                <div className="space-y-6">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">{t('chartType')}</label>
                                    <div className="grid grid-cols-4 gap-3">
                                        {allChartTypes.map(chartTypeOption => {
                                            const Icon = chartTypeIcons[chartTypeOption.id] || BarChart3;
                                            return (
                                                <button
                                                    key={chartTypeOption.id}
                                                    onClick={() => setBuilderChartType(chartTypeOption.id)}
                                                    className={cn(
                                                        "p-3 rounded-xl border transition-all flex flex-col items-center gap-2",
                                                        builderChartType === chartTypeOption.id ? "bg-primary text-white border-primary shadow-xl scale-105" : "bg-gray-100 border-gray-200 text-gray-500 hover:border-gray-300"
                                                    )}
                                                >
                                                    <Icon className="w-5 h-5" />
                                                    <span className="text-[8px] font-black uppercase tracking-widest leading-none">{chartTypeOption.label}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">{t('xAxis')}</label>
                                    <div className="flex flex-wrap gap-2">
                                        {Object.keys(dataset[0]).map(col => (
                                            <button
                                                key={col}
                                                onClick={() => setBuilderX(col)}
                                                className={cn(
                                                    "px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                                                    builderX === col ? "bg-primary text-white shadow-lg" : "bg-gray-100 text-gray-500"
                                                )}
                                            >
                                                {col}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">{t('yAxis')}</label>
                                    <div className="flex flex-wrap gap-2">
                                        {Object.keys(dataset[0]).filter(c => typeof dataset[0][c] === 'number').map(col => (
                                            <button
                                                key={col}
                                                onClick={() => setBuilderY(col)}
                                                className={cn(
                                                    "px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                                                    builderY === col ? "bg-emerald-500 text-white shadow-lg" : "bg-gray-100 text-gray-500"
                                                )}
                                            >
                                                {col}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={() => {
                                    if (!builderX || !builderY) return;

                                    const { data, layout } = buildChartData(filteredDataset, builderChartType, builderX, builderY);

                                    const newChart = {
                                        id: Math.random().toString(),
                                        title: `${builderX} vs ${builderY}`,
                                        type: builderChartType,
                                        data,
                                        layout,
                                        xColumn: builderX,
                                        yColumn: builderY
                                    };
                                    addChart(newChart);
                                    persistChart(newChart);
                                    setIsBuilderOpen(false);
                                }}
                                disabled={!builderX || !builderY}
                                className="w-full py-3.5 bg-primary text-white rounded-xl text-[11px] font-black uppercase tracking-wider hover:scale-[1.03] transition-all flex items-center justify-center gap-4 disabled:opacity-20 shadow-2xl"
                            >
                                <Zap className="w-5 h-5 fill-current" />
                                {t('createChart')}
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Content Display */}
            <div className="space-y-10">
                {/* Global Insight Overlay */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-6 rounded-2xl bg-primary/5 border border-primary/10 relative overflow-hidden group shadow-lg"
                >
                    <div className="absolute top-0 right-0 p-12 opacity-[0.05] transform group-hover:scale-125 transition-transform duration-1000 grayscale">
                        <Waves className="w-48 h-48 text-gray-900" />
                    </div>

                    <div className="flex flex-col md:flex-row items-center gap-6 relative z-10">
                        <div className="w-14 h-14 rounded-2xl bg-primary text-white flex items-center justify-center shadow-2xl shrink-0 group-hover:rotate-6 transition-transform">
                            <Lightbulb className="w-7 h-7 fill-current" />
                        </div>
                        <div className="space-y-3 flex-1">
                            <div className="flex items-center gap-3">
                                <span className="text-[10px] font-black uppercase tracking-wide text-primary">{t('keyInsight')}</span>
                                <div className="h-px flex-1 bg-gray-200" />
                            </div>
                            <h3 className="text-xl font-black text-gray-900 tracking-tight">{t('patternDetected')}</h3>
                            <p className="text-gray-600 font-medium leading-relaxed max-w-2xl text-base">
                                {t('patternDesc')}
                            </p>
                        </div>
                        <button className="px-10 py-4 rounded-2xl bg-gray-100 border border-gray-200 hover:bg-gray-200 text-gray-700 text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-2 group/btn">
                            {t('learnMore')}
                            <ArrowUpRight className="w-4 h-4 opacity-0 group-hover/btn:opacity-100 group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-all" />
                        </button>
                    </div>
                </motion.div>

                {/* Smart Chart Recommendations */}
                {recommendations.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="space-y-5"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                                <Star className="w-4 h-4 text-amber-500" />
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-gray-900 tracking-tight">{t('recommendedCharts')}</h3>
                                <p className="text-[10px] font-black uppercase tracking-wider text-gray-400">{t('aiPoweredSuggestions')}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                            {recommendations.slice(0, 4).map((rec, idx) => {
                                const Icon = chartTypeIcons[rec.type] || BarChart3;
                                return (
                                    <motion.button
                                        key={`rec-${idx}`}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.15 + idx * 0.05 }}
                                        onClick={() => handleRecommendationClick(rec)}
                                        className="p-5 rounded-2xl bg-white border border-gray-200 hover:border-primary/40 hover:shadow-lg transition-all text-left group/rec relative overflow-hidden"
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover/rec:opacity-100 transition-opacity" />
                                        <div className="relative z-10 space-y-3">
                                            <div className="flex items-center justify-between">
                                                <div className="w-10 h-10 rounded-xl bg-gray-100 group-hover/rec:bg-primary/10 flex items-center justify-center transition-colors">
                                                    <Icon className="w-5 h-5 text-gray-500 group-hover/rec:text-primary transition-colors" />
                                                </div>
                                                <span className={cn(
                                                    "px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest",
                                                    rec.score >= 0.85
                                                        ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                                                        : rec.score >= 0.65
                                                            ? "bg-blue-500/10 text-blue-600 border border-blue-500/20"
                                                            : "bg-gray-100 text-gray-500 border border-gray-200"
                                                )}>
                                                    {Math.round(rec.score * 100)}%
                                                </span>
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-bold text-gray-900 group-hover/rec:text-primary transition-colors leading-snug">{rec.title}</h4>
                                                <p className="text-[11px] text-gray-400 mt-1 line-clamp-2 leading-relaxed">{rec.reason}</p>
                                            </div>
                                            <div className="flex items-center gap-2 pt-1">
                                                <Plus className="w-3 h-3 text-gray-400 group-hover/rec:text-primary transition-colors" />
                                                <span className="text-[9px] font-black uppercase tracking-widest text-gray-400 group-hover/rec:text-primary transition-colors">{t('clickToCreate')}</span>
                                            </div>
                                        </div>
                                    </motion.button>
                                );
                            })}
                        </div>
                    </motion.div>
                )}

                {charts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-6">
                        <div className="w-20 h-20 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center relative shadow-inner">
                            <div className="absolute inset-0 rounded-full border border-dashed border-gray-300 animate-[spin_10s_linear_infinite]" />
                            <Cpu className="w-10 h-10 text-gray-400" />
                        </div>
                        <div className="space-y-4 text-center">
                            <h3 className="text-lg font-black text-gray-900 px-2">{t('noChartsYet')}</h3>
                            <p className="text-gray-400 text-sm font-medium max-w-sm mx-auto">
                                {t('noChartsDesc')}
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                        <AnimatePresence>
                            {charts.map((chart, idx) => {
                                const ChartIcon = chartTypeIcons[chart.type] || BarChart3;
                                return (
                                    <motion.div
                                        key={chart.id}
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: idx * 0.1 }}
                                        className="p-6 rounded-2xl bg-white shadow-sm border border-gray-200 hover:border-gray-300 transition-all flex flex-col group h-[380px]"
                                    >
                                        <div className="flex items-center justify-between mb-8">
                                            <div className="flex items-center gap-5">
                                                <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-500 group-hover:text-primary transition-colors">
                                                    <ChartIcon className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-3">
                                                        <h3 className="font-bold text-lg text-gray-900 group-hover:translate-x-1 transition-transform">{chart.title}</h3>
                                                        {simulations.some(s => s.isActive && (s.targetColumn === chart.yColumn || s.targetColumn === chart.xColumn)) && (
                                                            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                                                                <Zap className="w-2.5 h-2.5 text-emerald-500 fill-current" />
                                                                <span className="text-[8px] font-black text-emerald-600 uppercase tracking-widest">Sim</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <p className="text-[10px] font-black uppercase tracking-wide text-gray-400">{t('livePreview')}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-all">
                                                <button
                                                    onClick={() => handleDownloadPng(chart.id, chart.title || 'chart')}
                                                    className="p-3 bg-gray-100 hover:bg-primary text-gray-500 hover:text-white rounded-xl transition-all shadow-lg"
                                                    title={t('downloadAsPng')}
                                                >
                                                    <Download className="w-4 h-4" />
                                                </button>
                                                {(chart.type === 'line' || chart.type === 'area' || chart.type === 'bar') && (
                                                    <button
                                                        onClick={() => updateChart(chart.id, { isForecastActive: !chart.isForecastActive })}
                                                        className={cn(
                                                            "p-3 rounded-xl transition-all shadow-lg",
                                                            chart.isForecastActive ? "bg-primary text-white" : "bg-gray-100 text-gray-500 hover:bg-primary/10 hover:text-primary"
                                                        )}
                                                        title={t('magicForecast')}
                                                    >
                                                        <Sparkles className="w-4 h-4 fill-current" />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => {
                                                        chartInstancesRef.current.delete(chart.id);
                                                        removeChart(chart.id);
                                                    }}
                                                    className="p-3 bg-gray-100 hover:bg-red-500 text-gray-500 hover:text-white rounded-xl transition-all shadow-lg"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                        <div className="flex-1 min-h-0 relative">
                                            <DataChart
                                                data={(() => {
                                                    // If chart has column meta, we can re-inject simulations
                                                    if (chart.xColumn && (chart.type === 'bar' || chart.type === 'line' || chart.type === 'area')) {
                                                        const { data } = buildChartData(filteredDataset, chart.type, chart.xColumn, chart.yColumn, simulations);

                                                        let finalData = data;
                                                        if (chart.isForecastActive) {
                                                            finalData = applyForecast(data, filteredDataset.map(r => r[chart.xColumn]));
                                                        }
                                                        return finalData;
                                                    }
                                                    return chart.data;
                                                })()}
                                                layout={chart.layout}
                                                type={chart.type}
                                                title={chart.title}
                                                onChartReady={(instance) => handleChartReady(chart.id, instance)}
                                                onPointClick={(params) => {
                                                    setClickedPoint(params);
                                                    if (params.data && chart.xColumn) {
                                                        // params.name is often the xAxis category name in ECharts
                                                        setGlobalFilter(chart.xColumn, params.name);
                                                    }
                                                }}
                                            />
                                            <AnimatePresence>
                                                {clickedPoint && clickedPoint.seriesName === 'Actual' && (
                                                    <InsightBubble
                                                        pointInfo={clickedPoint}
                                                        onClose={() => setClickedPoint(null)}
                                                    />
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>

                        <button
                            onClick={() => setIsBuilderOpen(true)}
                            className="p-10 rounded-2xl border-2 border-dashed border-gray-300 hover:border-primary hover:bg-primary/5 transition-all flex flex-col items-center justify-center gap-6 group h-[380px] relative overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-gradient-to-t from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className="w-14 h-14 rounded-full border-2 border-gray-300 flex items-center justify-center text-gray-300 group-hover:text-primary group-hover:scale-110 transition-all shadow-xl">
                                <Plus className="w-6 h-6" />
                            </div>
                            <div className="space-y-2 text-center relative z-10">
                                <span className="text-[11px] font-black uppercase tracking-wider text-gray-300 group-hover:text-gray-600 transition-colors">{t('addChart')}</span>
                                <h4 className="text-base font-black text-gray-400 group-hover:text-gray-900 transition-colors">{t('addNewChart')}</h4>
                            </div>
                        </button>
                    </div>
                )}
            </div>

            <SimulationPanel
                isOpen={isSimulationOpen}
                onClose={() => setIsSimulationOpen(false)}
            />
        </div>
    );
}
