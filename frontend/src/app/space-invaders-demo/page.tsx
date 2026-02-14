'use client';

import Link from 'next/link';

/**
 * Demo: space-invaders overlay video (nave vs marcianos, never wins).
 * This same video can be added to any segment via POST /api/videos/add-game-overlay/:filename
 */
export default function SpaceInvadersDemoPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex flex-col items-center justify-center p-8">
      <div className="w-full max-w-lg">
        <Link
          href="/"
          className="text-sm text-gray-500 dark:text-gray-400 hover:underline mb-6 inline-block"
        >
          ← Back to divideIt
        </Link>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6">
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
            Nave vs marcianos (overlay)
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Add this to any clip. The ship never finishes all aliens — keeps people watching.
          </p>
          <div className="rounded-lg overflow-hidden bg-black">
            <video
              src="/space_invaders_loop.mp4"
              controls
              loop
              autoPlay
              muted
              playsInline
              className="w-full aspect-video object-contain"
              aria-label="Space invaders loop preview"
            />
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
            To add to a segment: POST /api/videos/add-game-overlay/:filename (see backend/docs/SPACE_INVADERS_OVERLAY.md)
          </p>
        </div>
      </div>
    </main>
  );
}
