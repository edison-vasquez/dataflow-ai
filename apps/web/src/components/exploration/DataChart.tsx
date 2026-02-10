"use client";

import React from 'react';
import dynamic from 'next/dynamic';

const Plot = dynamic(() => import('react-plotly.js'), { ssr: false });

interface ChartProps {
    data: any[];
    layout: any;
}

export function DataChart({ data, layout }: ChartProps) {
    return (
        <div className="w-full h-full min-h-[300px] flex items-center justify-center">
            <Plot
                data={data}
                layout={{
                    ...layout,
                    autosize: true,
                    margin: { t: 40, r: 20, b: 40, l: 40 },
                    paper_bgcolor: 'rgba(0,0,0,0)',
                    plot_bgcolor: 'rgba(0,0,0,0)',
                    font: { family: 'inherit', size: 11, color: '#888' },
                    xaxis: {
                        gridcolor: 'rgba(128,128,128,0.1)',
                        zeroline: false
                    },
                    yaxis: {
                        gridcolor: 'rgba(128,128,128,0.1)',
                        zeroline: false
                    }
                }}
                useResizeHandler={true}
                className="w-full h-full"
                config={{ displayModeBar: false, responsive: true }}
            />
        </div>
    );
}
