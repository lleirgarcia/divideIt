'use client';

import { VideoUploader } from '@/components/VideoUploader';
import { VideoPlayer } from '@/components/VideoPlayer';
import { SegmentsList } from '@/components/SegmentsList';
import { DarkModeToggle } from '@/components/ui/DarkModeToggle';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { useVideoStore } from '@/store/videoStore';

export default function Home() {
  const { segments } = useVideoStore();

  return (
    <ErrorBoundary>
      <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 py-8">
          <header className="text-center mb-12 relative">
            <div className="absolute top-0 right-0">
              <DarkModeToggle />
            </div>
            <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-4">
              divideIt
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              Split your videos into random segments for Reels, TikTok, and YouTube Shorts
            </p>
          </header>

          <div className="max-w-6xl mx-auto">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 mb-8">
              <VideoUploader />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <section className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6">
                <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">
                  Original Video
                </h2>
                <VideoPlayer />
              </section>

              {segments.length > 0 && (
                <section
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6"
                  aria-label="Generated video segments"
                >
                  <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">
                    Generated Segments ({segments.length})
                  </h2>
                  <SegmentsList />
                </section>
              )}
            </div>
          </div>
        </div>
      </main>
    </ErrorBoundary>
  );
}
