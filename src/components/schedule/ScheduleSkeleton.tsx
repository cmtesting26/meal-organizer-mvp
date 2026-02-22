/**
 * ScheduleSkeleton Component (Sprint 6)
 *
 * Skeleton loading placeholder for the weekly schedule view.
 * Shows animated placeholders while IndexedDB data loads.
 */

export function ScheduleSkeleton() {
  return (
    <div className="animate-pulse space-y-4" role="status" aria-label="Loading schedule">
      {/* Week navigation skeleton */}
      <div className="flex items-center justify-between mb-4">
        <div className="h-8 w-8 bg-gray-200 rounded" />
        <div className="h-5 bg-gray-200 rounded w-40" />
        <div className="h-8 w-8 bg-gray-200 rounded" />
      </div>

      {/* Day cards skeleton */}
      {Array.from({ length: 7 }).map((_, i) => (
        <div key={i} className="border rounded-lg p-3 bg-white">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-4 bg-gray-200 rounded w-24" />
            <div className="h-3 bg-gray-200 rounded w-16" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="h-12 bg-gray-100 rounded" />
            <div className="h-12 bg-gray-100 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}
