import { create } from 'zustand';

/**
 * Video segment information
 * 
 * @interface VideoSegment
 */
export interface VideoSegment {
  /** Sequential segment number (1-indexed) */
  segmentNumber: number;
  /** Start time in the original video (seconds) */
  startTime: number;
  /** End time in the original video (seconds) */
  endTime: number;
  /** Segment duration (seconds) */
  duration: number;
  /** URL to download the segment */
  downloadUrl: string;
}

/**
 * Video store state interface
 * 
 * Manages global state for video upload, processing, and segments.
 * Uses Zustand for lightweight state management.
 * 
 * @interface VideoState
 */
interface VideoState {
  videoFile: File | null;
  videoUrl: string | null;
  videoId: string | null;
  segments: VideoSegment[];
  isProcessing: boolean;
  error: string | null;
  setVideoFile: (file: File | null) => void;
  setVideoUrl: (url: string | null) => void;
  setVideoId: (videoId: string | null) => void;
  setSegments: (segments: VideoSegment[]) => void;
  setIsProcessing: (isProcessing: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

/**
 * Zustand store for video state management
 * 
 * Provides global state for:
 * - Uploaded video file and preview URL
 * - Generated segments
 * - Processing status
 * - Error messages
 * 
 * @constant
 * @returns {VideoState} Video store hook
 * 
 * @example
 * const { videoFile, setVideoFile, segments, isProcessing } = useVideoStore();
 */
export const useVideoStore = create<VideoState>((set) => ({
  videoFile: null,
  videoUrl: null,
  videoId: null,
  segments: [],
  isProcessing: false,
  error: null,
  setVideoFile: (file) => {
    if (file) {
      const url = URL.createObjectURL(file);
      set({ videoFile: file, videoUrl: url });
    } else {
      set({ videoFile: null, videoUrl: null });
    }
  },
  setVideoUrl: (url) => set({ videoUrl: url }),
  setVideoId: (videoId) => set({ videoId }),
  setSegments: (segments) => set({ segments }),
  setIsProcessing: (isProcessing) => set({ isProcessing }),
  setError: (error) => set({ error }),
  reset: () => set({
    videoFile: null,
    videoUrl: null,
    videoId: null,
    segments: [],
    isProcessing: false,
    error: null,
  }),
}));
