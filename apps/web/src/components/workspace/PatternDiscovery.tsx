"use client";

import React, { useState, useMemo } from "react";
import {
    Sparkles,
    ArrowRight,
    ArrowLeft,
    Layers,
    CheckCircle2,
    Loader2,
    PenLine,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAppStore } from "@/store/useAppStore";
import { useT } from "@/lib/i18n";
import { kMeansClustering, suggestK, type KMeansResult } from "@/lib/analytics";
import { cn } from "@/lib/utils";
import { AnimatedChart } from "@/components/ui/AnimatedChart";

const CLUSTER_COLORS = [
    "#3b82f6",
    "#ef4444",
    "#10b981",
    "#f59e0b",
    "#8b5cf6",
    "#ec4899",
    "#06b6d4",
    "#f97316",
];

export function PatternDiscovery() {
    const t = useT();
    const { dataset, datasetName, setDataset, addChart, setPhase, persistChart } =
        useAppStore();

    const [step, setStep] = useState<1 | 2 | 3>(1);
    const [selectedCols, setSelectedCols] = useState<string[]>([]);
    const [k, setK] = useState<number>(3);
    const [isRunning, setIsRunning] = useState(false);
    const [result, setResult] = useState<KMeansResult | null>(null);
    const [clusterNames, setClusterNames] = useState<string[]>([]);

    const numericColumns = useMemo(() => {
        if (!dataset || dataset.length === 0) return [];
        return Object.keys(dataset[0]).filter(
            (col) => typeof dataset[0][col] === "number"
        );
    }, [dataset]);

    const recommendedK = useMemo(() => {
        if (!dataset) return 3;
        return suggestK(dataset.length);
    }, [dataset]);

    if (!dataset) return null;

    const toggleColumn = (col: string) => {
        setSelectedCols((prev) =>
            prev.includes(col) ? prev.filter((c) => c !== col) : [...prev, col]
        );
    };

    const handleRun = () => {
        if (!dataset || selectedCols.length < 2) return;
        setIsRunning(true);
        setTimeout(() => {
            const res = kMeansClustering(dataset, selectedCols, k);
            setResult(res);
            setClusterNames(
                Array.from({ length: k }, (_, i) => `Group ${i + 1}`)
            );
            setStep(3);
            setIsRunning(false);
        }, 0);
    };

    const handleApply = () => {
        if (!result || !dataset) return;
        const enriched = dataset.map((row, i) => ({
            ...row,
            segment_tag: clusterNames[result.labels[i]] ?? `Group ${result.labels[i] + 1}`,
        }));
        setDataset(enriched, datasetName);

        const colX = selectedCols[0];
        const colY = selectedCols.length >= 2 ? selectedCols[1] : selectedCols[0];

        const series = Array.from({ length: k }, (_, ci) => {
            const indices = result.labels
                .map((l, idx) => (l === ci ? idx : -1))
                .filter((idx) => idx !== -1);
            return {
                name: clusterNames[ci],
                type: "scatter" as const,
                data: indices.map((idx) => [
                    Number(dataset[idx][colX]) || 0,
                    Number(dataset[idx][colY]) || 0,
                ]),
                itemStyle: { color: CLUSTER_COLORS[ci % CLUSTER_COLORS.length], opacity: 0.8 },
                symbolSize: 10,
            };
        });

        const chart = {
            id: Math.random().toString(),
            title: t("segTitle") || "Segmentation Analysis",
            type: "scatter",
            data: series,
            layout: {
                title: { text: `Segmentation (${colX} vs ${colY})` },
            },
            xColumn: colX,
            yColumn: colY,
        };

        addChart(chart);
        persistChart(chart);
        setPhase("exploration");
    };

    const updateClusterName = (index: number, name: string) => {
        setClusterNames((prev) => {
            const next = [...prev];
            next[index] = name;
            return next;
        });
    };

    // ---- Scatter chart option for Step 3 ----
    const chartOption = useMemo(() => {
        if (!result || !dataset) return null;
        const colX = selectedCols[0];
        const colY = selectedCols.length >= 2 ? selectedCols[1] : selectedCols[0];

        const series = Array.from({ length: k }, (_, ci) => {
            const indices = result.labels
                .map((l, idx) => (l === ci ? idx : -1))
                .filter((idx) => idx !== -1);
            return {
                name: clusterNames[ci],
                type: "scatter" as const,
                data: indices.map((idx) => [
                    Number(dataset[idx][colX]) || 0,
                    Number(dataset[idx][colY]) || 0,
                ]),
                itemStyle: {
                    color: CLUSTER_COLORS[ci % CLUSTER_COLORS.length],
                    opacity: 0.8,
                },
                symbolSize: 8,
            };
        });

        return {
            legend: { top: 4, textStyle: { fontSize: 11 } },
            xAxis: { name: colX, nameLocation: "center" as const, nameGap: 28 },
            yAxis: { name: colY, nameLocation: "center" as const, nameGap: 42 },
            series,
        };
    }, [result, dataset, selectedCols, k, clusterNames]);

    // ---- Step indicator ----
    const renderStepIndicator = () => (
        <div className="flex items-center justify-center gap-0 mb-6">
            {[1, 2, 3].map((s, i) => (
                <React.Fragment key={s}>
                    {i > 0 && (
                        <div
                            className={cn(
                                "h-0.5 w-10",
                                step > s - 1 ? "bg-emerald-500" : "bg-gray-200"
                            )}
                        />
                    )}
                    <div
                        className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors",
                            step === s && "bg-primary text-white",
                            step > s && "bg-emerald-500 text-white",
                            step < s && "bg-gray-100 text-gray-400"
                        )}
                    >
                        {step > s ? <CheckCircle2 className="w-4 h-4" /> : s}
                    </div>
                </React.Fragment>
            ))}
        </div>
    );

    // ---- Step 1 ----
    const renderStep1 = () => (
        <motion.div
            key="step1"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
        >
            <h3 className="text-lg font-semibold mb-1">{t("segStep1Title")}</h3>
            <p className="text-sm text-gray-500 mb-4">{t("segStep1Desc")}</p>

            {/* Info banner */}
            <div className="p-3 rounded-lg bg-blue-50 text-blue-700 text-sm mb-4">
                {t("segmentationHelp")}
            </div>

            {/* Column pills */}
            <div className="flex flex-wrap gap-2 mb-4">
                {numericColumns.map((col) => (
                    <button
                        key={col}
                        onClick={() => toggleColumn(col)}
                        className={cn(
                            "px-3 py-1.5 rounded-full text-sm font-medium border transition-colors",
                            selectedCols.includes(col)
                                ? "bg-primary text-white border-primary"
                                : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
                        )}
                    >
                        {col}
                    </button>
                ))}
            </div>

            {selectedCols.length < 2 && (
                <p className="text-xs text-amber-600 mb-4">{t("segMinColumns")}</p>
            )}

            <div className="flex justify-end">
                <button
                    disabled={selectedCols.length < 2}
                    onClick={() => setStep(2)}
                    className={cn(
                        "px-5 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors",
                        selectedCols.length >= 2
                            ? "bg-primary text-white hover:bg-primary/90"
                            : "bg-gray-100 text-gray-400 cursor-not-allowed"
                    )}
                >
                    {t("nextStep")}
                    <ArrowRight className="w-4 h-4" />
                </button>
            </div>
        </motion.div>
    );

    // ---- Step 2 ----
    const renderStep2 = () => (
        <motion.div
            key="step2"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
        >
            <h3 className="text-lg font-semibold mb-1">{t("segStep2Title")}</h3>
            <p className="text-sm text-gray-500 mb-4">{t("segStep2Desc")}</p>

            {/* K selector */}
            <div className="flex flex-wrap gap-2 mb-6">
                {[2, 3, 4, 5, 6, 7, 8].map((n) => (
                    <button
                        key={n}
                        onClick={() => setK(n)}
                        className={cn(
                            "relative px-4 py-2 rounded-lg text-sm font-semibold border transition-colors",
                            k === n
                                ? "bg-primary text-white border-primary"
                                : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
                        )}
                    >
                        {n}
                        {n === recommendedK && (
                            <span className="absolute -top-2 -right-2 px-1.5 py-0.5 rounded-full bg-emerald-500 text-white text-[9px] font-bold leading-none whitespace-nowrap">
                                {t("segRecommended")}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {isRunning ? (
                <div className="flex items-center gap-3 text-sm text-gray-500">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {t("segRunning")}
                </div>
            ) : (
                <div className="flex justify-between">
                    <button
                        onClick={() => setStep(1)}
                        className="px-5 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        {t("segBack")}
                    </button>
                    <button
                        onClick={handleRun}
                        className="px-5 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 bg-primary text-white hover:bg-primary/90 transition-colors"
                    >
                        <Sparkles className="w-4 h-4" />
                        {t("segStep2Title")}
                        <ArrowRight className="w-4 h-4" />
                    </button>
                </div>
            )}
        </motion.div>
    );

    // ---- Step 3 ----
    const renderStep3 = () => {
        if (!result) return null;
        const totalRows = dataset.length;

        return (
            <motion.div
                key="step3"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
            >
                <h3 className="text-lg font-semibold mb-1">{t("segStep3Title")}</h3>
                <p className="text-sm text-gray-500 mb-4">{t("segStep3Desc")}</p>

                {/* Scatter chart */}
                {chartOption && (
                    <div className="h-[280px] mb-4 rounded-lg border border-gray-100 overflow-hidden">
                        <AnimatedChart option={chartOption} />
                    </div>
                )}

                {/* Cluster cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                    {result.clusterStats.map((stat, ci) => {
                        const pct =
                            totalRows > 0
                                ? Math.round((stat.size / totalRows) * 100)
                                : 0;
                        const centroidEntries = Object.entries(stat.centroid).slice(0, 3);

                        return (
                            <div
                                key={ci}
                                className="p-3 rounded-xl border border-gray-200 bg-gray-50/50"
                            >
                                <div className="flex items-center gap-2 mb-2">
                                    <div
                                        className="w-3 h-3 rounded-full flex-shrink-0"
                                        style={{
                                            backgroundColor:
                                                CLUSTER_COLORS[ci % CLUSTER_COLORS.length],
                                        }}
                                    />
                                    <div className="flex items-center gap-1 flex-1 min-w-0">
                                        <input
                                            type="text"
                                            value={clusterNames[ci] ?? ""}
                                            onChange={(e) =>
                                                updateClusterName(ci, e.target.value)
                                            }
                                            className="text-sm font-semibold bg-transparent border-none outline-none w-full focus:ring-1 focus:ring-primary/30 rounded px-1"
                                        />
                                        <PenLine className="w-3 h-3 text-gray-400 flex-shrink-0" />
                                    </div>
                                </div>
                                <p className="text-xs text-gray-500 mb-1.5">
                                    {t("segRecords")
                                        .replace("{count}", String(stat.size))
                                        .replace("{pct}", String(pct))}
                                </p>
                                <div className="space-y-0.5">
                                    {centroidEntries.map(([col, val]) => (
                                        <div
                                            key={col}
                                            className="flex justify-between text-xs text-gray-500"
                                        >
                                            <span className="truncate mr-2">{col}</span>
                                            <span className="font-mono">
                                                {(Math.round(val * 100) / 100).toFixed(2)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Buttons */}
                <div className="flex justify-between">
                    <button
                        onClick={() => setStep(2)}
                        className="px-5 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        {t("segBack")}
                    </button>
                    <button
                        onClick={handleApply}
                        className="px-5 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 bg-primary text-white hover:bg-primary/90 transition-colors"
                    >
                        <Layers className="w-4 h-4" />
                        {t("segApply")}
                    </button>
                </div>
            </motion.div>
        );
    };

    return (
        <div className="p-6 rounded-2xl bg-white border border-gray-200 shadow-sm">
            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-primary" />
                </div>
                <div>
                    <h2 className="text-base font-bold">{t("segTitle")}</h2>
                    <p className="text-xs text-gray-500">{t("segDesc")}</p>
                </div>
            </div>

            {renderStepIndicator()}

            <AnimatePresence mode="wait">
                {step === 1 && renderStep1()}
                {step === 2 && renderStep2()}
                {step === 3 && renderStep3()}
            </AnimatePresence>
        </div>
    );
}
