"use client";

import React from "react";
import {
    Sparkles,
    Layers,
    ArrowRight,
    BrainCircuit,
    Zap,
    Target
} from "lucide-react";
import { motion } from "framer-motion";
import { useAppStore } from "@/store/useAppStore";
import { useT } from "@/lib/i18n";
import { performClustering } from "@/lib/analytics";
import { cn } from "@/lib/utils";

export function PatternDiscovery() {
    const t = useT();
    const { dataset, datasetName, setDataset, addChart, setPhase } = useAppStore();

    const handleDiscoverSegments = () => {
        if (!dataset || dataset.length === 0) return;

        const numCols = Object.keys(dataset[0]).filter(c => typeof dataset[0][c] === 'number');
        if (numCols.length < 2) return;

        const colX = numCols[0];
        const colY = numCols[1];

        // Use the analytics library to perform simplified K-means (quadrant based)
        const clusteredData = performClustering(dataset, colX, colY);
        setDataset(clusteredData, datasetName);

        // Create a bubble chart (scatter with size or segmented scatter)
        const newChart = {
            id: Math.random().toString(),
            title: t('neuralSegmentationAnalysis') || "Neural Segmentation Analysis",
            type: 'scatter',
            data: [{
                name: 'Segments',
                x: clusteredData.map(r => r[colX]),
                y: clusteredData.map(r => r[colY]),
                // We'll use segment_tag for coloring if supported, but here we just show the clusters
                // Better: Create multiple series for each cluster
            }],
            layout: {
                title: { text: `Neural Segmentation: ${colX} vs ${colY}` }
            },
            xColumn: colX,
            yColumn: colY
        };

        // Prepare segmented data for a nicer visualization
        const segments = ["Champions", "Loyal High-Value", "Emerging Potential", "At Risk / Low Value"];
        const series = segments.map(seg => ({
            name: seg,
            type: 'scatter',
            x: clusteredData.filter(r => r.segment_tag === seg).map(r => r[colX]),
            y: clusteredData.filter(r => r.segment_tag === seg).map(r => r[colY]),
            symbolSize: 12,
            itemStyle: {
                opacity: 0.8
            }
        }));

        const bubbleChart = {
            id: Math.random().toString(),
            title: t('neuralSegmentationAnalysis') || "Neural Segmentation Analysis",
            type: 'scatter',
            data: series,
            layout: {
                title: { text: `Segmentation Clusters (${colX} vs ${colY})` }
            }
        };

        addChart(bubbleChart);
        setPhase('exploration');
    };

    if (!dataset) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-8 rounded-3xl bg-gradient-to-br from-indigo-600 to-violet-700 text-white shadow-2xl relative overflow-hidden group"
        >
            {/* Background elements */}
            <div className="absolute top-0 right-0 p-12 opacity-10 transform scale-150 rotate-12 group-hover:scale-[1.7] transition-transform duration-1000">
                <BrainCircuit className="w-64 h-64" />
            </div>
            <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-from)_0%,_transparent_70%)] opacity-20" />

            <div className="relative z-10 flex flex-col lg:flex-row items-center gap-10">
                <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-2xl border border-white/30 group-hover:rotate-6 transition-transform">
                    <Sparkles className="w-10 h-10 fill-white" />
                </div>

                <div className="flex-1 space-y-4 text-center lg:text-left">
                    <div className="flex items-center justify-center lg:justify-start gap-3">
                        <span className="px-3 py-1 rounded-full bg-white/20 text-[10px] font-black uppercase tracking-widest border border-white/20">
                            {t('workersAiCore')}
                        </span>
                        <div className="h-px w-12 bg-white/20" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-white/60">
                            {t('neuralSegmenter')}
                        </span>
                    </div>
                    <h2 className="text-3xl font-black tracking-tighter">
                        {t('discoverHiddenPatterns')}
                    </h2>
                    <p className="text-white/80 font-medium max-w-xl text-lg leading-relaxed">
                        {t('segmentationDesc')}
                    </p>
                </div>

                <div className="flex flex-col gap-4 w-full lg:w-auto">
                    <button
                        onClick={handleDiscoverSegments}
                        className="px-10 py-5 bg-white text-indigo-600 rounded-2xl text-xs font-black uppercase tracking-[0.2em] shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-4 group/btn"
                    >
                        {t('runNeuralAnalysis')}
                        <ArrowRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
                    </button>
                    <div className="flex items-center justify-center gap-6 opacity-60">
                        <div className="flex items-center gap-2">
                            <Layers className="w-3 h-3" />
                            <span className="text-[9px] font-black uppercase tracking-widest">K-Means++</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Zap className="w-3 h-3" />
                            <span className="text-[9px] font-black uppercase tracking-widest">Edge Native</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Feature preview dots */}
            <div className="absolute bottom-6 right-8 flex gap-1.5">
                {[1, 2, 3].map(i => (
                    <div key={i} className="w-1.5 h-1.5 rounded-full bg-white/30" />
                ))}
            </div>
        </motion.div>
    );
}
