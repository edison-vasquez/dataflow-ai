import { DataIssue } from "@/store/useAppStore";

export function analyzeDataset(data: any[]): DataIssue[] {
    if (!data || data.length === 0) return [];

    const issues: DataIssue[] = [];
    const columns = Object.keys(data[0]);

    // 1. Check for Nulls
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
    const jsonRows = data.map(row => JSON.stringify(row));
    const uniqueRows = new Set(jsonRows);
    const duplicateCount = jsonRows.length - uniqueRows.size;

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

    // 3. Simple Outlier Detection for numbers (IQR method)
    columns.forEach(col => {
        const values = data.map(row => row[col]).filter(v => typeof v === 'number');
        if (values.length > 10) {
            const sorted = [...values].sort((a, b) => a - b);
            const q1 = sorted[Math.floor(sorted.length * 0.25)];
            const q3 = sorted[Math.floor(sorted.length * 0.75)];
            const iqr = q3 - q1;
            const lower = q1 - 1.5 * iqr;
            const upper = q3 + 1.5 * iqr;

            const outliers = values.filter(v => v < lower || v > upper);
            if (outliers.length > 0) {
                issues.push({
                    id: `outlier-${col}`,
                    type: 'outlier',
                    field: col,
                    count: outliers.length,
                    severity: 'low',
                    suggestion: 'Review extreme values that might skew analysis.'
                });
            }
        }
    });

    return issues;
}

export function applyTransformation(data: any[], type: string, params: any): any[] {
    let newData = [...data];

    switch (type) {
        case 'remove_duplicates':
            const seen = new Set();
            newData = newData.filter(row => {
                const str = JSON.stringify(row);
                if (seen.has(str)) return false;
                seen.add(str);
                return true;
            });
            break;

        case 'impute_nulls':
            const { field, value } = params;
            newData = newData.map(row => ({
                ...row,
                [field]: (row[field] === null || row[field] === undefined || row[field] === '') ? value : row[field]
            }));
            break;

        case 'standardize_text':
            const { col } = params;
            newData = newData.map(row => ({
                ...row,
                [col]: typeof row[col] === 'string' ? row[col].trim().toLowerCase() : row[col]
            }));
            break;
    }

    return newData;
}
