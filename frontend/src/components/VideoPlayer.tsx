'use client';

import { useVideoStore } from '@/store/videoStore';
import ReactPlayer from 'react-player';

export function VideoPlayer() {
  const { videoUrl } = useVideoStore();

  if (!videoUrl) {
    return (
      <div className="aspect-video bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
        <p className="text-gray-500 dark:text-gray-400">No video uploaded</p>
      </div>
    );
  }

  return (
    <div className="aspect-video bg-black rounded-lg overflow-hidden">
      <ReactPlayer
        url={videoUrl}
        controls
        width="100%"
        height="100%"
        playing={false}
      />
    </div>
  );
}
