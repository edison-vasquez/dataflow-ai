# DataFlow AI - User Guide

## Table of Contents

1. [Overview](#overview)
2. [Getting Started](#getting-started)
3. [Workspace (Data Ingestion)](#1-workspace---data-ingestion)
4. [Preparation (Data Cleaning)](#2-preparation---data-cleaning)
5. [EDA (Exploratory Data Analysis)](#3-eda---exploratory-data-analysis)
6. [Exploration (Visualization)](#4-exploration---visualization--charts)
7. [Reports (Export & AI Consultancy)](#5-reports---export--ai-consultancy)
8. [AI Assistant (Chat Panel)](#ai-assistant)
9. [What-If Simulations](#what-if-simulations)
10. [Settings & Configuration](#settings--configuration)
11. [Keyboard & Navigation](#keyboard--navigation)
12. [Deployment URLs](#deployment-urls)

---

## Overview

**DataFlow AI** is an enterprise data analytics platform that guides you through the complete data science workflow:

```
Workspace  -->  Preparation  -->  EDA  -->  Exploration  -->  Reports
(Upload)       (Clean)          (Analyze)  (Visualize)      (Export)
```

**Live URLs:**
- **Web App:** https://web-smoky-beta-57.vercel.app
- **API:** https://dataflow-api.edison-985.workers.dev

---

## Getting Started

1. Open the app at `/app`
2. You'll see the **Sidebar** on the left with 5 phases
3. The **AI Chat Panel** on the right is open by default
4. Start by uploading a dataset in the **Workspace** phase

---

## 1. Workspace - Data Ingestion

### Uploading Files

| Format | How |
|--------|-----|
| **CSV** | Drag & drop or click to upload `.csv` files |
| **Excel** | Supports `.xls` and `.xlsx` (reads first sheet) |
| **JSON** | Accepts JSON arrays or `{ data: [...] }` format |

### Connecting to Sources

Click any source card to connect:
- **File Storage** - Local CSV/XLS/JSON files
- **Cloud Sheets** - Google Sheets, Microsoft 365
- **Structured DB** - Postgres, MySQL, Snowflake
- **REST/GraphQL** - API endpoints (enter URL + API key)

> Cloud and DB connectors simulate a connection with mock enterprise data (150 records).

### After Upload

Once data is loaded, you'll see:
- **Dataset summary**: row count, column count, detected types
- **Data preview**: first 5 rows x 8 columns
- **Discover Segments**: auto-clustering that creates segment groups and a pie chart

### Actions
- **Clear Dataset** - Remove loaded data and start over
- **Continue to Preparation** - Advance to the next phase

---

## 2. Preparation - Data Cleaning

### Health Score

A circular indicator shows your data quality from 0-100%:
- **Green (>80%)** - Good quality
- **Yellow (50-80%)** - Needs attention
- **Red (<50%)** - Critical issues

### Guided Workflow

The system follows 3 steps:
1. **Scan Issues** - Automatically detects problems
2. **Auto Fix** - Apply suggested fixes
3. **Complete** - Data is ready for analysis

### Issue Types Detected

| Issue | Description |
|-------|-------------|
| **Null/Missing** | Empty cells per column |
| **Duplicates** | Exact duplicate rows |
| **Outliers** | Values outside 1.5x IQR |
| **Inconsistencies** | Mixed types in a column |
| **Type Mismatch** | Wrong data types |
| **High Cardinality** | Too many unique values |

### Fixing Issues

**Quick Fix:** Click the **Fix** button on any issue card to apply the default strategy.

**Custom Fix:** Click **Expand** to choose from multiple strategies:

**For Null Values:**
- Mean / Median / Mode imputation
- Forward Fill / Backward Fill
- Drop rows
- Custom value

**For Outliers:**
- IQR Capping
- Winsorization (5th/95th percentile)
- Remove outliers
- Log transformation

**For Duplicates:**
- Remove duplicates (keeps first occurrence)

**Auto-Clean All:** Click **Fix All Issues** to apply default strategies to every detected issue at once.

### Cleaning Toolbox (6 Tabs)

#### Tab 1: Missing Values
Select a column and an imputation strategy. Optionally enter a custom value.

#### Tab 2: Outliers
Select a numeric column and choose a handling method (cap, winsorize, remove, log).

#### Tab 3: Strings
String operations: Trim whitespace, Lowercase, Uppercase, or Regex Replace (with pattern + replacement fields).

#### Tab 4: Types
Convert a column's type to: Number, String, or Date.

#### Tab 5: Columns
- **Drop** - Remove a column permanently
- **Rename** - Change column name
- **Split** - Split by delimiter into new columns
- **Merge** - Combine 2+ columns with a separator
- **Computed** - Create a new column using expressions (e.g., `d.price * d.quantity`)

#### Tab 6: Feature Engineering
- **Normalize**: Min-Max [0,1], Z-Score, Robust (IQR-based)
- **Encode**: One-Hot Encoding, Label Encoding
- **Bin**: Equal Width or Equal Frequency (configurable bin count)
- **Date Features**: Extract Year, Month, Day, Weekday, Hour, Quarter
- **Text Features**: Length, Word Count, Has Digits, Has Special Chars

### Change Log & Undo/Redo

- The sidebar shows the last 5 transformations with timestamps
- Use **Undo / Redo** buttons to navigate transformation history
- All changes are tracked and reversible

---

## 3. EDA - Exploratory Data Analysis

This phase provides deep statistical analysis of your dataset:

- **Data Profiling** - Detailed column-by-column statistics
- **Distribution Analysis** - Histograms and distribution shapes
- **Bivariate Analysis** - Cross-column relationships
- **Correlation Matrices** - Numeric column correlations
- **Statistical Tests** - Significance testing
- **Quality Metrics** - Comprehensive data quality breakdown

---

## 4. Exploration - Visualization & Charts

### Chart Types (12 Available)

| Chart | Best For |
|-------|----------|
| **Bar** | Categorical comparisons |
| **Line** | Time series, trends |
| **Area** | Stacked cumulative values |
| **Pie** | Proportion breakdowns |
| **Scatter** | Correlation between 2 variables |
| **Radar** | Multi-metric comparison |
| **Heatmap** | Correlation matrices |
| **Boxplot** | Distribution quartiles |
| **Treemap** | Hierarchical proportions |
| **Funnel** | Conversion/attrition flows |
| **Gauge** | Single metric KPI |
| **Sunburst** | Hierarchical ring structure |

### Creating Charts

**Auto-Generate:** Click **Auto-Generate** to let the system create recommended charts based on your data types.

**Smart Recommendations:** The AI suggests charts with confidence scores. Click any recommendation to create it instantly.

**Custom Chart Builder:**
1. Click **Custom Chart**
2. Select a chart type
3. Choose X-axis column
4. Choose Y-axis column (numeric)
5. Click **Create Chart**

### Chart Actions

Hover over any chart to reveal:
- **Download PNG** - Export chart as image
- **Forecast** - Toggle trend projection (line/area/bar charts only)
- **Delete** - Remove chart

### Forecast Feature

Available on Line, Area, and Bar charts:
- Click the sparkle icon to toggle
- Shows projected values as a dashed line
- Extends 3 periods into the future with 5% opacity fill

### Click Insights

Click any data point on a chart to see an insight popup with the value details and category.

---

## What-If Simulations

### Accessing
Click **What-If Lab** in the Exploration phase to open the simulation panel.

### Creating a Simulation

1. Click **Add Simulation**
2. **Driver Column** - Select the column you want to adjust (numeric)
3. **Target Column** - Select the column to observe impact on (numeric)
4. **Adjustment Slider** - Drag from 0.5x (-50%) to 2.0x (+200%)
   - The percentage change is displayed in real-time (e.g., "+20%", "-15%")

### How It Works

- Simulations overlay on your existing Line, Bar, and Area charts
- Projected values appear as dashed lines with reduced opacity
- Multiple simulations can be active simultaneously
- Toggle simulations on/off individually
- Delete simulations when no longer needed

### Example Use Case

> "If I increase `marketing_spend` by 30%, what happens to `revenue`?"
>
> - Driver: `marketing_spend`, Adjustment: 1.3
> - Target: `revenue`
> - The chart shows the projected revenue alongside actual values

---

## 5. Reports - Export & AI Consultancy

### Standard Exports (6 Formats)

| Format | Content |
|--------|---------|
| **PDF Report** | Full audit with transformations, metadata, charts |
| **Data Quality PDF** | Quality score, issues, completeness, duplicates |
| **Audit Trail PDF** | Complete transformation history with timestamps |
| **CSV Export** | Clean dataset as CSV |
| **Excel Export** | Clean dataset as XLSX |
| **JSON Export** | Full export (metadata + data + transformations) |

### AI Consultancy Report

Click **AI Consultancy** to launch the wizard:

**Step 1 - Configure:**
- **Audience**: Executive / Technical / General
- **Strategic Objective**: Risks / Opportunities / Governance / Overview
- **Additional Context**: Free-text field for custom instructions

**Step 2 - Review & Export:**
The AI generates a strategic report with:
- Governance & Data Integrity analysis
- Exploratory Insights & pattern analysis
- Strategic Conclusions & recommendations
- Actionable items organized by quarter

You can:
- **Edit** the report text before exporting
- **Regenerate** for a different version
- **Export as PDF** when satisfied

---

## AI Assistant

The chat panel (right side) is a conversational AI that can:

### Ask Questions
- "What patterns do you see in my data?"
- "Which columns have the most missing values?"
- "Suggest charts for this dataset"

### Trigger Actions
The AI can automatically:
- Apply data transformations
- Generate and add charts
- Navigate between phases
- Detect and fix data quality issues

### Toggle
Click the **AI Assistant** button in the header or use the sidebar toggle.

---

## Settings & Configuration

Access via the gear icon in the sidebar.

| Setting | Options | Description |
|---------|---------|-------------|
| **Theme** | Dark / Light | App appearance (Light coming soon) |
| **Language** | English / Spanish | Full UI translation toggle (EN/ES button in header) |
| **Privacy Scrubbing** | On / Off | Auto-removes PII before AI processing |
| **Auto-Clean** | On / Off | Automatically fix issues on detection |
| **AI Provider** | Configured | Workers AI (Llama 3.1 70B) |

### Security
- Cloudflare JWT Authentication status shown in settings
- End-to-end encryption for data in transit
- Edge-native processing for low latency

---

## Keyboard & Navigation

### Sidebar Navigation
Click any phase in the left sidebar to jump directly:
1. **Workspace** - Upload data
2. **Preparation** - Clean data
3. **EDA** - Analyze data
4. **Exploration** - Visualize data
5. **Reports** - Export results

### System Diagnostics
Click **Run Diagnostics** in the sidebar health card to recalculate data quality scores and system status (OPTIMAL / STABLE / CRITICAL).

### Multi-Dataset Support
- Upload multiple files in the Workspace
- Switch between datasets from the dataset selector
- Each dataset maintains its own state

---

## Deployment URLs

| Service | Platform | URL |
|---------|----------|-----|
| **Frontend** | Vercel | https://web-smoky-beta-57.vercel.app |
| **API** | Cloudflare Workers | https://dataflow-api.edison-985.workers.dev |
| **Database** | Cloudflare D1 | `dataflow-db` |
| **Storage** | Cloudflare R2 | `dataflow-datasets` |

### Redeploying

```bash
# API (Cloudflare Workers)
cd apps/api && npx wrangler deploy

# Web (Vercel)
cd apps/web && npx vercel deploy --prod
```

---

*DataFlow AI - Enterprise Data Analytics Platform*
