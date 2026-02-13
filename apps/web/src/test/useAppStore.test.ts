import { describe, it, expect, beforeEach } from 'vitest';
import { useAppStore } from '../store/useAppStore';

describe('useAppStore Integration', () => {
    // We need to reset the store between tests because Zustand stores are persistent in a test run
    beforeEach(() => {
        const { setGlobalFilter, dataset, charts, addChart, removeChart } = useAppStore.getState();
        // Reset to initial state
        setGlobalFilter(null, null);
        // Note: Resetting everything might be complex if there's no dedicated reset action, 
        // but for these tests we'll just focuses on specific actions.
    });

    it('should update global filters correctly', () => {
        const { setGlobalFilter } = useAppStore.getState();

        setGlobalFilter('region', 'North');
        expect(useAppStore.getState().globalFilters.region).toBe('North');

        setGlobalFilter('region', 'South');
        expect(useAppStore.getState().globalFilters.region).toBe('South');

        setGlobalFilter('region', null);
        expect(useAppStore.getState().globalFilters.region).toBeUndefined();
    });

    it('should clear all filters', () => {
        const { setGlobalFilter } = useAppStore.getState();

        setGlobalFilter('a', 1);
        setGlobalFilter('b', 2);
        expect(Object.keys(useAppStore.getState().globalFilters).length).toBe(2);

        setGlobalFilter(null, null);
        expect(Object.keys(useAppStore.getState().globalFilters).length).toBe(0);
    });

    it('should manage charts', () => {
        const { addChart, removeChart } = useAppStore.getState();
        const initialCount = useAppStore.getState().charts.length;

        const newChart = { id: 'test-chart', title: 'Test', type: 'bar' };
        addChart(newChart);
        expect(useAppStore.getState().charts.length).toBe(initialCount + 1);
        expect(useAppStore.getState().charts.find(c => c.id === 'test-chart')).toBeDefined();

        removeChart('test-chart');
        expect(useAppStore.getState().charts.length).toBe(initialCount);
    });
});
