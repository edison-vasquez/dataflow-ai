"use client";

import { useEffect } from "react";

export default function AppError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error("App error:", error);
    }, [error]);

    const handleReset = () => {
        // Clear potentially corrupted persisted state
        try {
            localStorage.removeItem("dataflow-storage");
        } catch {}
        reset();
    };

    return (
        <div className="min-h-screen bg-white text-gray-900 flex items-center justify-center p-8">
            <div className="max-w-md text-center space-y-8">
                <div className="w-20 h-20 mx-auto rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                    <span className="text-3xl font-black text-red-500">!</span>
                </div>
                <div className="space-y-3">
                    <h2 className="text-2xl font-black tracking-tight">System Error</h2>
                    <p className="text-sm text-gray-500 leading-relaxed">
                        An unexpected error occurred in the application runtime. This may be caused by cached data from a previous session.
                    </p>
                </div>
                <div className="flex flex-col gap-3">
                    <button
                        onClick={handleReset}
                        className="w-full py-4 bg-primary text-white rounded-xl text-xs font-black uppercase tracking-widest hover:scale-105 transition-all"
                    >
                        Clear Cache & Retry
                    </button>
                    <button
                        onClick={() => window.location.href = "/"}
                        className="w-full py-4 bg-gray-100 text-gray-600 rounded-xl text-xs font-bold hover:bg-gray-200 transition-all border border-gray-200"
                    >
                        Return to Home
                    </button>
                </div>
            </div>
        </div>
    );
}
