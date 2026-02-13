export interface BivariateResult {
    type: 'numeric-numeric' | 'categorical-categorical' | 'numeric-categorical';
    columns: [string, string];
    metrics: Record<string, number>;
    chartConfig: any; // ECharts-compatible option object
}

// ---------------------------------------------------------------------------
// Color palette
// ---------------------------------------------------------------------------
const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

// ---------------------------------------------------------------------------
// Utility helpers
// ---------------------------------------------------------------------------

function isValidNumber(v: any): v is number {
    return typeof v === 'number' && !isNaN(v) && isFinite(v);
}

/** Extract paired numeric values from two columns, skipping any row where either value is missing / non-numeric. */
function extractPairs(data: any[], col1: string, col2: string): { x: number[]; y: number[] } {
    const x: number[] = [];
    const y: number[] = [];
    for (const row of data) {
        const a = typeof row[col1] === 'string' ? Number(row[col1]) : row[col1];
        const b = typeof row[col2] === 'string' ? Number(row[col2]) : row[col2];
        if (isValidNumber(a) && isValidNumber(b)) {
            x.push(a);
            y.push(b);
        }
    }
    return { x, y };
}

function mean(arr: number[]): number {
    if (arr.length === 0) return 0;
    return arr.reduce((s, v) => s + v, 0) / arr.length;
}

function stdev(arr: number[], avg?: number): number {
    if (arr.length < 2) return 0;
    const m = avg ?? mean(arr);
    const variance = arr.reduce((s, v) => s + (v - m) ** 2, 0) / (arr.length - 1);
    return Math.sqrt(variance);
}

function median(sorted: number[]): number {
    if (sorted.length === 0) return 0;
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function quartiles(values: number[]): [number, number, number, number, number] {
    const sorted = [...values].sort((a, b) => a - b);
    const n = sorted.length;
    if (n === 0) return [0, 0, 0, 0, 0];
    if (n === 1) return [sorted[0], sorted[0], sorted[0], sorted[0], sorted[0]];

    const min = sorted[0];
    const max = sorted[n - 1];
    const med = median(sorted);

    const lowerHalf = sorted.slice(0, Math.floor(n / 2));
    const upperHalf = n % 2 !== 0 ? sorted.slice(Math.floor(n / 2) + 1) : sorted.slice(Math.floor(n / 2));

    const q1 = median(lowerHalf);
    const q3 = median(upperHalf);

    return [min, q1, med, q3, max];
}

function round(v: number, decimals = 4): number {
    const f = Math.pow(10, decimals);
    return Math.round(v * f) / f;
}

// ---------------------------------------------------------------------------
// Numeric vs Numeric
// ---------------------------------------------------------------------------

export function analyzeNumericNumeric(data: any[], col1: string, col2: string): BivariateResult {
    const { x, y } = extractPairs(data, col1, col2);

    // Default result for edge cases
    const empty: BivariateResult = {
        type: 'numeric-numeric',
        columns: [col1, col2],
        metrics: { pearson: 0, slope: 0, intercept: 0, rSquared: 0, n: 0 },
        chartConfig: buildEmptyChart(`${col1} vs ${col2}`, 'Insufficient data for scatter plot'),
    };

    if (x.length < 2) return empty;

    const n = x.length;
    const mx = mean(x);
    const my = mean(y);
    const sx = stdev(x, mx);
    const sy = stdev(y, my);

    // Pearson correlation
    let pearson = 0;
    if (sx > 0 && sy > 0) {
        let sumXY = 0;
        for (let i = 0; i < n; i++) {
            sumXY += (x[i] - mx) * (y[i] - my);
        }
        pearson = sumXY / ((n - 1) * sx * sy);
    }

    // Simple linear regression: y = slope * x + intercept
    let slope = 0;
    let intercept = my;
    if (sx > 0) {
        let sumXX = 0;
        let sumXY = 0;
        for (let i = 0; i < n; i++) {
            sumXX += (x[i] - mx) ** 2;
            sumXY += (x[i] - mx) * (y[i] - my);
        }
        slope = sumXY / sumXX;
        intercept = my - slope * mx;
    }

    const rSquared = pearson * pearson;

    // Regression line endpoints
    const xMin = Math.min(...x);
    const xMax = Math.max(...x);
    const regLineData = [
        [round(xMin, 4), round(slope * xMin + intercept, 4)],
        [round(xMax, 4), round(slope * xMax + intercept, 4)],
    ];

    // Scatter data (cap at 2000 points for performance)
    const scatterData = x.length <= 2000
        ? x.map((v, i) => [round(v, 4), round(y[i], 4)])
        : (() => {
            const step = Math.ceil(x.length / 2000);
            const sampled: number[][] = [];
            for (let i = 0; i < x.length; i += step) {
                sampled.push([round(x[i], 4), round(y[i], 4)]);
            }
            return sampled;
        })();

    const chartConfig = {
        title: {
            text: `${col1} vs ${col2}`,
            subtext: `r = ${round(pearson, 3)}  |  R\u00B2 = ${round(rSquared, 3)}`,
            left: 'center',
            textStyle: { color: '#1f2937', fontSize: 13, fontWeight: '700' },
            subtextStyle: { color: '#6b7280', fontSize: 11 },
        },
        tooltip: {
            trigger: 'item',
            backgroundColor: '#ffffff',
            borderColor: '#e5e7eb',
            textStyle: { color: '#374151' },
        },
        legend: {
            bottom: 0,
            textStyle: { color: '#6b7280', fontSize: 11 },
        },
        grid: { top: 70, bottom: 50, left: 60, right: 30 },
        xAxis: {
            type: 'value',
            name: col1,
            nameLocation: 'middle',
            nameGap: 30,
            nameTextStyle: { color: '#6b7280', fontSize: 11, fontWeight: '600' },
            axisLabel: { color: 'rgba(0,0,0,0.5)', fontSize: 10 },
            axisLine: { lineStyle: { color: 'rgba(0,0,0,0.12)' } },
            splitLine: { lineStyle: { color: 'rgba(0,0,0,0.06)' } },
        },
        yAxis: {
            type: 'value',
            name: col2,
            nameLocation: 'middle',
            nameGap: 45,
            nameTextStyle: { color: '#6b7280', fontSize: 11, fontWeight: '600' },
            axisLabel: { color: 'rgba(0,0,0,0.5)', fontSize: 10 },
            splitLine: { lineStyle: { color: 'rgba(0,0,0,0.06)' } },
        },
        series: [
            {
                name: 'Data Points',
                type: 'scatter',
                data: scatterData,
                symbolSize: 6,
                itemStyle: { color: 'rgba(59, 130, 246, 0.5)', borderColor: '#3b82f6', borderWidth: 1 },
            },
            {
                name: `Regression (y = ${round(slope, 3)}x + ${round(intercept, 3)})`,
                type: 'line',
                data: regLineData,
                smooth: false,
                showSymbol: false,
                lineStyle: { color: '#ef4444', width: 2, type: 'dashed' },
                itemStyle: { color: '#ef4444' },
            },
        ],
    };

    return {
        type: 'numeric-numeric',
        columns: [col1, col2],
        metrics: {
            pearson: round(pearson),
            slope: round(slope),
            intercept: round(intercept),
            rSquared: round(rSquared),
            n,
        },
        chartConfig,
    };
}

// ---------------------------------------------------------------------------
// Categorical vs Categorical
// ---------------------------------------------------------------------------

export function analyzeCategoricalCategorical(data: any[], col1: string, col2: string): BivariateResult {
    const empty: BivariateResult = {
        type: 'categorical-categorical',
        columns: [col1, col2],
        metrics: { cramersV: 0, n: 0 },
        chartConfig: buildEmptyChart(`${col1} vs ${col2}`, 'Insufficient data for categorical analysis'),
    };

    if (!data || data.length === 0) return empty;

    // Build contingency table
    const contingency: Record<string, Record<string, number>> = {};
    const col1Set = new Set<string>();
    const col2Set = new Set<string>();
    let totalValid = 0;

    for (const row of data) {
        const v1 = row[col1];
        const v2 = row[col2];
        if (v1 === null || v1 === undefined || v1 === '' || v2 === null || v2 === undefined || v2 === '') continue;
        const k1 = String(v1);
        const k2 = String(v2);
        col1Set.add(k1);
        col2Set.add(k2);
        if (!contingency[k1]) contingency[k1] = {};
        contingency[k1][k2] = (contingency[k1][k2] || 0) + 1;
        totalValid++;
    }

    if (totalValid === 0 || col1Set.size === 0 || col2Set.size === 0) return empty;

    // Limit to top categories by frequency (top 8 for col1 as x-axis, top 6 for col2 as stack)
    const col1Freq: Record<string, number> = {};
    const col2Freq: Record<string, number> = {};
    for (const k1 of col1Set) {
        col1Freq[k1] = Object.values(contingency[k1] || {}).reduce((s, v) => s + v, 0);
    }
    for (const row of data) {
        const v2 = row[col2];
        if (v2 !== null && v2 !== undefined && v2 !== '') {
            const k2 = String(v2);
            col2Freq[k2] = (col2Freq[k2] || 0) + 1;
        }
    }

    const topCol1 = Object.entries(col1Freq).sort((a, b) => b[1] - a[1]).slice(0, 8).map(e => e[0]);
    const topCol2 = Object.entries(col2Freq).sort((a, b) => b[1] - a[1]).slice(0, 6).map(e => e[0]);

    // Cramer's V
    const r = col1Set.size;
    const c = col2Set.size;
    const allCols1 = Array.from(col1Set);
    const allCols2 = Array.from(col2Set);

    // Row and column totals (full table, not just top)
    const rowTotals: Record<string, number> = {};
    const colTotals: Record<string, number> = {};
    for (const k1 of allCols1) {
        rowTotals[k1] = 0;
        for (const k2 of allCols2) {
            const observed = contingency[k1]?.[k2] || 0;
            rowTotals[k1] += observed;
            colTotals[k2] = (colTotals[k2] || 0) + observed;
        }
    }

    // Chi-squared statistic
    let chiSquared = 0;
    for (const k1 of allCols1) {
        for (const k2 of allCols2) {
            const observed = contingency[k1]?.[k2] || 0;
            const expected = (rowTotals[k1] * colTotals[k2]) / totalValid;
            if (expected > 0) {
                chiSquared += ((observed - expected) ** 2) / expected;
            }
        }
    }

    const minDim = Math.min(r, c);
    const cramersV = minDim > 1 ? Math.sqrt(chiSquared / (totalValid * (minDim - 1))) : 0;

    // Build stacked bar chart series — each topCol2 value is one series
    const series = topCol2.map((cat2, idx) => ({
        name: cat2,
        type: 'bar',
        stack: 'total',
        emphasis: { focus: 'series' },
        itemStyle: { color: COLORS[idx % COLORS.length] },
        data: topCol1.map(cat1 => contingency[cat1]?.[cat2] || 0),
    }));

    const chartConfig = {
        title: {
            text: `${col1} vs ${col2}`,
            subtext: `Cram\u00E9r's V = ${round(cramersV, 3)}`,
            left: 'center',
            textStyle: { color: '#1f2937', fontSize: 13, fontWeight: '700' },
            subtextStyle: { color: '#6b7280', fontSize: 11 },
        },
        tooltip: {
            trigger: 'axis',
            axisPointer: { type: 'shadow' },
            backgroundColor: '#ffffff',
            borderColor: '#e5e7eb',
            textStyle: { color: '#374151' },
        },
        legend: {
            bottom: 0,
            textStyle: { color: '#6b7280', fontSize: 11 },
        },
        grid: { top: 70, bottom: 50, left: 60, right: 30 },
        xAxis: {
            type: 'category',
            data: topCol1,
            axisLabel: {
                color: 'rgba(0,0,0,0.5)',
                fontSize: 10,
                rotate: topCol1.some(l => l.length > 10) ? 30 : 0,
                overflow: 'truncate',
                width: 80,
            },
            axisLine: { lineStyle: { color: 'rgba(0,0,0,0.12)' } },
        },
        yAxis: {
            type: 'value',
            name: 'Count',
            nameTextStyle: { color: '#6b7280', fontSize: 11, fontWeight: '600' },
            axisLabel: { color: 'rgba(0,0,0,0.5)', fontSize: 10 },
            splitLine: { lineStyle: { color: 'rgba(0,0,0,0.06)' } },
        },
        series,
    };

    return {
        type: 'categorical-categorical',
        columns: [col1, col2],
        metrics: {
            cramersV: round(cramersV),
            chiSquared: round(chiSquared),
            n: totalValid,
            uniqueCol1: col1Set.size,
            uniqueCol2: col2Set.size,
        },
        chartConfig,
    };
}

// ---------------------------------------------------------------------------
// Numeric vs Categorical
// ---------------------------------------------------------------------------

export function analyzeNumericCategorical(data: any[], numCol: string, catCol: string): BivariateResult {
    const empty: BivariateResult = {
        type: 'numeric-categorical',
        columns: [numCol, catCol],
        metrics: { etaSquared: 0, n: 0 },
        chartConfig: buildEmptyChart(`${numCol} by ${catCol}`, 'Insufficient data for grouped analysis'),
    };

    if (!data || data.length === 0) return empty;

    // Group numeric values by category
    const groups: Record<string, number[]> = {};
    for (const row of data) {
        const cat = row[catCol];
        if (cat === null || cat === undefined || cat === '') continue;
        const num = typeof row[numCol] === 'string' ? Number(row[numCol]) : row[numCol];
        if (!isValidNumber(num)) continue;
        const key = String(cat);
        if (!groups[key]) groups[key] = [];
        groups[key].push(num);
    }

    const groupKeys = Object.keys(groups);
    if (groupKeys.length === 0) return empty;

    // Take top 10 categories by group size
    const topGroups = groupKeys
        .map(k => ({ key: k, values: groups[k] }))
        .sort((a, b) => b.values.length - a.values.length)
        .slice(0, 10);

    // Per-group statistics
    const groupStats: Record<string, { mean: number; median: number; stdev: number; n: number }> = {};
    for (const g of topGroups) {
        const sorted = [...g.values].sort((a, b) => a - b);
        const m = mean(g.values);
        groupStats[g.key] = {
            mean: round(m),
            median: round(median(sorted)),
            stdev: round(stdev(g.values, m)),
            n: g.values.length,
        };
    }

    // Eta-squared (effect size): SS_between / SS_total
    const allValues: number[] = [];
    for (const g of topGroups) allValues.push(...g.values);
    const grandMean = mean(allValues);

    let ssBetween = 0;
    let ssTotal = 0;
    for (const g of topGroups) {
        const gm = mean(g.values);
        ssBetween += g.values.length * (gm - grandMean) ** 2;
    }
    for (const v of allValues) {
        ssTotal += (v - grandMean) ** 2;
    }
    const etaSquared = ssTotal > 0 ? ssBetween / ssTotal : 0;

    // Box-plot data: [min, Q1, median, Q3, max] per category
    const categories = topGroups.map(g => g.key);
    const boxplotData = topGroups.map(g => {
        const q = quartiles(g.values);
        return q.map(v => round(v, 4));
    });

    // Outliers per group for scatter overlay
    const outlierData: number[][] = [];
    topGroups.forEach((g, catIdx) => {
        const q = quartiles(g.values);
        const iqr = q[3] - q[1];
        const lower = q[1] - 1.5 * iqr;
        const upper = q[3] + 1.5 * iqr;
        for (const v of g.values) {
            if (v < lower || v > upper) {
                outlierData.push([catIdx, round(v, 4)]);
            }
        }
    });

    const chartConfig = {
        title: {
            text: `${numCol} by ${catCol}`,
            subtext: `\u03B7\u00B2 = ${round(etaSquared, 3)}  |  ${topGroups.length} group${topGroups.length !== 1 ? 's' : ''}`,
            left: 'center',
            textStyle: { color: '#1f2937', fontSize: 13, fontWeight: '700' },
            subtextStyle: { color: '#6b7280', fontSize: 11 },
        },
        tooltip: {
            trigger: 'item',
            backgroundColor: '#ffffff',
            borderColor: '#e5e7eb',
            textStyle: { color: '#374151' },
            formatter: (params: any) => {
                if (params.seriesType === 'boxplot') {
                    const d = params.data;
                    return [
                        `<strong>${params.name}</strong>`,
                        `Max: ${d[5]}`,
                        `Q3: ${d[4]}`,
                        `Median: ${d[3]}`,
                        `Q1: ${d[2]}`,
                        `Min: ${d[1]}`,
                    ].join('<br/>');
                }
                return `Outlier: ${params.data[1]}`;
            },
        },
        grid: { top: 70, bottom: 50, left: 60, right: 30 },
        xAxis: {
            type: 'category',
            data: categories,
            axisLabel: {
                color: 'rgba(0,0,0,0.5)',
                fontSize: 10,
                rotate: categories.some(l => l.length > 10) ? 30 : 0,
                overflow: 'truncate',
                width: 80,
            },
            axisLine: { lineStyle: { color: 'rgba(0,0,0,0.12)' } },
        },
        yAxis: {
            type: 'value',
            name: numCol,
            nameTextStyle: { color: '#6b7280', fontSize: 11, fontWeight: '600' },
            axisLabel: { color: 'rgba(0,0,0,0.5)', fontSize: 10 },
            splitLine: { lineStyle: { color: 'rgba(0,0,0,0.06)' } },
        },
        series: [
            {
                name: 'Box Plot',
                type: 'boxplot',
                data: boxplotData,
                itemStyle: {
                    color: '#3b82f6',
                    borderColor: '#2563eb',
                    borderWidth: 1.5,
                },
                emphasis: {
                    itemStyle: { borderColor: '#1d4ed8', borderWidth: 2.5 },
                },
            },
            ...(outlierData.length > 0
                ? [
                    {
                        name: 'Outliers',
                        type: 'scatter',
                        data: outlierData,
                        symbolSize: 5,
                        itemStyle: { color: '#ef4444', opacity: 0.7 },
                    },
                ]
                : []),
        ],
    };

    // Build metrics object including per-group stats as flat keys
    const metrics: Record<string, number> = {
        etaSquared: round(etaSquared),
        grandMean: round(grandMean),
        n: allValues.length,
        groupCount: topGroups.length,
    };
    for (const g of topGroups) {
        const s = groupStats[g.key];
        metrics[`mean_${g.key}`] = s.mean;
        metrics[`median_${g.key}`] = s.median;
        metrics[`stdev_${g.key}`] = s.stdev;
        metrics[`n_${g.key}`] = s.n;
    }

    return {
        type: 'numeric-categorical',
        columns: [numCol, catCol],
        metrics,
        chartConfig,
    };
}

// ---------------------------------------------------------------------------
// Auto-dispatch
// ---------------------------------------------------------------------------

export function analyzeBivariate(data: any[], col1: string, col2: string): BivariateResult {
    if (!data || data.length === 0) {
        return {
            type: 'numeric-numeric',
            columns: [col1, col2],
            metrics: {},
            chartConfig: buildEmptyChart(`${col1} vs ${col2}`, 'No data available'),
        };
    }

    const isNumeric = (col: string): boolean => {
        // Sample up to 200 non-null values to decide
        let numericCount = 0;
        let total = 0;
        for (const row of data) {
            const v = row[col];
            if (v === null || v === undefined || v === '') continue;
            total++;
            if (typeof v === 'number' && isFinite(v)) {
                numericCount++;
            } else if (typeof v === 'string' && v.trim() !== '' && !isNaN(Number(v))) {
                numericCount++;
            }
            if (total >= 200) break;
        }
        // Consider numeric if >= 80% of sampled non-null values are numeric
        return total > 0 && numericCount / total >= 0.8;
    };

    const col1Numeric = isNumeric(col1);
    const col2Numeric = isNumeric(col2);

    if (col1Numeric && col2Numeric) {
        return analyzeNumericNumeric(data, col1, col2);
    }

    if (!col1Numeric && !col2Numeric) {
        return analyzeCategoricalCategorical(data, col1, col2);
    }

    // One numeric, one categorical
    if (col1Numeric) {
        return analyzeNumericCategorical(data, col1, col2);
    }
    return analyzeNumericCategorical(data, col2, col1);
}

// ---------------------------------------------------------------------------
// Empty / fallback chart config
// ---------------------------------------------------------------------------

function buildEmptyChart(title: string, message: string): any {
    return {
        title: {
            text: title,
            subtext: message,
            left: 'center',
            top: 'center',
            textStyle: { color: '#9ca3af', fontSize: 14, fontWeight: '600' },
            subtextStyle: { color: '#d1d5db', fontSize: 12 },
        },
        xAxis: { show: false },
        yAxis: { show: false },
        series: [],
    };
}
