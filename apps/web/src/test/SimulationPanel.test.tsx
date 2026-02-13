import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { SimulationPanel } from '../components/exploration/SimulationPanel';
import { useAppStore } from '@/store/useAppStore';

// Mock useAppStore
vi.mock('@/store/useAppStore', () => ({
    useAppStore: vi.fn()
}));

// Mock useT
vi.mock('@/lib/i18n', () => ({
    useT: () => (key: string) => key
}));

describe('SimulationPanel', () => {
    it('should render nothing if dataset is not present', () => {
        (useAppStore as any).mockReturnValue({
            dataset: null,
            simulations: []
        });

        const { container } = render(<SimulationPanel isOpen={true} onClose={() => { }} />);
        expect(container.firstChild).toBeNull();
    });

    it('should show "no active simulations" message when empty', () => {
        (useAppStore as any).mockReturnValue({
            dataset: [{ a: 1 }],
            simulations: [],
            addSimulation: vi.fn(),
            updateSimulation: vi.fn(),
            removeSimulation: vi.fn()
        });

        render(<SimulationPanel isOpen={true} onClose={() => { }} />);
        expect(screen.getByText('noActiveSimulations')).toBeInTheDocument();
    });

    it('should render active simulations', () => {
        const mockSimulations = [
            { id: '1', driverColumn: 'A', targetColumn: 'B', adjustment: 1.1, isActive: true }
        ];
        (useAppStore as any).mockReturnValue({
            dataset: [{ A: 1, B: 2 }],
            simulations: mockSimulations,
            addSimulation: vi.fn(),
            updateSimulation: vi.fn(),
            removeSimulation: vi.fn()
        });

        render(<SimulationPanel isOpen={true} onClose={() => { }} />);
        expect(screen.getByText('activeScenario')).toBeInTheDocument();
    });
});
