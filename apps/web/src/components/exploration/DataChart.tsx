"use client";

import React from "react";
import { AnimatedChart } from "@/components/ui/AnimatedChart";

interface ChartProps {
    data: any | any[];
    layout?: any;
    type?: string;
    title?: string;
    onChartReady?: (instance: any) => void;
    onPointClick?: (params: any) => void;
    isLoading?: boolean;
}

export const DataChart = React.memo(function DataChart({ data, layout, type, title, onChartReady, onPointClick, isLoading }: ChartProps) {
    // Determine internal structure
    const isHeatmap = type === 'heatmap';
    const isPie = type === 'pie';
    const isRadar = type === 'radar';
    const isTreemap = type === 'treemap';
    const isFunnel = type === 'funnel';
    const isGauge = type === 'gauge';
    const isSunburst = type === 'sunburst';
    const isLine = type === 'line';
    const isArea = type === 'area';

    let processedOption: any = {
        title: {
            text: title || layout?.title?.text || "",
            left: 'center',
            textStyle: { color: '#1f2937', fontSize: 13, fontWeight: '700' }
        },
        tooltip: {
            trigger: (isPie || isRadar || isTreemap || isFunnel || isGauge || isSunburst) ? 'item' : 'axis',
            backgroundColor: '#ffffff',
            borderColor: '#e5e7eb',
            textStyle: { color: '#374151' }
        },
        grid: { top: 60, bottom: 40, left: 50, right: 30 },
        series: []
    };

    if (isHeatmap) {
        processedOption.xAxis = { type: 'category', data: layout?.xAxis?.data || [] };
        processedOption.yAxis = { type: 'category', data: layout?.yAxis?.data || [] };
        processedOption.visualMap = { min: -1, max: 1, calculable: true, orient: 'horizontal', left: 'center', bottom: 0, inRange: { color: ['#ef4444', '#fff', '#3b82f6'] } };
        processedOption.series = [{
            type: 'heatmap',
            data: data.flatMap((row: any, i: number) => row.data.map((val: any, j: number) => [j, i, val])),
            label: { show: false }
        }];
    } else if (isPie) {
        processedOption.series = [{
            type: 'pie',
            radius: ['40%', '70%'],
            avoidLabelOverlap: false,
            itemStyle: { borderRadius: 10, borderColor: '#fff', borderWidth: 2 },
            label: { show: false },
            emphasis: { label: { show: true, fontSize: 12, fontWeight: 'bold' } },
            data: data.map((d: any) => ({ value: d.value, name: d.name }))
        }];
    } else if (isRadar) {
        processedOption.radar = {
            indicator: layout?.radar?.indicator || [],
            shape: 'circle',
            splitNumber: 5,
            axisName: { color: '#9ca3af' },
            splitLine: { lineStyle: { color: 'rgba(0,0,0,0.05)' } },
            splitArea: { show: false },
            axisLine: { lineStyle: { color: 'rgba(0,0,0,0.05)' } }
        };
        processedOption.series = [{
            type: 'radar',
            data: data.map((d: any) => ({
                value: d.value,
                name: d.name,
                areaStyle: { opacity: 0.1 }
            }))
        }];
    } else if (isTreemap) {
        processedOption.series = [{
            type: 'treemap',
            data: data,
            leafDepth: 1,
            levels: [
                { itemStyle: { borderColor: '#fff', borderWidth: 4, gapWidth: 4 } },
                { colorSaturation: [0.3, 0.6], itemStyle: { borderColorSaturation: 0.7, gapWidth: 2, borderWidth: 2 } }
            ]
        }];
    } else if (isFunnel) {
        processedOption.series = [{
            type: 'funnel',
            left: '10%',
            top: 60,
            bottom: 60,
            width: '80%',
            min: 0,
            max: 100,
            minSize: '0%',
            maxSize: '100%',
            sort: 'descending',
            gap: 2,
            label: { show: true, position: 'inside' },
            labelLine: { show: false },
            itemStyle: { opacity: 0.7 },
            emphasis: { label: { fontSize: 20 } },
            data: data
        }];
    } else if (isGauge) {
        processedOption.series = [{
            type: 'gauge',
            startAngle: 180,
            endAngle: 0,
            center: ['50%', '75%'],
            radius: '90%',
            min: 0,
            max: 1,
            progress: { show: true, width: 18 },
            pointer: { show: false },
            axisLine: { lineStyle: { width: 18 } },
            axisTick: { show: false },
            splitLine: { show: false },
            axisLabel: { show: false },
            anchor: { show: false },
            title: { show: false },
            detail: {
                valueAnimation: true,
                offsetCenter: [0, -10],
                fontSize: 30,
                fontWeight: '700',
                formatter: '{value}',
                color: 'inherit'
            },
            data: [{ value: data[0]?.value || 0, name: data[0]?.name || '' }]
        }];
    } else if (isSunburst) {
        processedOption.series = [{
            type: 'sunburst',
            data: data,
            radius: [0, '90%'],
            label: { rotate: 'radial' }
        }];
    } else if (type === 'boxplot') {
        processedOption.xAxis = { type: 'category', data: layout?.xAxis?.data || [] };
        processedOption.yAxis = { type: 'value' };
        processedOption.series = [{
            type: 'boxplot',
            data: data
        }];
    } else if (type === 'sankey') {
        processedOption.series = [{
            type: 'sankey',
            layout: 'none',
            emphasis: { focus: 'adjacency' },
            data: data.nodes,
            links: data.links,
            lineStyle: { color: 'gradient', curveness: 0.5 }
        }];
    } else if (type === 'scatter') {
        // Scatter chart needs value axes and [x,y] pairs
        const xData = Array.isArray(data) && data[0]?.x ? data[0].x : [];
        const yData = Array.isArray(data) && data[0]?.y ? data[0].y : [];
        const scatterData = xData.map((x: any, i: number) => [x, yData[i]]);

        processedOption.xAxis = {
            type: 'value',
            axisLabel: { color: 'rgba(0,0,0,0.5)', fontSize: 10 },
            axisLine: { lineStyle: { color: 'rgba(0,0,0,0.12)' } },
            splitLine: { lineStyle: { color: 'rgba(0,0,0,0.06)' } }
        };
        processedOption.yAxis = {
            type: 'value',
            axisLabel: { color: 'rgba(0,0,0,0.5)', fontSize: 10 },
            splitLine: { lineStyle: { color: 'rgba(0,0,0,0.06)' } }
        };
        processedOption.series = [{
            type: 'scatter',
            data: scatterData,
            symbolSize: 8,
            itemStyle: { color: 'rgba(59, 130, 246, 0.6)' }
        }];
    } else {
        // Generic Bar/Line/Area — supports multi-series XY data (simulations + forecasts)
        const hasXY = Array.isArray(data) && data.length > 0 && data[0]?.x;
        const hasNameValue = Array.isArray(data) && data.length > 0 && data[0]?.name !== undefined && !data[0]?.x;

        if (hasXY) {
            // Multi-series: [{name, x, y, lineStyle?, areaStyle?, itemStyle?}, ...]
            const allXLabels: string[] = [];
            const xSet = new Set<string>();
            for (const series of data) {
                for (const label of (series.x || [])) {
                    const key = String(label);
                    if (!xSet.has(key)) {
                        xSet.add(key);
                        allXLabels.push(key);
                    }
                }
            }

            processedOption.xAxis = {
                type: 'category',
                data: allXLabels,
                axisLabel: { color: 'rgba(0,0,0,0.5)', fontSize: 10 },
                axisLine: { lineStyle: { color: 'rgba(0,0,0,0.12)' } }
            };
            processedOption.yAxis = {
                type: 'value',
                axisLabel: { color: 'rgba(0,0,0,0.5)', fontSize: 10 },
                splitLine: { lineStyle: { color: 'rgba(0,0,0,0.06)' } }
            };

            const defaultColors = ['#1a73e8', '#e8453c', '#34a853', '#fbbc04', '#6366f1', '#ec4899'];

            processedOption.series = data.map((s: any, idx: number) => {
                const valueMap = new Map<string, number>();
                (s.x || []).forEach((xVal: any, i: number) => {
                    valueMap.set(String(xVal), (s.y || [])[i]);
                });
                const alignedY = allXLabels.map(label => valueMap.get(label) ?? null);

                return {
                    type: s.type || type || 'bar',
                    name: s.name || `Series ${idx + 1}`,
                    data: alignedY,
                    smooth: true,
                    symbolSize: 4,
                    connectNulls: false,
                    itemStyle: s.itemStyle || { color: defaultColors[idx % defaultColors.length] },
                    lineStyle: s.lineStyle || undefined,
                    areaStyle: s.areaStyle || (type === 'area' && idx === 0 ? { opacity: 0.1 } : undefined),
                };
            });

            if (data.length > 1) {
                processedOption.legend = {
                    data: data.map((s: any, idx: number) => s.name || `Series ${idx + 1}`),
                    bottom: 0,
                    textStyle: { color: 'rgba(0,0,0,0.5)', fontSize: 10 }
                };
                processedOption.grid.bottom = 60;
            }
        } else {
            // Simple named-value or raw array data
            const xAxisData = hasNameValue ? data.map((d: any) => d.name) : data.map((_: any, i: number) => i);
            const seriesData = hasNameValue ? data.map((d: any) => d.value) : data.map((d: any) => d.value ?? d);

            processedOption.xAxis = {
                type: 'category',
                data: xAxisData,
                axisLabel: { color: 'rgba(0,0,0,0.5)', fontSize: 10 },
                axisLine: { lineStyle: { color: 'rgba(0,0,0,0.12)' } }
            };
            processedOption.yAxis = {
                type: 'value',
                axisLabel: { color: 'rgba(0,0,0,0.5)', fontSize: 10 },
                splitLine: { lineStyle: { color: 'rgba(0,0,0,0.06)' } }
            };
            processedOption.series = [{
                type: type || 'bar',
                data: seriesData,
                smooth: true,
                symbolSize: 4,
                itemStyle: { color: '#1a73e8' },
                areaStyle: type === 'area' ? { opacity: 0.1 } : undefined
            }];
        }
    }

    return <AnimatedChart
        option={processedOption}
        onChartReady={onChartReady}
        onEvents={onPointClick ? { 'click': onPointClick } : undefined}
        isLoading={isLoading}
    />;
});
