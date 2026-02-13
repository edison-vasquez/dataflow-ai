/**
 * DataFlow AI Logic Test Suite
 * Run with: node test-logic.js
 */

const assert = require('assert');

// Simple mock for i18n
const t = (k) => k;

// Mocked functions for testing logic (Isolation)
function calculateForecast(data, points = 5) {
    if (data.length < 3) return new Array(points).fill(data[data.length - 1] || 0);
    const n = data.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
    const start = Math.max(0, n - 20);
    const count = n - start;
    for (let i = start; i < n; i++) {
        const x = i - start;
        sumX += x;
        sumY += data[i];
        sumXY += x * data[i];
        sumX2 += x * x;
    }
    const slope = (count * sumXY - sumX * sumY) / (count * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / count;
    const projections = [];
    for (let i = count; i < count + points; i++) {
        projections.push(Math.round((slope * i + intercept) * 100) / 100);
    }
    return projections;
}

function performClustering(dataset, colX, colY) {
    const valsX = dataset.map(r => Number(r[colX]) || 0).sort((a, b) => a - b);
    const valsY = dataset.map(r => Number(r[colY]) || 0).sort((a, b) => a - b);
    const medianX = valsX[Math.floor(valsX.length / 2)];
    const medianY = valsY[Math.floor(valsY.length / 2)];
    return dataset.map(row => {
        const x = Number(row[colX]) || 0;
        const y = Number(row[colY]) || 0;
        let segment = "";
        if (x >= medianX && y >= medianY) segment = "Champions";
        else if (x >= medianX && y < medianY) segment = "Loyal High-Value";
        else if (x < medianX && y >= medianY) segment = "Emerging Potential";
        else segment = "At Risk / Low Value";
        return { ...row, segment_tag: segment };
    });
}

function runTests() {
    console.log('\n--- 🧪 DATAFLOW AI: LOGIC TESTS ---\n');

    // 1. Forecast Test
    console.log('Testing Forecast Engine...');
    const series = [10, 15, 20, 25, 30]; // Linear growth
    const result = calculateForecast(series, 2);
    assert.strictEqual(result[0], 35, 'Next point should be 35');
    assert.strictEqual(result[1], 40, 'Second point should be 40');
    console.log('✅ Forecast Logic: PASSED');

    // 2. Clustering Test
    console.log('Testing Neural Segmenter (Clustering)...');
    const data = [
        { x: 100, y: 100 }, // Champion
        { x: 10, y: 10 },   // At Risk
        { x: 100, y: 10 },  // Loyal
        { x: 10, y: 100 }   // Emerging
    ];
    const clustered = performClustering(data, 'x', 'y');
    assert.strictEqual(clustered[0].segment_tag, 'Champions');
    assert.strictEqual(clustered[1].segment_tag, 'At Risk / Low Value');
    console.log('✅ Clustering Logic: PASSED');

    console.log('\n--- 🎉 ALL LOGIC TESTS PASSED ---\n');
}

try {
    runTests();
} catch (e) {
    console.error('\n❌ TEST FAILED');
    console.error(e.message);
    process.exit(1);
}
