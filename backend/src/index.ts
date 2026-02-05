// Load environment variables FIRST before any imports that depend on them
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { errorHandler } from './middleware/errorHandler';
import { rateLimiter } from './middleware/rateLimiter';
import { metricsMiddleware } from './middleware/metrics';
import { videoRoutes } from './routes/videoRoutes';
import { healthRoutes } from './routes/healthRoutes';
import { metricsRoutes } from './routes/metricsRoutes';
import { googleDriveRoutes } from './routes/googleDriveRoutes';
import { logger } from './utils/logger';
import { ensureDirectoryExists } from './utils/fileUtils';

const app = express();
const PORT = process.env.PORT || 3051;

// Initialize directories
const initializeDirectories = async () => {
  await ensureDirectoryExists('uploads');
  await ensureDirectoryExists('processed');
  await ensureDirectoryExists('logs');
};

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3050',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
app.use(morgan('combined', { stream: { write: (message) => logger.info(message.trim()) } }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Metrics middleware (should be before routes)
app.use(metricsMiddleware);

// Rate limiting
app.use('/api/', rateLimiter);

// Routes
app.use('/api/health', healthRoutes);
app.use('/api/metrics', metricsRoutes);
app.use('/api/videos', videoRoutes);
app.use('/api/google-drive', googleDriveRoutes);

// Error handling
app.use(errorHandler);

// Start server
const startServer = async () => {
  await initializeDirectories();
  
  app.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`);
    logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
  });
};

// Do not start listening in test (supertest uses the app without listening)
if (process.env.NODE_ENV !== 'test') {
  startServer().catch((error) => {
    logger.error(`Failed to start server: ${error.message}`);
    process.exit(1);
  });
}

export default app;
