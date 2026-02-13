import * as aq from 'arquero';

export interface NumericColumnStats {
    mean: number;
    median: number;
    mode: number;
    min: number;
    max: number;
    range: number;
    q1: number;
    q3: number;
    iqr: number;
    stdev: number;
    variance: number;
    skewness: number;
    kurtosis: number;
    cv: number;
}

export interface CategoricalColumnStats {
    uniqueCount: number;
    topValues: Array<{ value: string; count: number; percentage: number }>;
    entropy: number;
}

export interface ColumnProfile {
    name: string;
    type: 'numeric' | 'categorical' | 'date' | 'boolean' | 'text';
    stats: NumericColumnStats | CategoricalColumnStats;
    missing: { count: number; percentage: number };
    zeros: { count: number; percentage: number };
    uniqueValues: number;
    uniquePercentage: number;
}

export interface DataProfile {
    rowCount: number;
    columnCount: number;
    memoryEstimateKB: number;
    columns: Record<string, ColumnProfile>;
    qualityScore: number;
    duplicateRows: number;
    completenessPercentage: number;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function isNullish(v: unknown): boolean {
    return v === null || v === undefined || v === '';
}

/**
 * Detect the profiling type for a single column by inspecting its non-null
 * values.  We sample up to `sampleSize` rows to keep detection fast on large
 * data sets.
 */
function detectColumnType(
    data: any[],
    col: string,
    sampleSize = 500,
): ColumnProfile['type'] {
    // Gather a sample of non-null values
    const step = Math.max(1, Math.floor(data.length / sampleSize));
    const sample: unknown[] = [];
    for (let i = 0; i < data.length && sample.length < sampleSize; i += step) {
        const v = data[i][col];
        if (!isNullish(v)) sample.push(v);
    }

    if (sample.length === 0) return 'categorical';

    // Boolean check
    if (
        sample.every(
            (v) =>
                typeof v === 'boolean' ||
                v === 'true' ||
                v === 'false' ||
                v === 0 ||
                v === 1,
        )
    ) {
        // Only flag as boolean if the distinct textual values are limited to
        // true/false/0/1 style values
        const distinct = new Set(sample.map(String));
        if (distinct.size <= 2) return 'boolean';
    }

    // Numeric check
    if (
        sample.every(
            (v) =>
                typeof v === 'number' ||
                (typeof v === 'string' && v.trim() !== '' && !isNaN(Number(v))),
        )
    ) {
        return 'numeric';
    }

    // Date check – require > 80% parseable date strings with length > 5
    const dateHits = sample.filter(
        (v) => typeof v === 'string' && v.length > 5 && !isNaN(Date.parse(v)),
    );
    if (sample.length > 5 && dateHits.length > sample.length * 0.8) {
        return 'date';
    }

    // Long-text heuristic
    const avgLen =
        sample.reduce((acc: number, v) => acc + String(v).length, 0) /
        sample.length;
    if (avgLen > 100) return 'text';

    return 'categorical';
}

/**
 * Estimate total memory footprint in kilobytes by sampling rows and measuring
 * their JSON representation.
 */
function estimateMemoryKB(data: any[]): number {
    if (data.length === 0) return 0;

    const sampleCount = Math.min(100, data.length);
    const step = Math.max(1, Math.floor(data.length / sampleCount));
    let totalBytes = 0;
    let sampled = 0;

    for (let i = 0; i < data.length && sampled < sampleCount; i += step) {
        totalBytes += JSON.stringify(data[i]).length;
        sampled++;
    }

    const avgBytesPerRow = totalBytes / sampled;
    return Math.round((avgBytesPerRow * data.length) / 1024);
}

/**
 * Compute the mode (most frequent value) of a sorted numeric array.
 */
function numericMode(sorted: number[]): number {
    if (sorted.length === 0) return 0;

    let bestVal = sorted[0];
    let bestCount = 1;
    let currentVal = sorted[0];
    let currentCount = 1;

    for (let i = 1; i < sorted.length; i++) {
        if (sorted[i] === currentVal) {
            currentCount++;
        } else {
            if (currentCount > bestCount) {
                bestCount = currentCount;
                bestVal = currentVal;
            }
            currentVal = sorted[i];
            currentCount = 1;
        }
    }
    // Final run
    if (currentCount > bestCount) {
        bestVal = currentVal;
    }
    return bestVal;
}

/**
 * Given a sorted array, return the value at the given quantile (0-1) using
 * linear interpolation.
 */
function quantile(sorted: number[], q: number): number {
    if (sorted.length === 0) return 0;
    if (sorted.length === 1) return sorted[0];

    const pos = q * (sorted.length - 1);
    const lower = Math.floor(pos);
    const upper = Math.ceil(pos);
    const fraction = pos - lower;

    if (lower === upper) return sorted[lower];
    return sorted[lower] * (1 - fraction) + sorted[upper] * fraction;
}

// ---------------------------------------------------------------------------
// Stats builders
// ---------------------------------------------------------------------------

function buildNumericStats(
    data: any[],
    col: string,
    dt: aq.ColumnTable,
): NumericColumnStats {
    // Use Arquero for the basics it handles well
    const rollup = dt
        .rollup({
            mean: aq.op.mean(col),
            median: aq.op.median(col),
            min: aq.op.min(col),
            max: aq.op.max(col),
            stdev: aq.op.stdev(col),
            variance: aq.op.variance(col),
        })
        .object(0) as Record<string, number>;

    // Sorted array of valid numbers for percentile / higher-moment calculations
    const values = data
        .map((r) => r[col])
        .filter((v): v is number => typeof v === 'number' && !isNaN(v))
        .sort((a, b) => a - b);

    const n = values.length;

    const mean = rollup.mean ?? 0;
    const stdev = rollup.stdev ?? 0;
    const variance = rollup.variance ?? 0;
    const min = rollup.min ?? 0;
    const max = rollup.max ?? 0;
    const median = rollup.median ?? 0;

    const q1 = quantile(values, 0.25);
    const q3 = quantile(values, 0.75);
    const iqr = q3 - q1;
    const range = max - min;

    const mode = numericMode(values);

    // Coefficient of variation (percentage)
    const cv = mean !== 0 ? (stdev / Math.abs(mean)) * 100 : 0;

    // Skewness – adjusted Fisher-Pearson standardised moment
    let skewness = 0;
    if (n > 2 && stdev > 0) {
        const m3 =
            values.reduce((acc, v) => acc + Math.pow(v - mean, 3), 0) / n;
        skewness = (m3 / Math.pow(stdev, 3)) * (n * n) / ((n - 1) * (n - 2));
    }

    // Excess kurtosis – adjusted (Fisher definition, normal = 0)
    let kurtosis = 0;
    if (n > 3 && stdev > 0) {
        const m4 =
            values.reduce((acc, v) => acc + Math.pow(v - mean, 4), 0) / n;
        const rawKurt = m4 / Math.pow(stdev, 4);
        // Adjusted excess kurtosis
        kurtosis =
            ((n * (n + 1)) / ((n - 1) * (n - 2) * (n - 3))) * rawKurt * n -
            (3 * (n - 1) * (n - 1)) / ((n - 2) * (n - 3));
    }

    return {
        mean: round(mean),
        median: round(median),
        mode: round(mode),
        min: round(min),
        max: round(max),
        range: round(range),
        q1: round(q1),
        q3: round(q3),
        iqr: round(iqr),
        stdev: round(stdev),
        variance: round(variance),
        skewness: round(skewness, 4),
        kurtosis: round(kurtosis, 4),
        cv: round(cv),
    };
}

function buildCategoricalStats(
    data: any[],
    col: string,
    dt: aq.ColumnTable,
): CategoricalColumnStats {
    const counts = dt.groupby(col).count().orderby(aq.desc('count'));
    const totalNonNull = data.filter((r) => !isNullish(r[col])).length;
    const uniqueCount = counts.numRows();

    // Top 5 values
    const topValues: CategoricalColumnStats['topValues'] = [];
    const limit = Math.min(5, counts.numRows());
    for (let i = 0; i < limit; i++) {
        const row = counts.object(i) as Record<string, any>;
        topValues.push({
            value: String(row[col]),
            count: row.count as number,
            percentage:
                totalNonNull > 0
                    ? round(((row.count as number) / totalNonNull) * 100)
                    : 0,
        });
    }

    // Shannon entropy (bits)
    let entropy = 0;
    for (let i = 0; i < counts.numRows(); i++) {
        const row = counts.object(i) as Record<string, any>;
        const p = (row.count as number) / totalNonNull;
        if (p > 0) entropy -= p * Math.log2(p);
    }

    return {
        uniqueCount,
        topValues,
        entropy: round(entropy, 4),
    };
}

// ---------------------------------------------------------------------------
// Rounding helper
// ---------------------------------------------------------------------------

function round(value: number, decimals = 2): number {
    if (!isFinite(value)) return 0;
    const factor = Math.pow(10, decimals);
    return Math.round(value * factor) / factor;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Generate a comprehensive data profile for the supplied row-based dataset.
 *
 * The profiler:
 *  1. Counts rows and columns.
 *  2. Estimates memory via JSON-stringify sampling (100 rows).
 *  3. Detects each column's type and computes the appropriate stats.
 *     - Numeric: mean, median, mode, min, max, range, q1, q3, iqr, stdev,
 *       variance, skewness, kurtosis, cv.
 *     - Categorical / date / boolean / text: uniqueCount, topValues (top 5),
 *       entropy.
 *  4. Computes per-column missing and zero counts.
 *  5. Counts duplicate rows via Arquero `dedupe`.
 *  6. Derives overall completeness and a composite quality score.
 */
export function generateDataProfile(data: any[]): DataProfile {
    if (!data || data.length === 0) {
        return {
            rowCount: 0,
            columnCount: 0,
            memoryEstimateKB: 0,
            columns: {},
            qualityScore: 0,
            duplicateRows: 0,
            completenessPercentage: 0,
        };
    }

    const dt = aq.from(data);
    const columnNames = dt.columnNames();

    const rowCount = data.length;
    const columnCount = columnNames.length;
    const memoryEstimateKB = estimateMemoryKB(data);

    // Duplicate rows
    const deduped = dt.dedupe();
    const duplicateRows = rowCount - deduped.numRows();

    // Build column profiles
    const columns: Record<string, ColumnProfile> = {};
    let totalMissing = 0;

    for (const col of columnNames) {
        const type = detectColumnType(data, col);

        // Missing values
        const missingCount = data.filter((r) => isNullish(r[col])).length;
        totalMissing += missingCount;
        const missingPercentage =
            rowCount > 0 ? round((missingCount / rowCount) * 100) : 0;

        // Zero values (meaningful for numeric, but tracked for all)
        const zeroCount = data.filter((r) => {
            const v = r[col];
            return v === 0 || v === '0';
        }).length;
        const zeroPercentage =
            rowCount > 0 ? round((zeroCount / rowCount) * 100) : 0;

        // Unique values
        const uniqueSet = new Set(
            data.map((r) => r[col]).filter((v) => !isNullish(v)).map(String),
        );
        const uniqueValues = uniqueSet.size;
        const nonNullCount = rowCount - missingCount;
        const uniquePercentage =
            nonNullCount > 0 ? round((uniqueValues / nonNullCount) * 100) : 0;

        // Stats (numeric vs categorical-like)
        let stats: NumericColumnStats | CategoricalColumnStats;

        if (type === 'numeric') {
            stats = buildNumericStats(data, col, dt);
        } else {
            stats = buildCategoricalStats(data, col, dt);
        }

        columns[col] = {
            name: col,
            type,
            stats,
            missing: { count: missingCount, percentage: missingPercentage },
            zeros: { count: zeroCount, percentage: zeroPercentage },
            uniqueValues,
            uniquePercentage,
        };
    }

    // Completeness
    const totalCells = rowCount * columnCount;
    const completenessPercentage =
        totalCells > 0
            ? round(((totalCells - totalMissing) / totalCells) * 100)
            : 0;

    // Build the profile without quality score first, then compute it
    const profile: DataProfile = {
        rowCount,
        columnCount,
        memoryEstimateKB,
        columns,
        qualityScore: 0, // placeholder
        duplicateRows,
        completenessPercentage,
    };

    profile.qualityScore = computeQualityScore(profile);
    return profile;
}

/**
 * Compute a 0-100 quality score based on three weighted dimensions:
 *
 *  - **Completeness (40%)**: Percentage of non-missing cells.
 *  - **Duplicate ratio (30%)**: Penalises duplicate rows.  A dataset with
 *    zero duplicates gets full marks; one that is 100% duplicates scores 0.
 *  - **Type consistency (30%)**: For each column we check how consistently
 *    the non-null values match the detected type.  Columns where every value
 *    conforms to the detected type score 100; mixed-type columns drag the
 *    score down.
 *
 * The final score is clamped to [0, 100] and rounded to one decimal.
 */
export function computeQualityScore(profile: DataProfile): number {
    if (profile.rowCount === 0) return 0;

    // --- 1. Completeness (0-100) -------------------------------------------
    const completenessScore = profile.completenessPercentage;

    // --- 2. Duplicate ratio (0-100) ----------------------------------------
    // duplicateRatio 0 -> score 100, duplicateRatio 1 -> score 0
    const duplicateRatio = profile.duplicateRows / profile.rowCount;
    const duplicateScore = (1 - duplicateRatio) * 100;

    // --- 3. Type consistency (0-100) ---------------------------------------
    // For each column we estimate how well values conform to the detected
    // type.  A fully numeric column where every non-null value parses as a
    // number scores 100.  A "categorical" column is assumed consistent (we
    // can't really invalidate arbitrary strings).  The overall type
    // consistency is the average across columns.

    const columnNames = Object.keys(profile.columns);
    let typeConsistencySum = 0;

    for (const colName of columnNames) {
        const col = profile.columns[colName];
        const nonNullCount =
            profile.rowCount - col.missing.count;

        if (nonNullCount === 0) {
            // All missing – penalise heavily
            typeConsistencySum += 0;
            continue;
        }

        switch (col.type) {
            case 'numeric': {
                // A numeric column's consistency can be approximated by how
                // few zeros and missing values it has relative to its total,
                // combined with whether outliers are reasonable.  However,
                // zeros are valid data, so we only use the fact that Arquero
                // was able to compute stats as a proxy.  We consider a numeric
                // column with finite mean/stdev as 100% consistent.
                const numStats = col.stats as NumericColumnStats;
                const hasFiniteStats =
                    isFinite(numStats.mean) && isFinite(numStats.stdev);
                typeConsistencySum += hasFiniteStats ? 100 : 50;
                break;
            }
            case 'boolean': {
                // Boolean columns with <= 2 unique values are fully consistent
                typeConsistencySum += col.uniqueValues <= 2 ? 100 : 70;
                break;
            }
            case 'date': {
                // If detected as date, we assume the heuristic was solid (it
                // requires > 80% parseable).  Give a slight penalty since not
                // all rows may parse.
                typeConsistencySum += 90;
                break;
            }
            case 'text':
            case 'categorical': {
                // Categorical / text are inherently flexible.  We give full
                // marks but penalise very high cardinality (every value unique
                // in a large dataset may indicate an ID column that was
                // mis-classified).
                const cardinalityRatio = col.uniqueValues / nonNullCount;
                if (cardinalityRatio > 0.95 && nonNullCount > 20) {
                    // Likely an ID column – mild penalty
                    typeConsistencySum += 70;
                } else {
                    typeConsistencySum += 100;
                }
                break;
            }
            default:
                typeConsistencySum += 80;
        }
    }

    const typeConsistencyScore =
        columnNames.length > 0
            ? typeConsistencySum / columnNames.length
            : 100;

    // --- Weighted combination ----------------------------------------------
    const weightedScore =
        completenessScore * 0.4 +
        duplicateScore * 0.3 +
        typeConsistencyScore * 0.3;

    return round(Math.max(0, Math.min(100, weightedScore)), 1);
}
