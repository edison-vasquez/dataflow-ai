"use client";

import React, { useState } from "react";
import {
    LayoutDashboard,
    Zap,
    LineChart as ChartIcon,
    FileSpreadsheet,
    Settings,
    Shield,
    Activity,
    ChevronRight,
    Brain,
    Search
} from "lucide-react";
import { motion } from "framer-motion";
import { useAppStore } from "@/store/useAppStore";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n";

export function Sidebar() {
    const { currentPhase, setPhase, toggleSettings, runFullDiagnostics, isLoading } = useAppStore();
    const t = useT();

    const navigation = [
        { id: 'workspace', name: t('phaseUpload'), icon: LayoutDashboard },
        { id: 'preparation', name: t('phasePreparation'), icon: Zap },
        { id: 'eda', name: t('phaseAnalysis'), icon: Search },
        { id: 'exploration', name: t('phaseExploration'), icon: ChartIcon },
        { id: 'reports', name: t('phaseReports'), icon: FileSpreadsheet },
    ];
    const [diagResult, setDiagResult] = useState<{ health: number; status: string } | null>(null);

    const handleDiagnostics = async () => {
        const result = await runFullDiagnostics();
        setDiagResult(result);
        setTimeout(() => setDiagResult(null), 5000);
    };

    return (
        <div className="w-72 border-r border-gray-200 bg-white h-full flex flex-col py-6 px-4 gap-8 select-none">
            {/* Corporate Branding */}
            <div className="flex items-center gap-3 px-2">
                <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-white shadow-md">
                    <Brain className="w-6 h-6" />
                </div>
                <div className="flex flex-col">
                    <span className="font-bold text-base tracking-tight leading-none text-gray-900">{t('dataflow')}</span>
                    <span className="text-[9px] uppercase tracking-wider font-black text-gray-400 mt-1.5">{t('dataPlatform')}</span>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 w-full space-y-1.5">
                <div className="px-3 mb-4">
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">{t('navigation')}</span>
                </div>
                {navigation.map((item) => {
                    const Icon = item.icon;
                    const isActive = currentPhase === item.id;

                    return (
                        <button
                            key={item.id}
                            onClick={() => setPhase(item.id as any)}
                            className={cn(
                                "w-full flex items-center justify-between px-4 py-3.5 rounded-xl text-sm font-medium transition-all group relative",
                                isActive
                                    ? "bg-primary/10 text-primary border border-primary/10"
                                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                            )}
                        >
                            <div className="flex items-center gap-3.5 relative z-10">
                                <Icon className={cn(
                                    "w-4.5 h-4.5 transition-all duration-300",
                                    isActive ? "text-primary scale-110" : "text-gray-400"
                                )} />
                                <span className="tracking-tight">{item.name}</span>
                            </div>

                            {isActive && (
                                <motion.div
                                    layoutId="active-nav-indicator"
                                    className="w-1 h-4 bg-primary rounded-full"
                                />
                            )}
                        </button>
                    );
                })}
            </nav>

            {/* Corporate Health & System */}
            <div className="mt-auto space-y-4">
                <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 space-y-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Shield className="w-3.5 h-3.5 text-emerald-500" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">{t('systemStatus')}</span>
                        </div>
                        <Activity className={cn("w-3.5 h-3.5 text-emerald-500", !isLoading && "animate-pulse")} />
                    </div>

                    <div>
                        <p className="text-xs font-semibold text-gray-800">
                            {diagResult ? `${t('systemHealthLabel')}: ${diagResult.health}%` : t('systemActive')}
                        </p>
                        <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider mt-1">
                            {diagResult ? `${t('status')}: ${diagResult.status}` : t('aiActive')}
                        </p>
                    </div>

                    <button
                        onClick={handleDiagnostics}
                        disabled={isLoading}
                        className="w-full py-3 bg-white hover:bg-gray-100 text-gray-700 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all border border-gray-200 flex items-center justify-center gap-2 group disabled:opacity-50"
                    >
                        {isLoading ? t('running') : t('runDiagnostics')}
                        <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={toggleSettings}
                        className="flex-1 flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-all border border-transparent hover:border-gray-200"
                    >
                        <Settings className="w-4 h-4" />
                        {t('settings')}
                    </button>
                    <div className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center bg-gray-100 hover:bg-gray-200 cursor-pointer transition-all">
                        <span className="text-[10px] font-bold text-gray-700">JD</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
