'use client';

/**
 * Attention-loop animation: builds anticipation as if something is about to happen,
 * then resets without payoff — keeps viewers watching.
 * Renders below the main video (e.g. in review segment cards).
 */
export function AttentionLoop() {
  return (
    <div
      className="mt-3 rounded-full overflow-hidden bg-gray-200/80 dark:bg-gray-600/50 h-1.5"
      role="presentation"
      aria-hidden="true"
    >
      <div
        className="h-full w-0 rounded-full bg-primary-500/90 dark:bg-primary-400/80 max-w-full motion-safe:animate-attention-progress"
      />
      <p
        className="mt-1.5 text-center text-[10px] text-gray-500 dark:text-gray-400 motion-safe:animate-attention-dots tabular-nums"
        aria-hidden="true"
      >
        …
      </p>
    </div>
  );
}
