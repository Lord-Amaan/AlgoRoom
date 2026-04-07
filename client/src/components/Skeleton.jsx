/**
 * Skeleton Loading Component
 * Displays placeholder animations while content loads
 */

export function SkeletonCard() {
  return (
    <div className="bg-dark-800 p-6 rounded-lg border border-dark-700 space-y-4 animate-pulse">
      <div className="h-4 bg-dark-700 rounded w-3/4"></div>
      <div className="h-3 bg-dark-700 rounded w-1/2"></div>
      <div className="space-y-2">
        <div className="h-3 bg-dark-700 rounded"></div>
        <div className="h-3 bg-dark-700 rounded w-5/6"></div>
      </div>
    </div>
  );
}

export function SkeletonStats() {
  return (
    <div className="grid grid-cols-3 gap-4 mb-8">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-white rounded-xl p-4 shadow-sm border animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonStrategyList() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="bg-white rounded-lg p-4 flex items-center justify-between border animate-pulse"
        >
          <div className="flex-1">
            <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-1/4"></div>
          </div>
          <div className="space-x-2 flex">
            <div className="h-8 bg-gray-200 rounded w-16"></div>
            <div className="h-8 bg-gray-200 rounded w-16"></div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonBacktestResults() {
  return (
    <div className="space-y-6">
      {/* Results Cards */}
      <div className="grid grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-dark-800 p-4 rounded-lg border border-dark-700 animate-pulse"
          >
            <div className="h-3 bg-dark-700 rounded w-2/3 mb-2"></div>
            <div className="h-6 bg-dark-700 rounded w-1/2"></div>
          </div>
        ))}
      </div>

      {/* Chart Skeleton */}
      <div className="bg-dark-800 p-6 rounded-xl border border-dark-700 animate-pulse">
        <div className="h-4 bg-dark-700 rounded w-1/4 mb-4"></div>
        <div className="h-64 bg-dark-700 rounded"></div>
      </div>

      {/* Trades Table Skeleton */}
      <div className="bg-dark-800 p-6 rounded-xl border border-dark-700 animate-pulse">
        <div className="h-4 bg-dark-700 rounded w-1/4 mb-4"></div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 bg-dark-700 rounded"></div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function SkeletonLegForm() {
  return (
    <div className="bg-dark-800 p-4 rounded-lg border border-dark-700 space-y-3 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-4 bg-dark-700 rounded w-1/4"></div>
        <div className="h-6 bg-dark-700 rounded w-12"></div>
      </div>

      {/* Qty, Position, Option Type */}
      <div className="grid grid-cols-3 gap-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="space-y-1">
            <div className="h-3 bg-dark-700 rounded w-full mb-1"></div>
            <div className="h-8 bg-dark-700 rounded"></div>
          </div>
        ))}
      </div>

      {/* Expiry, Strike Type, Active */}
      <div className="grid grid-cols-3 gap-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="space-y-1">
            <div className="h-3 bg-dark-700 rounded w-full mb-1"></div>
            <div className="h-8 bg-dark-700 rounded"></div>
          </div>
        ))}
      </div>

      {/* SL Config */}
      <div className="grid grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="space-y-1">
            <div className="h-3 bg-dark-700 rounded w-full mb-1"></div>
            <div className="h-8 bg-dark-700 rounded"></div>
          </div>
        ))}
      </div>

      {/* TP Config */}
      <div className="grid grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="space-y-1">
            <div className="h-3 bg-dark-700 rounded w-full mb-1"></div>
            <div className="h-8 bg-dark-700 rounded"></div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SkeletonBacktestForm() {
  return (
    <div className="bg-dark-800 p-6 rounded-xl border border-dark-700 space-y-4 animate-pulse">
      <div className="h-5 bg-dark-700 rounded w-1/4 mb-4"></div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="space-y-2">
            <div className="h-3 bg-dark-700 rounded w-1/2"></div>
            <div className="h-10 bg-dark-700 rounded"></div>
          </div>
        ))}
      </div>

      <div className="h-10 bg-dark-700 rounded w-full"></div>
    </div>
  );
}
