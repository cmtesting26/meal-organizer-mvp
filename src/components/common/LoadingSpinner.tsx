/**
 * LoadingSpinner Component
 * Reusable loading indicator for async operations
 * 
 * Usage:
 * - Inline loading states
 * - Full-page loading overlays
 * - Button loading states
 */

import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Optional message to display */
  message?: string;
  /** Full screen overlay */
  fullScreen?: boolean;
  /** Custom className */
  className?: string;
}

export function LoadingSpinner({ 
  size = 'md', 
  message, 
  fullScreen = false,
  className 
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  const spinner = (
    <div className={cn('flex flex-col items-center justify-center', className)}>
      <Loader2 
        className={cn('animate-spin', sizeClasses[size])} 
        style={{ color: 'var(--fs-accent, #D97706)' }}
        aria-label="Loading"
      />
      {message && (
        <p className="mt-4 text-sm" style={{ color: 'var(--fs-text-muted, #78716C)' }}>{message}</p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50">
        {spinner}
      </div>
    );
  }

  return spinner;
}

/**
 * SkeletonLoader Component
 * Skeleton loading placeholders for content
 */

interface SkeletonLoaderProps {
  /** Number of skeleton cards to show */
  count?: number;
  /** Type of skeleton */
  type?: 'card' | 'list' | 'text';
  /** Custom className */
  className?: string;
}

export function SkeletonLoader({ 
  count = 3, 
  type = 'card',
  className 
}: SkeletonLoaderProps) {
  if (type === 'card') {
    return (
      <div className={cn('grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6', className)}>
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="bg-gray-200 h-48 rounded-t-lg" />
            <div className="p-4 space-y-3">
              <div className="h-4 bg-gray-200 rounded w-3/4" />
              <div className="h-3 bg-gray-200 rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (type === 'list') {
    return (
      <div className={cn('space-y-4', className)}>
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="animate-pulse flex items-center space-x-4">
            <div className="h-12 w-12 bg-gray-200 rounded" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-3/4" />
              <div className="h-3 bg-gray-200 rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Text skeleton
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-full" />
        </div>
      ))}
    </div>
  );
}
