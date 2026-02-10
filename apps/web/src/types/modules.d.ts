declare module 'react-plotly.js' {
  import { Component } from 'react';

  interface PlotParams {
    data: any[];
    layout?: any;
    config?: any;
    style?: any;
    className?: string;
    useResizeHandler?: boolean;
    onInitialized?: (figure: any, graphDiv: any) => void;
    onUpdate?: (figure: any, graphDiv: any) => void;
    onSelected?: (event: any) => void;
    onClick?: (event: any) => void;
    [key: string]: any;
  }

  class Plot extends Component<PlotParams> {}
  export default Plot;
}

declare module 'plotly.js-dist-min';
