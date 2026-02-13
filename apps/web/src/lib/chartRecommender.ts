export interface ChartRecommendation {
    type: string; // 'bar' | 'scatter' | 'pie' | 'line' | 'boxplot' | 'heatmap' | 'radar' | 'treemap' | 'area'
    score: number; // 0-1 relevance
    reason: string; // Human-readable explanation
    xColumn: string;
    yColumn?: string;
    title: string;
}

/**
 * Formats a column name into a human-readable label.
 * Converts snake_case or camelCase into Title Case.
 */
function humanize(columnName: string): string {
    return columnName
        .replace(/[_-]/g, ' ')
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        .replace(/\b\w/g, (c) => c.toUpperCase())
        .trim();
}

/**
 * Counts unique non-null values for a given column across the dataset.
 */
function getUniqueValues(data: any[], column: string): Set<string> {
    const unique = new Set<string>();
    for (const row of data) {
        const val = row[column];
        if (val !== null && val !== undefined && val !== '') {
            unique.add(String(val));
        }
    }
    return unique;
}

/**
 * Checks whether a column's values look like a time series (monotonically
 * increasing dates or numbers that could represent sequential time points).
 */
function looksLikeTimeSeries(data: any[], column: string, columnType: string): boolean {
    if (columnType === 'date') return true;

    // For numeric columns, check if values are monotonically increasing (with some tolerance)
    if (columnType === 'numeric') {
        const values = data
            .map((r) => r[column])
            .filter((v) => typeof v === 'number' && !isNaN(v));
        if (values.length < 5) return false;

        let increasing = 0;
        for (let i = 1; i < values.length; i++) {
            if (values[i] >= values[i - 1]) increasing++;
        }
        // At least 85% of consecutive pairs are non-decreasing
        return increasing / (values.length - 1) >= 0.85;
    }

    // For categorical columns, check if string values parse as dates
    if (columnType === 'categorical') {
        const sample = data.slice(0, Math.min(20, data.length));
        const parseable = sample.filter((r) => {
            const val = r[column];
            if (typeof val !== 'string' || val.length < 6) return false;
            const parsed = Date.parse(val);
            return !isNaN(parsed);
        });
        return parseable.length >= sample.length * 0.8;
    }

    return false;
}

/**
 * Recommends the best chart types based on data characteristics.
 *
 * Analyzes the actual data -- unique value counts, column type combinations,
 * time-series patterns, and cardinality -- to produce up to 6 ranked
 * recommendations sorted by descending score.
 *
 * @param data - The dataset rows (array of objects).
 * @param columnTypes - Output of detectColumnTypes: a map of column name to
 *   type string ('numeric' | 'categorical' | 'date' | 'boolean').
 * @returns An array of at most 6 ChartRecommendation objects, sorted by score
 *   descending.
 */
export function recommendCharts(
    data: any[],
    columnTypes: Record<string, string>
): ChartRecommendation[] {
    if (!data || data.length === 0 || !columnTypes) return [];

    const columns = Object.keys(columnTypes);
    if (columns.length === 0) return [];

    const numericColumns = columns.filter((c) => columnTypes[c] === 'numeric');
    const categoricalColumns = columns.filter((c) => columnTypes[c] === 'categorical');
    const dateColumns = columns.filter((c) => columnTypes[c] === 'date');
    const booleanColumns = columns.filter((c) => columnTypes[c] === 'boolean');

    // Pre-compute unique value counts for categorical columns
    const uniqueCounts: Record<string, number> = {};
    for (const col of [...categoricalColumns, ...booleanColumns]) {
        uniqueCounts[col] = getUniqueValues(data, col).size;
    }

    // Detect which columns look like time series
    const timeSeriesFlags: Record<string, boolean> = {};
    for (const col of columns) {
        timeSeriesFlags[col] = looksLikeTimeSeries(data, col, columnTypes[col]);
    }

    const recommendations: ChartRecommendation[] = [];

    // -----------------------------------------------------------------------
    // Rule 4: Date + numeric -> line (0.95), area (0.7)
    // This is checked first because date columns are the strongest signal
    // for a time-series chart.
    // -----------------------------------------------------------------------
    for (const dateCol of dateColumns) {
        for (const numCol of numericColumns) {
            const xLabel = humanize(dateCol);
            const yLabel = humanize(numCol);

            recommendations.push({
                type: 'line',
                score: 0.95,
                reason: `Line chart excels at showing how ${yLabel} changes over time, revealing trends and seasonality in ${xLabel}.`,
                xColumn: dateCol,
                yColumn: numCol,
                title: `${yLabel} Over Time`,
            });

            recommendations.push({
                type: 'area',
                score: 0.7,
                reason: `Area chart emphasizes the magnitude of ${yLabel} over ${xLabel}, making cumulative trends visually prominent.`,
                xColumn: dateCol,
                yColumn: numCol,
                title: `${yLabel} Trend by ${xLabel}`,
            });
        }
    }

    // -----------------------------------------------------------------------
    // Rule 1: 2 numeric columns -> scatter (0.9), line (0.6)
    // Also handles the case where one numeric column looks like a time series.
    // -----------------------------------------------------------------------
    for (let i = 0; i < numericColumns.length; i++) {
        for (let j = i + 1; j < numericColumns.length; j++) {
            const colA = numericColumns[i];
            const colB = numericColumns[j];
            const labelA = humanize(colA);
            const labelB = humanize(colB);

            // If one of them looks like a time series, favor line over scatter
            const aIsTime = timeSeriesFlags[colA];
            const bIsTime = timeSeriesFlags[colB];

            if (aIsTime || bIsTime) {
                const timeCol = aIsTime ? colA : colB;
                const valCol = aIsTime ? colB : colA;
                const timeLabel = humanize(timeCol);
                const valLabel = humanize(valCol);

                recommendations.push({
                    type: 'line',
                    score: 0.88,
                    reason: `${timeLabel} appears to be sequential, making a line chart ideal for tracking ${valLabel} progression.`,
                    xColumn: timeCol,
                    yColumn: valCol,
                    title: `${valLabel} by ${timeLabel}`,
                });

                recommendations.push({
                    type: 'area',
                    score: 0.62,
                    reason: `Area chart highlights the volume of ${valLabel} as ${timeLabel} progresses.`,
                    xColumn: timeCol,
                    yColumn: valCol,
                    title: `${valLabel} Area Trend`,
                });
            } else {
                recommendations.push({
                    type: 'scatter',
                    score: 0.9,
                    reason: `Scatter plot reveals the correlation and distribution pattern between ${labelA} and ${labelB}.`,
                    xColumn: colA,
                    yColumn: colB,
                    title: `${labelA} vs ${labelB} Correlation`,
                });

                recommendations.push({
                    type: 'line',
                    score: 0.6,
                    reason: `Line chart can show the relationship between ${labelA} and ${labelB} when data is ordered.`,
                    xColumn: colA,
                    yColumn: colB,
                    title: `${labelA} to ${labelB} Relationship`,
                });
            }
        }
    }

    // -----------------------------------------------------------------------
    // Rule 2: 1 categorical + 1 numeric -> bar (0.9), pie if <10 categories (0.7)
    // -----------------------------------------------------------------------
    for (const catCol of categoricalColumns) {
        const catUniques = uniqueCounts[catCol] ?? 0;

        for (const numCol of numericColumns) {
            const catLabel = humanize(catCol);
            const numLabel = humanize(numCol);

            recommendations.push({
                type: 'bar',
                score: 0.9,
                reason: `Bar chart is ideal for comparing ${numLabel} across ${catUniques} distinct ${catLabel} categories.`,
                xColumn: catCol,
                yColumn: numCol,
                title: `${numLabel} by ${catLabel}`,
            });

            // Only suggest pie if there are fewer than 10 unique categories
            if (catUniques > 1 && catUniques < 10) {
                recommendations.push({
                    type: 'pie',
                    score: 0.7,
                    reason: `Pie chart effectively shows the proportional share of each ${catLabel} in total ${numLabel} (${catUniques} categories).`,
                    xColumn: catCol,
                    yColumn: numCol,
                    title: `${numLabel} Distribution by ${catLabel}`,
                });
            }
        }
    }

    // Boolean columns can act like categoricals with 2 values
    for (const boolCol of booleanColumns) {
        for (const numCol of numericColumns) {
            const boolLabel = humanize(boolCol);
            const numLabel = humanize(numCol);

            recommendations.push({
                type: 'bar',
                score: 0.85,
                reason: `Bar chart clearly compares ${numLabel} between the two ${boolLabel} groups.`,
                xColumn: boolCol,
                yColumn: numCol,
                title: `${numLabel} by ${boolLabel}`,
            });

            recommendations.push({
                type: 'pie',
                score: 0.65,
                reason: `Pie chart shows the proportional split of ${numLabel} across ${boolLabel} values.`,
                xColumn: boolCol,
                yColumn: numCol,
                title: `${numLabel} Split by ${boolLabel}`,
            });
        }
    }

    // -----------------------------------------------------------------------
    // Rule 3: 1 numeric alone -> histogram/bar (0.8), boxplot (0.6)
    // -----------------------------------------------------------------------
    for (const numCol of numericColumns) {
        const numLabel = humanize(numCol);

        recommendations.push({
            type: 'bar',
            score: 0.8,
            reason: `Histogram (bar) reveals the frequency distribution of ${numLabel}, showing where values concentrate.`,
            xColumn: numCol,
            title: `${numLabel} Distribution`,
        });

        recommendations.push({
            type: 'boxplot',
            score: 0.6,
            reason: `Box plot summarizes the spread, median, and outliers of ${numLabel} at a glance.`,
            xColumn: numCol,
            title: `${numLabel} Statistical Summary`,
        });
    }

    // -----------------------------------------------------------------------
    // Rule 5: Multiple numeric (3+) -> heatmap correlation (0.7), radar (0.5)
    // -----------------------------------------------------------------------
    if (numericColumns.length >= 3) {
        const colNames = numericColumns.slice(0, 8).map(humanize).join(', ');

        recommendations.push({
            type: 'heatmap',
            score: 0.7,
            reason: `Correlation heatmap exposes linear relationships among ${numericColumns.length} numeric variables (${colNames}).`,
            xColumn: numericColumns[0],
            yColumn: numericColumns[1],
            title: 'Correlation Matrix Heatmap',
        });

        // Radar only makes sense with a manageable number of axes
        if (numericColumns.length <= 10) {
            recommendations.push({
                type: 'radar',
                score: 0.5,
                reason: `Radar chart profiles multiple metrics (${colNames}) simultaneously, useful for comparing records.`,
                xColumn: numericColumns[0],
                title: 'Multi-Metric Radar Profile',
            });
        }
    }

    // -----------------------------------------------------------------------
    // Rule 6: Categorical with many values + numeric -> treemap (0.6)
    // -----------------------------------------------------------------------
    for (const catCol of categoricalColumns) {
        const catUniques = uniqueCounts[catCol] ?? 0;

        // Treemap works well when there are many categories (10+) but not
        // so many that labels become unreadable (cap at 200).
        if (catUniques >= 10 && catUniques <= 200) {
            for (const numCol of numericColumns) {
                const catLabel = humanize(catCol);
                const numLabel = humanize(numCol);

                recommendations.push({
                    type: 'treemap',
                    score: 0.6,
                    reason: `Treemap handles ${catUniques} ${catLabel} categories gracefully, sizing each block by ${numLabel}.`,
                    xColumn: catCol,
                    yColumn: numCol,
                    title: `${numLabel} Treemap by ${catLabel}`,
                });
            }
        }
    }

    // -----------------------------------------------------------------------
    // Deduplicate: if we have multiple recommendations with the same type,
    // xColumn, and yColumn, keep only the highest-scoring one.
    // -----------------------------------------------------------------------
    const seen = new Map<string, ChartRecommendation>();
    for (const rec of recommendations) {
        const key = `${rec.type}|${rec.xColumn}|${rec.yColumn ?? ''}`;
        const existing = seen.get(key);
        if (!existing || rec.score > existing.score) {
            seen.set(key, rec);
        }
    }

    const deduped = Array.from(seen.values());

    // Sort by score descending, then by title alphabetically for stability
    deduped.sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return a.title.localeCompare(b.title);
    });

    // Return at most 6 recommendations
    return deduped.slice(0, 6);
}
