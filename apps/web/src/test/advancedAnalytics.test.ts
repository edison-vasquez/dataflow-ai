import { describe, it, expect } from 'vitest';
import { analyzeDataset, applyTransformation } from '../lib/dataProcessor';

describe('Advanced Analytics - Z-Score', () => {
    it('should detect outliers using Z-score', () => {
        // Data with clear Z-score outlier (mean=10.9, std ~28)
        // Let's use more obvious data: 0,0,0,0,0,0,0,0,0,0, 1000
        const data = [
            { val: 10 }, { val: 11 }, { val: 12 }, { val: 10 }, { val: 11 },
            { val: 12 }, { val: 10 }, { val: 11 }, { val: 12 }, { val: 10 },
            { val: 11 }, { val: 12 }, { val: 1000 }
        ];
        const issues = analyzeDataset(data);
        const outlierIssue = issues.find(i => i.field === 'val' && i.type === 'outlier');

        expect(outlierIssue).toBeDefined();
        expect(outlierIssue?.suggestion).toContain('Z-score');
    });
});

describe('Advanced Analytics - Joins', () => {
    it('should perform a left join between two datasets', () => {
        const left = [
            { id: 1, name: 'Alpha' },
            { id: 2, name: 'Beta' }
        ];
        const right = [
            { id: 1, score: 100 },
            { id: 3, score: 300 }
        ];

        const params = {
            otherData: right,
            leftKey: 'id',
            rightKey: 'id',
            type: 'left'
        };

        const result = applyTransformation(left, 'join_datasets', params);

        expect(result).toHaveLength(2);
        expect(result[0]).toEqual({ id: 1, name: 'Alpha', score: 100 });
        expect(result[1]).toEqual({ id: 2, name: 'Beta', score: undefined }); // Arquero join_left behavior
    });

    it('should perform an inner join between two datasets', () => {
        const left = [
            { id: 1, name: 'Alpha' },
            { id: 2, name: 'Beta' }
        ];
        const right = [
            { id: 1, score: 100 },
            { id: 3, score: 300 }
        ];

        const params = {
            otherData: right,
            leftKey: 'id',
            rightKey: 'id',
            type: 'inner'
        };

        const result = applyTransformation(left, 'join_datasets', params);

        expect(result).toHaveLength(1);
        expect(result[0]).toEqual({ id: 1, name: 'Alpha', score: 100 });
    });
});
