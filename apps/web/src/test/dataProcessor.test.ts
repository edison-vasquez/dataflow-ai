import { describe, it, expect } from 'vitest';
import { analyzeDataset, detectColumnTypes, applySimulations } from '../lib/dataProcessor';

describe('dataProcessor', () => {
    describe('analyzeDataset', () => {
        it('should detect null values', () => {
            const data = [
                { a: 1, b: 'x' },
                { a: null, b: 'y' },
                { a: 3, b: '' }
            ];
            const issues = analyzeDataset(data);
            const nullIssues = issues.filter(i => i.type === 'null');
            expect(nullIssues.length).toBeGreaterThan(0);
            expect(nullIssues.some(i => i.field === 'a')).toBe(true);
        });

        it('should detect duplicates', () => {
            const data = [
                { id: 1, val: 'a' },
                { id: 1, val: 'a' },
                { id: 2, val: 'b' }
            ];
            const issues = analyzeDataset(data);
            expect(issues.some(i => i.type === 'duplicate')).toBe(true);
        });
    });

    describe('detectColumnTypes', () => {
        it('should correctly detect numeric columns', () => {
            const data = [
                { price: 10, category: 'A' },
                { price: 20, category: 'B' }
            ];
            const types = detectColumnTypes(data);
            expect(types.price).toBe('numeric');
            expect(types.category).toBe('categorical');
        });
    });

    describe('applySimulations', () => {
        it('should apply multiplier to target column', () => {
            const data = [
                { revenue: 100, cost: 50 },
                { revenue: 200, cost: 80 }
            ];
            const simulations = [
                { id: '1', targetColumn: 'revenue', adjustment: 1.1, isActive: true }
            ];
            const result = applySimulations(data, simulations);
            expect(result[0].revenue).toBeCloseTo(110);
            expect(result[1].revenue).toBeCloseTo(220);
            expect(result[0].cost).toBe(50);
        });

        it('should not apply inactive simulations', () => {
            const data = [{ val: 100 }];
            const simulations = [{ id: '1', targetColumn: 'val', adjustment: 2.0, isActive: false }];
            const result = applySimulations(data, simulations);
            expect(result[0].val).toBe(100);
        });
    });
});
