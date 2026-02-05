import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

/**
 * Extended Error interface for application errors
 * @interface AppError
 * @extends {Error}
 */
export interface AppError extends Error {
  /** HTTP status code for the error */
  statusCode?: number;
  /** Indicates if this is an operational (expected) error */
  isOperational?: boolean;
}

/**
 * Express error handling middleware
 * 
 * Handles all errors thrown in the application and returns appropriate HTTP responses.
 * Logs errors with context information and includes stack traces in development mode.
 * 
 * @param {AppError} err - The error object
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next function
 * @returns {void}
 * 
 * @example
 * // Errors are automatically caught and handled
 * throw createError('Not found', 404);
 */
export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  logger.error({
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method
  });

  res.status(statusCode).json({
    success: false,
    error: {
      message,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    }
  });
};

/**
 * Creates a standardized application error
 * 
 * Creates an error object with a status code and marks it as operational.
 * Operational errors are expected errors that should be returned to the client.
 * 
 * @param {string} message - Error message
 * @param {number} [statusCode=500] - HTTP status code (default: 500)
 * @returns {AppError} Error object with status code
 * 
 * @example
 * throw createError('Video not found', 404);
 * throw createError('Invalid file type', 400);
 */
export const createError = (message: string, statusCode: number = 500): AppError => {
  const error: AppError = new Error(message);
  error.statusCode = statusCode;
  error.isOperational = true;
  return error;
};
