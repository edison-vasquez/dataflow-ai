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
    Sun,
    Zap,
    CheckCircle2,
    FileText,
    Search,
    Languages
} from "lucide-react";
import { ChatPanel } from "./ChatPanel";
import { useT } from "@/lib/i18n";
import dynamic from "next/dynamic";
import { NeuralLoading } from "../ui/NeuralLoading";
import { ToastContainer } from "../ui/ToastContainer";
import { motion, AnimatePresence } from "framer-motion";

const WorkspaceView = dynamic(
    () => import("../workspace/WorkspaceView").then(m => ({ default: m.WorkspaceView })),
    { loading: () => <NeuralLoading />, ssr: false }
);
const PreparationView = dynamic(
    () => import("../preparation/PreparationView").then(m => ({ default: m.PreparationView })),
    { loading: () => <NeuralLoading />, ssr: false }
);
const EDAView = dynamic(
    () => import("../eda/EDAView").then(m => ({ default: m.EDAView })),
    { loading: () => <NeuralLoading />, ssr: false }
);
const ExplorationView = dynamic(
    () => import("../exploration/ExplorationView").then(m => ({ default: m.ExplorationView })),
    { loading: () => <NeuralLoading />, ssr: false }
);
const ReportsView = dynamic(
    () => import("../reports/ReportsView").then(m => ({ default: m.ReportsView })),
    { loading: () => <NeuralLoading />, ssr: false }
);

export function AppShell({ children }: { children: React.ReactNode }) {
    const {
        isChatOpen,
        toggleChat,
        currentPhase,
        setPhase,
        isSettingsOpen,
        toggleSettings,
        settings,
        updateSettings,
        addToast
    } = useAppStore();
    const t = useT();
    const [mounted, setMounted] = React.useState(false);

    React.useEffect(() => {
        setMounted(true);
        addToast({
            type: 'info',
            message: t('platformReady') || 'Platform Ready',
            description: t('aiSecurityActive') || 'AI Security & Cloudflare Workers Active',
            duration: 3000
        });
    }, [addToast, t]);

    if (!mounted) return null;

    const phaseNames = {
        workspace: t('phaseUpload'),
        preparation: t('phasePreparation'),
        eda: t('phaseAnalysis'),
        exploration: t('phaseExploration'),
        reports: t('phaseReports')
    };

    const renderPhaseContent = () => {
        switch (currentPhase) {
            case 'workspace': return <WorkspaceView />;
            case 'preparation': return <PreparationView />;
            case 'eda': return <EDAView />;
            case 'exploration': return <ExplorationView />;
            case 'reports': return <ReportsView />;
            default: return children;
        }
    };

    return (
        <div className="flex h-screen w-full bg-[hsl(var(--background))] text-[hsl(var(--foreground))] overflow-hidden font-sans">
            {/* Sidebar - Fixed Left */}
            <Sidebar />

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col relative overflow-hidden bg-gray-50">
                {/* Corporate Header */}
                <header className="h-16 border-b border-gray-200 flex items-center justify-between px-6 bg-white shadow-sm z-20">
                    <div className="flex items-center gap-5">
                        <div className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-lg bg-gray-100 border border-gray-200">
                            <Command className="w-3.5 h-3.5 text-gray-500" />
                            <span className="text-[10px] font-black uppercase tracking-wide text-gray-500">{t('core')}</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-300" />
                        <div className="flex items-center gap-3">
                            <span className="text-sm font-bold tracking-tight text-gray-800">
                                {phaseNames[currentPhase as keyof typeof phaseNames]}
                            </span>
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-sm ml-1" />
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => updateSettings({ language: settings.language === 'en' ? 'es' : 'en' })}
                            className="group flex items-center gap-2 px-3 py-2 rounded-xl text-[10px] font-black tracking-wide uppercase transition-all duration-300 border bg-gray-100 text-gray-600 border-gray-200 hover:border-gray-300 hover:text-gray-900"
                        >
                            <Languages className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                            {settings.language === 'en' ? 'ES' : 'EN'}
                        </button>
                        <button
                            onClick={toggleChat}
                            className={cn(
                                "group flex items-center gap-3 px-4 py-2 rounded-xl text-[10px] font-black tracking-wide uppercase transition-all duration-300 border",
                                isChatOpen
                                    ? "bg-primary text-white border-primary shadow-md"
                                    : "bg-gray-100 text-gray-600 border-gray-200 hover:border-gray-300 hover:text-gray-900"
                            )}
                        >
                            <MessageSquare className={cn("w-3.5 h-3.5", isChatOpen ? "fill-white" : "group-hover:scale-110 transition-transform")} />
                            {isChatOpen ? t('closeAssistant') : t('aiAssistant')}
                        </button>
                    </div>
                </header>

                {/* Content View with Animation */}
                <div className="flex-1 overflow-auto p-6 relative scrollbar-hide">
                    <div className="max-w-7xl mx-auto h-full relative z-10">
                        {/* Global Workflow Progress */}
                        <div className="flex items-center justify-between mb-8 pt-4">
                            <div className="flex items-center gap-4 lg:gap-6">
                                {[
                                    { id: 'workspace', label: t('stepUpload'), icon: Zap },
                                    { id: 'preparation', label: t('stepPrepare'), icon: Shield },
                                    { id: 'eda', label: t('stepAnalyze'), icon: Search },
                                    { id: 'exploration', label: t('stepExplore'), icon: Activity },
                                    { id: 'reports', label: t('stepReport'), icon: Bot }
                                ].map((step, i) => {
                                    const isActive = currentPhase === step.id;
                                    const stages = ['workspace', 'preparation', 'eda', 'exploration', 'reports'];
                                    const isPast = stages.indexOf(currentPhase) > i;
                                    const Icon = step.icon;

                                    return (
                                        <div key={step.id} className="flex items-center gap-3 lg:gap-5">
                                            <button
                                                onClick={() => setPhase(step.id as any)}
                                                className={cn(
                                                    "w-10 h-10 rounded-2xl border flex items-center justify-center transition-all duration-700 hover:scale-105 active:scale-95",
                                                    isActive ? "bg-primary text-white border-primary shadow-md scale-110" :
                                                        isPast ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-500" :
                                                            "bg-gray-100 border-gray-200 text-gray-400"
                                                )}>
                                                {isPast ? <CheckCircle2 className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                                            </button>
                                            <div className="hidden xl:block">
                                                <p className={cn(
                                                    "text-[10px] font-black uppercase tracking-wider transition-colors",
                                                    isActive ? "text-gray-900" : "text-gray-400"
                                                )}>{step.label}</p>
                                                {isActive && <motion.div layoutId="active-dot" className="w-1 h-1 rounded-full bg-primary mt-1 mx-auto" />}
                                            </div>
                                            {i < 4 && <div className="hidden lg:block w-4 h-px bg-gray-200" />}
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="hidden md:flex items-center gap-4 bg-gray-50 border border-gray-200 px-4 py-2 rounded-xl">
                                <Activity className="w-3.5 h-3.5 text-emerald-500" />
                                <span className="text-[10px] font-black text-gray-500 tracking-wide uppercase">{t('aiSuggestionsActive')}</span>
                            </div>
                        </div>

                        <AnimatePresence mode="wait">
                            <motion.div
                                key={currentPhase}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                                className="h-full"
                            >
                                {renderPhaseContent()}
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
                        className="h-full w-[450px] border-l border-gray-200 bg-white shadow-xl z-30"
                    >
                        <ChatPanel />
                    </motion.aside>
                )}
            </AnimatePresence>

            {/* Settings Modal */}
            <AnimatePresence>
                {isSettingsOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="w-full max-w-2xl bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-2xl"
                        >
                            <div className="flex items-center justify-between p-5 border-b border-gray-200">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
                                        <Bot className="w-6 h-6 text-gray-500" />
                                    </div>
                                    <h2 className="text-xl font-bold tracking-tight text-gray-900">{t('settings')}</h2>
                                </div>
                                <button onClick={toggleSettings} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                                    <X className="w-6 h-6 text-gray-400" />
                                </button>
                            </div>

                            <div className="p-6 space-y-6">
                                <section className="space-y-4">
                                    <h3 className="text-xs font-black uppercase tracking-wider text-gray-400">{t('interfaceSecurity')}</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <button
                                            onClick={() => updateSettings({ theme: 'dark' })}
                                            className={cn(
                                                "p-4 rounded-2xl border flex flex-col gap-3 text-left transition-all",
                                                settings.theme === 'dark' ? "bg-gray-100 border-gray-300" : "bg-transparent border-gray-200 hover:border-gray-300"
                                            )}
                                        >
                                            <Moon className="w-5 h-5 text-gray-500" />
                                            <div>
                                                <p className="text-sm font-bold text-gray-900">{t('darkMode')}</p>
                                                <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest mt-1">{t('active')}</p>
                                            </div>
                                        </button>
                                        <button
                                            className="p-4 rounded-2xl border border-gray-200 flex flex-col gap-3 text-left opacity-30 cursor-not-allowed"
                                        >
                                            <Sun className="w-5 h-5 text-gray-500" />
                                            <div>
                                                <p className="text-sm font-bold text-gray-900">{t('lightMode')}</p>
                                                <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest mt-1">{t('comingSoon')}</p>
                                            </div>
                                        </button>
                                    </div>
                                </section>

                                <section className="p-5 rounded-xl bg-gray-50 border border-gray-200 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <Shield className="w-6 h-6 text-emerald-500/50" />
                                            <div>
                                                <h4 className="text-sm font-bold text-gray-900">{t('privacyScrubbing')}</h4>
                                                <p className="text-xs text-gray-500 mt-1">{t('privacyDesc')}</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => updateSettings({ privacyMode: !settings.privacyMode })}
                                            className={cn(
                                                "w-12 h-6 rounded-full relative transition-all duration-500",
                                                settings.privacyMode ? "bg-emerald-500" : "bg-gray-300"
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
                                            <User className="w-6 h-6 text-gray-400" />
                                            <div>
                                                <h4 className="text-sm font-bold text-gray-900">{t('cloudflareJwt')}</h4>
                                                <p className="text-xs text-gray-500 mt-1">{t('jwtStatus')}</p>
                                            </div>
                                        </div>
                                        <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500">{t('live')}</span>
                                    </div>
                                </section>
                            </div>

                            <div className="p-5 bg-gray-50 border-t border-gray-200 flex justify-end gap-4">
                                <button onClick={toggleSettings} className="px-6 py-2.5 rounded-xl text-xs font-bold text-gray-500 hover:text-gray-900 transition-all">
                                    {t('close')}
                                </button>
                                <button onClick={toggleSettings} className="px-6 py-2.5 bg-primary text-white rounded-xl text-xs font-black uppercase tracking-widest hover:scale-105 transition-all">
                                    {t('save')}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Global Toasts */}
            <ToastContainer />
        </div>
    );
}
