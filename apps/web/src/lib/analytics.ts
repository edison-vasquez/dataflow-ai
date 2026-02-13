/**
 * Simple Linear Regression for forecasting numeric trends.
 */
export function calculateForecast(data: number[], points: number = 5): number[] {
    if (data.length < 3) return new Array(points).fill(data[data.length - 1] || 0);

    const n = data.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;

    // Use last 10 points for a more "recent" trend if available
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

/**
 * Detect simple statistical outliers using IQR.
 */
export function detectOutliers(data: number[]) {
    if (data.length < 4) return [];
    const sorted = [...data].sort((a, b) => a - b);
    const q1 = sorted[Math.floor(sorted.length * 0.25)];
    const q3 = sorted[Math.floor(sorted.length * 0.75)];
    const iqr = q3 - q1;
    const min = q1 - 1.5 * iqr;
    const max = q3 + 1.5 * iqr;

    return data.filter(d => d < min || d > max);
}

/**
 * 2D Segmenter (Simplified Clustering)
 * Divides data into 4 quadrants based on medians of two columns.
 */
export function performClustering(dataset: any[], colX: string, colY: string) {
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
