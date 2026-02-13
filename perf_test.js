import { analyzeDataset, computeEDAStats, computeCorrelationMatrix } from './apps/web/src/lib/dataProcessor';

function generateLargeDataset(rows: number, cols: number) {
    const data = [];
    for (let i = 0; i < rows; i++) {
        const row: any = {};
        for (let j = 0; j < cols; j++) {
            row[`col_${j}`] = Math.random() * 100;
        }
        data.push(row);
    }
    return data;
}

const rows = 100000; // 100k rows
const cols = 10;
console.log(`Generating dataset with ${rows} rows and ${cols} columns...`);
const start = Date.now();
const data = generateLargeDataset(rows, cols);
console.log(`Generation took ${Date.now() - start}ms`);

console.log('Running analyzeDataset...');
const s1 = Date.now();
analyzeDataset(data);
console.log(`analyzeDataset took ${Date.now() - s1}ms`);

console.log('Running computeEDAStats...');
const s2 = Date.now();
computeEDAStats(data);
console.log(`computeEDAStats took ${Date.now() - s2}ms`);

console.log('Running computeCorrelationMatrix...');
const s3 = Date.now();
computeCorrelationMatrix(data);
console.log(`computeCorrelationMatrix took ${Date.now() - s3}ms`);
