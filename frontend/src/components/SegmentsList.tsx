'use client';

import { useState } from 'react';
import { useVideoStore, VideoSegment } from '@/store/videoStore';
import { downloadSegment } from '@/services/api';
import { Button } from './ui/Button';
import { LoadingSkeleton } from './ui/LoadingSkeleton';
import toast from 'react-hot-toast';

/**
 * Component displaying list of generated video segments
 * 
 * Features:
 * - Lists all generated segments with timing information
 * - Download functionality for each segment
 * - Empty state when no segments available
 * - Accessible with ARIA labels
 * 
 * @component
 * @returns {JSX.Element} Segments list component
 * 
 * @example
 * <SegmentsList />
 */
export function SegmentsList() {
  const { segments, isProcessing } = useVideoStore();
  const [downloadingId, setDownloadingId] = useState<number | null>(null);

  const handleDownload = async (segment: VideoSegment) => {
    setDownloadingId(segment.segmentNumber);
    try {
      const url = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3051'}${segment.downloadUrl}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Download failed: ${response.statusText}`);
      }
      
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `segment_${segment.segmentNumber}.mp4`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
      toast.success(`Downloaded segment ${segment.segmentNumber}`);
    } catch (error: any) {
      console.error('Download failed:', error);
      toast.error(`Failed to download segment ${segment.segmentNumber}`);
    } finally {
      setDownloadingId(null);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (isProcessing) {
    return (
      <div className="space-y-3" role="status" aria-label="Processing segments">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
          >
            <LoadingSkeleton variant="text" lines={1} height={24} />
            <div className="mt-2 flex gap-4">
              <LoadingSkeleton variant="text" width="100px" height={16} />
              <LoadingSkeleton variant="text" width="80px" height={16} />
            </div>
          </div>
        ))}
        <div className="text-center py-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Processing segments...
          </p>
        </div>
      </div>
    );
  }

  if (segments.length === 0) {
    return (
      <div
        className="text-center py-8 text-gray-500 dark:text-gray-400"
        role="status"
        aria-label="No segments generated"
      >
        <p>No segments generated yet. Upload a video and click "Split Video" to create segments.</p>
      </div>
    );
  }

  return (
    <div
      className="space-y-3 max-h-96 overflow-y-auto"
      role="list"
      aria-label="Generated video segments"
    >
      {segments.map((segment) => (
        <div
          key={segment.segmentNumber}
          className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
          role="listitem"
        >
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 md:gap-4">
              <span className="font-semibold text-gray-900 dark:text-white">
                Segment {segment.segmentNumber}
              </span>
              <span className="text-sm text-gray-600 dark:text-gray-400" aria-label={`Time range: ${formatTime(segment.startTime)} to ${formatTime(segment.endTime)}`}>
                {formatTime(segment.startTime)} - {formatTime(segment.endTime)}
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-500" aria-label={`Duration: ${formatTime(segment.duration)}`}>
                ({formatTime(segment.duration)})
              </span>
            </div>
          </div>
          <Button
            onClick={() => handleDownload(segment)}
            isLoading={downloadingId === segment.segmentNumber}
            size="sm"
            aria-label={`Download segment ${segment.segmentNumber}`}
            className="ml-4 flex-shrink-0"
          >
            Download
          </Button>
        </div>
      ))}
    </div>
  );
}
