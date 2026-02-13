import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { temporal } from 'zundo';
import { api } from '@/lib/api';

export interface DataIssueAction {
    label: string;
    transformationType: string;
    params: any;
}

export interface DataIssue {
    id: string;
    type: 'null' | 'duplicate' | 'outlier' | 'inconsistency' | 'type_mismatch' | 'high_cardinality';
    field: string;
    count: number;
    severity: 'high' | 'medium' | 'low';
    suggestion: string;
    availableActions?: DataIssueAction[];
}

export interface Transformation {
    id: string;
    type: string;
    params: any;
    timestamp: Date;
    affectedRows?: number;
    affectedColumns?: string[];
}

export interface Simulation {
    id: string;
    driverColumn: string;
    adjustment: number; // e.g., 1.2 for +20%
    targetColumn: string;
    isActive: boolean;
}

export interface DatasetEntry {
    id: string;
    name: string;
    data: any[];
}

export interface DataProfile {
    rowCount: number;
    columnCount: number;
    memoryEstimateKB: number;
    qualityScore: number;
    duplicateRows: number;
    completenessPercentage: number;
    columns: Record<string, any>;
}

interface AppSettings {
    theme: 'dark' | 'light' | 'system';
    language: 'en' | 'es';
    privacyMode: boolean;
    autoClean: boolean;
    aiProvider: string;
}

export interface Toast {
    id: string;
    type: 'success' | 'error' | 'info' | 'warning';
    message: string;
    description?: string;
    duration?: number;
}

interface AppState {
    currentPhase: 'workspace' | 'preparation' | 'eda' | 'exploration' | 'reports';
    setPhase: (phase: AppState['currentPhase']) => void;
    isChatOpen: boolean;
    toggleChat: () => void;
    setChatOpen: (open: boolean) => void;
    isLoading: boolean;
    setLoading: (loading: boolean) => void;
    isGeneratingReport: boolean;
    generateReport: () => Promise<void>;

    // Project State
    projectId: string | null;
    setProjectId: (id: string | null) => void;
    dataSourceId: string | null;
    setDataSourceId: (id: string | null) => void;

    // Data State
    dataset: any[] | null;
    datasetName: string | null;
    rawFile: File | null;
    setDataset: (data: any[] | null, name: string | null) => void;
    setRawFile: (file: File | null) => void;

    // Data Profile
    dataProfile: DataProfile | null;
    setDataProfile: (profile: DataProfile | null) => void;

    // Multi-dataset support
    datasets: DatasetEntry[];
    activeDatasetId: string | null;
    addDatasetEntry: (name: string, data: any[]) => void;
    removeDatasetEntry: (id: string) => void;
    setActiveDataset: (id: string) => void;

    // Preparation State
    issues: DataIssue[];
    setIssues: (issues: DataIssue[]) => void;
    transformations: Transformation[];
    addTransformation: (t: Transformation) => void;

    // Exploration State
    charts: any[];
    addChart: (chart: any) => void;
    removeChart: (id: string) => void;
    updateChart: (id: string, updates: any) => void;
    globalFilters: Record<string, any>;
    setGlobalFilter: (column: string | null, value: any | null) => void;

    // Transformation Management
    removeTransformation: (id: string) => void;

    // Settings
    settings: AppSettings;
    updateSettings: (s: Partial<AppSettings>) => void;
    isSettingsOpen: boolean;
    toggleSettings: () => void;

    // Simulation State
    simulations: Simulation[];
    addSimulation: (s: Simulation) => void;
    updateSimulation: (id: string, updates: Partial<Simulation>) => void;
    removeSimulation: (id: string) => void;

    // Toast State
    toasts: Toast[];
    addToast: (toast: Omit<Toast, 'id'>) => void;
    removeToast: (id: string) => void;

    // Server sync
    persistTransformation: (t: Transformation) => void;
    persistChart: (chart: any) => void;
    uploadDataset: (file: File) => Promise<void>;
    initProject: () => Promise<void>;
    runFullDiagnostics: () => Promise<{ health: number; status: string }>;
    // Worker actions
    runWorkerTask: (type: string, data: any[]) => Promise<any>;
}

export const useAppStore = create<AppState>()(
    temporal(
        persist(
            (set, get) => ({
                currentPhase: 'workspace',
                setPhase: (phase) => set({ currentPhase: phase }),
                isChatOpen: true,
                toggleChat: () => set((state) => ({ isChatOpen: !state.isChatOpen })),
                setChatOpen: (open) => set({ isChatOpen: open }),
                isLoading: false,
                setLoading: (loading) => set({ isLoading: loading }),
                isGeneratingReport: false,
                generateReport: async () => {
                    set({ isGeneratingReport: true });
                    // Simulate report generation
                    await new Promise(r => setTimeout(r, 2000));
                    set({ isGeneratingReport: false });
                },

                projectId: null,
                setProjectId: (id) => set({ projectId: id }),
                dataSourceId: null,
                setDataSourceId: (id) => set({ dataSourceId: id }),

                dataset: null,
                datasetName: null,
                rawFile: null,
                setDataset: (data, name) => {
                    set({ dataset: data, datasetName: name });
                    if (data && data.length > 0) {
                        // Trigger async analysis when dataset changes
                        get().runWorkerTask('ANALYZE_DATASET', data).then(results => {
                            set({ issues: results });
                        });
                    }
                },
                setRawFile: (file) => set({ rawFile: file }),

                dataProfile: null,
                setDataProfile: (profile) => set({ dataProfile: profile }),

                datasets: [],
                activeDatasetId: null,
                addDatasetEntry: (name, data) => set((state) => {
                    const id = crypto.randomUUID();
                    return { datasets: [...state.datasets, { id, name, data }] };
                }),
                removeDatasetEntry: (id) => set((state) => ({
                    datasets: state.datasets.filter(d => d.id !== id),
                    activeDatasetId: state.activeDatasetId === id ? null : state.activeDatasetId
                })),
                setActiveDataset: (id) => {
                    const ds = get().datasets.find(d => d.id === id);
                    if (ds) {
                        set({ activeDatasetId: id, dataset: ds.data, datasetName: ds.name });
                    }
                },

                issues: [],
                setIssues: (issues) => set({ issues }),
                transformations: [],
                addTransformation: (t) => set((state) => ({ transformations: [...state.transformations, t] })),

                charts: [],
                addChart: (chart) => set((state) => ({ charts: [...state.charts, chart] })),
                removeChart: (id) => set((state) => ({ charts: state.charts.filter(c => c.id !== id) })),
                updateChart: (id, updates) => set((state) => ({
                    charts: state.charts.map(c => c.id === id ? { ...c, ...updates } : c)
                })),
                globalFilters: {},
                setGlobalFilter: (column, value) => set((state) => {
                    if (!column) return { globalFilters: {} };
                    const newFilters = { ...state.globalFilters };
                    if (value === null) {
                        delete newFilters[column];
                    } else {
                        newFilters[column] = value;
                    }
                    return { globalFilters: newFilters };
                }),

                removeTransformation: (id) => set((state) => ({
                    transformations: state.transformations.filter(t => t.id !== id)
                })),

                settings: {
                    theme: 'light',
                    language: 'en',
                    privacyMode: true,
                    autoClean: false,
                    aiProvider: 'AI Assistant'
                },
                updateSettings: (s) => set((state) => ({ settings: { ...state.settings, ...s } })),
                isSettingsOpen: false,
                toggleSettings: () => set((state) => ({ isSettingsOpen: !state.isSettingsOpen })),

                simulations: [],
                addSimulation: (s) => set((state) => ({ simulations: [...state.simulations, s] })),
                updateSimulation: (id, updates) => set((state) => ({
                    simulations: state.simulations.map(s => s.id === id ? { ...s, ...updates } : s)
                })),
                removeSimulation: (id) => set((state) => ({
                    simulations: state.simulations.filter(s => s.id !== id)
                })),

                toasts: [],
                addToast: (t) => set((state) => ({
                    toasts: [...state.toasts, { ...t, id: Math.random().toString() }]
                })),
                removeToast: (id) => set((state) => ({
                    toasts: state.toasts.filter(t => t.id !== id)
                })),

                // Server sync actions
                persistTransformation: (t) => {
                    const { projectId } = get();
                    if (projectId && !projectId.startsWith('local-')) {
                        api.transformations.create({
                            projectId,
                            type: t.type,
                            params: t.params,
                            rowsAffected: 0,
                        }).catch(() => { });
                    }
                },

                persistChart: (chart) => {
                    const { projectId } = get();
                    // Only persist to backend if we have a real (non-local) project ID
                    if (projectId && !projectId.startsWith('local-')) {
                        api.charts.create({
                            projectId,
                            title: chart.title || 'Untitled Chart',
                            type: chart.type || 'bar',
                            config: { type: chart.type, title: chart.title },
                        }).catch(() => { });
                    }
                },

                uploadDataset: async (file: File) => {
                    const { projectId, dataset } = get();
                    if (!projectId || !dataset || dataset.length === 0) return;

                    try {
                        const schema = Object.keys(dataset[0]);
                        const result = await api.datasets.upload(file, projectId, schema, dataset.length);
                        set({ dataSourceId: result.id });
                    } catch (error) {
                        console.error('Dataset upload error:', error);
                    }
                },

                initProject: async () => {
                    try {
                        const projects = await api.projects.list();
                        if (projects.length > 0) {
                            set({ projectId: projects[0].id });
                        } else {
                            const newProject = await api.projects.create('Enterprise Dataset');
                            set({ projectId: newProject.id });
                        }
                    } catch (error) {
                        console.error('Project init error:', error);
                        set({ projectId: 'local-' + crypto.randomUUID() });
                    }
                },

                runFullDiagnostics: async () => {
                    set({ isLoading: true });
                    await new Promise(r => setTimeout(r, 1500));
                    const { issues, dataset } = get();

                    let health = 100;
                    if (dataset && dataset.length > 0) {
                        const totalPossiblePoints = dataset.length * Object.keys(dataset[0]).length;
                        const totalIssues = issues.reduce((acc, issue) => acc + issue.count, 0);
                        health = Math.round(Math.max(0, Math.min(100, 100 - (totalIssues / totalPossiblePoints) * 500)));
                    }

                    set({ isLoading: false });
                    return {
                        health,
                        status: health > 80 ? 'OPTIMAL' : health > 50 ? 'STABLE' : 'CRITICAL'
                    };
                },

                runWorkerTask: (type, data) => {
                    const { setLoading } = get();
                    setLoading(true);
                    return new Promise((resolve, reject) => {
                        const worker = new Worker(new URL('../lib/dataWorker.ts', import.meta.url), { type: 'module' });
                        worker.onmessage = (e) => {
                            const { type: resType, results, error } = e.data;
                            setLoading(false);
                            if (resType === 'ERROR') {
                                reject(new Error(error));
                            } else {
                                resolve(results);
                            }
                            worker.terminate();
                        };
                        worker.onerror = (err) => {
                            setLoading(false);
                            reject(err);
                            worker.terminate();
                        };
                        worker.postMessage({ type, data });
                    });
                }
            }),
            {
                name: 'dataflow-storage',
                version: 2,
                storage: createJSONStorage(() => localStorage),
                partialize: (state) => {
                    // Guard: only persist dataset if serialized size is under ~2MB
                    let persistedDataset = state.dataset;
                    if (persistedDataset) {
                        try {
                            const estimatedSize = JSON.stringify(persistedDataset).length;
                            if (estimatedSize > 2 * 1024 * 1024) {
                                persistedDataset = persistedDataset.slice(0, 500);
                            }
                        } catch {
                            persistedDataset = null;
                        }
                    }
                    return {
                        currentPhase: state.currentPhase,
                        projectId: state.projectId,
                        dataSourceId: state.dataSourceId,
                        datasetName: state.datasetName,
                        dataset: persistedDataset,
                        dataProfile: state.dataProfile,
                        issues: state.issues,
                        charts: state.charts,
                        isChatOpen: state.isChatOpen,
                        settings: state.settings,
                    };
                },
                migrate: () => {
                    // Version bump: clear stale data from pre-dynamicTyping era
                    return {
                        currentPhase: 'workspace' as const,
                        projectId: null,
                        dataSourceId: null,
                        datasetName: null,
                        dataset: null,
                        issues: [],
                        charts: [],
                        isChatOpen: true,
                        settings: { theme: 'light' as const, language: 'en' as const, privacyMode: true, autoClean: false, aiProvider: 'AI Assistant' },
                    };
                },
                onRehydrateStorage: () => (state) => {
                    if (state) {
                        try {
                            if (state.dataset && (!Array.isArray(state.dataset) || (state.dataset.length > 0 && typeof state.dataset[0] !== 'object'))) {
                                state.dataset = null;
                                state.datasetName = null;
                            }
                            if (!Array.isArray(state.issues)) state.issues = [];
                            if (!Array.isArray(state.charts)) state.charts = [];
                        } catch {
                            state.dataset = null;
                            state.datasetName = null;
                            state.issues = [];
                            state.charts = [];
                        }
                    }
                },
            }
        )
    )
);

// ── Selector hooks for performance (subscribe only to what you need) ──
export const useDataset = () => useAppStore((s) => s.dataset);
export const useDatasetName = () => useAppStore((s) => s.datasetName);
export const useCharts = () => useAppStore((s) => s.charts);
export const useIssues = () => useAppStore((s) => s.issues);
export const useSimulations = () => useAppStore((s) => s.simulations);
export const useCurrentPhase = () => useAppStore((s) => s.currentPhase);
export const useSettings = () => useAppStore((s) => s.settings);
export const useIsLoading = () => useAppStore((s) => s.isLoading);
export const useDataProfile = () => useAppStore((s) => s.dataProfile);
export const useTransformations = () => useAppStore((s) => s.transformations);

