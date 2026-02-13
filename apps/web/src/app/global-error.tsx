"use client";

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    return (
        <html>
            <body className="bg-white text-gray-900">
                <div className="min-h-screen flex items-center justify-center p-8">
                    <div className="max-w-md text-center space-y-8">
                        <div className="w-20 h-20 mx-auto rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                            <span className="text-3xl font-black text-red-500">!</span>
                        </div>
                        <div className="space-y-3">
                            <h2 className="text-2xl font-black tracking-tight">Critical Error</h2>
                            <p className="text-sm text-gray-500 leading-relaxed">
                                The application encountered a critical error. Please clear your browser cache and try again.
                            </p>
                        </div>
                        <div className="flex flex-col gap-3">
                            <button
                                onClick={() => {
                                    try { localStorage.clear(); } catch {}
                                    reset();
                                }}
                                className="w-full py-4 bg-primary text-white rounded-xl text-xs font-black uppercase tracking-widest"
                            >
                                Clear Cache & Retry
                            </button>
                        </div>
                    </div>
                </div>
            </body>
        </html>
    );
}
