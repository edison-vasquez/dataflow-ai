"use client";

import React from "react";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

export function NeuralLoading({ message = "AI is thinking..." }: { message?: string }) {
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
                    className="absolute inset-4 rounded-full bg-gradient-to-br from-primary to-blue-600 shadow-[0_0_30px_rgba(37,99,235,0.4)] flex items-center justify-center"
                    animate={{
                        scale: [1, 1.1, 1],
                        boxShadow: [
                            "0 0 20px rgba(37,99,235,0.4)",
                            "0 0 40px rgba(37,99,235,0.6)",
                            "0 0 20px rgba(37,99,235,0.4)"
                        ]
                    }}
                    transition={{ duration: 3, repeat: Infinity }}
                >
                    <Sparkles className="w-8 h-8 text-white" />
                </motion.div>
            </div>

            <div className="space-y-2 text-center">
                <motion.p
                    className="text-sm font-bold tracking-widest uppercase text-white/40"
                    animate={{ opacity: [0.3, 0.6, 0.3] }}
                    transition={{ duration: 2, repeat: Infinity }}
                >
                    Neural Processing
                </motion.p>
                <p className="text-xl font-black tracking-tight">{message}</p>
            </div>
        </div>
    );
}

export function ShimmerCard() {
    return (
        <div className="glass-card p-6 h-40 neural-shimmer rounded-3xl opacity-50">
            <div className="w-1/2 h-4 bg-white/5 rounded-full mb-4" />
            <div className="w-full h-2 bg-white/5 rounded-full mb-2" />
            <div className="w-3/4 h-2 bg-white/5 rounded-full" />
        </div>
    );
}
