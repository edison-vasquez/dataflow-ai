import { DataIssue } from "@/store/useAppStore";
import * as aq from 'arquero';

export function analyzeDataset(data: any[]): DataIssue[] {
    if (!data || data.length === 0) return [];

    const dt = aq.from(data);
    const issues: DataIssue[] = [];
    const columns = dt.columnNames();

    // 1. Check for Nulls using Arquero
    columns.forEach(col => {
        const nullCount = data.filter(row => row[col] === null || row[col] === undefined || row[col] === '').length;
        if (nullCount > 0) {
            const percentage = (nullCount / data.length) * 100;
            issues.push({
                id: `null-${col}`,
                type: 'null',
                field: col,
                count: nullCount,
                severity: percentage > 30 ? 'high' : percentage > 10 ? 'medium' : 'low',
                suggestion: `Impute missing values in ${col} using the ${typeof data[0][col] === 'number' ? 'mean' : 'mode'}.`
            });
        }
    });

    // 2. Check for Duplicates
    const duplicateCount = data.length - dt.dedupe().numRows();
    if (duplicateCount > 0) {
        issues.push({
            id: 'duplicates',
            type: 'duplicate',
            field: 'All Columns',
            count: duplicateCount,
            severity: (duplicateCount / data.length) > 0.05 ? 'high' : 'medium',
            suggestion: 'Remove duplicate records to ensure data integrity.'
        });
    }

    // 3. Outlier Detection (IQR & Z-score)
    columns.forEach(col => {
        const values = data.map(row => row[col]).filter(v => typeof v === 'number');
        if (values.length > 10) {
            // IQR Method
            const sorted = [...values].sort((a, b) => a - b);
            const q1 = sorted[Math.floor(sorted.length * 0.25)];
            const q3 = sorted[Math.floor(sorted.length * 0.75)];
            const iqr = q3 - q1;
            const lower = q1 - 1.5 * iqr;
            const upper = q3 + 1.5 * iqr;

            // Z-score Method
            const mean = values.reduce((a, b) => a + b, 0) / values.length;
            const std = Math.sqrt(values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length);

            const outliersIQR = values.filter(v => v < lower || v > upper);
            const outliersZ = values.filter(v => std > 0 && Math.abs((v - mean) / std) > 3);

            if (outliersIQR.length > 0 || outliersZ.length > 0) {
                issues.push({
                    id: `outlier-${col}`,
                    type: 'outlier',
                    field: col,
                    count: Math.max(outliersIQR.length, outliersZ.length),
                    severity: 'low',
                    suggestion: `Detected outliers using IQR (${outliersIQR.length}) and Z-score (${outliersZ.length}). Consider capping or removing them.`
                });
            }
        }
    });

    return issues;
}

export interface ColumnTypeInfo {
    type: 'numeric' | 'categorical' | 'date' | 'boolean' | 'text' | 'id';
    nullCount: number;
    nullPercentage: number;
    uniqueCount: number;
    sampleValues: any[];
}

export function detectColumnTypes(data: any[], options?: { sampleSize?: number; fullScan?: boolean }): Record<string, 'numeric' | 'categorical' | 'date' | 'boolean'> {
    if (!data || data.length === 0) return {};
    const columns = Object.keys(data[0]);
    const types: Record<string, 'numeric' | 'categorical' | 'date' | 'boolean'> = {};

    // Stratified sampling: first 10, last 10, random middle (up to 500)
    const targetSize = options?.fullScan ? data.length : Math.min(options?.sampleSize || 500, data.length);
    const sampleIndices = new Set<number>();
    for (let i = 0; i < Math.min(10, data.length); i++) sampleIndices.add(i);
    for (let i = Math.max(0, data.length - 10); i < data.length; i++) sampleIndices.add(i);
    while (sampleIndices.size < targetSize) {
        sampleIndices.add(Math.floor(Math.random() * data.length));
    }
    const sample = [...sampleIndices].map(i => data[i]);

    columns.forEach(col => {
        const values = sample.map(r => r[col]).filter(v => v !== null && v !== undefined && v !== '');
        if (values.length === 0) { types[col] = 'categorical'; return; }
        if (values.every(v => typeof v === 'number' || (typeof v === 'string' && !isNaN(Number(v)) && v.trim() !== ''))) types[col] = 'numeric';
        else if (values.every(v => typeof v === 'boolean' || v === 'true' || v === 'false')) types[col] = 'boolean';
        else if (values.length > 5 && values.filter(v => typeof v === 'string' && v.length > 5 && !isNaN(Date.parse(v))).length > values.length * 0.8) types[col] = 'date';
        else types[col] = 'categorical';
    });

    return types;
}

export function detectColumnTypesDetailed(data: any[]): Record<string, ColumnTypeInfo> {
    if (!data || data.length === 0) return {};
    const columns = Object.keys(data[0]);
    const basicTypes = detectColumnTypes(data);
    const result: Record<string, ColumnTypeInfo> = {};

    columns.forEach(col => {
        const nullCount = data.filter(r => r[col] === null || r[col] === undefined || r[col] === '').length;
        const nonNull = data.map(r => r[col]).filter(v => v !== null && v !== undefined && v !== '');
        const uniqueSet = new Set(nonNull.map(String));

        let detailedType: ColumnTypeInfo['type'] = basicTypes[col] || 'categorical';
        // Detect IDs: high cardinality numeric or string columns
        if (uniqueSet.size === nonNull.length && nonNull.length > 10) {
            detailedType = 'id';
        } else if (basicTypes[col] === 'categorical' && nonNull.some(v => String(v).length > 100)) {
            detailedType = 'text';
        } else {
            detailedType = basicTypes[col] || 'categorical';
        }

        result[col] = {
            type: detailedType,
            nullCount,
            nullPercentage: data.length > 0 ? Math.round((nullCount / data.length) * 10000) / 100 : 0,
            uniqueCount: uniqueSet.size,
            sampleValues: nonNull.slice(0, 5),
        };
    });

    return result;
}

export function applyTransformation(data: any[], type: string, params: any): any[] {
    const dt = aq.from(data);
    const isNull = (v: any) => v === null || v === undefined || v === '';

    switch (type) {
        // === ORIGINAL ===
        case 'remove_duplicates':
            return dt.dedupe().objects();
        case 'impute_nulls': {
            const { field, value } = params;
            return data.map(row => ({
                ...row,
                [field]: isNull(row[field]) ? value : row[field]
            }));
        }
        case 'drop_column':
            return dt.select(aq.not(params.column)).objects();
        case 'rename_column':
            return dt.rename({ [params.oldName]: params.newName }).objects();

        // === MISSING VALUE STRATEGIES ===
        case 'impute_mean': {
            const vals = data.map(r => r[params.field]).filter(v => typeof v === 'number' && !isNull(v));
            const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
            return data.map(row => ({ ...row, [params.field]: isNull(row[params.field]) ? Math.round(mean * 100) / 100 : row[params.field] }));
        }
        case 'impute_median': {
            const vals = data.map(r => r[params.field]).filter(v => typeof v === 'number' && !isNull(v)).sort((a, b) => a - b);
            const mid = Math.floor(vals.length / 2);
            const median = vals.length % 2 ? vals[mid] : (vals[mid - 1] + vals[mid]) / 2;
            return data.map(row => ({ ...row, [params.field]: isNull(row[params.field]) ? median : row[params.field] }));
        }
        case 'impute_mode': {
            const freq: Record<string, number> = {};
            data.forEach(r => { if (!isNull(r[params.field])) { const k = String(r[params.field]); freq[k] = (freq[k] || 0) + 1; } });
            const mode = Object.entries(freq).sort((a, b) => b[1] - a[1])[0]?.[0];
            const isNum = data.some(r => typeof r[params.field] === 'number');
            const modeVal = isNum ? Number(mode) : mode;
            return data.map(row => ({ ...row, [params.field]: isNull(row[params.field]) ? modeVal : row[params.field] }));
        }
        case 'impute_forward_fill': {
            let last: any = null;
            return data.map(row => {
                if (!isNull(row[params.field])) { last = row[params.field]; return row; }
                return { ...row, [params.field]: last };
            });
        }
        case 'impute_backward_fill': {
            let last: any = null;
            const result = [...data];
            for (let i = result.length - 1; i >= 0; i--) {
                if (!isNull(result[i][params.field])) { last = result[i][params.field]; }
                else { result[i] = { ...result[i], [params.field]: last }; }
            }
            return result;
        }
        case 'drop_rows_with_nulls': {
            if (params.field) return data.filter(row => !isNull(row[params.field]));
            return data.filter(row => !Object.values(row).some(isNull));
        }

        // === OUTLIER TREATMENT ===
        case 'outlier_cap': {
            const vals = data.map(r => r[params.field]).filter(v => typeof v === 'number').sort((a, b) => a - b);
            const q1 = vals[Math.floor(vals.length * 0.25)];
            const q3 = vals[Math.floor(vals.length * 0.75)];
            const iqr = q3 - q1;
            const factor = params.factor || 1.5;
            const lower = q1 - factor * iqr;
            const upper = q3 + factor * iqr;
            return data.map(row => {
                if (typeof row[params.field] !== 'number') return row;
                return { ...row, [params.field]: Math.max(lower, Math.min(upper, row[params.field])) };
            });
        }
        case 'outlier_winsorize': {
            const pct = params.percentile || 5;
            const vals = data.map(r => r[params.field]).filter(v => typeof v === 'number').sort((a, b) => a - b);
            const lowerVal = vals[Math.floor(vals.length * pct / 100)];
            const upperVal = vals[Math.floor(vals.length * (100 - pct) / 100)];
            return data.map(row => {
                if (typeof row[params.field] !== 'number') return row;
                return { ...row, [params.field]: Math.max(lowerVal, Math.min(upperVal, row[params.field])) };
            });
        }
        case 'outlier_remove': {
            const vals = data.map(r => r[params.field]).filter(v => typeof v === 'number').sort((a, b) => a - b);
            const q1 = vals[Math.floor(vals.length * 0.25)];
            const q3 = vals[Math.floor(vals.length * 0.75)];
            const iqr = q3 - q1;
            const threshold = params.threshold || 1.5;
            const lower = q1 - threshold * iqr;
            const upper = q3 + threshold * iqr;
            return data.filter(row => {
                if (typeof row[params.field] !== 'number') return true;
                return row[params.field] >= lower && row[params.field] <= upper;
            });
        }
        case 'outlier_log_transform': {
            return data.map(row => {
                if (typeof row[params.field] !== 'number' || row[params.field] <= 0) return row;
                return { ...row, [params.field]: Math.round(Math.log(row[params.field]) * 10000) / 10000 };
            });
        }

        // === STRING CLEANING ===
        case 'string_trim':
            return data.map(row => ({ ...row, [params.field]: typeof row[params.field] === 'string' ? row[params.field].trim() : row[params.field] }));
        case 'string_lowercase':
            return data.map(row => ({ ...row, [params.field]: typeof row[params.field] === 'string' ? row[params.field].toLowerCase() : row[params.field] }));
        case 'string_uppercase':
            return data.map(row => ({ ...row, [params.field]: typeof row[params.field] === 'string' ? row[params.field].toUpperCase() : row[params.field] }));
        case 'string_regex_replace':
            try {
                const regex = new RegExp(params.pattern, 'g');
                return data.map(row => ({ ...row, [params.field]: typeof row[params.field] === 'string' ? row[params.field].replace(regex, params.replacement || '') : row[params.field] }));
            } catch { return data; }

        // === TYPE CONVERSION ===
        case 'convert_to_number':
            return data.map(row => ({ ...row, [params.field]: isNull(row[params.field]) ? null : Number(row[params.field]) || 0 }));
        case 'convert_to_string':
            return data.map(row => ({ ...row, [params.field]: isNull(row[params.field]) ? '' : String(row[params.field]) }));
        case 'convert_to_date':
            return data.map(row => ({ ...row, [params.field]: isNull(row[params.field]) ? null : new Date(row[params.field]).toISOString() }));

        // === COLUMN OPERATIONS ===
        case 'split_column': {
            const { field: splitField, delimiter, newColumns } = params;
            return data.map(row => {
                const parts = String(row[splitField] || '').split(delimiter);
                const extra: Record<string, string> = {};
                (newColumns || []).forEach((nc: string, i: number) => { extra[nc] = parts[i] || ''; });
                return { ...row, ...extra };
            });
        }
        case 'merge_columns': {
            const { fields, newName, separator } = params;
            return data.map(row => ({
                ...row,
                [newName]: (fields || []).map((f: string) => String(row[f] || '')).join(separator || ' ')
            }));
        }
        case 'computed_column': {
            const { newName, expression } = params;
            return data.map(row => {
                try {
                    const d = row;
                    const val = new Function('d', `return ${expression}`)(d);
                    return { ...row, [newName]: val };
                } catch { return { ...row, [newName]: null }; }
            });
        }

        // === ADVANCED ANALYTICS ===
        case 'join_datasets': {
            const { otherData, leftKey, rightKey, type: joinType } = params;
            const otherDt = aq.from(otherData);
            let result;
            if (joinType === 'left') {
                result = dt.join_left(otherDt, [leftKey, rightKey]);
            } else if (joinType === 'inner') {
                result = dt.join(otherDt, [leftKey, rightKey]);
            } else if (joinType === 'full') {
                result = dt.join_full(otherDt, [leftKey, rightKey]);
            } else {
                result = dt.join(otherDt, [leftKey, rightKey]);
            }
            return result.objects();
        }

        default:
            return data;
    }
}

export function computeEDAStats(data: any[]): Record<string, any> {
    if (!data || data.length === 0) return {};
    const dt = aq.from(data);
    const columns = dt.columnNames();
    const stats: any = {};

    columns.forEach(col => {
        const isNumeric = typeof data[0][col] === 'number';

        if (isNumeric) {
            const rollup = dt.rollup({
                mean: aq.op.mean(col),
                median: aq.op.median(col),
                min: aq.op.min(col),
                max: aq.op.max(col),
                stdev: aq.op.stdev(col),
                count: aq.op.count(),
                missing: aq.op.invalid(col)
            }).object(0) as any;

            // Compute quartiles and extended stats
            const values = data.map(r => r[col]).filter(v => typeof v === 'number' && !isNaN(v)).sort((a, b) => a - b);
            const n = values.length;
            const q1 = n > 0 ? values[Math.floor(n * 0.25)] : 0;
            const q3 = n > 0 ? values[Math.floor(n * 0.75)] : 0;
            const iqr = q3 - q1;
            const meanVal = rollup.mean || 0;
            const range = (rollup.max || 0) - (rollup.min || 0);

            // Skewness (Fisher-Pearson)
            let skewness = 0;
            let kurtosis = 0;
            if (n > 2 && rollup.stdev > 0) {
                const s = rollup.stdev;
                skewness = values.reduce((acc, v) => acc + Math.pow((v - meanVal) / s, 3), 0) * n / ((n - 1) * (n - 2));
                kurtosis = values.reduce((acc, v) => acc + Math.pow((v - meanVal) / s, 4), 0) * n * (n + 1) / ((n - 1) * (n - 2) * (n - 3)) - 3 * (n - 1) * (n - 1) / ((n - 2) * (n - 3));
            }

            const p5 = n > 0 ? values[Math.floor(n * 0.05)] : 0;
            const p95 = n > 0 ? values[Math.floor(n * 0.95)] : 0;
            const zeros = values.filter(v => v === 0).length;
            const cv = meanVal !== 0 ? ((rollup.stdev || 0) / Math.abs(meanVal)) * 100 : 0;

            stats[col] = {
                type: 'numeric',
                ...rollup,
                mean: rollup.mean?.toFixed(2),
                median: rollup.median?.toFixed(2),
                std: rollup.stdev?.toFixed(2),
                q1: Number(q1.toFixed(2)),
                q3: Number(q3.toFixed(2)),
                iqr: Number(iqr.toFixed(2)),
                range: Number(range.toFixed(2)),
                skewness: Number(skewness.toFixed(3)),
                kurtosis: Number(kurtosis.toFixed(3)),
                cv: Number(cv.toFixed(1)),
                zeros,
                percentiles: { p5: Number(p5.toFixed(2)), p25: q1, p50: rollup.median, p75: q3, p95: Number(p95.toFixed(2)) }
            };
        } else {
            const counts = dt.groupby(col).count().orderby(aq.desc('count'));
            const top = counts.object(0) as any;
            const missingCount = data.filter(r => r[col] === null || r[col] === undefined || r[col] === '').length;
            const uniqueCount = counts.numRows();
            const nonNull = data.length - missingCount;

            // Top N values
            const topN: Array<{ value: string; count: number; percentage: number }> = [];
            const numTop = Math.min(5, counts.numRows());
            for (let i = 0; i < numTop; i++) {
                const row = counts.object(i) as any;
                topN.push({ value: String(row[col]), count: row.count, percentage: nonNull > 0 ? Math.round((row.count / nonNull) * 10000) / 100 : 0 });
            }

            // Entropy
            let entropy = 0;
            for (let i = 0; i < counts.numRows(); i++) {
                const row = counts.object(i) as any;
                const p = row.count / nonNull;
                if (p > 0) entropy -= p * Math.log2(p);
            }

            stats[col] = {
                type: 'categorical',
                unique: uniqueCount,
                top: top ? top[col] : 'N/A',
                freq: top ? top.count : 0,
                missing: missingCount,
                topN,
                entropy: Number(entropy.toFixed(3)),
                cardinalityRatio: nonNull > 0 ? Number((uniqueCount / nonNull).toFixed(3)) : 0
            };
        }
    });

    return stats;
}

export function computeCorrelationMatrix(data: any[]) {
    if (!data || data.length === 0) return null;
    const numericCols = Object.keys(data[0]).filter(col => typeof data[0][col] === 'number');
    if (numericCols.length < 2) return null;

    const dt = aq.from(data).select(numericCols);
    const matrix: any = {};

    numericCols.forEach(col1 => {
        matrix[col1] = {};
        numericCols.forEach(col2 => {
            if (col1 === col2) {
                matrix[col1][col2] = 1;
            } else {
                const corr = dt.rollup({
                    c: aq.op.corr(col1, col2)
                }).get('c', 0);
                matrix[col1][col2] = Number(Number(corr).toFixed(3));
            }
        });
    });

    return matrix;
}


export function applySimulations(data: any[], simulations: any[]) {
    if (!data || !simulations || simulations.length === 0) return data;

    return data.map(row => {
        let newRow = { ...row };
        simulations.forEach(sim => {
            if (!sim.isActive) return;
            const target = sim.targetColumn;
            const multiplier = sim.adjustment;

            if (typeof newRow[target] === 'number') {
                newRow[target] = newRow[target] * multiplier;
            }
        });
        return newRow;
    });
}
