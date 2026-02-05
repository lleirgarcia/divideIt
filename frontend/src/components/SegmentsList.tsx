'use client';

import { useVideoStore, VideoSegment } from '@/store/videoStore';
import { downloadSegment } from '@/services/api';

export function SegmentsList() {
  const { segments } = useVideoStore();

  const handleDownload = async (segment: VideoSegment) => {
    try {
      const url = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}${segment.downloadUrl}`;
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `segment_${segment.segmentNumber}.mp4`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-3 max-h-96 overflow-y-auto">
      {segments.map((segment) => (
        <div
          key={segment.segmentNumber}
          className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
        >
          <div className="flex-1">
            <div className="flex items-center gap-4">
              <span className="font-semibold text-gray-900 dark:text-white">
                Segment {segment.segmentNumber}
              </span>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {formatTime(segment.startTime)} - {formatTime(segment.endTime)}
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-500">
                ({formatTime(segment.duration)})
              </span>
            </div>
          </div>
          <button
            onClick={() => handleDownload(segment)}
            className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
          >
            Download
          </button>
        </div>
      ))}
    </div>
  );
}
