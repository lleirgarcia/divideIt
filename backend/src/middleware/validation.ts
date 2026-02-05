import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

const splitVideoSchema = z.object({
  numSegments: z.number().int().min(1).max(20).optional(),
  minDuration: z.number().positive().optional(),
  maxDuration: z.number().positive().optional()
});

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
