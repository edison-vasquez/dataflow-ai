// Feature Engineering module for data science workflows.
// All functions are pure: they take data as any[] and return a new any[]
// with new columns added alongside existing ones.

// =============================================================================
// NORMALIZATION
// =============================================================================

/**
 * Scales numeric values of `field` to the [0, 1] range using min-max
 * normalization.  Adds a column named `${field}_minmax`.
 *
 * When max === min (constant column) or there are no valid numeric values the
 * normalized value is set to 0.
 */
export function normalizeMinMax(data: any[], field: string): any[] {
  if (!data || data.length === 0) return [];

  const numericValues: number[] = [];
  for (const row of data) {
    const v = Number(row[field]);
    if (!isNaN(v) && row[field] !== null && row[field] !== undefined && row[field] !== '') {
      numericValues.push(v);
    }
  }

  if (numericValues.length === 0) {
    return data.map((row) => ({ ...row, [`${field}_minmax`]: null }));
  }

  const min = Math.min(...numericValues);
  const max = Math.max(...numericValues);
  const range = max - min;

  return data.map((row) => {
    const v = Number(row[field]);
    const isValid = !isNaN(v) && row[field] !== null && row[field] !== undefined && row[field] !== '';
    const normalized = isValid ? (range === 0 ? 0 : (v - min) / range) : null;
    return { ...row, [`${field}_minmax`]: normalized };
  });
}

/**
 * Standardizes numeric values of `field` to mean = 0 and standard
 * deviation = 1 (z-score).  Adds a column named `${field}_zscore`.
 *
 * When stdev === 0 the z-score is set to 0.
 */
export function normalizeZScore(data: any[], field: string): any[] {
  if (!data || data.length === 0) return [];

  const numericValues: number[] = [];
  for (const row of data) {
    const v = Number(row[field]);
    if (!isNaN(v) && row[field] !== null && row[field] !== undefined && row[field] !== '') {
      numericValues.push(v);
    }
  }

  if (numericValues.length === 0) {
    return data.map((row) => ({ ...row, [`${field}_zscore`]: null }));
  }

  const mean = numericValues.reduce((s, v) => s + v, 0) / numericValues.length;
  const variance =
    numericValues.reduce((s, v) => s + (v - mean) ** 2, 0) / numericValues.length;
  const stdev = Math.sqrt(variance);

  return data.map((row) => {
    const v = Number(row[field]);
    const isValid = !isNaN(v) && row[field] !== null && row[field] !== undefined && row[field] !== '';
    const zscore = isValid ? (stdev === 0 ? 0 : (v - mean) / stdev) : null;
    return { ...row, [`${field}_zscore`]: zscore };
  });
}

/**
 * Robust normalization using the median and inter-quartile range (IQR).
 * Adds a column named `${field}_robust`.
 *
 * formula: (value - median) / IQR
 *
 * When IQR === 0 the result is set to 0.
 */
export function normalizeRobust(data: any[], field: string): any[] {
  if (!data || data.length === 0) return [];

  const numericValues: number[] = [];
  for (const row of data) {
    const v = Number(row[field]);
    if (!isNaN(v) && row[field] !== null && row[field] !== undefined && row[field] !== '') {
      numericValues.push(v);
    }
  }

  if (numericValues.length === 0) {
    return data.map((row) => ({ ...row, [`${field}_robust`]: null }));
  }

  const sorted = [...numericValues].sort((a, b) => a - b);

  const median = computeMedian(sorted);
  const q1 = computeQuantile(sorted, 0.25);
  const q3 = computeQuantile(sorted, 0.75);
  const iqr = q3 - q1;

  return data.map((row) => {
    const v = Number(row[field]);
    const isValid = !isNaN(v) && row[field] !== null && row[field] !== undefined && row[field] !== '';
    const robust = isValid ? (iqr === 0 ? 0 : (v - median) / iqr) : null;
    return { ...row, [`${field}_robust`]: robust };
  });
}

// =============================================================================
// ENCODING
// =============================================================================

/**
 * One-hot encodes `field` by creating a binary column for each unique value.
 * Column names follow the pattern `${field}_${value}`.
 *
 * To avoid column explosion the encoding is limited to the first 20 unique
 * values (sorted alphabetically).  Values beyond the limit receive 0 in every
 * generated column.
 */
export function oneHotEncode(data: any[], field: string): any[] {
  if (!data || data.length === 0) return [];

  const uniqueValues = Array.from(new Set(data.map((row) => row[field])))
    .filter((v) => v !== null && v !== undefined)
    .map(String)
    .sort();

  const limitedValues = uniqueValues.slice(0, 20);

  return data.map((row) => {
    const newRow: Record<string, any> = { ...row };
    const rowValue = row[field] !== null && row[field] !== undefined ? String(row[field]) : null;
    for (const value of limitedValues) {
      newRow[`${field}_${value}`] = rowValue === value ? 1 : 0;
    }
    return newRow;
  });
}

/**
 * Label-encodes `field` by mapping each unique value to an integer starting at
 * 0.  The mapping order is determined by sorting unique values alphabetically.
 * Adds a column named `${field}_label`.
 *
 * Null / undefined values are mapped to null.
 */
export function labelEncode(data: any[], field: string): any[] {
  if (!data || data.length === 0) return [];

  const uniqueValues = Array.from(new Set(data.map((row) => row[field])))
    .filter((v) => v !== null && v !== undefined)
    .map(String)
    .sort();

  const labelMap: Record<string, number> = {};
  uniqueValues.forEach((v, i) => {
    labelMap[v] = i;
  });

  return data.map((row) => {
    const rawValue = row[field];
    const label =
      rawValue !== null && rawValue !== undefined ? (labelMap[String(rawValue)] ?? null) : null;
    return { ...row, [`${field}_label`]: label };
  });
}

/**
 * Ordinal-encodes `field` according to the explicit `order` array.
 * The index in `order` becomes the encoded integer.  Values not present
 * in `order` are mapped to null.  Adds a column named `${field}_ordinal`.
 */
export function ordinalEncode(data: any[], field: string, order: string[]): any[] {
  if (!data || data.length === 0) return [];

  const orderMap: Record<string, number> = {};
  order.forEach((v, i) => {
    orderMap[v] = i;
  });

  return data.map((row) => {
    const rawValue = row[field];
    const encoded =
      rawValue !== null && rawValue !== undefined ? (orderMap[String(rawValue)] ?? null) : null;
    return { ...row, [`${field}_ordinal`]: encoded };
  });
}

// =============================================================================
// BINNING
// =============================================================================

/**
 * Assigns each row to an equal-width bin and adds a column named `${field}_bin`.
 * Bin labels follow the pattern "lower-upper" (rounded to two decimals).
 *
 * `bins` must be >= 1.  Non-numeric values receive a null bin.
 */
export function equalWidthBin(data: any[], field: string, bins: number): any[] {
  if (!data || data.length === 0) return [];
  if (bins < 1) bins = 1;

  const numericValues: number[] = [];
  for (const row of data) {
    const v = Number(row[field]);
    if (!isNaN(v) && row[field] !== null && row[field] !== undefined && row[field] !== '') {
      numericValues.push(v);
    }
  }

  if (numericValues.length === 0) {
    return data.map((row) => ({ ...row, [`${field}_bin`]: null }));
  }

  const min = Math.min(...numericValues);
  const max = Math.max(...numericValues);
  const width = max === min ? 1 : (max - min) / bins;

  return data.map((row) => {
    const v = Number(row[field]);
    const isValid = !isNaN(v) && row[field] !== null && row[field] !== undefined && row[field] !== '';
    if (!isValid) {
      return { ...row, [`${field}_bin`]: null };
    }

    let binIndex = Math.floor((v - min) / width);
    // Clamp the last value into the final bin.
    if (binIndex >= bins) binIndex = bins - 1;

    const lower = roundTwo(min + binIndex * width);
    const upper = roundTwo(min + (binIndex + 1) * width);
    return { ...row, [`${field}_bin`]: `${lower}-${upper}` };
  });
}

/**
 * Assigns each row to an equal-frequency (quantile) bin and adds a column
 * named `${field}_bin`.  Bin labels follow the pattern "lower-upper".
 *
 * `bins` must be >= 1.  Non-numeric values receive a null bin.
 */
export function equalFreqBin(data: any[], field: string, bins: number): any[] {
  if (!data || data.length === 0) return [];
  if (bins < 1) bins = 1;

  // Collect numeric values together with their original indices so that we can
  // map back after sorting.
  const indexed: { index: number; value: number }[] = [];
  for (let i = 0; i < data.length; i++) {
    const v = Number(data[i][field]);
    if (!isNaN(v) && data[i][field] !== null && data[i][field] !== undefined && data[i][field] !== '') {
      indexed.push({ index: i, value: v });
    }
  }

  if (indexed.length === 0) {
    return data.map((row) => ({ ...row, [`${field}_bin`]: null }));
  }

  indexed.sort((a, b) => a.value - b.value);

  // Compute bin boundaries from quantiles.
  const boundaries: number[] = [indexed[0].value];
  for (let b = 1; b <= bins; b++) {
    const quantile = b / bins;
    const idx = Math.min(Math.ceil(quantile * indexed.length) - 1, indexed.length - 1);
    boundaries.push(indexed[idx].value);
  }

  // Determine which bin each sorted entry falls into.
  const binAssignment = new Map<number, string>();
  const itemsPerBin = Math.ceil(indexed.length / bins);

  for (let i = 0; i < indexed.length; i++) {
    let binIndex = Math.floor(i / itemsPerBin);
    if (binIndex >= bins) binIndex = bins - 1;

    const lower = roundTwo(boundaries[binIndex]);
    const upper = roundTwo(boundaries[binIndex + 1]);
    binAssignment.set(indexed[i].index, `${lower}-${upper}`);
  }

  return data.map((row, i) => ({
    ...row,
    [`${field}_bin`]: binAssignment.get(i) ?? null,
  }));
}

// =============================================================================
// DATE FEATURES
// =============================================================================

type DateFeature = 'year' | 'month' | 'day' | 'weekday' | 'hour' | 'quarter';

/**
 * Parses `field` as a date and extracts the requested components into new
 * columns named `${field}_${feature}`.
 *
 * Invalid or unparseable dates produce null for every requested feature.
 */
export function extractDateFeatures(
  data: any[],
  field: string,
  features: DateFeature[],
): any[] {
  if (!data || data.length === 0) return [];
  if (!features || features.length === 0) return data.map((row) => ({ ...row }));

  return data.map((row) => {
    const newRow: Record<string, any> = { ...row };
    const raw = row[field];
    const date = raw instanceof Date ? raw : new Date(raw);
    const isValid = raw !== null && raw !== undefined && raw !== '' && !isNaN(date.getTime());

    for (const feature of features) {
      if (!isValid) {
        newRow[`${field}_${feature}`] = null;
        continue;
      }

      switch (feature) {
        case 'year':
          newRow[`${field}_year`] = date.getFullYear();
          break;
        case 'month':
          newRow[`${field}_month`] = date.getMonth() + 1; // 1-indexed
          break;
        case 'day':
          newRow[`${field}_day`] = date.getDate();
          break;
        case 'weekday':
          newRow[`${field}_weekday`] = date.getDay(); // 0=Sunday
          break;
        case 'hour':
          newRow[`${field}_hour`] = date.getHours();
          break;
        case 'quarter':
          newRow[`${field}_quarter`] = Math.floor(date.getMonth() / 3) + 1;
          break;
        default:
          // Unknown feature -- skip silently.
          break;
      }
    }

    return newRow;
  });
}

// =============================================================================
// TEXT FEATURES
// =============================================================================

type TextFeature = 'length' | 'wordCount' | 'hasDigits' | 'hasSpecial';

/**
 * Extracts text-based features from `field` into new columns named
 * `${field}_${feature}`.
 *
 * - length     : character count of the string
 * - wordCount  : number of whitespace-delimited tokens
 * - hasDigits  : 1 if the string contains at least one digit, 0 otherwise
 * - hasSpecial : 1 if the string contains at least one non-alphanumeric,
 *                non-whitespace character, 0 otherwise
 *
 * Null / undefined / non-string values produce null for every feature.
 */
export function extractTextFeatures(
  data: any[],
  field: string,
  features: TextFeature[],
): any[] {
  if (!data || data.length === 0) return [];
  if (!features || features.length === 0) return data.map((row) => ({ ...row }));

  return data.map((row) => {
    const newRow: Record<string, any> = { ...row };
    const raw = row[field];
    const text = raw !== null && raw !== undefined ? String(raw) : null;

    for (const feature of features) {
      if (text === null) {
        newRow[`${field}_${feature}`] = null;
        continue;
      }

      switch (feature) {
        case 'length':
          newRow[`${field}_length`] = text.length;
          break;
        case 'wordCount':
          newRow[`${field}_wordCount`] = text.trim() === '' ? 0 : text.trim().split(/\s+/).length;
          break;
        case 'hasDigits':
          newRow[`${field}_hasDigits`] = /\d/.test(text) ? 1 : 0;
          break;
        case 'hasSpecial':
          newRow[`${field}_hasSpecial`] = /[^\w\s]/.test(text) ? 1 : 0;
          break;
        default:
          break;
      }
    }

    return newRow;
  });
}

// =============================================================================
// AGGREGATION
// =============================================================================

type AggOp = 'sum' | 'mean' | 'count' | 'min' | 'max';

/**
 * Groups `data` by the columns in `groupBy` and computes aggregations as
 * specified in `agg` (mapping of field name to aggregation operation).
 *
 * Returns one row per group.  Each row contains the groupBy fields plus an
 * aggregated column for each entry in `agg`, named `${field}_${op}`.
 */
export function aggregateGroupBy(
  data: any[],
  groupBy: string[],
  agg: Record<string, AggOp>,
): any[] {
  if (!data || data.length === 0) return [];
  if (!groupBy || groupBy.length === 0) return [];

  // Build groups keyed by the composite groupBy values.
  const groups = new Map<string, any[]>();

  for (const row of data) {
    const key = groupBy.map((g) => String(row[g] ?? '')).join('\x00');
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(row);
  }

  const results: any[] = [];

  for (const [, rows] of groups) {
    const resultRow: Record<string, any> = {};

    // Copy groupBy fields from the first row.
    for (const g of groupBy) {
      resultRow[g] = rows[0][g];
    }

    // Compute each aggregation.
    for (const [aggField, op] of Object.entries(agg)) {
      const values: number[] = [];
      for (const row of rows) {
        const v = Number(row[aggField]);
        if (!isNaN(v) && row[aggField] !== null && row[aggField] !== undefined && row[aggField] !== '') {
          values.push(v);
        }
      }

      const colName = `${aggField}_${op}`;

      switch (op) {
        case 'sum':
          resultRow[colName] = values.length > 0 ? values.reduce((s, v) => s + v, 0) : 0;
          break;
        case 'mean':
          resultRow[colName] =
            values.length > 0 ? values.reduce((s, v) => s + v, 0) / values.length : null;
          break;
        case 'count':
          resultRow[colName] = values.length;
          break;
        case 'min':
          resultRow[colName] = values.length > 0 ? Math.min(...values) : null;
          break;
        case 'max':
          resultRow[colName] = values.length > 0 ? Math.max(...values) : null;
          break;
        default:
          resultRow[colName] = null;
          break;
      }
    }

    results.push(resultRow);
  }

  return results;
}

// =============================================================================
// INTERNAL HELPERS
// =============================================================================

/** Compute the median of a **sorted** array of numbers. */
function computeMedian(sorted: number[]): number {
  if (sorted.length === 0) return 0;
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

/**
 * Compute a quantile (0-1) from a **sorted** array using linear
 * interpolation.
 */
function computeQuantile(sorted: number[], q: number): number {
  if (sorted.length === 0) return 0;
  if (sorted.length === 1) return sorted[0];

  const pos = q * (sorted.length - 1);
  const lower = Math.floor(pos);
  const upper = Math.ceil(pos);
  const weight = pos - lower;

  if (lower === upper) return sorted[lower];
  return sorted[lower] * (1 - weight) + sorted[upper] * weight;
}

/** Round a number to two decimal places. */
function roundTwo(n: number): number {
  return Math.round(n * 100) / 100;
}
