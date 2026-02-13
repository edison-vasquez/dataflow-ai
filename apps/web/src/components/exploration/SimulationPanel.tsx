"use client";

import React, { useState } from "react";
import {
    Zap,
    X,
    ChevronRight,
    TrendingUp,
    RotateCcw,
    Save,
    Plus,
    Target,
    SlidersHorizontal
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAppStore, Simulation } from "@/store/useAppStore";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";

interface SimulationPanelProps {
    isOpen: boolean;
    onClose: () => void;
}

export function SimulationPanel({ isOpen, onClose }: SimulationPanelProps) {
    const t = useT();
    const { dataset, simulations, addSimulation, updateSimulation, removeSimulation } = useAppStore();
    const [isCreating, setIsCreating] = useState(false);

    if (!dataset) return null;

    const numericColumns = Object.keys(dataset[0]).filter(c => typeof dataset[0][c] === 'number');

    const handleCreateDefault = () => {
        if (numericColumns.length < 2) return;
        const newSim: Simulation = {
            id: crypto.randomUUID(),
            driverColumn: numericColumns[0],
            targetColumn: numericColumns[1],
            adjustment: 1.0,
            isActive: true
        };
        addSimulation(newSim);
        setIsCreating(false);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[70] flex items-center justify-end p-6 bg-black/40 backdrop-blur-md">
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        className="w-full max-w-lg h-full bg-white rounded-3xl border border-gray-100 shadow-3xl flex flex-col overflow-hidden"
                    >
                        {/* Header */}
                        <div className="p-8 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
                            <div>
                                <div className="flex items-center gap-3 mb-1">
                                    <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white shadow-lg">
                                        <Zap className="w-4 h-4 fill-current" />
                                    </div>
                                    <h2 className="text-xl font-black text-gray-900 tracking-tight">{t('whatIfLab')}</h2>
                                </div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-primary/60">{t('enterpriseReportingEngine')}</p>
                            </div>
                            <div className="flex items-center gap-3">
                                {simulations.length > 0 && (
                                    <button
                                        onClick={() => simulations.forEach(s => removeSimulation(s.id))}
                                        className="px-4 py-2 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all text-[10px] font-black uppercase tracking-wider border border-red-500/20"
                                    >
                                        {t('resetAllScenarios')}
                                    </button>
                                )}
                                <button
                                    onClick={onClose}
                                    aria-label={t('closeSimulation')}
                                    className="p-3 rounded-2xl bg-white border border-gray-100 hover:bg-gray-100 transition-all shadow-sm"
                                >
                                    <X className="w-6 h-6 text-gray-400" />
                                </button>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-8 space-y-8">
                            {simulations.length === 0 && !isCreating ? (
                                <div className="h-full flex flex-col items-center justify-center text-center space-y-6">
                                    <div className="w-16 h-16 rounded-3xl bg-gray-50 border border-dashed border-gray-200 flex items-center justify-center">
                                        <SlidersHorizontal className="w-8 h-8 text-gray-300" />
                                    </div>
                                    <div className="space-y-2">
                                        <h3 className="font-bold text-gray-900">{t('noActiveSimulations')}</h3>
                                        <p className="text-[11px] text-gray-400 max-w-[240px] leading-relaxed">{t('createSimulationDesc')}</p>
                                    </div>
                                    <button
                                        onClick={handleCreateDefault}
                                        className="px-8 py-3 bg-primary text-white rounded-2xl text-[10px] font-black uppercase tracking-wider shadow-xl hover:scale-105 transition-all"
                                    >
                                        {t('createFirstScenario')}
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {simulations.map((sim) => (
                                        <motion.div
                                            key={sim.id}
                                            layout
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="p-6 rounded-3xl bg-gray-50 border border-gray-100 space-y-6 relative group"
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-6 h-6 rounded-lg bg-gray-900 flex items-center justify-center text-white shadow-lg">
                                                        <TrendingUp className="w-3 h-3" />
                                                    </div>
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-900">{t('activeScenario')}</span>
                                                </div>
                                                <button
                                                    onClick={() => removeSimulation(sim.id)}
                                                    aria-label={t('removeScenario')}
                                                    className="p-2 opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-500"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>

                                            {/* Selectors */}
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <label className="text-[9px] font-black uppercase tracking-wider text-gray-400">{t('driverLabel')}</label>
                                                    <select
                                                        value={sim.driverColumn}
                                                        onChange={(e) => updateSimulation(sim.id, { driverColumn: e.target.value })}
                                                        className="w-full bg-white p-3 rounded-xl border border-gray-200 text-xs font-bold text-gray-700 outline-none"
                                                    >
                                                        {numericColumns.map(col => <option key={col} value={col}>{col}</option>)}
                                                    </select>
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[9px] font-black uppercase tracking-wider text-gray-400">{t('impactLabel')}</label>
                                                    <select
                                                        value={sim.targetColumn}
                                                        onChange={(e) => updateSimulation(sim.id, { targetColumn: e.target.value })}
                                                        className="w-full bg-white p-3 rounded-xl border border-gray-200 text-xs font-bold text-gray-700 outline-none"
                                                    >
                                                        {numericColumns.map(col => <option key={col} value={col}>{col}</option>)}
                                                    </select>
                                                </div>
                                            </div>

                                            {/* Slider */}
                                            <div className="space-y-4 pt-4">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs font-bold text-gray-600">{t('adjustmentLabel')}</span>
                                                    <span className={cn(
                                                        "text-lg font-black tracking-tighter",
                                                        sim.adjustment > 1 ? "text-emerald-500" : sim.adjustment < 1 ? "text-red-500" : "text-gray-400"
                                                    )}>
                                                        {sim.adjustment > 1 ? "+" : ""}{Math.round((sim.adjustment - 1) * 100)}%
                                                    </span>
                                                </div>
                                                <input
                                                    type="range"
                                                    min="0.5"
                                                    max="1.5"
                                                    step="0.01"
                                                    value={sim.adjustment}
                                                    onChange={(e) => updateSimulation(sim.id, { adjustment: parseFloat(e.target.value) })}
                                                    aria-label={t('adjustmentLabel')}
                                                    aria-valuetext={`${Math.round((sim.adjustment - 1) * 100)}%`}
                                                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
                                                />
                                                <div className="flex justify-between text-[8px] font-black text-gray-300 uppercase">
                                                    <span>{t('reductionLabel')}</span>
                                                    <span>{t('baselineLabel')}</span>
                                                    <span>{t('growthLabel')}</span>
                                                </div>
                                            </div>

                                            {/* Reset button */}
                                            {sim.adjustment !== 1 && (
                                                <button
                                                    onClick={() => updateSimulation(sim.id, { adjustment: 1.0 })}
                                                    className="w-full py-2 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-primary transition-colors"
                                                >
                                                    <RotateCcw className="w-3 h-3" />
                                                    {t('resetToBase')}
                                                </button>
                                            )}
                                        </motion.div>
                                    ))}

                                    <button
                                        onClick={handleCreateDefault}
                                        className="w-full py-4 rounded-3xl border-2 border-dashed border-gray-100 hover:border-primary/30 hover:bg-primary/5 transition-all flex items-center justify-center gap-3 group"
                                    >
                                        <Plus className="w-4 h-4 text-gray-300 group-hover:text-primary transition-colors" />
                                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 group-hover:text-primary transition-colors">{t('addScenario')}</span>
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Footer / Summary */}
                        <div className="p-10 border-t border-gray-50 bg-gray-900">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                                    <Target className="w-6 h-6" />
                                </div>
                                <div>
                                    <h4 className="text-white font-black text-lg tracking-tight">{t('intelligenceFeedback')}</h4>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400/60">{t('scenariosActive')}</p>
                                </div>
                            </div>
                            <p className="text-gray-400 text-sm font-medium leading-relaxed italic">
                                {t('scenariosPersistNote')}
                            </p>
                        </div>
                        {/* Comparison Metrics Footer */}
                        {simulations.some(s => s.isActive) && (
                            <div className="p-8 bg-gray-900 text-white space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-[10px] font-black uppercase tracking-widest text-primary">{t('impactSummary')}</h3>
                                    <TrendingUp className="w-4 h-4 text-primary" />
                                </div>
                                <div className="space-y-4">
                                    {Array.from(new Set(simulations.filter(s => s.isActive).map(s => s.targetColumn))).map(col => {
                                        const originalSum = dataset.reduce((acc, r) => acc + (Number(r[col]) || 0), 0);
                                        const activeSims = simulations.filter(s => s.isActive && s.targetColumn === col);
                                        const totalAdjustment = activeSims.reduce((acc, s) => acc * s.adjustment, 1);
                                        const projectedSum = originalSum * totalAdjustment;
                                        const diff = projectedSum - originalSum;
                                        const diffPct = (totalAdjustment - 1) * 100;

                                        return (
                                            <div key={col} className="space-y-2">
                                                <div className="flex justify-between items-center text-xs">
                                                    <span className="text-gray-400 font-bold">{col}</span>
                                                    <span className={cn(
                                                        "font-black",
                                                        diff >= 0 ? "text-emerald-400" : "text-red-400"
                                                    )}>
                                                        {diff >= 0 ? '+' : ''}{Math.round(diffPct)}%
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <div className="flex-1">
                                                        <p className="text-[9px] text-gray-500 uppercase font-black tracking-widest mb-1">{t('original')}</p>
                                                        <p className="text-sm font-black tabular-nums">{Math.round(originalSum).toLocaleString()}</p>
                                                    </div>
                                                    <ChevronRight className="w-4 h-4 text-gray-700" />
                                                    <div className="flex-1 text-right">
                                                        <p className="text-[9px] text-primary uppercase font-black tracking-widest mb-1">{t('projected')}</p>
                                                        <p className="text-sm font-black text-emerald-400 tabular-nums">{Math.round(projectedSum).toLocaleString()}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
