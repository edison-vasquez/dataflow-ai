import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { api } from '@/lib/api';

export interface DataIssue {
    id: string;
    type: 'null' | 'duplicate' | 'outlier' | 'inconsistency';
    field: string;
    count: number;
    severity: 'high' | 'medium' | 'low';
    suggestion: string;
}

export interface Transformation {
    id: string;
    type: string;
    params: any;
    timestamp: Date;
}

interface AppSettings {
    theme: 'dark' | 'light' | 'system';
    privacyMode: boolean;
    autoClean: boolean;
    aiProvider: string;
}

interface AppState {
    currentPhase: 'workspace' | 'preparation' | 'exploration' | 'reports';
    setPhase: (phase: AppState['currentPhase']) => void;
    isChatOpen: boolean;
    toggleChat: () => void;
    isLoading: boolean;
    setLoading: (loading: boolean) => void;

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

    // Preparation State
    issues: DataIssue[];
    setIssues: (issues: DataIssue[]) => void;
    transformations: Transformation[];
    addTransformation: (t: Transformation) => void;

    // Exploration State
    charts: any[];
    addChart: (chart: any) => void;

    // Settings
    settings: AppSettings;
    updateSettings: (s: Partial<AppSettings>) => void;
    isSettingsOpen: boolean;
    toggleSettings: () => void;

    // Server sync
    persistTransformation: (t: Transformation) => void;
    persistChart: (chart: any) => void;
    uploadDataset: (file: File) => Promise<void>;
    initProject: () => Promise<void>;
    runFullDiagnostics: () => Promise<{ health: number; status: string }>;
}

export const useAppStore = create<AppState>()(
    persist(
        (set, get) => ({
            currentPhase: 'workspace',
            setPhase: (phase) => set({ currentPhase: phase }),
            isChatOpen: true,
            toggleChat: () => set((state) => ({ isChatOpen: !state.isChatOpen })),
            isLoading: false,
            setLoading: (loading) => set({ isLoading: loading }),

            projectId: null,
            setProjectId: (id) => set({ projectId: id }),
            dataSourceId: null,
            setDataSourceId: (id) => set({ dataSourceId: id }),

            dataset: null,
            datasetName: null,
            rawFile: null,
            setDataset: (data, name) => set({ dataset: data, datasetName: name }),
            setRawFile: (file) => set({ rawFile: file }),

            issues: [],
            setIssues: (issues) => set({ issues }),
            transformations: [],
            addTransformation: (t) => set((state) => ({ transformations: [...state.transformations, t] })),

            charts: [],
            addChart: (chart) => set((state) => ({ charts: [...state.charts, chart] })),

            settings: {
                theme: 'dark',
                privacyMode: true,
                autoClean: false,
                aiProvider: 'Cloudflare Llama 3.1 70B'
            },
            updateSettings: (s) => set((state) => ({ settings: { ...state.settings, ...s } })),
            isSettingsOpen: false,
            toggleSettings: () => set((state) => ({ isSettingsOpen: !state.isSettingsOpen })),

            // Server sync actions
            persistTransformation: (t) => {
                const { projectId } = get();
                if (projectId) {
                    api.transformations.create({
                        projectId,
                        type: t.type,
                        params: t.params,
                        rowsAffected: 0,
                    }).catch(console.error);
                }
            },

            persistChart: (chart) => {
                const { projectId } = get();
                if (projectId) {
                    api.charts.create({
                        projectId,
                        title: chart.title || 'Untitled Chart',
                        type: chart.type || 'bar',
                        config: { data: chart.data, layout: chart.layout },
                    }).catch(console.error);
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
            }
        }),
        {
            name: 'dataflow-storage',
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({
                currentPhase: state.currentPhase,
                projectId: state.projectId,
                dataSourceId: state.dataSourceId,
                datasetName: state.datasetName,
                dataset: state.dataset, // Persist the actual data
                issues: state.issues,   // Persist identified issues
                charts: state.charts,   // Persist created charts
                isChatOpen: state.isChatOpen,
                settings: state.settings,
            }),
        }
    )
);

