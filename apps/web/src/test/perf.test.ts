import { describe, it } from 'vitest';
import { analyzeDataset, computeEDAStats, computeCorrelationMatrix } from '../lib/dataProcessor';

describe('Performance Benchmark', () => {
    it('should handle 100k rows efficiently', () => {
        const rows = 100000;
        const cols = 10;
        const data = [];
        for (let i = 0; i < rows; i++) {
            const row: any = {};
            for (let j = 0; j < cols; j++) {
                row[`col_${j}`] = Math.random() * 100;
            }
            data.push(row);
        }

        console.time('analyzeDataset');
        analyzeDataset(data);
        console.timeEnd('analyzeDataset');

        console.time('computeEDAStats');
        computeEDAStats(data);
        console.timeEnd('computeEDAStats');

        console.time('computeCorrelationMatrix');
        computeCorrelationMatrix(data);
        console.timeEnd('computeCorrelationMatrix');
    });
});
