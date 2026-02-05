import { Router } from 'express';
import { Request, Response } from 'express';
import os from 'os';

const router = Router();

/**
 * Basic health check endpoint
 * 
 * Returns comprehensive health status including:
 * - Server status
 * - Uptime
 * - Memory usage
 * - CPU usage
 * - System information
 * 
 * Used for monitoring and load balancer health checks.
 * 
 * @route GET /api/health
 * @returns {Object} Health status object
 * 
 * @example
 * GET /api/health
 * Response: {
 *   status: 'ok',
 *   timestamp: '2024-01-15T10:30:00.000Z',
 *   uptime: 3600,
 *   memory: { used: 50, total: 100, ... },
 *   ...
 * }
 */
router.get('/', (_req: Request, res: Response) => {
  const memoryUsage = process.memoryUsage();
  const cpuUsage = process.cpuUsage();
  
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '1.0.0',
    memory: {
      used: Math.round(memoryUsage.heapUsed / 1024 / 1024),
      total: Math.round(memoryUsage.heapTotal / 1024 / 1024),
      external: Math.round(memoryUsage.external / 1024 / 1024),
      rss: Math.round(memoryUsage.rss / 1024 / 1024)
    },
    cpu: {
      user: cpuUsage.user,
      system: cpuUsage.system
    },
    system: {
      platform: os.platform(),
      arch: os.arch(),
      cpus: os.cpus().length,
      loadAverage: os.loadavg()
    }
  });
});

/**
 * Readiness probe endpoint
 * 
 * Checks if the service is ready to accept traffic.
 * Can be extended to check database connections, external services, etc.
 * Used by Kubernetes and Docker health checks.
 * 
 * @route GET /api/health/ready
 * @returns {Object} Readiness status
 * 
 * @example
 * GET /api/health/ready
 * Response: { status: 'ready', timestamp: '...' }
 */
router.get('/ready', (_req: Request, res: Response) => {
  // Add custom readiness checks here (e.g., database connection, external services)
  res.json({
    status: 'ready',
    timestamp: new Date().toISOString()
  });
});

/**
 * Liveness probe endpoint
 * 
 * Checks if the service is alive and running.
 * Returns basic status and uptime information.
 * Used by Kubernetes and Docker health checks.
 * 
 * @route GET /api/health/live
 * @returns {Object} Liveness status
 * 
 * @example
 * GET /api/health/live
 * Response: { status: 'alive', timestamp: '...', uptime: 3600 }
 */
router.get('/live', (_req: Request, res: Response) => {
  res.json({
    status: 'alive',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

export { router as healthRoutes };
