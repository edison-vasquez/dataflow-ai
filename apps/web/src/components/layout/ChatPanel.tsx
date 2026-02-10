"use client";

import React, { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Sparkles, Loader2, Cpu } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { processAssistantRequest } from "@/lib/ai";
import { cn } from "@/lib/utils";

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

export function ChatPanel() {
    const { isChatOpen, dataset, datasetName, currentPhase, issues, setDataset, setIssues, addChart, setPhase } = useAppStore();
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            role: 'assistant',
            content: "Welcome to DataFlow Intelligence. I have initialized the neural context for your workspace. How can I assist with your data operations today?",
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
            const response = await processAssistantRequest(
                currentInput,
                dataset || [],
                setDataset,
                setIssues,
                addChart,
                setPhase,
                { datasetName, phase: currentPhase, issues }
            );

            // Clean response of any accidental JSON artifacts from LLM
            const cleanContent = response.replace(/```json[\s\S]*?```/g, "").replace(/\{[\s\S]*?"action"[\s\S]*?\}/g, "").trim();

            const assistantMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: cleanContent || "Action executed successfully.",
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
        <div className="h-full flex flex-col bg-[#080809] border-l border-white/5">
            {/* Corporate Chat Header */}
            <div className="p-6 border-b border-white/5 flex items-center justify-between bg-black/20 backdrop-blur-md">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/50 border border-white/10 ring-4 ring-white/5">
                        <Cpu className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="font-bold text-sm tracking-tight text-white/90">Neural Assistant</h3>
                        <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
                            <span className="text-[9px] text-white/30 uppercase font-black tracking-widest">Active Cluster</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Messages area */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-hide">
                <div className="absolute inset-0 opacity-[0.02] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')] bg-repeat" />

                {messages.map((msg) => (
                    <div key={msg.id} className={cn(
                        "flex w-full gap-4 transition-all duration-500",
                        msg.role === 'user' ? "flex-row-reverse" : "flex-row"
                    )}>
                        <div className={cn(
                            "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border mt-1",
                            msg.role === 'user'
                                ? "bg-white text-black border-white"
                                : "bg-white/5 text-white/40 border-white/10"
                        )}>
                            {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                        </div>
                        <div className={cn(
                            "max-w-[80%] p-5 rounded-2xl text-[13px] leading-relaxed shadow-lg",
                            msg.role === 'user'
                                ? "bg-white text-black font-semibold rounded-tr-none"
                                : "bg-[#111112] text-white/80 rounded-tl-none border border-white/5"
                        )}>
                            {msg.content}
                        </div>
                    </div>
                ))}
                {isTyping && (
                    <div className="flex gap-4">
                        <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                            <Bot className="w-4 h-4 text-white/20" />
                        </div>
                        <div className="bg-[#111112] p-4 px-6 rounded-2xl rounded-tl-none flex items-center gap-1.5 border border-white/5">
                            <span className="w-1 h-1 bg-white/40 rounded-full animate-bounce" />
                            <span className="w-1 h-1 bg-white/40 rounded-full animate-bounce [animation-delay:0.2s]" />
                            <span className="w-1 h-1 bg-white/40 rounded-full animate-bounce [animation-delay:0.4s]" />
                        </div>
                    </div>
                )}
            </div>

            {/* Input area */}
            <div className="p-6 border-t border-white/5 bg-black/40 backdrop-blur-2xl">
                <div className="relative group">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Interface with neural core..."
                        className="w-full bg-white/5 hover:bg-white/[0.08] focus:bg-white/[0.08] border border-white/5 focus:border-white/20 rounded-2xl px-5 py-4 pr-14 text-sm transition-all focus:ring-4 focus:ring-white/5 placeholder:text-white/20 text-white/90 outline-none"
                    />
                    <button
                        onClick={handleSend}
                        disabled={!input.trim() || isTyping}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 p-2.5 rounded-xl bg-white text-black disabled:opacity-20 disabled:scale-95 transition-all shadow-xl active:scale-95"
                    >
                        {isTyping ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    </button>
                </div>
                <p className="text-[9px] text-white/20 uppercase font-black tracking-[0.2em] mt-4 text-center">
                    DataFlow Enterprise Neural Protocol v4.0.2
                </p>
            </div>
        </div>
    );
}

