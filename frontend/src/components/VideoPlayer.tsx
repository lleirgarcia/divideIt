'use client';

import { lazy, Suspense } from 'react';
import { useVideoStore } from '@/store/videoStore';
import { LoadingSkeleton } from './ui/LoadingSkeleton';

const ReactPlayer = lazy(() => import('react-player'));

/**
 * Video player component for previewing uploaded videos
 * 
 * Displays:
 * - Uploaded video preview with controls
 * - Processing state indicator
 * - Empty state when no video uploaded
 * 
 * Uses React Player for video playback with lazy loading for performance.
 * 
 * @component
 * @returns {JSX.Element} Video player component
 * 
 * @example
 * <VideoPlayer />
 */
export function VideoPlayer() {
  const { videoUrl, isProcessing } = useVideoStore();

  if (isProcessing) {
    return (
      <div className="aspect-video bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
        <div className="text-center space-y-2">
          <LoadingSkeleton variant="circular" width={48} height={48} className="mx-auto" />
          <p className="text-gray-500 dark:text-gray-400 text-sm">Processing video...</p>
        </div>
      </div>
    );
  }

  if (!videoUrl) {
    return (
      <div
        className="aspect-video bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center"
        role="status"
        aria-label="No video uploaded"
      >
        <div className="text-center">
          <svg
            className="mx-auto h-12 w-12 text-gray-400 mb-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
            />
          </svg>
          <p className="text-gray-500 dark:text-gray-400">No video uploaded</p>
        </div>
      </div>
    );
  }

  return (
    <div className="aspect-video bg-black rounded-lg overflow-hidden" role="region" aria-label="Video player">
      <Suspense fallback={<LoadingSkeleton className="w-full h-full" />}>
        <ReactPlayer
          url={videoUrl}
          controls
          width="100%"
          height="100%"
          playing={false}
          config={{
            file: {
              attributes: {
                controlsList: 'nodownload',
              },
            },
          }}
          aria-label="Video player"
        />
      </Suspense>
    </div>
  );
}
