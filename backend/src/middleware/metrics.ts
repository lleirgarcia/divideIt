import { Request, Response, NextFunction } from 'express';
import client from 'prom-client';

// Create a Registry to register the metrics
const register = new client.Registry();

// Add default metrics (CPU, memory, etc.)
client.collectDefaultMetrics({ register });

// HTTP request duration histogram
const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.5, 1, 2, 5, 10, 30]
});

// HTTP request total counter
const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code']
});

// Video processing metrics
const videoProcessingDuration = new client.Histogram({
  name: 'video_processing_duration_seconds',
  help: 'Duration of video processing in seconds',
  labelNames: ['operation'],
  buckets: [1, 5, 10, 30, 60, 120, 300]
});

const videoProcessingTotal = new client.Counter({
  name: 'video_processing_total',
  help: 'Total number of video processing operations',
  labelNames: ['operation', 'status']
});

const videoFileSize = new client.Histogram({
  name: 'video_file_size_bytes',
  help: 'Size of uploaded video files in bytes',
  buckets: [1024 * 1024, 10 * 1024 * 1024, 50 * 1024 * 1024, 100 * 1024 * 1024, 500 * 1024 * 1024, 1024 * 1024 * 1024]
});

// Register custom metrics
register.registerMetric(httpRequestDuration);
register.registerMetric(httpRequestsTotal);
register.registerMetric(videoProcessingDuration);
register.registerMetric(videoProcessingTotal);
register.registerMetric(videoFileSize);

// Middleware to track HTTP requests
export const metricsMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  const route = req.route?.path || req.path;

  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const labels = {
      method: req.method,
      route: route,
      status_code: res.statusCode.toString()
    };

    httpRequestDuration.observe(labels, duration);
    httpRequestsTotal.inc(labels);
  });

  next();
};

// Export metrics for Prometheus scraping
export const getMetrics = async (): Promise<string> => {
  return register.metrics();
};

// Video processing metrics helpers
export const recordVideoProcessing = (operation: string, duration: number, status: 'success' | 'error') => {
  videoProcessingDuration.observe({ operation }, duration);
  videoProcessingTotal.inc({ operation, status });
};

export const recordVideoFileSize = (size: number) => {
  videoFileSize.observe(size);
};

export { register };
