import { Request, Response, NextFunction } from 'express';
import { videoService, VideoSegment } from '../services/videoService';
import { logger } from '../utils/logger';
import path from 'path';
import fs from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';

// In-memory store for video metadata (in production, use a database)
const videoStore = new Map<string, {
  id: string;
  originalPath: string;
  filename: string;
  uploadedAt: Date;
  segments?: VideoSegment[];
}>();

export const videoController = {
  /**
   * Upload video file
   */
  async uploadVideo(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.file) {
        res.status(400).json({
          success: false,
          error: { message: 'No video file provided' }
        });
        return;
      }

      const videoId = uuidv4();
      const metadata = await videoService.getVideoMetadata(req.file.path);

      videoStore.set(videoId, {
        id: videoId,
        originalPath: req.file.path,
        filename: req.file.originalname,
        uploadedAt: new Date()
      });

      logger.info(`Video uploaded: ${videoId} - ${req.file.originalname}`);

      res.status(201).json({
        success: true,
        data: {
          id: videoId,
          filename: req.file.originalname,
          metadata,
          uploadedAt: new Date()
        }
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Split video into random segments
   */
  async splitVideo(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const video = videoStore.get(id);

      if (!video) {
        res.status(404).json({
          success: false,
          error: { message: 'Video not found' }
        });
        return;
      }

      const options = {
        numSegments: req.body.numSegments,
        minDuration: req.body.minDuration,
        maxDuration: req.body.maxDuration
      };

      const segments = await videoService.splitVideo(
        video.originalPath,
        id,
        options
      );

      // Update video store with segments
      video.segments = segments;
      videoStore.set(id, video);

      logger.info(`Video ${id} split into ${segments.length} segments`);

      res.status(200).json({
        success: true,
        data: {
          videoId: id,
          segments: segments.map(s => ({
            id: s.id,
            startTime: s.startTime,
            endTime: s.endTime,
            duration: s.duration
          }))
        }
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get all segments for a video
   */
  async getSegments(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const video = videoStore.get(id);

      if (!video) {
        res.status(404).json({
          success: false,
          error: { message: 'Video not found' }
        });
        return;
      }

      if (!video.segments || video.segments.length === 0) {
        res.status(200).json({
          success: true,
          data: {
            videoId: id,
            segments: [],
            message: 'Video has not been split yet'
          }
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: {
          videoId: id,
          segments: video.segments.map(s => ({
            id: s.id,
            startTime: s.startTime,
            endTime: s.endTime,
            duration: s.duration
          }))
        }
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Download a specific segment
   */
  async downloadSegment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id, segmentId } = req.params;
      const video = videoStore.get(id);

      if (!video || !video.segments) {
        res.status(404).json({
          success: false,
          error: { message: 'Video or segments not found' }
        });
        return;
      }

      const segment = video.segments.find(s => s.id === segmentId);
      if (!segment) {
        res.status(404).json({
          success: false,
          error: { message: 'Segment not found' }
        });
        return;
      }

      // Check if file exists
      try {
        await fs.access(segment.filePath);
      } catch {
        res.status(404).json({
          success: false,
          error: { message: 'Segment file not found' }
        });
        return;
      }

      res.download(segment.filePath, (err) => {
        if (err) {
          logger.error(`Error downloading segment ${segmentId}:`, err);
          if (!res.headersSent) {
            res.status(500).json({
              success: false,
              error: { message: 'Failed to download segment' }
            });
          }
        }
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Delete video and all segments
   */
  async deleteVideo(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const video = videoStore.get(id);

      if (!video) {
        res.status(404).json({
          success: false,
          error: { message: 'Video not found' }
        });
        return;
      }

      await videoService.deleteVideo(id, video.originalPath);
      videoStore.delete(id);

      logger.info(`Video ${id} deleted`);

      res.status(200).json({
        success: true,
        message: 'Video and all segments deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }
};
