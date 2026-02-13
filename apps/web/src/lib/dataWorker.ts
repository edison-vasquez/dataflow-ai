import { analyzeDataset, computeEDAStats, computeCorrelationMatrix } from './dataProcessor';
import { analyzeBivariate } from './bivariateAnalysis';

self.onmessage = (e: MessageEvent) => {
    const { type, data, payload } = e.data;

    try {
        switch (type) {
            case 'ANALYZE_DATASET': {
                const results = analyzeDataset(data);
                self.postMessage({ type: 'ANALYZE_DATASET_RESULT', results });
                break;
            }
            case 'COMPUTE_EDA_STATS': {
                const results = computeEDAStats(data);
                self.postMessage({ type: 'COMPUTE_EDA_STATS_RESULT', results });
                break;
            }
            case 'COMPUTE_CORRELATION': {
                const results = computeCorrelationMatrix(data);
                self.postMessage({ type: 'COMPUTE_CORRELATION_RESULT', results });
                break;
            }
            case 'ANALYZE_BIVARIATE': {
                const { col1, col2 } = payload;
                const results = analyzeBivariate(data, col1, col2);
                self.postMessage({ type: 'ANALYZE_BIVARIATE_RESULT', results });
                break;
            }
            default:
                break;
        }
    } catch (error: any) {
        self.postMessage({ type: 'ERROR', error: error.message });
    }
};
