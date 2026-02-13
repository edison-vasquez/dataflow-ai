"use client";

import React from "react";
import {
    FileText,
    Download,
    Share2,
    CheckCircle2,
    Presentation,
    FileSpreadsheet,
    FileJson,
    Crown,
    Cloud,
    Shield,
    Globe,
    ArrowUpRight,
    Search,
    Clock,
    Zap,
    Cpu,
    Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/useAppStore";
import { exportToPDF, exportToCSV, exportToExcel, exportDataQualityReport, exportAuditReport } from "@/lib/exporters";
import { motion } from "framer-motion";
import { useT } from "@/lib/i18n";
import { ConsultancyReportWizard } from "./ConsultancyReportWizard";

export function ReportsView() {
    const { dataset, datasetName, transformations, charts, setPhase, dataProfile, issues } = useAppStore();
    const t = useT();
    const [mode, setMode] = React.useState<'export' | 'consultancy'>('export');

    const exportFormats = [
        { id: 'pdf', name: t('reportPdf'), description: t('reportPdfDesc'), icon: FileText, premium: false },
        { id: 'quality', name: t('qualityReportPdf'), description: t('qualityReportPdfDesc'), icon: Shield, premium: false },
        { id: 'audit', name: t('auditTrailPdf'), description: t('auditTrailPdfDesc'), icon: Clock, premium: false },
        { id: 'csv', name: t('cleanDataCsv'), description: t('cleanDataCsvDesc'), icon: FileSpreadsheet, premium: false },
        { id: 'excel', name: t('excelXlsx'), description: t('excelXlsxDesc'), icon: FileSpreadsheet, premium: false },
        { id: 'json', name: t('fullExportJson'), description: t('fullExportJsonDesc'), icon: FileJson, premium: false },
    ];

    const handleExport = (formatId: string) => {
        if (formatId === 'pdf') {
            exportToPDF({
                projectName: datasetName || 'Intelligence Phase Output',
                transformations,
                chartsCount: charts.length
            });
        } else if (formatId === 'csv') {
            if (!dataset) return;
            exportToCSV(dataset, `${datasetName || 'dataflow'}_optimized.csv`);
        } else if (formatId === 'json') {
            if (!dataset) return;
            const blob = new Blob([JSON.stringify({
                metadata: { datasetName, transformations, chartsCount: charts.length },
                data: dataset
            }, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${datasetName || 'dataflow'}_snapshot.json`;
            a.click();
        } else if (formatId === 'excel') {
            if (!dataset) return;
            exportToExcel(dataset, `${datasetName || 'dataflow'}_data.xlsx`);
        } else if (formatId === 'quality') {
            if (dataProfile) {
                exportDataQualityReport(dataProfile, issues || []);
            } else if (dataset) {
                exportDataQualityReport({
                    rowCount: dataset.length,
                    columnCount: Object.keys(dataset[0] || {}).length,
                    qualityScore: 0,
                    completenessPercentage: 100,
                    duplicateRows: 0,
                    columns: {}
                }, issues || []);
            }
        } else if (formatId === 'audit') {
            exportAuditReport(transformations, {
                datasetName: datasetName || 'Unknown',
                finalRowCount: dataset?.length,
                finalColumnCount: dataset && dataset.length > 0 ? Object.keys(dataset[0]).length : 0,
            });
        }
    };

    if (!dataset) {
        return (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-12 fade-in py-20">
                <div className="w-20 h-20 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center relative group">
                    <div className="absolute inset-0 bg-primary/5 blur-3xl rounded-full" />
                    <Cloud className="w-12 h-12 text-gray-300 group-hover:text-gray-400 transition-all duration-700" />
                </div>
                <div className="space-y-6">
                    <h2 className="text-2xl font-black tracking-tighter text-gray-900">{t('noDataExport')}</h2>
                    <p className="text-gray-400 font-medium max-w-md mx-auto leading-relaxed">
                        {t('noDataExportDesc')}
                    </p>
                </div>
                <button
                    onClick={() => setPhase('workspace')}
                    className="px-8 py-3 bg-primary text-white rounded-2xl text-[11px] font-black uppercase tracking-wider hover:scale-[1.05] transition-all"
                >
                    {t('uploadData')}
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-10 py-6 fade-in pb-16">
            {/* Enterprise Header */}
            <div className="flex flex-col gap-6">
                <div className="flex items-center gap-4">
                    <div className="px-4 py-1.5 rounded-lg bg-primary/10 border border-primary/20 flex items-center gap-2.5">
                        <Globe className="w-3.5 h-3.5 text-primary" />
                        <span className="text-[10px] font-black uppercase tracking-wider text-primary">{t('export')}</span>
                    </div>
                    <div className="h-px w-12 bg-gray-200" />
                    <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">{t('reports')}</span>
                    <div className="h-px w-12 bg-gray-200" />
                    <span className="text-[10px] font-black uppercase tracking-wider text-primary italic">{t('aiConsultantSuite')}</span>
                </div>

                <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
                    <div className="space-y-4">
                        <motion.h1
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="text-4xl font-black tracking-tighter text-gray-900"
                        >
                            {t('reportsExport')}
                        </motion.h1>
                        <p className="text-gray-600 font-medium max-w-xl text-lg leading-relaxed">
                            {t('exportDataset', { name: datasetName || '' })}
                        </p>
                    </div>

                    <div className="flex items-center p-1 bg-gray-100 rounded-2xl border border-gray-200">
                        <button
                            onClick={() => setMode('export')}
                            className={cn(
                                "px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all",
                                mode === 'export' ? "bg-white text-gray-900 shadow-sm" : "text-gray-400 hover:text-gray-600"
                            )}
                        >
                            {t('standardExport')}
                        </button>
                        <button
                            onClick={() => setMode('consultancy')}
                            className={cn(
                                "px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-2",
                                mode === 'consultancy' ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-gray-400 hover:text-gray-600"
                            )}
                        >
                            <Sparkles className="w-3 h-3" />
                            {t('aiConsultancy')}
                        </button>
                    </div>
                </div>
            </div>

            {mode === 'consultancy' ? (
                <div className="max-w-4xl mx-auto py-4">
                    <ConsultancyReportWizard />
                </div>
            ) : (
                <>
                    {/* Executive Summary Overlay */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-6 rounded-2xl bg-primary/5 border border-primary/10 relative overflow-hidden group shadow-sm"
                    >
                        <div className="absolute top-0 right-0 p-12 opacity-[0.05] grayscale group-hover:scale-125 transition-transform duration-1000">
                            <FileText className="w-48 h-48 text-gray-900" />
                        </div>
                        <div className="flex flex-col md:flex-row items-center gap-6 relative z-10">
                            <div className="w-14 h-14 rounded-2xl bg-primary text-white flex items-center justify-center shadow-2xl shrink-0">
                                <Zap className="w-7 h-7 fill-current" />
                            </div>
                            <div className="space-y-4 flex-1">
                                <div className="flex items-center gap-3">
                                    <span className="text-[10px] font-black uppercase tracking-wide text-primary">{t('summary')}</span>
                                    <div className="h-px flex-1 bg-gray-200" />
                                </div>
                                <h3 className="text-xl font-black text-gray-900 tracking-tight">{t('analysisSummary')}</h3>
                                <p className="text-gray-600 font-medium leading-relaxed max-w-3xl text-base">
                                    {t('analysisSummaryDesc', { name: datasetName || '', charts: String(charts.length), transforms: String(transformations.length) })}
                                </p>
                            </div>
                        </div>
                    </motion.div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        {/* Export Protocols */}
                        <div className="lg:col-span-8 space-y-5">
                            <h2 className="text-[10px] font-black uppercase tracking-wider text-gray-400 italic px-4">{t('exportFormats')}</h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {exportFormats.map((format, idx) => {
                                    const Icon = format.icon;
                                    return (
                                        <motion.div
                                            key={format.id}
                                            initial={{ opacity: 0, scale: 0.98 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: idx * 0.1 }}
                                            className="p-6 rounded-2xl bg-white shadow-sm border border-gray-200 hover:border-primary/30 transition-all flex flex-col justify-between group h-[240px]"
                                        >
                                            <div className="space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center shadow-sm group-hover:rotate-6 transition-transform">
                                                        <Icon className="w-8 h-8" />
                                                    </div>
                                                    {format.premium && (
                                                        <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20">
                                                            <Crown className="w-3 h-3 text-primary fill-primary" />
                                                            <span className="text-[9px] font-black uppercase tracking-widest text-primary">{t('premium')}</span>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="space-y-2">
                                                    <h3 className="text-xl font-black text-gray-900">{format.name}</h3>
                                                    <p className="text-sm text-gray-600 font-medium leading-relaxed">{format.description}</p>
                                                </div>
                                            </div>

                                            <button
                                                onClick={() => handleExport(format.id)}
                                                className={cn(
                                                    "w-full py-3 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-3 active:scale-95",
                                                    format.premium
                                                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                                        : "bg-primary text-white hover:bg-primary/90 shadow-sm"
                                                )}
                                            >
                                                <Download className="w-4 h-4" />
                                                {t('download')}
                                            </button>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Audit & Sharing */}
                        <div className="lg:col-span-4 space-y-6">
                            <div className="p-6 rounded-2xl bg-white text-gray-900 space-y-5 shadow-sm border border-gray-200 group overflow-hidden relative">
                                <div className="absolute top-0 right-0 p-12 opacity-[0.03] group-hover:scale-125 transition-transform duration-1000">
                                    <Zap className="w-48 h-48 text-gray-900" />
                                </div>

                                <div className="space-y-3 relative z-10">
                                    <h2 className="text-xl font-black tracking-tighter italic">{t('share')}</h2>
                                    <p className="text-gray-600 font-semibold leading-relaxed">
                                        {t('shareDesc')}
                                    </p>
                                </div>

                                <div className="space-y-6 relative z-10">
                                    {[
                                        { label: t('secureAccess'), icon: Shield },
                                        { label: t('fastDelivery'), icon: Globe },
                                    ].map((item, i) => (
                                        <div key={i} className="flex items-center gap-4">
                                            <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                                                <item.icon className="w-5 h-5 text-gray-600" />
                                            </div>
                                            <span className="text-[10px] font-black uppercase tracking-wide text-gray-600">{item.label}</span>
                                        </div>
                                    ))}
                                </div>

                                <button
                                    className="w-full py-3.5 bg-primary text-white rounded-xl text-[11px] font-black uppercase tracking-wider flex items-center justify-center gap-4 hover:scale-[1.03] transition-all shadow-sm active:scale-95 relative z-10"
                                >
                                    {t('createShareLink')}
                                    <ArrowUpRight className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="p-5 rounded-xl bg-gray-50 border border-gray-200 space-y-5">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-[10px] font-black uppercase tracking-wider text-gray-500 italic">{t('activityLog')}</h3>
                                    <Clock className="w-4 h-4 text-gray-400" />
                                </div>

                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <span className="text-[9px] font-black uppercase text-gray-500 tracking-wide">{t('transformations')}</span>
                                            <p className="text-xl font-black text-gray-900">{transformations.length}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <span className="text-[9px] font-black uppercase text-gray-500 tracking-wide">{t('insights')}</span>
                                            <p className="text-xl font-black text-gray-900">{charts.length}</p>
                                        </div>
                                    </div>

                                    <div className="space-y-5 pt-6 border-t border-gray-200">
                                        {transformations.slice(-2).reverse().map((tr) => (
                                            <div key={tr.id} className="flex items-center gap-4">
                                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                                <span className="text-[11px] font-bold text-gray-600">{tr.type}</span>
                                                <span className="ml-auto text-[9px] font-black text-gray-400">{t('success')}</span>
                                            </div>
                                        ))}
                                        {transformations.length === 0 && <p className="text-xs text-gray-300 italic">{t('auditLogInit')}</p>}
                                    </div>

                                    <div className="pt-6 border-t border-gray-200 flex items-center justify-between gap-3">
                                        <span className="text-[9px] font-black uppercase text-gray-500 tracking-[0.1em] px-3 py-1 bg-gray-100 rounded-full">{t('poweredByAi')}</span>
                                        <Clock className="w-4 h-4 text-gray-400" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
