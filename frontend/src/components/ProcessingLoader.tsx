'use client';

import { useState, useEffect } from 'react';
import { useVideoStore } from '@/store/videoStore';

/** Simulated progress: reach ~90% over this many ms (long videos may take longer) */
const PROGRESS_DURATION_MS = 55000;
const PROGRESS_CAP = 90;

/**
 * Full-screen loader overlay that displays while videos are being processed
 *
 * Shows a prominent loading indicator with progress bar and message.
 * Progress bar simulates progress (backend does not stream progress).
 *
 * @component
 * @returns {JSX.Element | null} Processing loader overlay or null if not processing
 */
export function ProcessingLoader() {
  const { isProcessing } = useVideoStore();
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!isProcessing) {
      setProgress(0);
      return;
    }
    setProgress(0);
    const start = Date.now();
    const tick = () => {
      const elapsed = Date.now() - start;
      const p = Math.min((elapsed / PROGRESS_DURATION_MS) * PROGRESS_CAP, PROGRESS_CAP);
      setProgress(Math.round(p));
    };
    const id = setInterval(tick, 200);
    tick();
    return () => clearInterval(id);
  }, [isProcessing]);

  if (!isProcessing) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      role="status"
      aria-live="polite"
      aria-label="Processing videos"
      aria-valuenow={progress}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 max-w-md mx-4 text-center w-full">
        {/* Spinner */}
        <div className="mb-6 flex justify-center">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 border-4 border-primary-200 dark:border-primary-800 rounded-full" />
            <div className="absolute inset-0 border-4 border-transparent border-t-primary-600 dark:border-t-primary-500 rounded-full animate-spin" />
          </div>
        </div>

        {/* Message */}
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Processing Videos
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Please wait while we split your video into segments...
        </p>

        {/* Progress bar */}
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
          <div
            className="h-full bg-primary-600 dark:bg-primary-500 rounded-full transition-[width] duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 tabular-nums">
          {progress}%
        </p>
      </div>
    </div>
  );
}
