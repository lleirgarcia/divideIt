import rateLimit from 'express-rate-limit';

/**
 * General API rate limiter middleware
 * 
 * Limits API requests to prevent abuse and ensure fair usage.
 * Applies to all API endpoints except upload endpoints.
 * 
 * @constant
 * @type {RateLimitRequestHandler}
 * 
 * @property {number} windowMs - Time window in milliseconds (15 minutes)
 * @property {number} max - Maximum requests per window (100 requests)
 * 
 * @example
 * app.use('/api/', rateLimiter);
 */
export const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Upload endpoint rate limiter middleware
 * 
 * Stricter rate limiting for video upload endpoints to prevent abuse
 * and manage server resources. Video processing is resource-intensive.
 * 
 * @constant
 * @type {RateLimitRequestHandler}
 * 
 * @property {number} windowMs - Time window in milliseconds (1 hour)
 * @property {number} max - Maximum uploads per window (10 uploads)
 * 
 * @example
 * router.post('/split', uploadRateLimiter, upload.single('video'), handler);
 */
export const uploadRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Limit each IP to 10 uploads per hour
  message: 'Too many uploads from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
