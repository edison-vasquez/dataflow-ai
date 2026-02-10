"use client";

import React from "react";
import { Sidebar } from "./Sidebar";
import { useAppStore } from "@/store/useAppStore";
import { cn } from "@/lib/utils";
import {
    MessageSquare,
    ChevronRight,
    Activity,
    Command,
    X,
    User,
    Shield,
    Bot,
    Moon,
    Sun
} from "lucide-react";
import { ChatPanel } from "./ChatPanel";
import { motion, AnimatePresence } from "framer-motion";

export function AppShell({ children }: { children: React.ReactNode }) {
    const {
        isChatOpen,
        toggleChat,
        currentPhase,
        isSettingsOpen,
        toggleSettings,
        settings,
        updateSettings
    } = useAppStore();
    const [mounted, setMounted] = React.useState(false);

    React.useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    const phaseNames = {
        workspace: 'Neural Hub',
        preparation: 'Data Integrity',
        exploration: 'Deep Insights',
        reports: 'Intelligence'
    };

    return (
        <div className="flex h-screen w-full bg-[#050505] text-white overflow-hidden font-sans">
            {/* Sidebar - Fixed Left */}
            <Sidebar />

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col relative overflow-hidden bg-[#0A0A0B]">
                {/* Corporate Header */}
                <header className="h-20 border-b border-[#1a1a1a] flex items-center justify-between px-10 bg-black/20 backdrop-blur-3xl z-20">
                    <div className="flex items-center gap-5">
                        <div className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-lg bg-white/5 border border-white/10">
                            <Command className="w-3.5 h-3.5 text-white/50" />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50">Core</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-white/10" />
                        <div className="flex items-center gap-3">
                            <span className="text-sm font-bold tracking-tight text-white/90">
                                {phaseNames[currentPhase as keyof typeof phaseNames]}
                            </span>
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] ml-1" />
                        </div>
                    </div>

                    <div className="flex items-center gap-8">
                        <div className="hidden lg:flex items-center gap-3 px-4 py-2 rounded-xl bg-[#0F1712] text-emerald-500 border border-emerald-500/10">
                            <Activity className="w-3.5 h-3.5" />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Edge Node: SYD-01 (12ms)</span>
                        </div>

                        <button
                            onClick={toggleChat}
                            className={cn(
                                "group flex items-center gap-3 px-6 py-2.5 rounded-xl text-[10px] font-black tracking-[0.2em] uppercase transition-all duration-300 border",
                                isChatOpen
                                    ? "bg-white text-black border-white shadow-[0_0_30px_rgba(255,255,255,0.15)]"
                                    : "bg-white/5 text-white/60 border-white/5 hover:border-white/20 hover:text-white"
                            )}
                        >
                            <MessageSquare className={cn("w-3.5 h-3.5", isChatOpen ? "fill-black" : "group-hover:scale-110 transition-transform")} />
                            {isChatOpen ? "Detach AI" : "Neural Assistant"}
                        </button>
                    </div>
                </header>

                {/* Content View with Animation */}
                <div className="flex-1 overflow-auto p-12 relative scrollbar-hide">
                    {/* Subtle grain overlay */}
                    <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')] bg-repeat" />

                    <div className="max-w-7xl mx-auto h-full relative z-10">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={currentPhase}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                                className="h-full"
                            >
                                {children}
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </div>
            </main>

            {/* Chat Panel - Fixed Right */}
            <AnimatePresence>
                {isChatOpen && (
                    <motion.aside
                        initial={{ x: 450 }}
                        animate={{ x: 0 }}
                        exit={{ x: 450 }}
                        transition={{ type: "spring", damping: 28, stiffness: 220 }}
                        className="h-full w-[450px] border-l border-[#1a1a1a] bg-[#080809] shadow-[-30px_0_60px_rgba(0,0,0,0.8)] z-30"
                    >
                        <ChatPanel />
                    </motion.aside>
                )}
            </AnimatePresence>

            {/* Settings Modal */}
            <AnimatePresence>
                {isSettingsOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="w-full max-w-2xl bg-[#0F0F10] border border-white/10 rounded-[2.5rem] overflow-hidden shadow-3xl"
                        >
                            <div className="flex items-center justify-between p-8 border-b border-white/5">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                                        <Bot className="w-6 h-6 text-white/50" />
                                    </div>
                                    <h2 className="text-xl font-bold tracking-tight">System Preferences</h2>
                                </div>
                                <button onClick={toggleSettings} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                                    <X className="w-6 h-6 text-white/30" />
                                </button>
                            </div>

                            <div className="p-10 space-y-10">
                                <section className="space-y-6">
                                    <h3 className="text-xs font-black uppercase tracking-[0.3em] text-white/20">Interface & Security</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <button
                                            onClick={() => updateSettings({ theme: 'dark' })}
                                            className={cn(
                                                "p-4 rounded-2xl border flex flex-col gap-3 text-left transition-all",
                                                settings.theme === 'dark' ? "bg-white/5 border-white/20" : "bg-transparent border-white/5 hover:border-white/10"
                                            )}
                                        >
                                            <Moon className="w-5 h-5 text-white/40" />
                                            <div>
                                                <p className="text-sm font-bold">Dark Protocol</p>
                                                <p className="text-[10px] text-white/30 uppercase font-black tracking-widest mt-1">High Contrast Active</p>
                                            </div>
                                        </button>
                                        <button
                                            className="p-4 rounded-2xl border border-white/5 flex flex-col gap-3 text-left opacity-30 cursor-not-allowed"
                                        >
                                            <Sun className="w-5 h-5 text-white/40" />
                                            <div>
                                                <p className="text-sm font-bold">Light Protocol</p>
                                                <p className="text-[10px] text-white/30 uppercase font-black tracking-widest mt-1">Enterprise Only</p>
                                            </div>
                                        </button>
                                    </div>
                                </section>

                                <section className="p-8 rounded-3xl bg-white/[0.02] border border-white/5 space-y-6">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <Shield className="w-6 h-6 text-emerald-500/50" />
                                            <div>
                                                <h4 className="text-sm font-bold">Privacy Metadata Scrubbing</h4>
                                                <p className="text-xs text-white/30 mt-1">Automatically remove PII from datasets before AI analysis.</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => updateSettings({ privacyMode: !settings.privacyMode })}
                                            className={cn(
                                                "w-12 h-6 rounded-full relative transition-all duration-500",
                                                settings.privacyMode ? "bg-emerald-500" : "bg-white/10"
                                            )}
                                        >
                                            <motion.div
                                                animate={{ x: settings.privacyMode ? 26 : 4 }}
                                                className="absolute top-1 left-0 w-4 h-4 bg-white rounded-full shadow-lg"
                                            />
                                        </button>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <User className="w-6 h-6 text-white/20" />
                                            <div>
                                                <h4 className="text-sm font-bold">Cloudflare Access JWT</h4>
                                                <p className="text-xs text-white/30 mt-1">Status: Authenticated (as john.doe@enterprise.com)</p>
                                            </div>
                                        </div>
                                        <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Live</span>
                                    </div>
                                </section>
                            </div>

                            <div className="p-8 bg-black/40 border-t border-white/5 flex justify-end gap-4">
                                <button onClick={toggleSettings} className="px-8 py-3 rounded-xl text-xs font-bold text-white/40 hover:text-white transition-all">
                                    Close
                                </button>
                                <button onClick={toggleSettings} className="px-10 py-3 bg-white text-black rounded-xl text-xs font-black uppercase tracking-widest hover:scale-105 transition-all">
                                    Save Changes
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

