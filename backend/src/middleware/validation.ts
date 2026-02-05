import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

/**
 * Zod schema for validating video split request parameters
 * 
 * @constant
 * @type {z.ZodObject}
 */
const splitVideoSchema = z.object({
  numSegments: z.number().int().min(1).max(20).optional(),
  minDuration: z.number().positive().optional(),
  maxDuration: z.number().positive().optional()
});

/**
 * Middleware to validate that a video file was uploaded
 * 
 * Checks if req.file exists and returns 400 error if not.
 * Should be used after multer middleware.
 * 
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next function
 * @returns {void}
 * 
 * @example
 * router.post('/upload', upload.single('video'), validateVideoUpload, handler);
 */
export const validateVideoUpload = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.file) {
    res.status(400).json({
      success: false,
      error: { message: 'No video file provided' }
    });
    return;
  }
  next();
};

/**
 * Middleware to validate video split request parameters
 * 
 * Validates request body parameters using Zod schema:
 * - numSegments: integer between 1-20 (optional)
 * - minDuration: positive number (optional)
 * - maxDuration: positive number (optional)
 * 
 * Returns 400 error with validation details if validation fails.
 * Parses and normalizes parameters before passing to next handler.
 * 
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next function
 * @returns {void}
 * 
 * @example
 * router.post('/split', validateSplitRequest, handler);
 */
export const validateSplitRequest = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    const body = {
      numSegments: req.body.numSegments ? parseInt(req.body.numSegments) : undefined,
      minDuration: req.body.minDuration ? parseFloat(req.body.minDuration) : undefined,
      maxDuration: req.body.maxDuration ? parseFloat(req.body.maxDuration) : undefined
    };
    
    splitVideoSchema.parse(body);
    req.body = body;
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: { message: 'Invalid request parameters', details: error.errors }
      });
      return;
    }
    next(error);
  }
};
