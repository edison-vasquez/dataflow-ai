"use client";

import React, { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Sparkles, Loader2, Cpu, Activity, PieChart, CheckCircle2, AlertTriangle, FileText, Filter, X } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { processAssistantRequest } from "@/lib/ai";
import { applyTransformation, analyzeDataset } from "@/lib/dataProcessor";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n";

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

export function ChatPanel() {
    const t = useT();
    const {
        isChatOpen,
        setChatOpen,
        dataset,
        datasetName,
        currentPhase,
        issues,
        setDataset,
        setIssues,
        addChart,
        setPhase,
        addTransformation,
        persistTransformation,
        persistChart
    } = useAppStore();
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            role: 'assistant',
            content: t('welcomeMessage'),
            timestamp: new Date()
        }
    ]);
    const [input, setInput] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isTyping]);

    const handleSend = async () => {
        if (!input.trim() || isTyping) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: input,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        const currentInput = input;
        setInput("");
        setIsTyping(true);

        try {
            const result = await processAssistantRequest(
                currentInput,
                dataset || [],
                setDataset,
                setIssues,
                addChart,
                setPhase,
                { datasetName, phase: currentPhase, issues }
            );

            let messageContent = typeof result === 'string' ? result : result.message;

            if (typeof result !== 'string' && result.chart) {
                persistChart(result.chart);
                setPhase('exploration');
            }

            if (typeof result !== 'string' && result.transformation && dataset) {
                const { type, params } = result.transformation;
                const newData = applyTransformation(dataset, type, params);
                setDataset(newData, datasetName);
                setIssues(analyzeDataset(newData));

                const transformation = {
                    id: Math.random().toString(),
                    type,
                    params,
                    timestamp: new Date()
                };
                addTransformation(transformation);
                persistTransformation(transformation);
            }

            const cleanContent = messageContent
                .replace(/```json[\s\S]*?```/g, "")
                .replace(/```[\s\S]*?```/g, "")
                .replace(/\{[\s\S]*?"action"[\s\S]*?\}/g, "")
                .trim();

            const assistantMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: cleanContent || t('defaultResponse'),
                timestamp: new Date()
            };
            setMessages(prev => [...prev, assistantMessage]);
        } catch (error) {
            console.error(error);
        } finally {
            setIsTyping(false);
        }
    };

    if (!isChatOpen) return null;

    return (
        <div className="h-full flex flex-col bg-white border-l border-gray-200">
            {/* Corporate Chat Header */}
            <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
                <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 ring-2 ring-primary/5">
                        <Cpu className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="font-bold text-sm tracking-tight text-gray-900">{t('aiAssistant')}</h3>
                        <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-sm" />
                            <span className="text-[9px] text-gray-400 uppercase font-black tracking-widest">{t('online')}</span>
                        </div>
                    </div>
                </div>
                <button
                    onClick={() => setChatOpen(false)}
                    aria-label={t('closeChat')}
                    className="p-2 hover:bg-gray-200 rounded-lg transition-colors text-gray-500"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>

            {/* Messages area */}
            <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide"
                role="log"
                aria-live="polite"
                aria-relevant="additions"
            >
                {messages.map((msg) => (
                    <div key={msg.id} className={cn(
                        "flex w-full gap-4 transition-all duration-500",
                        msg.role === 'user' ? "flex-row-reverse" : "flex-row"
                    )}>
                        <div className={cn(
                            "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border mt-1",
                            msg.role === 'user'
                                ? "bg-primary text-white border-primary"
                                : "bg-gray-100 text-gray-500 border-gray-200"
                        )}>
                            {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                        </div>
                        <div className={cn(
                            "max-w-[80%] p-3 rounded-2xl text-[13px] leading-relaxed shadow-sm",
                            msg.role === 'user'
                                ? "bg-primary/10 text-gray-900 font-medium rounded-tr-none"
                                : "bg-gray-100 text-gray-800 rounded-tl-none border border-gray-200"
                        )}>
                            {msg.content}
                        </div>
                    </div>
                ))}
                {isTyping && (
                    <div className="flex gap-4" aria-live="polite" aria-busy="true">
                        <div className="w-8 h-8 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center shrink-0">
                            <Bot className="w-4 h-4 text-gray-400" />
                        </div>
                        <div className="bg-gray-100 p-4 px-6 rounded-2xl rounded-tl-none flex items-center gap-1.5 border border-gray-200">
                            <span className="sr-only">{t('aiTyping')}</span>
                            <span className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" />
                            <span className="w-1 h-1 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                            <span className="w-1 h-1 bg-gray-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                        </div>
                    </div>
                )}
            </div>

            {/* Quick Actions */}
            <div className="px-4 py-2 flex items-center gap-2 overflow-x-auto no-scrollbar border-t border-gray-100 bg-gray-50/50">
                <Sparkles className="w-3.5 h-3.5 text-primary shrink-0" />
                <div className="flex items-center gap-2 whitespace-nowrap">
                    {(() => {
                        const actions = [];
                        if (!dataset) return null;

                        if (currentPhase === 'workspace') actions.push({ label: t('explainData'), icon: <Activity className="w-3 h-3" />, prompt: "Explain the dataset structure and quality." });
                        if (currentPhase === 'preparation') actions.push({ label: t('cleanupData'), icon: <CheckCircle2 className="w-3 h-3" />, prompt: "Suggest data cleaning steps for these issues." });
                        if (currentPhase === 'exploration') actions.push({ label: t('suggestCharts'), icon: <PieChart className="w-3 h-3" />, prompt: "Suggest 3 interesting charts for this dataset." });
                        actions.push({ label: t('analyzeOutliers'), icon: <AlertTriangle className="w-3 h-3" />, prompt: "Identify potential outliers in the numeric columns." });
                        actions.push({ label: t('generateReport'), icon: <FileText className="w-3 h-3" />, prompt: "Generate a summary report of the dataset." });
                        actions.push({ label: t('clearFilters'), icon: <Filter className="w-3 h-3" />, prompt: "Clear all active filters and transformations." });

                        return actions.map((act, i) => (
                            <button
                                key={i}
                                onClick={() => setInput(act.prompt)}
                                aria-label={act.label}
                                className="px-3 py-1.5 rounded-lg bg-white border border-gray-200 text-[10px] font-bold text-gray-600 hover:border-primary hover:text-primary transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
                            >
                                {act.icon}
                                {act.label}
                            </button>
                        ));
                    })()}
                </div>
            </div>

            {/* Input area */}
            <div className="p-4 border-t border-gray-200 bg-white">
                <div className="relative group">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        placeholder={t('chatPlaceholder')}
                        className="w-full bg-gray-100 hover:bg-gray-50 focus:bg-white border border-gray-200 focus:border-primary rounded-xl px-4 py-3 pr-14 text-sm transition-all focus:ring-2 focus:ring-primary/10 placeholder:text-gray-400 text-gray-900 outline-none"
                    />
                    <button
                        onClick={handleSend}
                        disabled={!input.trim() || isTyping}
                        aria-label={t('sendMessage')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-primary text-white disabled:opacity-20 disabled:scale-95 transition-all shadow-md active:scale-95"
                    >
                        {isTyping ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    </button>
                </div>
                <p className="text-[9px] text-gray-400 uppercase font-black tracking-wide mt-3 text-center">
                    {t('poweredBy')}
                </p>
            </div>
        </div>
    );
}
