"use client";

import React, { useEffect } from "react";
import { CheckCircle2, XCircle, Info, X, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAppStore } from "@/store/useAppStore";
import { cn } from "@/lib/utils";

export function ToastContainer() {
    const { toasts, removeToast } = useAppStore();

    return (
        <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none">
            <AnimatePresence>
                {toasts.map((toast) => (
                    <ToastItem
                        key={toast.id}
                        toast={toast}
                        onClose={() => removeToast(toast.id)}
                    />
                ))}
            </AnimatePresence>
        </div>
    );
}

function ToastItem({ toast, onClose }: { toast: any, onClose: () => void }) {
    useEffect(() => {
        const timer = setTimeout(onClose, toast.duration || 4000);
        return () => clearTimeout(timer);
    }, [onClose, toast.duration]);

    const icons = {
        success: <CheckCircle2 className="w-5 h-5 text-emerald-500" />,
        error: <XCircle className="w-5 h-5 text-red-500" />,
        info: <Info className="w-5 h-5 text-blue-500" />,
        warning: <AlertCircle className="w-5 h-5 text-amber-500" />
    };

    const bgColors = {
        success: "bg-emerald-50 border-emerald-100",
        error: "bg-red-50 border-red-100",
        info: "bg-blue-50 border-blue-100",
        warning: "bg-amber-50 border-amber-100"
    };

    return (
        <motion.div
            layout
            initial={{ opacity: 0, x: 20, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 20, scale: 0.8 }}
            className={cn(
                "pointer-events-auto p-4 py-3 rounded-2xl border shadow-2xl flex items-center gap-4 min-w-[280px] max-w-md",
                bgColors[toast.type as keyof typeof bgColors] || "bg-white border-gray-100"
            )}
        >
            <div className="shrink-0">{icons[toast.type as keyof typeof icons] || icons.info}</div>
            <div className="flex-1">
                <p className="text-sm font-bold text-gray-900 leading-tight">{toast.message}</p>
                {toast.description && <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-1">{toast.description}</p>}
            </div>
            <button
                onClick={onClose}
                className="p-1 hover:bg-black/5 rounded-lg transition-all"
            >
                <X className="w-4 h-4 text-gray-400" />
            </button>
        </motion.div>
    );
}
