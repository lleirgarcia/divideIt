'use client';

import Link from 'next/link';
import { AttentionLoop } from '@/components/AttentionLoop';

/**
 * Demo page: shows only the attention-loop animation so you can see it in action.
 * The progress bar fills to ~96%, holds, then resets — never completes (keeps viewers watching).
 */
export default function AttentionLoopDemoPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex flex-col items-center justify-center p-8">
      <div className="w-full max-w-md">
        <Link
          href="/"
          className="text-sm text-gray-500 dark:text-gray-400 hover:underline mb-6 inline-block"
        >
          ← Back to divideIt
        </Link>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6">
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Attention-loop animation
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            Bar almost reaches the end, then resets. Nothing happens — keeps you watching.
          </p>
          <div className="aspect-video bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center text-gray-400 dark:text-gray-500 text-sm">
            (Video placeholder)
          </div>
          <AttentionLoop />
        </div>
      </div>
    </main>
  );
}
