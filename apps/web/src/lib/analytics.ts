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

// ---- K-Means Clustering ----

export interface ClusterStat {
    clusterIndex: number;
    size: number;
    centroid: Record<string, number>;
}

export interface KMeansResult {
    labels: number[];
    centroids: number[][];
    iterations: number;
    columnNames: string[];
    clusterStats: ClusterStat[];
}

function euclidean(a: number[], b: number[]): number {
    let sum = 0;
    for (let i = 0; i < a.length; i++) {
        const d = a[i] - b[i];
        sum += d * d;
    }
    return sum; // squared distance (no sqrt needed for comparison)
}

/**
 * Suggest a reasonable k based on dataset size.
 */
export function suggestK(n: number): number {
    return Math.min(Math.max(2, Math.round(Math.sqrt(n / 2))), 8);
}

/**
 * Real K-Means++ clustering on selected numeric columns.
 */
export function kMeansClustering(
    dataset: any[],
    columns: string[],
    k: number,
    maxIterations: number = 50
): KMeansResult {
    const n = dataset.length;
    if (n === 0 || columns.length === 0) {
        return { labels: [], centroids: [], iterations: 0, columnNames: columns, clusterStats: [] };
    }

    // Extract numeric matrix
    const matrix: number[][] = dataset.map(row =>
        columns.map(col => Number(row[col]) || 0)
    );
    const dim = columns.length;

    // Min-max normalize
    const mins = new Array(dim).fill(Infinity);
    const maxs = new Array(dim).fill(-Infinity);
    for (const row of matrix) {
        for (let d = 0; d < dim; d++) {
            if (row[d] < mins[d]) mins[d] = row[d];
            if (row[d] > maxs[d]) maxs[d] = row[d];
        }
    }
    const ranges = mins.map((mn, d) => maxs[d] - mn || 1);
    const normalized: number[][] = matrix.map(row =>
        row.map((v, d) => (v - mins[d]) / ranges[d])
    );

    // K-Means++ initialization
    const centroids: number[][] = [];
    const firstIdx = Math.floor(Math.random() * n);
    centroids.push([...normalized[firstIdx]]);

    for (let c = 1; c < k; c++) {
        const dists = normalized.map(point => {
            let minDist = Infinity;
            for (const cen of centroids) {
                const d = euclidean(point, cen);
                if (d < minDist) minDist = d;
            }
            return minDist;
        });
        const totalDist = dists.reduce((a, b) => a + b, 0);
        let r = Math.random() * totalDist;
        let chosen = 0;
        for (let i = 0; i < n; i++) {
            r -= dists[i];
            if (r <= 0) { chosen = i; break; }
        }
        centroids.push([...normalized[chosen]]);
    }

    // Iterate
    const labels = new Array(n).fill(0);
    let iterations = 0;

    for (let iter = 0; iter < maxIterations; iter++) {
        iterations = iter + 1;
        let changed = false;

        // Assignment
        for (let i = 0; i < n; i++) {
            let bestK = 0;
            let bestDist = Infinity;
            for (let c = 0; c < k; c++) {
                const d = euclidean(normalized[i], centroids[c]);
                if (d < bestDist) { bestDist = d; bestK = c; }
            }
            if (labels[i] !== bestK) { labels[i] = bestK; changed = true; }
        }

        if (!changed) break;

        // Update centroids
        const sums: number[][] = Array.from({ length: k }, () => new Array(dim).fill(0));
        const counts = new Array(k).fill(0);
        for (let i = 0; i < n; i++) {
            const c = labels[i];
            counts[c]++;
            for (let d = 0; d < dim; d++) sums[c][d] += normalized[i][d];
        }
        for (let c = 0; c < k; c++) {
            if (counts[c] === 0) continue;
            for (let d = 0; d < dim; d++) centroids[c][d] = sums[c][d] / counts[c];
        }
    }

    // De-normalize centroids
    const denormCentroids = centroids.map(cen =>
        cen.map((v, d) => v * ranges[d] + mins[d])
    );

    // Compute cluster stats
    const clusterStats: ClusterStat[] = Array.from({ length: k }, (_, c) => {
        const centroidMap: Record<string, number> = {};
        columns.forEach((col, d) => {
            centroidMap[col] = Math.round(denormCentroids[c][d] * 100) / 100;
        });
        return {
            clusterIndex: c,
            size: labels.filter(l => l === c).length,
            centroid: centroidMap,
        };
    });

    return { labels, centroids: denormCentroids, iterations, columnNames: columns, clusterStats };
}

/**
 * @deprecated Use kMeansClustering instead.
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
