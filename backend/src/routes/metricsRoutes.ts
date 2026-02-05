import { Router } from 'express';
import { Request, Response } from 'express';
import { getMetrics } from '../middleware/metrics';

const router = Router();

// Prometheus metrics endpoint
router.get('/', async (_req: Request, res: Response) => {
  try {
    const metrics = await getMetrics();
    res.set('Content-Type', 'text/plain; version=0.0.4; charset=utf-8');
    res.send(metrics);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve metrics' });
  }
});

export { router as metricsRoutes };
