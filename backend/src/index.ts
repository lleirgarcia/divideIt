import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { errorHandler } from './middleware/errorHandler';
import { rateLimiter } from './middleware/rateLimiter';
import { videoRoutes } from './routes/videoRoutes';
import { healthRoutes } from './routes/healthRoutes';
import { logger } from './utils/logger';
import { ensureDirectoryExists } from './utils/fileUtils';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize directories
const initializeDirectories = async () => {
  await ensureDirectoryExists('uploads');
  await ensureDirectoryExists('processed');
  await ensureDirectoryExists('logs');
};

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(morgan('combined', { stream: { write: (message) => logger.info(message.trim()) } }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
app.use('/api/', rateLimiter);

// Routes
app.use('/api/health', healthRoutes);
app.use('/api/videos', videoRoutes);

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

startServer().catch((error) => {
  logger.error(`Failed to start server: ${error.message}`);
  process.exit(1);
});

export default app;
