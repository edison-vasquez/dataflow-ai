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
    Brain
} from "lucide-react";
import { motion } from "framer-motion";
import { useAppStore } from "@/store/useAppStore";
import { cn } from "@/lib/utils";

const navigation = [
    { id: 'workspace', name: 'Neural Hub', icon: LayoutDashboard },
    { id: 'preparation', name: 'Data Integrity', icon: Zap },
    { id: 'exploration', name: 'Deep Insights', icon: ChartIcon },
    { id: 'reports', name: 'Intelligence', icon: FileSpreadsheet },
];

export function Sidebar() {
    const { currentPhase, setPhase, toggleSettings, runFullDiagnostics, isLoading } = useAppStore();
    const [diagResult, setDiagResult] = useState<{ health: number; status: string } | null>(null);

    const handleDiagnostics = async () => {
        const result = await runFullDiagnostics();
        setDiagResult(result);
        setTimeout(() => setDiagResult(null), 5000);
    };

    return (
        <div className="w-72 border-r border-[#1a1a1a] bg-[#0A0A0B] h-full flex flex-col py-10 px-6 gap-12 select-none">
            {/* Corporate Branding */}
            <div className="flex items-center gap-4 px-2">
                <div className="w-11 h-11 rounded-xl bg-white flex items-center justify-center text-black shadow-[0_0_20px_rgba(255,255,255,0.1)]">
                    <Brain className="w-6 h-6" />
                </div>
                <div className="flex flex-col">
                    <span className="font-bold text-lg tracking-tight leading-none text-white">DataFlow</span>
                    <span className="text-[9px] uppercase tracking-[0.3em] font-black text-white/30 mt-1.5">Intelligence</span>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 w-full space-y-1.5">
                <div className="px-3 mb-4">
                    <span className="text-[10px] font-black uppercase tracking-widest text-white/20">Operational Phases</span>
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
                                    ? "bg-white/5 text-white border border-white/10"
                                    : "text-white/40 hover:text-white hover:bg-white/[0.02]"
                            )}
                        >
                            <div className="flex items-center gap-3.5 relative z-10">
                                <Icon className={cn(
                                    "w-4.5 h-4.5 transition-all duration-300",
                                    isActive ? "text-white scale-110" : "text-white/20"
                                )} />
                                <span className="tracking-tight">{item.name}</span>
                            </div>

                            {isActive && (
                                <motion.div
                                    layoutId="active-nav-indicator"
                                    className="w-1 h-4 bg-white rounded-full"
                                />
                            )}
                        </button>
                    );
                })}
            </nav>

            {/* Corporate Health & System */}
            <div className="mt-auto space-y-6">
                <div className="p-6 rounded-2xl bg-[#111112] border border-white/5 space-y-5">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Shield className="w-3.5 h-3.5 text-emerald-500" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-[#555]">Security Core</span>
                        </div>
                        <Activity className={cn("w-3.5 h-3.5 text-emerald-500", !isLoading && "animate-pulse")} />
                    </div>

                    <div>
                        <p className="text-xs font-semibold text-white/90">
                            {diagResult ? `System Health: ${diagResult.health}%` : "Neural Engine Active"}
                        </p>
                        <p className="text-[9px] text-[#444] font-bold uppercase tracking-wider mt-1">
                            {diagResult ? `Status: ${diagResult.status}` : "Cluster: CF-Llama-70B"}
                        </p>
                    </div>

                    <button
                        onClick={handleDiagnostics}
                        disabled={isLoading}
                        className="w-full py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all border border-white/5 flex items-center justify-center gap-2 group disabled:opacity-50"
                    >
                        {isLoading ? "Running..." : "Run Global Audit"}
                        <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={toggleSettings}
                        className="flex-1 flex items-center gap-3 px-5 py-3.5 rounded-xl text-xs font-semibold text-white/40 hover:text-white hover:bg-white/5 transition-all border border-transparent hover:border-white/5"
                    >
                        <Settings className="w-4 h-4" />
                        Settings
                    </button>
                    <div className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center bg-white/5 hover:bg-white/10 cursor-pointer transition-all">
                        <span className="text-[10px] font-bold">JD</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

