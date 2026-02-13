import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ExplorationView } from '../components/exploration/ExplorationView';
import { useAppStore } from '@/store/useAppStore';

// Mock useAppStore
vi.mock('@/store/useAppStore', () => ({
    useAppStore: vi.fn()
}));

vi.mock('framer-motion', () => ({
    motion: {
        div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
        h1: ({ children, ...props }: any) => <h1 {...props}>{children}</h1>,
        span: ({ children, ...props }: any) => <span {...props}>{children}</span>,
    },
    AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// Mock useT
vi.mock('@/lib/i18n', () => ({
    useT: () => (key: string) => key
}));

// Mock components that might be too heavy or cause issues
vi.mock('./DataChart', () => ({
    DataChart: () => <div data-testid="mock-chart">Chart</div>
}));

vi.mock('./SimulationPanel', () => ({
    SimulationPanel: () => <div data-testid="mock-sim-panel">Sim Panel</div>
}));

vi.mock('./InsightBubble', () => ({
    InsightBubble: () => <div data-testid="mock-insight-bubble">Insight Bubble</div>
}));

vi.mock('@/lib/chartRecommender', () => ({
    recommendCharts: vi.fn(() => [])
}));

vi.mock('@/lib/dataProcessor', () => ({
    detectColumnTypes: vi.fn(() => ({})),
    applySimulations: vi.fn((data) => data)
}));

vi.mock('@/lib/exporters', () => ({
    exportToCSV: vi.fn()
}));

vi.mock('@/lib/analytics', () => ({
    calculateForecast: vi.fn(() => [])
}));

const mockAppState = {
    dataset: [{ a: 1 }],
    datasetName: 'Test Data',
    charts: [],
    globalFilters: {},
    setGlobalFilter: vi.fn(),
    addChart: vi.fn(),
    removeChart: vi.fn(),
    updateChart: vi.fn(),
    persistChart: vi.fn(),
    setPhase: vi.fn(),
    transformations: [],
    simulations: []
};

describe('ExplorationView', () => {
    it('should render the exploration title', () => {
        (useAppStore as any).mockReturnValue(mockAppState);

        render(<ExplorationView />);
        expect(screen.getByText('chartsExploration')).toBeInTheDocument();
    });

    it('should show the "Auto Generate" button', () => {
        (useAppStore as any).mockReturnValue(mockAppState);

        render(<ExplorationView />);
        expect(screen.getByText('autoGenerate')).toBeInTheDocument();
    });
});
