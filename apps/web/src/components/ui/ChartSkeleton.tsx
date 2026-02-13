"use client";

import React from "react";
import { motion } from "framer-motion";

export function ChartSkeleton() {
    return (
        <div className="w-full h-full min-h-[300px] flex flex-col p-6 space-y-6 bg-white/50 backdrop-blur-sm rounded-2xl border border-gray-100/50 overflow-hidden relative">
            {/* Header Skeleton */}
            <div className="flex items-center justify-between">
                <div className="space-y-2">
                    <motion.div
                        initial={{ opacity: 0.3 }}
                        animate={{ opacity: [0.3, 0.6, 0.3] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                        className="h-4 w-32 bg-gray-200 rounded-lg"
                    />
                    <motion.div
                        initial={{ opacity: 0.2 }}
                        animate={{ opacity: [0.2, 0.4, 0.2] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
                        className="h-2 w-48 bg-gray-100 rounded-lg"
                    />
                </div>
                <div className="w-8 h-8 rounded-lg bg-gray-100 animate-pulse" />
            </div>

            {/* Main Chart Area Skeleton */}
            <div className="flex-1 flex items-end gap-2 px-2 pb-8">
                {[...Array(12)].map((_, i) => (
                    <motion.div
                        key={i}
                        initial={{ height: "10%" }}
                        animate={{ height: [`${20 + Math.random() * 60}%`, `${30 + Math.random() * 50}%`, `${20 + Math.random() * 60}%`] }}
                        transition={{
                            duration: 2 + Math.random(),
                            repeat: Infinity,
                            ease: "easeInOut",
                            delay: i * 0.1
                        }}
                        className="flex-1 bg-gradient-to-t from-primary/5 to-primary/20 rounded-t-lg"
                    />
                ))}
            </div>

            {/* X-Axis Skeleton */}
            <div className="flex justify-between px-4 pb-2">
                {[...Array(6)].map((_, i) => (
                    <div key={i} className="h-1.5 w-8 bg-gray-100 rounded-full" />
                ))}
            </div>

            {/* Loading Overlay Gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-white/10 via-transparent to-white/10 pointer-events-none" />

            <div className="absolute inset-0 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                        className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full"
                    />
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 animate-pulse">
                        Analyzing Intelligence...
                    </p>
                </div>
            </div>
        </div>
    );
}
