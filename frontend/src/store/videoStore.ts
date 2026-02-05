import { create } from 'zustand';

export interface VideoSegment {
  segmentNumber: number;
  startTime: number;
  endTime: number;
  duration: number;
  downloadUrl: string;
}

interface VideoState {
  videoFile: File | null;
  videoUrl: string | null;
  segments: VideoSegment[];
  isProcessing: boolean;
  error: string | null;
  setVideoFile: (file: File | null) => void;
  setVideoUrl: (url: string | null) => void;
  setSegments: (segments: VideoSegment[]) => void;
  setIsProcessing: (isProcessing: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

export const useVideoStore = create<VideoState>((set) => ({
  videoFile: null,
  videoUrl: null,
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
  setSegments: (segments) => set({ segments }),
  setIsProcessing: (isProcessing) => set({ isProcessing }),
  setError: (error) => set({ error }),
  reset: () => set({
    videoFile: null,
    videoUrl: null,
    segments: [],
    isProcessing: false,
    error: null,
  }),
}));
