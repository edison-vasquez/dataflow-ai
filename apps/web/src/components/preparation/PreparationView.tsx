"use client";

import React, { useState, useMemo, useCallback } from "react";
import {
    AlertCircle,
    CheckCircle2,
    Sparkles,
    ArrowRight,
    ShieldCheck,
    Database,
    Zap,
    RefreshCcw,
    FileCode,
    Activity,
    Shield,
    Trash2,
    Lock,
    Cpu,
    ChevronDown,
    ChevronRight,
    Wrench,
    Type,
    Hash,
    Calendar,
    Columns,
    FlaskConical,
    ArrowDownUp,
    Scissors,
    Merge,
    PenLine,
    X,
    Play,
    Settings2,
    Binary,
    Sigma,
    Regex,
    CaseSensitive,
    CaseUpper,
    CaseLower
} from "lucide-react";
import { useAppStore, Transformation } from "@/store/useAppStore";
import { applyTransformation, analyzeDataset, detectColumnTypesDetailed } from "@/lib/dataProcessor";
import {
    normalizeMinMax,
    normalizeZScore,
    normalizeRobust,
    oneHotEncode,
    labelEncode,
    equalWidthBin,
    equalFreqBin,
    extractDateFeatures,
    extractTextFeatures
} from "@/lib/featureEngineering";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ToolboxTab = 'missing' | 'outliers' | 'strings' | 'types' | 'columns' | 'features';

interface StrategyOption {
    label: string;
    value: string;
    transformationType: string;
    params: (field: string, extra?: any) => any;
    description: string;
}

// ---------------------------------------------------------------------------
// Strategy definitions
// ---------------------------------------------------------------------------

const NULL_STRATEGIES: StrategyOption[] = [
    { label: "imputeMean", value: "mean", transformationType: "impute_mean", params: (f) => ({ field: f }), description: "stratMeanDesc" },
    { label: "imputeMedian", value: "median", transformationType: "impute_median", params: (f) => ({ field: f }), description: "stratMedianDesc" },
    { label: "imputeMode", value: "mode", transformationType: "impute_mode", params: (f) => ({ field: f }), description: "stratModeDesc" },
    { label: "forwardFill", value: "ffill", transformationType: "impute_forward_fill", params: (f) => ({ field: f }), description: "stratForwardFillDesc" },
    { label: "backwardFill", value: "bfill", transformationType: "impute_backward_fill", params: (f) => ({ field: f }), description: "stratBackwardFillDesc" },
    { label: "dropNullRows", value: "drop", transformationType: "drop_rows_with_nulls", params: (f) => ({ field: f }), description: "stratDropRowsDesc" },
];

const OUTLIER_STRATEGIES: StrategyOption[] = [
    { label: "capOutliers", value: "cap", transformationType: "outlier_cap", params: (f) => ({ field: f }), description: "iqrCapDesc" },
    { label: "winsorize", value: "winsorize", transformationType: "outlier_winsorize", params: (f) => ({ field: f, percentile: 5 }), description: "winsorizeDesc" },
    { label: "removeRowsLabel", value: "remove", transformationType: "outlier_remove", params: (f) => ({ field: f }), description: "removeRowsDesc" },
    { label: "logTransform", value: "log", transformationType: "outlier_log_transform", params: (f) => ({ field: f }), description: "logTransformDesc" },
];

const DUPLICATE_STRATEGIES: StrategyOption[] = [
    { label: "removeDuplicates", value: "remove", transformationType: "remove_duplicates", params: () => ({}), description: "removeDuplicates" },
];

function getStrategiesForIssueType(type: string): StrategyOption[] {
    switch (type) {
        case 'null': return NULL_STRATEGIES;
        case 'outlier': return OUTLIER_STRATEGIES;
        case 'duplicate': return DUPLICATE_STRATEGIES;
        default: return [];
    }
}

// ---------------------------------------------------------------------------
// Helper: apply and record transformation
// ---------------------------------------------------------------------------

function useApplyTransformation() {
    const { dataset, datasetName, setDataset, setIssues, addTransformation, persistTransformation, addToast } = useAppStore();
    const t = useT();

    return useCallback((transformationType: string, params: any, label?: string) => {
        if (!dataset) return;
        try {
            const newData = applyTransformation(dataset, transformationType, params);
            setDataset(newData, datasetName);
            setIssues(analyzeDataset(newData));
            const tx: Transformation = {
                id: Math.random().toString(36).slice(2),
                type: transformationType,
                params,
                timestamp: new Date(),
            };
            addTransformation(tx);
            persistTransformation(tx);

            addToast({
                type: 'success',
                message: t('transformationApplied') || 'Transformation Applied',
                description: `${transformationType.replace(/_/g, ' ').toUpperCase()} on ${params.field || 'dataset'}`,
                duration: 3000
            });
        } catch (error) {
            addToast({
                type: 'error',
                message: t('transformationError') || 'Transformation Error',
                description: error instanceof Error ? error.message : 'Unknown error',
            });
        }
    }, [dataset, datasetName, setDataset, setIssues, addTransformation, persistTransformation, addToast, t]);
}

// Same pattern but for feature engineering functions that return data directly
function useApplyFeatureEngineering() {
    const { dataset, datasetName, setDataset, setIssues, addTransformation, persistTransformation } = useAppStore();

    return useCallback((featureFn: (data: any[], ...args: any[]) => any[], args: any[], label: string) => {
        if (!dataset) return;
        const newData = featureFn(dataset, ...args);
        setDataset(newData, datasetName);
        setIssues(analyzeDataset(newData));
        const tx: Transformation = {
            id: Math.random().toString(36).slice(2),
            type: label,
            params: { args },
            timestamp: new Date(),
        };
        addTransformation(tx);
        persistTransformation(tx);
    }, [dataset, datasetName, setDataset, setIssues, addTransformation, persistTransformation]);
}

// ---------------------------------------------------------------------------
// Sub-component: Issue Card with expandable strategy panel
// ---------------------------------------------------------------------------

function IssueCard({ issue, index }: { issue: any; index: number }) {
    const t = useT();
    const [expanded, setExpanded] = useState(false);
    const [selectedStrategy, setSelectedStrategy] = useState<string | null>(null);
    const applyTx = useApplyTransformation();

    const strategies = getStrategiesForIssueType(issue.type);

    const handleApply = () => {
        if (!selectedStrategy) return;
        const strategy = strategies.find(s => s.value === selectedStrategy);
        if (!strategy) return;
        applyTx(strategy.transformationType, strategy.params(issue.field), strategy.label);
        setExpanded(false);
        setSelectedStrategy(null);
    };

    const handleQuickFix = (strategy: StrategyOption) => {
        applyTx(strategy.transformationType, strategy.params(issue.field), strategy.label);
    };

    return (
        <motion.div
            key={issue.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ delay: index * 0.05 }}
            className="group rounded-xl bg-white shadow-sm border border-gray-200 hover:border-gray-300 transition-all overflow-hidden"
        >
            {/* Issue Header Row */}
            <div
                className="p-6 flex items-center justify-between cursor-pointer select-none"
                onClick={() => setExpanded(!expanded)}
            >
                <div className="flex items-center gap-4">
                    <div className={cn(
                        "w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-lg transition-transform group-hover:scale-110 duration-500",
                        issue.severity === 'high' ? "bg-red-500/10 text-red-500" :
                            issue.severity === 'medium' ? "bg-amber-500/10 text-amber-500" : "bg-blue-500/10 text-blue-500"
                    )}>
                        <AlertCircle className="w-6 h-6" />
                    </div>
                    <div className="space-y-2">
                        <div className="flex items-center gap-4">
                            <h3 className="font-bold text-base text-gray-900 tracking-tight">{issue.field}</h3>
                            <span className={cn(
                                "text-[9px] font-black uppercase tracking-wide px-3 py-1.5 rounded-full border",
                                issue.severity === 'high' ? "bg-red-500/5 border-red-500/20 text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.1)]" :
                                    issue.severity === 'medium' ? "bg-amber-500/5 border-amber-500/20 text-amber-500" : "bg-blue-500/5 border-blue-500/20 text-blue-500"
                            )}>{issue.type} {t('detected')}</span>
                        </div>
                        <p className="text-xs text-gray-500 font-medium">{t('foundOccurrences', { count: issue.count })}. <span className="italic block mt-1">{issue.suggestion}</span></p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            // Quick fix with default strategy
                            const defaultStrategy = strategies[0];
                            if (defaultStrategy) handleQuickFix(defaultStrategy);
                        }}
                        className="px-6 py-2.5 rounded-lg bg-gray-100 hover:bg-primary text-gray-600 hover:text-white transition-all text-[10px] font-black uppercase tracking-wide border border-gray-200"
                    >
                        {t('fix')}
                    </button>
                    <div className={cn(
                        "w-8 h-8 rounded-lg bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-400 transition-all",
                        expanded && "bg-primary/5 border-primary/20 text-primary"
                    )}>
                        {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </div>
                </div>
            </div>

            {/* Expandable Strategy Panel */}
            <AnimatePresence>
                {expanded && strategies.length > 0 && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="overflow-hidden"
                    >
                        <div className="px-6 pb-6 pt-2 border-t border-gray-100">
                            <div className="flex items-center gap-3 mb-4">
                                <Settings2 className="w-3.5 h-3.5 text-gray-400" />
                                <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">{t('resolveStrategies')}</span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                {strategies.map((strategy) => (
                                    <button
                                        key={strategy.value}
                                        onClick={() => setSelectedStrategy(
                                            selectedStrategy === strategy.value ? null : strategy.value
                                        )}
                                        className={cn(
                                            "p-4 rounded-xl border text-left transition-all",
                                            selectedStrategy === strategy.value
                                                ? "border-primary/30 bg-primary/5 shadow-md"
                                                : "border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-gray-100"
                                        )}
                                    >
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className={cn(
                                                "w-4 h-4 rounded-full border-2 flex items-center justify-center",
                                                selectedStrategy === strategy.value
                                                    ? "border-primary"
                                                    : "border-gray-300"
                                            )}>
                                                {selectedStrategy === strategy.value && (
                                                    <div className="w-2 h-2 rounded-full bg-primary" />
                                                )}
                                            </div>
                                            <span className="text-[11px] font-bold text-gray-900">{t(strategy.label as any)}</span>
                                        </div>
                                        <p className="text-[10px] text-gray-500 font-medium leading-relaxed pl-7">
                                            {t(strategy.description as any)}
                                        </p>
                                    </button>
                                ))}
                            </div>
                            {selectedStrategy && (
                                <motion.div
                                    initial={{ opacity: 0, y: 5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="mt-4 flex items-center gap-3"
                                >
                                    <button
                                        onClick={handleApply}
                                        className="px-6 py-2.5 bg-primary text-white rounded-lg text-[10px] font-black uppercase tracking-wider hover:scale-[1.03] transition-all shadow-lg flex items-center gap-2"
                                    >
                                        <Play className="w-3 h-3" />
                                        {t('apply')} {t(strategies.find(s => s.value === selectedStrategy)?.label as any)}
                                    </button>
                                    <button
                                        onClick={() => setSelectedStrategy(null)}
                                        className="px-4 py-2.5 bg-gray-100 text-gray-600 rounded-lg text-[10px] font-black uppercase tracking-wider hover:bg-gray-200 transition-all border border-gray-200"
                                    >
                                        {t('cancelAction')}
                                    </button>
                                </motion.div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

// ---------------------------------------------------------------------------
// Sub-component: Cleaning Toolbox
// ---------------------------------------------------------------------------

function CleaningToolbox() {
    const t = useT();
    const { dataset } = useAppStore();
    const [activeTab, setActiveTab] = useState<ToolboxTab>('missing');
    const applyTx = useApplyTransformation();
    const applyFE = useApplyFeatureEngineering();

    const columns = useMemo(() => {
        if (!dataset || dataset.length === 0) return [];
        return Object.keys(dataset[0]);
    }, [dataset]);

    const columnTypes = useMemo(() => {
        if (!dataset || dataset.length === 0) return {} as Record<string, any>;
        return detectColumnTypesDetailed(dataset);
    }, [dataset]);

    const numericColumns = useMemo(() =>
        columns.filter(c => columnTypes[c]?.type === 'numeric'),
        [columns, columnTypes]
    );

    const categoricalColumns = useMemo(() =>
        columns.filter(c => columnTypes[c]?.type === 'categorical' || columnTypes[c]?.type === 'text'),
        [columns, columnTypes]
    );

    const dateColumns = useMemo(() =>
        columns.filter(c => columnTypes[c]?.type === 'date'),
        [columns, columnTypes]
    );

    if (!dataset || columns.length === 0) return null;

    const TABS: { id: ToolboxTab; label: string; icon: React.ElementType }[] = [
        { id: 'missing', label: 'missingValues', icon: AlertCircle },
        { id: 'outliers', label: 'outliers', icon: Activity },
        { id: 'strings', label: 'strings', icon: Type },
        { id: 'types', label: 'types', icon: Binary },
        { id: 'columns', label: 'columnOps', icon: Columns },
        { id: 'features', label: 'featureEng', icon: FlaskConical },
    ];

    return (
        <section className="space-y-6 pt-10">
            <div className="flex items-center justify-between px-4">
                <div className="flex items-center gap-3">
                    <Wrench className="w-4 h-4 text-gray-400" />
                    <h3 className="text-[10px] font-black uppercase tracking-wider text-gray-400">{t('cleaningToolbox')}</h3>
                </div>
                <div className="h-px flex-1 bg-gray-200 mx-8" />
            </div>

            <div className="rounded-2xl bg-white border border-gray-200 shadow-sm overflow-hidden">
                {/* Tab bar */}
                <div className="flex border-b border-gray-200 overflow-x-auto">
                    {TABS.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={cn(
                                "flex items-center gap-2 px-5 py-3.5 text-[10px] font-black uppercase tracking-wider transition-all whitespace-nowrap border-b-2",
                                activeTab === tab.id
                                    ? "text-primary border-primary bg-primary/5"
                                    : "text-gray-400 border-transparent hover:text-gray-600 hover:bg-gray-50"
                            )}
                        >
                            <tab.icon className="w-3.5 h-3.5" />
                            {t(tab.label as any)}
                        </button>
                    ))}
                </div>

                {/* Tab content */}
                <div className="p-6">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={{ duration: 0.15 }}
                        >
                            {activeTab === 'missing' && <MissingValuesTab columns={columns} applyTx={applyTx} />}
                            {activeTab === 'outliers' && <OutliersTab columns={numericColumns} applyTx={applyTx} />}
                            {activeTab === 'strings' && <StringsTab columns={columns} applyTx={applyTx} />}
                            {activeTab === 'types' && <TypesTab columns={columns} applyTx={applyTx} />}
                            {activeTab === 'columns' && <ColumnsTab columns={columns} applyTx={applyTx} />}
                            {activeTab === 'features' && (
                                <FeaturesTab
                                    columns={columns}
                                    numericColumns={numericColumns}
                                    categoricalColumns={categoricalColumns}
                                    dateColumns={dateColumns}
                                    applyFE={applyFE}
                                />
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>
        </section>
    );
}

// ---------------------------------------------------------------------------
// Toolbox tab: Missing Values
// ---------------------------------------------------------------------------

function MissingValuesTab({ columns, applyTx }: { columns: string[]; applyTx: ReturnType<typeof useApplyTransformation> }) {
    const t = useT();
    const [selectedCol, setSelectedCol] = useState('');
    const [strategy, setStrategy] = useState('impute_mean');
    const [customValue, setCustomValue] = useState('');

    const strategies = [
        { value: 'impute_mean', label: 'imputeMean', desc: 'stratMeanDesc' },
        { value: 'impute_median', label: 'imputeMedian', desc: 'stratMedianDesc' },
        { value: 'impute_mode', label: 'imputeMode', desc: 'stratModeDesc' },
        { value: 'impute_forward_fill', label: 'forwardFill', desc: 'stratForwardFillDesc' },
        { value: 'impute_backward_fill', label: 'backwardFill', desc: 'stratBackwardFillDesc' },
        { value: 'impute_nulls', label: 'stratCustomValue', desc: 'stratCustomValueDesc' },
        { value: 'drop_rows_with_nulls', label: 'dropNullRows', desc: 'stratDropRowsDesc' },
    ];

    const handleApply = () => {
        if (!selectedCol) return;
        const params: any = { field: selectedCol };
        if (strategy === 'impute_nulls') {
            params.value = isNaN(Number(customValue)) ? customValue : Number(customValue);
        }
        applyTx(strategy, params);
    };

    return (
        <div className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <ToolboxSelect label={t('column')} value={selectedCol} onChange={setSelectedCol} options={columns} placeholder={t('selectColumnPlaceholder')} />
                <div />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {strategies.map((s) => (
                    <button
                        key={s.value}
                        onClick={() => setStrategy(s.value)}
                        className={cn(
                            "p-3 rounded-xl border text-left transition-all",
                            strategy === s.value ? "border-primary/30 bg-primary/5" : "border-gray-200 bg-gray-50 hover:border-gray-300"
                        )}
                    >
                        <div className="flex items-center gap-2 mb-1">
                            <div className={cn("w-3 h-3 rounded-full border-2", strategy === s.value ? "border-primary" : "border-gray-300")}>
                                {strategy === s.value && <div className="w-1.5 h-1.5 rounded-full bg-primary m-[1px]" />}
                            </div>
                            <span className="text-[10px] font-bold text-gray-900">{t(s.label as any)}</span>
                        </div>
                        <p className="text-[9px] text-gray-500 pl-5">{t(s.desc as any)}</p>
                    </button>
                ))}
            </div>
            {strategy === 'impute_nulls' && (
                <input
                    type="text"
                    value={customValue}
                    onChange={(e) => setCustomValue(e.target.value)}
                    placeholder={t('enterCustomValue')}
                    className="w-full max-w-sm px-4 py-2.5 rounded-lg border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30"
                />
            )}
            <ToolboxApplyButton disabled={!selectedCol} onClick={handleApply} />
        </div>
    );
}

// ---------------------------------------------------------------------------
// Toolbox tab: Outliers
// ---------------------------------------------------------------------------

function OutliersTab({ columns, applyTx }: { columns: string[]; applyTx: ReturnType<typeof useApplyTransformation> }) {
    const t = useT();
    const [selectedCol, setSelectedCol] = useState('');
    const [method, setMethod] = useState('outlier_cap');

    const methods = [
        { value: 'outlier_cap', label: 'capOutliers', desc: 'iqrCapDesc' },
        { value: 'outlier_winsorize', label: 'winsorize', desc: 'winsorizeDesc' },
        { value: 'outlier_remove', label: 'removeRowsLabel', desc: 'removeRowsDesc' },
        { value: 'outlier_log_transform', label: 'logTransform', desc: 'logTransformDesc' },
    ];

    const handleApply = () => {
        if (!selectedCol) return;
        applyTx(method, { field: selectedCol });
    };

    return (
        <div className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <ToolboxSelect label={t('column')} value={selectedCol} onChange={setSelectedCol} options={columns} placeholder={t('selectNumericColumn')} />
                <div />
            </div>
            {columns.length === 0 && (
                <p className="text-xs text-gray-400 italic">{t('noNumericCols')}</p>
            )}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {methods.map((m) => (
                    <button
                        key={m.value}
                        onClick={() => setMethod(m.value)}
                        className={cn(
                            "p-3 rounded-xl border text-left transition-all",
                            method === m.value ? "border-primary/30 bg-primary/5" : "border-gray-200 bg-gray-50 hover:border-gray-300"
                        )}
                    >
                        <div className="flex items-center gap-2 mb-1">
                            <div className={cn("w-3 h-3 rounded-full border-2", method === m.value ? "border-primary" : "border-gray-300")}>
                                {method === m.value && <div className="w-1.5 h-1.5 rounded-full bg-primary m-[1px]" />}
                            </div>
                            <span className="text-[10px] font-bold text-gray-900">{t(m.label as any)}</span>
                        </div>
                        <p className="text-[9px] text-gray-500 pl-5">{t(m.desc as any)}</p>
                    </button>
                ))}
            </div>
            <ToolboxApplyButton disabled={!selectedCol} onClick={handleApply} />
        </div>
    );
}

// ---------------------------------------------------------------------------
// Toolbox tab: Strings
// ---------------------------------------------------------------------------

function StringsTab({ columns, applyTx }: { columns: string[]; applyTx: ReturnType<typeof useApplyTransformation> }) {
    const t = useT();
    const [selectedCol, setSelectedCol] = useState('');
    const [operation, setOperation] = useState('string_trim');
    const [regexPattern, setRegexPattern] = useState('');
    const [regexReplacement, setRegexReplacement] = useState('');

    const operations = [
        { value: 'string_trim', label: 'trimWhitespace', icon: Scissors },
        { value: 'string_lowercase', label: 'toLowercase', icon: CaseLower },
        { value: 'string_uppercase', label: 'toUppercase', icon: CaseUpper },
        { value: 'string_regex_replace', label: 'regexReplaceOp', icon: Regex },
    ];

    const handleApply = () => {
        if (!selectedCol) return;
        const params: any = { field: selectedCol };
        if (operation === 'string_regex_replace') {
            params.pattern = regexPattern;
            params.replacement = regexReplacement;
        }
        applyTx(operation, params);
    };

    return (
        <div className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <ToolboxSelect label={t('column')} value={selectedCol} onChange={setSelectedCol} options={columns} placeholder={t('selectColumnPlaceholder')} />
                <div />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {operations.map((op) => (
                    <button
                        key={op.value}
                        onClick={() => setOperation(op.value)}
                        className={cn(
                            "p-4 rounded-xl border text-left transition-all flex items-center gap-3",
                            operation === op.value ? "border-primary/30 bg-primary/5" : "border-gray-200 bg-gray-50 hover:border-gray-300"
                        )}
                    >
                        <op.icon className={cn("w-4 h-4", operation === op.value ? "text-primary" : "text-gray-400")} />
                        <span className="text-[10px] font-bold text-gray-900">{t(op.label as any)}</span>
                    </button>
                ))}
            </div>
            {operation === 'string_regex_replace' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <input
                        type="text"
                        value={regexPattern}
                        onChange={(e) => setRegexPattern(e.target.value)}
                        placeholder={t('regexPatternPlaceholder')}
                        className="px-4 py-2.5 rounded-lg border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30"
                    />
                    <input
                        type="text"
                        value={regexReplacement}
                        onChange={(e) => setRegexReplacement(e.target.value)}
                        placeholder={t('replacementText')}
                        className="px-4 py-2.5 rounded-lg border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30"
                    />
                </div>
            )}
            <ToolboxApplyButton disabled={!selectedCol} onClick={handleApply} />
        </div>
    );
}

// ---------------------------------------------------------------------------
// Toolbox tab: Types
// ---------------------------------------------------------------------------

function TypesTab({ columns, applyTx }: { columns: string[]; applyTx: ReturnType<typeof useApplyTransformation> }) {
    const t = useT();
    const [selectedCol, setSelectedCol] = useState('');
    const [targetType, setTargetType] = useState('convert_to_number');

    const types = [
        { value: 'convert_to_number', label: 'numberType', icon: Hash },
        { value: 'convert_to_string', label: 'stringType', icon: Type },
        { value: 'convert_to_date', label: 'dateType', icon: Calendar },
    ];

    const handleApply = () => {
        if (!selectedCol) return;
        applyTx(targetType, { field: selectedCol });
    };

    return (
        <div className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <ToolboxSelect label={t('column')} value={selectedCol} onChange={setSelectedCol} options={columns} placeholder={t('selectColumnPlaceholder')} />
                <div />
            </div>
            <div className="grid grid-cols-3 gap-3">
                {types.map((tp) => (
                    <button
                        key={tp.value}
                        onClick={() => setTargetType(tp.value)}
                        className={cn(
                            "p-4 rounded-xl border text-center transition-all flex flex-col items-center gap-2",
                            targetType === tp.value ? "border-primary/30 bg-primary/5" : "border-gray-200 bg-gray-50 hover:border-gray-300"
                        )}
                    >
                        <tp.icon className={cn("w-5 h-5", targetType === tp.value ? "text-primary" : "text-gray-400")} />
                        <span className="text-[10px] font-bold text-gray-900">{t(tp.label as any)}</span>
                    </button>
                ))}
            </div>
            <ToolboxApplyButton disabled={!selectedCol} onClick={handleApply} />
        </div>
    );
}

// ---------------------------------------------------------------------------
// Toolbox tab: Columns
// ---------------------------------------------------------------------------

function ColumnsTab({ columns, applyTx }: { columns: string[]; applyTx: ReturnType<typeof useApplyTransformation> }) {
    const t = useT();
    const [operation, setOperation] = useState<'split' | 'merge' | 'rename' | 'drop' | 'computed'>('drop');

    // Split state
    const [splitCol, setSplitCol] = useState('');
    const [splitDelimiter, setSplitDelimiter] = useState(',');
    const [splitNewCols, setSplitNewCols] = useState('');

    // Merge state
    const [mergeFields, setMergeFields] = useState<string[]>([]);
    const [mergeNewName, setMergeNewName] = useState('');
    const [mergeSeparator, setMergeSeparator] = useState(' ');

    // Rename state
    const [renameOld, setRenameOld] = useState('');
    const [renameNew, setRenameNew] = useState('');

    // Drop state
    const [dropCol, setDropCol] = useState('');

    // Computed state
    const [computedNewName, setComputedNewName] = useState('');
    const [computedExpression, setComputedExpression] = useState('');

    const ops = [
        { id: 'drop' as const, label: 'dropOp', icon: Trash2 },
        { id: 'rename' as const, label: 'renameOp', icon: PenLine },
        { id: 'split' as const, label: 'splitOp', icon: Scissors },
        { id: 'merge' as const, label: 'mergeOp', icon: Merge },
        { id: 'computed' as const, label: 'computedOp', icon: Sigma },
    ];

    const handleApply = () => {
        switch (operation) {
            case 'split':
                if (!splitCol || !splitNewCols) return;
                applyTx('split_column', { field: splitCol, delimiter: splitDelimiter, newColumns: splitNewCols.split(',').map(s => s.trim()).filter(Boolean) });
                break;
            case 'merge':
                if (mergeFields.length < 2 || !mergeNewName) return;
                applyTx('merge_columns', { fields: mergeFields, newName: mergeNewName, separator: mergeSeparator });
                break;
            case 'rename':
                if (!renameOld || !renameNew) return;
                applyTx('rename_column', { oldName: renameOld, newName: renameNew });
                break;
            case 'drop':
                if (!dropCol) return;
                applyTx('drop_column', { column: dropCol });
                break;
            case 'computed':
                if (!computedNewName || !computedExpression) return;
                applyTx('computed_column', { newName: computedNewName, expression: computedExpression });
                break;
        }
    };

    const toggleMergeField = (col: string) => {
        setMergeFields(prev => prev.includes(col) ? prev.filter(c => c !== col) : [...prev, col]);
    };

    return (
        <div className="space-y-5">
            <div className="grid grid-cols-5 gap-3">
                {ops.map((op) => (
                    <button
                        key={op.id}
                        onClick={() => setOperation(op.id)}
                        className={cn(
                            "p-3 rounded-xl border text-center transition-all flex flex-col items-center gap-2",
                            operation === op.id ? "border-primary/30 bg-primary/5" : "border-gray-200 bg-gray-50 hover:border-gray-300"
                        )}
                    >
                        <op.icon className={cn("w-4 h-4", operation === op.id ? "text-primary" : "text-gray-400")} />
                        <span className="text-[9px] font-bold text-gray-900 uppercase tracking-wide">{t(op.label as any)}</span>
                    </button>
                ))}
            </div>

            {operation === 'drop' && (
                <ToolboxSelect label={t('columnToDrop')} value={dropCol} onChange={setDropCol} options={columns} placeholder={t('selectColumnPlaceholder')} />
            )}

            {operation === 'rename' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <ToolboxSelect label={t('column')} value={renameOld} onChange={setRenameOld} options={columns} placeholder={t('selectColumnPlaceholder')} />
                    <div className="space-y-2">
                        <label className="text-[9px] font-black uppercase tracking-wider text-gray-400">{t('newName')}</label>
                        <input
                            type="text"
                            value={renameNew}
                            onChange={(e) => setRenameNew(e.target.value)}
                            placeholder={t('newColumnName')}
                            className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30"
                        />
                    </div>
                </div>
            )}

            {operation === 'split' && (
                <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <ToolboxSelect label={t('columnToSplit')} value={splitCol} onChange={setSplitCol} options={columns} placeholder={t('selectColumnPlaceholder')} />
                        <div className="space-y-2">
                            <label className="text-[9px] font-black uppercase tracking-wider text-gray-400">{t('delimiter')}</label>
                            <input
                                type="text"
                                value={splitDelimiter}
                                onChange={(e) => setSplitDelimiter(e.target.value)}
                                placeholder=","
                                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30"
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[9px] font-black uppercase tracking-wider text-gray-400">{t('newColumnNamesCsv')}</label>
                        <input
                            type="text"
                            value={splitNewCols}
                            onChange={(e) => setSplitNewCols(e.target.value)}
                            placeholder="part_1, part_2, part_3"
                            className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30"
                        />
                    </div>
                </div>
            )}

            {operation === 'merge' && (
                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-[9px] font-black uppercase tracking-wider text-gray-400">{t('selectColumnsToMerge')} ({mergeFields.length} {t('mergedSelected')})</label>
                        <div className="flex flex-wrap gap-2">
                            {columns.map((col) => (
                                <button
                                    key={col}
                                    onClick={() => toggleMergeField(col)}
                                    className={cn(
                                        "px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all",
                                        mergeFields.includes(col) ? "bg-primary/10 border-primary/30 text-primary" : "bg-gray-50 border-gray-200 text-gray-600 hover:border-gray-300"
                                    )}
                                >
                                    {col}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[9px] font-black uppercase tracking-wider text-gray-400">{t('newColumnNameLabel')}</label>
                            <input
                                type="text"
                                value={mergeNewName}
                                onChange={(e) => setMergeNewName(e.target.value)}
                                placeholder="merged_column"
                                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[9px] font-black uppercase tracking-wider text-gray-400">{t('separatorLabel')}</label>
                            <input
                                type="text"
                                value={mergeSeparator}
                                onChange={(e) => setMergeSeparator(e.target.value)}
                                placeholder=" "
                                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30"
                            />
                        </div>
                    </div>
                </div>
            )}

            {operation === 'computed' && (
                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-[9px] font-black uppercase tracking-wider text-gray-400">{t('newColumnNameLabel')}</label>
                        <input
                            type="text"
                            value={computedNewName}
                            onChange={(e) => setComputedNewName(e.target.value)}
                            placeholder="new_column"
                            className="w-full max-w-sm px-4 py-2.5 rounded-lg border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[9px] font-black uppercase tracking-wider text-gray-400">{t('expressionLabel')}</label>
                        <input
                            type="text"
                            value={computedExpression}
                            onChange={(e) => setComputedExpression(e.target.value)}
                            placeholder={t('expressionPlaceholder')}
                            className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-gray-50 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30"
                        />
                    </div>
                </div>
            )}

            <ToolboxApplyButton
                disabled={
                    (operation === 'drop' && !dropCol) ||
                    (operation === 'rename' && (!renameOld || !renameNew)) ||
                    (operation === 'split' && (!splitCol || !splitNewCols)) ||
                    (operation === 'merge' && (mergeFields.length < 2 || !mergeNewName)) ||
                    (operation === 'computed' && (!computedNewName || !computedExpression))
                }
                onClick={handleApply}
            />
        </div>
    );
}

// ---------------------------------------------------------------------------
// Toolbox tab: Feature Engineering
// ---------------------------------------------------------------------------

function FeaturesTab({
    columns, numericColumns, categoricalColumns, dateColumns, applyFE
}: {
    columns: string[];
    numericColumns: string[];
    categoricalColumns: string[];
    dateColumns: string[];
    applyFE: ReturnType<typeof useApplyFeatureEngineering>;
}) {
    const t = useT();
    const [featureOp, setFeatureOp] = useState<'normalize' | 'encode' | 'bin' | 'date' | 'text'>('normalize');
    const [selectedCol, setSelectedCol] = useState('');

    // Normalize
    const [normMethod, setNormMethod] = useState<'minmax' | 'zscore' | 'robust'>('minmax');

    // Encode
    const [encodeMethod, setEncodeMethod] = useState<'onehot' | 'label'>('label');

    // Bin
    const [binMethod, setBinMethod] = useState<'equal_width' | 'equal_freq'>('equal_width');
    const [binCount, setBinCount] = useState(5);

    // Date features
    const [dateFeatures, setDateFeatures] = useState<string[]>(['year', 'month', 'day']);

    // Text features
    const [textFeatures, setTextFeatures] = useState<string[]>(['length', 'wordCount']);

    const featureOps = [
        { id: 'normalize' as const, label: 'normalizeOp', icon: ArrowDownUp },
        { id: 'encode' as const, label: 'encodeOp', icon: Binary },
        { id: 'bin' as const, label: 'binOp', icon: Hash },
        { id: 'date' as const, label: 'dateFeaturesOp', icon: Calendar },
        { id: 'text' as const, label: 'textFeaturesOp', icon: Type },
    ];

    const toggleDateFeature = (f: string) => {
        setDateFeatures(prev => prev.includes(f) ? prev.filter(x => x !== f) : [...prev, f]);
    };

    const toggleTextFeature = (f: string) => {
        setTextFeatures(prev => prev.includes(f) ? prev.filter(x => x !== f) : [...prev, f]);
    };

    const handleApply = () => {
        if (!selectedCol) return;
        switch (featureOp) {
            case 'normalize':
                if (normMethod === 'minmax') applyFE(normalizeMinMax, [selectedCol], 'normalize_minmax');
                else if (normMethod === 'zscore') applyFE(normalizeZScore, [selectedCol], 'normalize_zscore');
                else applyFE(normalizeRobust, [selectedCol], 'normalize_robust');
                break;
            case 'encode':
                if (encodeMethod === 'onehot') applyFE(oneHotEncode, [selectedCol], 'one_hot_encode');
                else applyFE(labelEncode, [selectedCol], 'label_encode');
                break;
            case 'bin':
                if (binMethod === 'equal_width') applyFE(equalWidthBin, [selectedCol, binCount], 'equal_width_bin');
                else applyFE(equalFreqBin, [selectedCol, binCount], 'equal_freq_bin');
                break;
            case 'date':
                if (dateFeatures.length > 0) applyFE(extractDateFeatures, [selectedCol, dateFeatures], 'extract_date_features');
                break;
            case 'text':
                if (textFeatures.length > 0) applyFE(extractTextFeatures, [selectedCol, textFeatures], 'extract_text_features');
                break;
        }
    };

    const relevantColumns = featureOp === 'normalize' || featureOp === 'bin'
        ? (numericColumns.length > 0 ? numericColumns : columns)
        : featureOp === 'encode'
            ? (categoricalColumns.length > 0 ? categoricalColumns : columns)
            : featureOp === 'date'
                ? (dateColumns.length > 0 ? dateColumns : columns)
                : columns;

    return (
        <div className="space-y-5">
            <div className="grid grid-cols-5 gap-3">
                {featureOps.map((op) => (
                    <button
                        key={op.id}
                        onClick={() => { setFeatureOp(op.id); setSelectedCol(''); }}
                        className={cn(
                            "p-3 rounded-xl border text-center transition-all flex flex-col items-center gap-2",
                            featureOp === op.id ? "border-primary/30 bg-primary/5" : "border-gray-200 bg-gray-50 hover:border-gray-300"
                        )}
                    >
                        <op.icon className={cn("w-4 h-4", featureOp === op.id ? "text-primary" : "text-gray-400")} />
                        <span className="text-[9px] font-bold text-gray-900 uppercase tracking-wide">{t(op.label as any)}</span>
                    </button>
                ))}
            </div>

            <ToolboxSelect
                label={t('column')}
                value={selectedCol}
                onChange={setSelectedCol}
                options={relevantColumns}
                placeholder={t('selectColumnPlaceholder')}
            />

            {featureOp === 'normalize' && (
                <div className="grid grid-cols-3 gap-3">
                    {([
                        { value: 'minmax', label: 'minMaxLabel' },
                        { value: 'zscore', label: 'zScoreLabel' },
                        { value: 'robust', label: 'robustIqrLabel' },
                    ] as const).map((m) => (
                        <button
                            key={m.value}
                            onClick={() => setNormMethod(m.value)}
                            className={cn(
                                "p-3 rounded-xl border text-center transition-all",
                                normMethod === m.value ? "border-primary/30 bg-primary/5" : "border-gray-200 bg-gray-50 hover:border-gray-300"
                            )}
                        >
                            <span className="text-[10px] font-bold text-gray-900">{t(m.label as any)}</span>
                        </button>
                    ))}
                </div>
            )}

            {featureOp === 'encode' && (
                <div className="grid grid-cols-2 gap-3">
                    {([
                        { value: 'onehot', label: 'oneHotLabel', desc: 'oneHotDesc' },
                        { value: 'label', label: 'labelEncodeLabel', desc: 'labelEncodeDesc' },
                    ] as const).map((m) => (
                        <button
                            key={m.value}
                            onClick={() => setEncodeMethod(m.value)}
                            className={cn(
                                "p-4 rounded-xl border text-left transition-all",
                                encodeMethod === m.value ? "border-primary/30 bg-primary/5" : "border-gray-200 bg-gray-50 hover:border-gray-300"
                            )}
                        >
                            <span className="text-[11px] font-bold text-gray-900">{t(m.label as any)}</span>
                            <p className="text-[9px] text-gray-500 mt-1">{t(m.desc as any)}</p>
                        </button>
                    ))}
                </div>
            )}

            {featureOp === 'bin' && (
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                        {([
                            { value: 'equal_width', label: 'equalWidthLabel' },
                            { value: 'equal_freq', label: 'equalFreqLabel' },
                        ] as const).map((m) => (
                            <button
                                key={m.value}
                                onClick={() => setBinMethod(m.value)}
                                className={cn(
                                    "p-3 rounded-xl border text-center transition-all",
                                    binMethod === m.value ? "border-primary/30 bg-primary/5" : "border-gray-200 bg-gray-50 hover:border-gray-300"
                                )}
                            >
                                <span className="text-[10px] font-bold text-gray-900">{t(m.label as any)}</span>
                            </button>
                        ))}
                    </div>
                    <div className="space-y-2">
                        <label className="text-[9px] font-black uppercase tracking-wider text-gray-400">{t('numberOfBins')}</label>
                        <input
                            type="number"
                            min={2}
                            max={50}
                            value={binCount}
                            onChange={(e) => setBinCount(Math.max(2, parseInt(e.target.value) || 5))}
                            className="w-32 px-4 py-2.5 rounded-lg border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30"
                        />
                    </div>
                </div>
            )}

            {featureOp === 'date' && (
                <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase tracking-wider text-gray-400">{t('dateFeaturesOp')}</label>
                    <div className="flex flex-wrap gap-2">
                        {['year', 'month', 'day', 'weekday', 'hour', 'quarter'].map((f) => (
                            <button
                                key={f}
                                onClick={() => toggleDateFeature(f)}
                                className={cn(
                                    "px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all capitalize",
                                    dateFeatures.includes(f) ? "bg-primary/10 border-primary/30 text-primary" : "bg-gray-50 border-gray-200 text-gray-600 hover:border-gray-300"
                                )}
                            >
                                {f}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {featureOp === 'text' && (
                <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase tracking-wider text-gray-400">{t('textFeaturesOp')}</label>
                    <div className="flex flex-wrap gap-2">
                        {[
                            { id: 'length', label: 'lengthFeature' },
                            { id: 'wordCount', label: 'wordCountFeature' },
                            { id: 'hasDigits', label: 'hasDigitsFeature' },
                            { id: 'hasSpecial', label: 'hasSpecialFeature' },
                        ].map((f) => (
                            <button
                                key={f.id}
                                onClick={() => toggleTextFeature(f.id)}
                                className={cn(
                                    "px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all",
                                    textFeatures.includes(f.id) ? "bg-primary/10 border-primary/30 text-primary" : "bg-gray-50 border-gray-200 text-gray-600 hover:border-gray-300"
                                )}
                            >
                                {t(f.label as any)}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            <ToolboxApplyButton disabled={!selectedCol} onClick={handleApply} />
        </div>
    );
}

// ---------------------------------------------------------------------------
// Shared micro-components
// ---------------------------------------------------------------------------

function ToolboxSelect({ label, value, onChange, options, placeholder }: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    options: string[];
    placeholder: string;
}) {
    return (
        <div className="space-y-2">
            <label className="text-[9px] font-black uppercase tracking-wider text-gray-400">{label}</label>
            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 appearance-none"
            >
                <option value="">{placeholder}</option>
                {options.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                ))}
            </select>
        </div>
    );
}

function ToolboxApplyButton({ disabled, onClick }: { disabled: boolean; onClick: () => void }) {
    const t = useT();
    return (
        <div className="pt-2">
            <button
                disabled={disabled}
                onClick={onClick}
                className="px-8 py-2.5 bg-primary text-white rounded-xl text-[10px] font-black uppercase tracking-wider hover:scale-[1.03] transition-all shadow-lg disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100 active:scale-95 flex items-center gap-2"
            >
                <Play className="w-3 h-3" />
                {t('applyTransformation')}
            </button>
        </div>
    );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function PreparationView() {
    const t = useT();
    const {
        dataset,
        datasetName,
        issues,
        setIssues,
        setDataset,
        setPhase,
        addTransformation,
        persistTransformation,
        setLoading
    } = useAppStore();

    const [isCleaning, setIsCleaning] = useState(false);

    const healthScore = useMemo(() => {
        if (!dataset || dataset.length === 0) return 100;
        const totalPossiblePoints = dataset.length * Object.keys(dataset[0]).length;
        const totalIssues = (issues || []).reduce((acc, issue) => acc + issue.count, 0);
        return Math.round(Math.max(0, Math.min(100, 100 - (totalIssues / totalPossiblePoints) * 500)));
    }, [dataset, issues]);

    if (!dataset) {
        return (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-12 fade-in py-20">
                <div className="w-20 h-20 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center relative overflow-hidden group shadow-2xl">
                    <Database className="w-12 h-12 text-gray-300 group-hover:text-gray-500 transition-all duration-700 group-hover:scale-110" />
                    <div className="absolute inset-0 bg-gradient-to-t from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-gray-300 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                </div>
                <div className="space-y-6">
                    <div className="flex flex-col items-center gap-2">
                        <span className="text-[10px] font-black uppercase tracking-wide text-gray-400">{t('systemStatus')}</span>
                        <h2 className="text-2xl font-black tracking-tighter text-gray-900">{t('noDataConnected')}</h2>
                    </div>
                    <p className="text-gray-500 font-medium max-w-md mx-auto leading-relaxed">
                        {t('noDataConnectedDesc')}
                    </p>
                </div>
                <button
                    onClick={() => setPhase('workspace')}
                    className="group px-8 py-3 bg-primary text-white rounded-xl text-[11px] font-black uppercase tracking-wider hover:scale-[1.05] transition-all shadow-lg active:scale-95 flex items-center gap-3"
                >
                    {t('uploadData')}
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
            </div>
        );
    }

    const handleAutoClean = async () => {
        setIsCleaning(true);
        setLoading(true);
        await new Promise(r => setTimeout(r, 2500));

        let currentData = [...dataset];
        (issues || []).forEach(issue => {
            const transformationType = issue.type === 'duplicate' ? 'remove_duplicates' :
                issue.type === 'null' ? 'impute_nulls' :
                    issue.type === 'outlier' ? 'remove_outliers' : issue.type;

            currentData = applyTransformation(currentData, transformationType, { field: issue.field, value: 'N/A' });
            const tx: Transformation = {
                id: Math.random().toString(36).slice(2),
                type: transformationType,
                params: { field: issue.field },
                timestamp: new Date()
            };
            addTransformation(tx);
            persistTransformation(tx);
        });

        setDataset(currentData, datasetName);
        setIssues(analyzeDataset(currentData));
        setLoading(false);
        setIsCleaning(false);
    };

    return (
        <div className="space-y-8 py-6 fade-in pb-16">
            {/* Enterprise Header */}
            <div className="flex flex-col gap-6">
                <div className="flex items-center gap-4">
                    <div className="px-4 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2.5">
                        <Shield className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="text-[10px] font-black uppercase tracking-wider text-emerald-500">{t('dataQuality')}</span>
                    </div>
                    <div className="h-px w-12 bg-gray-200" />
                    <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">{t('phasePreparation')}</span>
                    <div className="ml-auto flex items-center gap-3">
                        <button
                            onClick={() => (useAppStore as any).temporal.getState().undo()}
                            className="p-2 rounded-lg bg-gray-100 border border-gray-200 hover:bg-gray-200 transition-all text-gray-500 hover:text-gray-900"
                        >
                            <RefreshCcw className="w-4 h-4 scale-x-[-1]" />
                        </button>
                        <button
                            onClick={() => (useAppStore as any).temporal.getState().redo()}
                            className="p-2 rounded-lg bg-gray-100 border border-gray-200 hover:bg-gray-200 transition-all text-gray-500 hover:text-gray-900"
                        >
                            <RefreshCcw className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Guided Stepper */}
                <div className="grid grid-cols-3 gap-6 mb-6">
                    {[
                        { step: 1, label: t('scanIssues'), desc: t('detectingIssues'), active: true, done: issues && issues.length > 0 },
                        { step: 2, label: t('autoFix'), desc: t('fixingIssues'), active: issues && issues.length > 0 || isCleaning, done: issues && issues.length === 0 && dataset && dataset.length > 0 },
                        { step: 3, label: t('complete'), desc: t('readyForAnalysis'), active: issues && issues.length === 0 && dataset && dataset.length > 0, done: false }
                    ].map((s, idx) => (
                        <div key={idx} className={cn(
                            "group p-4 rounded-xl border transition-all duration-700 relative overflow-hidden",
                            s.active ? "bg-primary/5 border-primary/20 shadow-2xl" : "bg-transparent border-gray-200 opacity-20",
                            s.done && "border-emerald-500/20 bg-emerald-500/5"
                        )}>
                            {s.done && <div className="absolute top-0 right-0 p-4"><CheckCircle2 className="w-4 h-4 text-emerald-500" /></div>}
                            <div className="flex items-center gap-5 relative z-10">
                                <div className={cn(
                                    "w-8 h-8 rounded-xl flex items-center justify-center text-[12px] font-black transition-all",
                                    s.done ? "bg-emerald-500 text-white" : s.active ? "bg-primary text-white" : "bg-gray-100 text-gray-400"
                                )}>
                                    {s.done ? <CheckCircle2 className="w-5 h-5" /> : `0${s.step}`}
                                </div>
                                <div>
                                    <p className={cn("text-[11px] font-black uppercase tracking-wide", s.active ? "text-gray-900" : "text-gray-500")}>{s.label}</p>
                                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1">{s.desc}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
                    <div className="space-y-4">
                        <motion.h1
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="text-4xl font-black tracking-tighter text-gray-900"
                        >
                            {t('dataPreparation')}
                        </motion.h1>
                        <p className="text-gray-500 font-medium max-w-xl text-base leading-relaxed">
                            {t('scanningDataset', { name: datasetName || '' })}
                        </p>
                    </div>

                    <div className="flex items-center gap-5 bg-white shadow-sm border border-gray-200 p-5 px-6 rounded-xl">
                        <div className="relative">
                            <svg className="w-20 h-20 transform -rotate-90">
                                <circle cx="40" cy="40" r="36" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-gray-200" />
                                <motion.circle
                                    cx="40" cy="40" r="36" stroke="currentColor" strokeWidth="4" fill="transparent"
                                    strokeDasharray={226.2}
                                    initial={{ strokeDashoffset: 226.2 }}
                                    animate={{ strokeDashoffset: 226.2 - (226.2 * healthScore) / 100 }}
                                    className={cn(
                                        "transition-all duration-1000",
                                        healthScore > 80 ? "text-emerald-500" : healthScore > 50 ? "text-amber-500" : "text-red-500"
                                    )}
                                />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-xl font-black text-gray-900">{healthScore}%</span>
                            </div>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] font-black uppercase tracking-wider text-gray-400">{t('healthScore')}</p>
                            <p className="text-base font-bold text-gray-900 tracking-tight">{healthScore > 80 ? t('good') : t('needsAttention')}</p>
                            <p className="text-[10px] text-gray-500 uppercase font-bold mt-1">{t('foundIssues', { count: String((issues || []).length) })}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Diagnostic Feed */}
                <div className="lg:col-span-2 space-y-5">
                    <div className="flex items-center justify-between px-4">
                        <div className="flex items-center gap-4">
                            <h2 className="text-[10px] font-black uppercase tracking-wider text-gray-400">{t('issuesFound')}</h2>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="flex -space-x-2">
                                {[1, 2, 3].map(i => <div key={i} className="w-6 h-6 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center text-[8px] font-black">AI</div>)}
                            </div>
                            <span className="text-[9px] font-bold text-gray-500">{t('aiAnalysis')}</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-5">
                        <AnimatePresence mode="popLayout">
                            {(!issues || issues.length === 0) ? (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.98 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="p-10 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 flex flex-col items-center justify-center text-center gap-8 shadow-inner"
                                >
                                    <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 relative">
                                        <div className="absolute inset-0 rounded-full animate-ping bg-emerald-500/10" />
                                        <ShieldCheck className="w-8 h-8 relative z-10" />
                                    </div>
                                    <div className="space-y-3">
                                        <p className="text-xl font-black text-gray-900 tracking-tight">{t('allIssuesResolved')}</p>
                                        <p className="text-sm text-gray-600 font-medium max-w-sm">{t('noIssuesDesc')}</p>
                                    </div>
                                    <button
                                        onClick={() => setPhase('exploration')}
                                        className="mt-4 px-8 py-3 bg-primary text-white rounded-xl text-[10px] font-black uppercase tracking-wider hover:scale-105 transition-all shadow-xl"
                                    >
                                        {t('continueExploration')}
                                    </button>
                                </motion.div>
                            ) : (
                                issues.map((issue, i) => (
                                    <IssueCard key={issue.id} issue={issue} index={i} />
                                ))
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* Automation Sidebar */}
                <div className="space-y-5">
                    <div className="p-6 rounded-2xl bg-white text-gray-900 flex flex-col justify-between min-h-[320px] shadow-lg relative overflow-hidden group border border-gray-200">
                        <div className="absolute top-0 right-0 p-12 opacity-[0.03] group-hover:scale-125 transition-transform duration-1000">
                            <Cpu className="w-48 h-48 text-gray-900" />
                        </div>

                        <div className="space-y-6 relative z-10">
                            <div className="flex items-center gap-5">
                                <div className="w-10 h-10 rounded-xl bg-gray-900 text-white flex items-center justify-center shadow-2xl">
                                    <Sparkles className="w-6 h-6" />
                                </div>
                                <div className="space-y-1">
                                    <h3 className="text-xl font-black tracking-tighter leading-none">{t('autoFix')}</h3>
                                    <p className="text-[10px] text-gray-500 font-black uppercase tracking-wide">{t('oneClickRepair')}</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <p className="text-base font-semibold leading-relaxed text-gray-600">
                                    {t('autoFixDesc')}
                                </p>
                                <div className="space-y-5">
                                    {[
                                        { label: t('removeDuplicates'), icon: Lock },
                                        { label: t('fillMissing'), icon: Shield },
                                        { label: t('handleOutliers'), icon: Activity }
                                    ].map((item, idx) => (
                                        <div key={idx} className="flex items-center gap-4">
                                            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                                                <item.icon className="w-4 h-4 text-gray-500" />
                                            </div>
                                            <span className="text-xs font-black uppercase tracking-widest text-gray-700">{item.label}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={handleAutoClean}
                            disabled={isCleaning || !issues || issues.length === 0}
                            className="w-full py-3.5 bg-primary text-white rounded-xl text-[11px] font-black uppercase tracking-wider hover:scale-[1.03] transition-all flex items-center justify-center gap-3 disabled:opacity-10 active:scale-95 shadow-2xl relative z-10"
                        >
                            {isCleaning ? <RefreshCcw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4 fill-white" />}
                            {isCleaning ? t('fixing') : t('fixAllIssues')}
                        </button>
                    </div>

                    <div className="p-5 rounded-xl bg-gray-50 border border-gray-200 space-y-4">
                        <div className="flex items-center justify-between px-2">
                            <h3 className="text-[10px] font-black uppercase tracking-wider text-gray-400">{t('changeLog')}</h3>
                            <FileCode className="w-4 h-4 text-gray-300" />
                        </div>
                        <div className="space-y-6">
                            <AnimatePresence>
                                {useAppStore.getState().transformations.slice(-5).reverse().map((tx) => (
                                    <motion.div
                                        key={tx.id}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className="flex items-center justify-between p-4 rounded-xl bg-white border border-gray-200"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                            <span className="text-[10px] font-bold text-gray-700 uppercase tracking-widest">{tx.type.replace(/_/g, ' ')}</span>
                                        </div>
                                        <span className="text-[9px] font-black text-gray-400 uppercase">{new Date(tx.timestamp).toLocaleTimeString()}</span>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                            {useAppStore.getState().transformations.length === 0 && (
                                <p className="text-xs font-medium text-gray-400 italic text-center py-4 border border-dashed border-gray-200 rounded-2xl">
                                    {t('noChanges')}
                                </p>
                            )}
                            <div className="pt-6 border-t border-gray-200 flex items-center justify-between">
                                <span className="text-[9px] font-black uppercase text-gray-300 tracking-wide">{t('undoAvailable')}</span>
                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Cleaning Toolbox */}
            <CleaningToolbox />

            {/* Column Inspector Grid */}
            <section className="space-y-8 pt-10">
                <div className="flex items-center justify-between px-4">
                    <h3 className="text-[10px] font-black uppercase tracking-wider text-gray-400">{t('columnInspector')}</h3>
                    <div className="h-px flex-1 bg-gray-200 mx-8" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {useMemo(() => Object.keys(dataset[0]), [dataset]).map((col) => {
                        const colType = (dataset[0] && typeof dataset[0][col] === 'number') ? 'numeric' : 'categorical';
                        return (
                            <motion.div
                                key={col}
                                whileHover={{ y: -5 }}
                                className="p-5 rounded-xl bg-white shadow-sm border border-gray-200 group relative overflow-hidden"
                            >
                                <div className="space-y-6 relative z-10">
                                    <div className="flex items-center justify-between">
                                        <div className={cn(
                                            "w-10 h-10 rounded-xl flex items-center justify-center",
                                            colType === 'numeric' ? "bg-primary/10 text-primary" : "bg-gray-100 text-gray-500"
                                        )}>
                                            <Database className="w-5 h-5" />
                                        </div>
                                        <span className="text-[7px] font-black uppercase tracking-widest text-gray-400 border border-gray-200 px-2 py-1 rounded bg-gray-50">{colType === 'numeric' ? t('numeric') : t('categorical')}</span>
                                    </div>
                                    <div>
                                        <h4 className="text-base font-black text-gray-900 truncate group-hover:text-primary transition-colors">{col}</h4>
                                        <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mt-1">{t('statusActive')}</p>
                                    </div>
                                    <div className="pt-6 border-t border-gray-200 flex items-center justify-between gap-4">
                                        <button
                                            onClick={() => {
                                                const newName = prompt(t('newName') + ':', col);
                                                if (newName && newName !== col) {
                                                    const newData = applyTransformation(dataset, 'rename_column', { oldName: col, newName });
                                                    setDataset(newData, datasetName);
                                                    setIssues(analyzeDataset(newData));
                                                    addTransformation({ id: Math.random().toString(), type: 'rename_column', params: { oldName: col, newName }, timestamp: new Date() });
                                                }
                                            }}
                                            className="text-[9px] font-black uppercase tracking-widest text-gray-500 hover:text-gray-900 transition-colors"
                                        >
                                            {t('rename')}
                                        </button>
                                        <button
                                            onClick={() => {
                                                if (confirm(t('dropColumnConfirm', { col }))) {
                                                    const newData = applyTransformation(dataset, 'drop_column', { column: col });
                                                    setDataset(newData, datasetName);
                                                    setIssues(analyzeDataset(newData));
                                                    addTransformation({ id: Math.random().toString(), type: 'drop_column', params: { column: col }, timestamp: new Date() });
                                                }
                                            }}
                                            className="p-2 rounded-lg hover:bg-red-500/10 text-gray-300 hover:text-red-500 transition-all"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </section>
        </div>
    );
}
