"use client";

import React from "react";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { useT } from "@/lib/i18n";

export function NeuralLoading({ message }: { message?: string }) {
    const t = useT();
    const displayMessage = message || t('aiThinking');
    return (
        <div className="flex flex-col items-center justify-center p-12 space-y-6">
            <div className="relative w-24 h-24">
                {/* Animated Rings */}
                {[1, 2, 3].map((i) => (
                    <motion.div
                        key={i}
                        className="absolute inset-0 rounded-full border-2 border-primary/20"
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{
                            scale: [0.8, 1.2],
                            opacity: [0, 0.5, 0],
                        }}
                        transition={{
                            duration: 2,
                            repeat: Infinity,
                            delay: i * 0.4,
                            ease: "easeInOut"
                        }}
                    />
                ))}

                {/* Core Glow */}
                <motion.div
                    className="absolute inset-4 rounded-full bg-primary shadow-lg flex items-center justify-center"
                    animate={{
                        scale: [1, 1.1, 1]
                    }}
                    transition={{ duration: 3, repeat: Infinity }}
                >
                    <Sparkles className="w-8 h-8 text-white" />
                </motion.div>
            </div>

            <div className="space-y-2 text-center">
                <motion.p
                    className="text-sm font-bold tracking-widest uppercase text-gray-500"
                    animate={{ opacity: [0.3, 0.6, 0.3] }}
                    transition={{ duration: 2, repeat: Infinity }}
                >
                    {t('processing')}
                </motion.p>
                <p className="text-xl font-black tracking-tight text-gray-900">{displayMessage}</p>
            </div>
        </div>
    );
}

export function ShimmerCard() {
    return (
        <div className="bg-gray-100 border border-gray-200 rounded-3xl p-6 h-40 animate-pulse opacity-50">
            <div className="w-1/2 h-4 bg-gray-200 rounded-full mb-4" />
            <div className="w-full h-2 bg-gray-200 rounded-full mb-2" />
            <div className="w-3/4 h-2 bg-gray-200 rounded-full" />
        </div>
    );
}
