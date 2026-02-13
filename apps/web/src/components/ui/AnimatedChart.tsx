"use client";

import React from "react";
import dynamic from "next/dynamic";
import { cn } from "@/lib/utils";
import { ChartSkeleton } from "./ChartSkeleton";
import { AnimatePresence, motion } from "framer-motion";

const ReactECharts = dynamic(() => import("echarts-for-react"), {
    ssr: false,
    loading: () => (
        <div className="w-full h-full min-h-[300px] flex items-center justify-center">
            <div className="animate-pulse text-gray-400 text-xs">Loading chart...</div>
        </div>
    ),
});

interface AnimatedChartProps {
    option: any;
    className?: string;
    style?: React.CSSProperties;
    onChartReady?: (instance: any) => void;
    onEvents?: Record<string, Function>;
    isLoading?: boolean;
}

export const AnimatedChart = React.memo(function AnimatedChart({ option, className, style, onChartReady, onEvents, isLoading }: AnimatedChartProps) {
    const defaultOption = {
        backgroundColor: "transparent",
        textStyle: {
            fontFamily: "Inter, sans-serif",
            color: "rgba(0, 0, 0, 0.5)"
        },
        tooltip: {
            backgroundColor: "#ffffff",
            borderColor: "#e5e7eb",
            borderWidth: 1,
            textStyle: {
                color: "#374151",
                fontSize: 12
            },
            padding: [10, 15],
            borderRadius: 12,
            shadowColor: "rgba(0, 0, 0, 0.1)",
            shadowBlur: 10
        },
        grid: {
            top: 60,
            left: 50,
            right: 30,
            bottom: 60,
            containLabel: true
        }
    };

    const finalOption = {
        ...defaultOption,
        ...option,
        animation: true,
        animationDuration: 1200,
        animationEasing: "cubicInOut",
        animationThreshold: 2000
    };

    return (
        <div className={cn("w-full h-full min-h-[300px] relative", className)}>
            <AnimatePresence mode="wait">
                {isLoading ? (
                    <motion.div
                        key="skeleton"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 z-10"
                    >
                        <ChartSkeleton />
                    </motion.div>
                ) : null}
            </AnimatePresence>
            <ReactECharts
                option={finalOption}
                style={{ height: "100%", width: "100%", ...style }}
                onChartReady={onChartReady}
                onEvents={onEvents}
                notMerge={false}
                lazyUpdate={true}
            />
        </div>
    );
});
