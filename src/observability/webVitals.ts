import { onCLS, onFCP, onINP, onLCP, onTTFB, type Metric } from 'web-vitals';
import { captureMessage, isSentryEnabled } from './sentry';

function reportMetric(metric: Metric): void {
  captureMessage('web-vital', {
    metricName: metric.name,
    metricRating: metric.rating,
    metricValue: Math.round(metric.value),
    metricDelta: Math.round(metric.delta),
  });
}

export function startWebVitals(): void {
  if (!isSentryEnabled() && import.meta.env.VITE_WEB_VITALS !== 'true') return;

  onCLS(reportMetric);
  onFCP(reportMetric);
  onINP(reportMetric);
  onLCP(reportMetric);
  onTTFB(reportMetric);
}
