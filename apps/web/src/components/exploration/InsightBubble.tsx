"use client";

import React, { useState, useEffect } from "react";
import { Sparkles, X, BrainCircuit, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useT } from "@/lib/i18n";

interface InsightBubbleProps {
    pointInfo: any;
    onClose: () => void;
}

export function InsightBubble({ pointInfo, onClose }: InsightBubbleProps) {
    const t = useT();
    const [explanation, setExplanation] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Simulated AI diagnostic
        const timer = setTimeout(() => {
            const val = Array.isArray(pointInfo.value) ? pointInfo.value[1] : pointInfo.value;
            setExplanation(`Critical Analysis: The value ${val} at this point shows a 14% deviation from the predicted baseline. Correlation analysis suggests internal efficiency factors (Sigma-2) are the primary drivers of this specific peak.`);
            setIsLoading(false);
        }, 1200);
        return () => clearTimeout(timer);
    }, [pointInfo]);

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            className="absolute z-20 bg-white/95 backdrop-blur-xl border border-primary/20 shadow-2xl rounded-2xl p-5 max-w-[280px] left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        >
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <BrainCircuit className="w-4 h-4 text-primary" />
                    <span className="text-[10px] font-black uppercase tracking-wider text-primary font-black">{t('aiDiagnostic')}</span>
                </div>
                <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
                    <X className="w-3 h-3 text-gray-400" />
                </button>
            </div>

            <div className="space-y-3">
                {isLoading ? (
                    <div className="flex flex-col items-center py-4 gap-2">
                        <Loader2 className="w-5 h-5 animate-spin text-primary/40" />
                        <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">{t('analyzingRootCause')}</span>
                    </div>
                ) : (
                    <>
                        <p className="text-xs font-medium text-gray-700 leading-relaxed italic border-l-2 border-primary/20 pl-3">
                            "{explanation}"
                        </p>
                        <div className="pt-2 flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-emerald-500 font-black">
                            <Sparkles className="w-3 h-3 fill-current" />
                            {t('confidenceScore')}: 0.94
                        </div>
                    </>
                )}
            </div>
        </motion.div>
    );
}
