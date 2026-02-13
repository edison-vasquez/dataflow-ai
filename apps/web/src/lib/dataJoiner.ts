export type JoinType = 'inner' | 'left' | 'right' | 'outer';

export interface JoinConfig {
    leftKey: string;
    rightKey: string;
    joinType: JoinType;
    suffix?: { left: string; right: string };
}

export interface JoinPreview {
    expectedRowCount: number;
    leftUnmatched: number;
    rightUnmatched: number;
    sampleRows: any[];
    newColumns: string[];
}

const DEFAULT_SUFFIX = { left: '_left', right: '_right' };

/**
 * Checks whether a key value is valid for matching.
 * null, undefined, and empty strings are never matched.
 */
function isValidKey(value: any): boolean {
    return value !== null && value !== undefined && value !== '';
}

/**
 * Build a multi-map (key -> array of rows) on the given dataset for O(1) lookups.
 * Rows with null/undefined/empty keys are excluded from the index.
 */
function buildIndex(data: any[], keyColumn: string): Map<string, any[]> {
    const index = new Map<string, any[]>();
    for (const row of data) {
        const rawKey = row[keyColumn];
        if (!isValidKey(rawKey)) continue;
        const key = String(rawKey);
        const bucket = index.get(key);
        if (bucket) {
            bucket.push(row);
        } else {
            index.set(key, [row]);
        }
    }
    return index;
}

/**
 * Determine which columns from the right table conflict with the left table,
 * and return a mapping of original right column name -> resolved output name.
 * The join key column from the right table is excluded from the output since
 * it duplicates the left key.
 */
function resolveColumns(
    leftColumns: string[],
    rightColumns: string[],
    rightKey: string,
    suffix: { left: string; right: string }
): { rightColumnMap: Record<string, string>; allOutputColumns: string[] } {
    const leftSet = new Set(leftColumns);
    const rightColumnMap: Record<string, string> = {};

    for (const col of rightColumns) {
        // Skip the right join key — it's redundant with the left key
        if (col === rightKey) continue;
        if (leftSet.has(col)) {
            rightColumnMap[col] = col + suffix.right;
        } else {
            rightColumnMap[col] = col;
        }
    }

    // If any left columns were renamed due to conflict, rename them too
    // But per the spec, only the right table's conflicting columns get the suffix.
    const allOutputColumns = [
        ...leftColumns,
        ...Object.values(rightColumnMap),
    ];

    return { rightColumnMap, allOutputColumns };
}

/**
 * Merge a left row with a right row, applying the column mapping for conflicts.
 * If rightRow is null, all right columns are filled with null.
 */
function mergeRows(
    leftRow: any | null,
    rightRow: any | null,
    leftColumns: string[],
    rightColumnMap: Record<string, string>
): any {
    const merged: any = {};

    // Copy left columns (or null if left row is missing, for right joins)
    for (const col of leftColumns) {
        merged[col] = leftRow ? leftRow[col] : null;
    }

    // Copy right columns under resolved names
    for (const [origCol, resolvedCol] of Object.entries(rightColumnMap)) {
        merged[resolvedCol] = rightRow ? rightRow[origCol] : null;
    }

    return merged;
}

/**
 * Execute a full join of two datasets according to the given configuration.
 *
 * Performance: O(n + m) where n = left.length, m = right.length (plus output size
 * for one-to-many joins), achieved by indexing the right table into a hash map.
 *
 * Join semantics:
 *   inner — only rows where both sides match on the key
 *   left  — all left rows; unmatched left rows get null for right columns
 *   right — all right rows; unmatched right rows get null for left columns
 *   outer — all rows from both sides; unmatched rows get null on the missing side
 *
 * Column conflicts are resolved by appending the configured suffix (default '_right')
 * to the right table's conflicting column names.  The right join key column is omitted
 * from the output since it duplicates the left key.
 */
export function executeJoin(left: any[], right: any[], config: JoinConfig): any[] {
    if (!left || left.length === 0) {
        if (config.joinType === 'right' || config.joinType === 'outer') {
            return right ? [...right] : [];
        }
        return [];
    }
    if (!right || right.length === 0) {
        if (config.joinType === 'left' || config.joinType === 'outer') {
            return [...left];
        }
        return [];
    }

    const { leftKey, rightKey, joinType } = config;
    const suffix = config.suffix || DEFAULT_SUFFIX;

    const leftColumns = Object.keys(left[0]);
    const rightColumns = Object.keys(right[0]);
    const { rightColumnMap } = resolveColumns(leftColumns, rightColumns, rightKey, suffix);

    // Build index on the right table for fast lookups
    const rightIndex = buildIndex(right, rightKey);

    const result: any[] = [];

    // Track which right-index keys have been matched (needed for right/outer joins)
    const matchedRightKeys = new Set<string>();

    // --- Process left rows ---
    for (const leftRow of left) {
        const rawKey = leftRow[leftKey];

        if (!isValidKey(rawKey)) {
            // Left row has no valid key — include only for left/outer joins
            if (joinType === 'left' || joinType === 'outer') {
                result.push(mergeRows(leftRow, null, leftColumns, rightColumnMap));
            }
            continue;
        }

        const key = String(rawKey);
        const rightMatches = rightIndex.get(key);

        if (rightMatches && rightMatches.length > 0) {
            matchedRightKeys.add(key);
            // One-to-many: emit one output row per matching right row
            for (const rightRow of rightMatches) {
                result.push(mergeRows(leftRow, rightRow, leftColumns, rightColumnMap));
            }
        } else {
            // No match on the right side
            if (joinType === 'left' || joinType === 'outer') {
                result.push(mergeRows(leftRow, null, leftColumns, rightColumnMap));
            }
            // For inner and right joins, this left row is dropped
        }
    }

    // --- Process unmatched right rows (for right/outer joins) ---
    if (joinType === 'right' || joinType === 'outer') {
        for (const rightRow of right) {
            const rawKey = rightRow[rightKey];

            if (!isValidKey(rawKey)) {
                // Right row with no valid key — always unmatched
                result.push(mergeRows(null, rightRow, leftColumns, rightColumnMap));
                continue;
            }

            const key = String(rawKey);
            if (!matchedRightKeys.has(key)) {
                result.push(mergeRows(null, rightRow, leftColumns, rightColumnMap));
            }
        }
    }

    return result;
}

/**
 * Preview a join by executing it on a sample of the data (first 100 rows of each
 * table) and computing statistics about the full join.
 *
 * Returns:
 *   - expectedRowCount: exact count from the full join
 *   - leftUnmatched: number of left rows with no matching right row
 *   - rightUnmatched: number of right rows with no matching left row
 *   - sampleRows: first 10 rows of the joined sample
 *   - newColumns: the column names of the joined output
 */
export function previewJoin(left: any[], right: any[], config: JoinConfig): JoinPreview {
    const safeLeft = left || [];
    const safeRight = right || [];
    const { leftKey, rightKey } = config;
    const suffix = config.suffix || DEFAULT_SUFFIX;

    // --- Compute full-data statistics ---

    // Build index on full right table to compute match stats
    const rightIndex = buildIndex(safeRight, rightKey);

    let leftMatched = 0;
    let leftUnmatched = 0;
    const matchedRightKeys = new Set<string>();

    for (const leftRow of safeLeft) {
        const rawKey = leftRow[leftKey];
        if (!isValidKey(rawKey)) {
            leftUnmatched++;
            continue;
        }
        const key = String(rawKey);
        if (rightIndex.has(key)) {
            leftMatched++;
            matchedRightKeys.add(key);
        } else {
            leftUnmatched++;
        }
    }

    // Count unmatched right rows
    let rightUnmatched = 0;
    for (const rightRow of safeRight) {
        const rawKey = rightRow[rightKey];
        if (!isValidKey(rawKey)) {
            rightUnmatched++;
            continue;
        }
        const key = String(rawKey);
        if (!matchedRightKeys.has(key)) {
            rightUnmatched++;
        }
    }

    // Compute expected row count for the full join
    // For exact count we need to account for one-to-many: each left row
    // produces N output rows where N = number of matching right rows.
    let matchedRowCount = 0;
    for (const leftRow of safeLeft) {
        const rawKey = leftRow[leftKey];
        if (!isValidKey(rawKey)) continue;
        const key = String(rawKey);
        const bucket = rightIndex.get(key);
        if (bucket) {
            matchedRowCount += bucket.length;
        }
    }

    let expectedRowCount: number;
    switch (config.joinType) {
        case 'inner':
            expectedRowCount = matchedRowCount;
            break;
        case 'left':
            expectedRowCount = matchedRowCount + leftUnmatched;
            break;
        case 'right':
            expectedRowCount = matchedRowCount + rightUnmatched;
            break;
        case 'outer':
            expectedRowCount = matchedRowCount + leftUnmatched + rightUnmatched;
            break;
    }

    // --- Execute join on sample data for preview rows ---
    const sampleLeft = safeLeft.slice(0, 100);
    const sampleRight = safeRight.slice(0, 100);
    const sampleResult = executeJoin(sampleLeft, sampleRight, config);
    const sampleRows = sampleResult.slice(0, 10);

    // --- Determine output columns ---
    const leftColumns = safeLeft.length > 0 ? Object.keys(safeLeft[0]) : [];
    const rightColumns = safeRight.length > 0 ? Object.keys(safeRight[0]) : [];
    const { allOutputColumns } = resolveColumns(leftColumns, rightColumns, rightKey, suffix);

    return {
        expectedRowCount,
        leftUnmatched,
        rightUnmatched,
        sampleRows,
        newColumns: allOutputColumns,
    };
}
