import clsx from 'clsx';

export interface LoadingSkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
  lines?: number;
}

export function LoadingSkeleton({
  className,
  variant = 'rectangular',
  width,
  height,
  lines = 1,
}: LoadingSkeletonProps) {
  const baseStyles = 'animate-pulse bg-gray-200 dark:bg-gray-700 rounded';

  if (variant === 'text' && lines > 1) {
    return (
      <div className={clsx('space-y-2', className)}>
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={clsx(
              baseStyles,
              i === lines - 1 ? 'w-3/4' : 'w-full',
              height || 'h-4'
            )}
          />
        ))}
      </div>
    );
  }

  const styles = {
    text: 'h-4',
    circular: 'rounded-full',
    rectangular: '',
  };

  return (
    <div
      className={clsx(baseStyles, styles[variant], className)}
      style={{
        width: width || (variant === 'circular' ? height || '40px' : '100%'),
        height: height || (variant === 'circular' ? width || '40px' : '20px'),
      }}
      aria-busy="true"
      aria-label="Loading"
    />
  );
}
