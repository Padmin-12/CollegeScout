export default function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-md border border-gray-200 animate-pulse">
      {/* Header skeleton */}
      <div className="bg-gradient-to-r from-gray-200 to-gray-300 p-6 h-24" />

      {/* Content skeleton */}
      <div className="p-6 space-y-4">
        <div className="flex justify-between items-center">
          <div className="h-4 bg-gray-200 rounded w-1/3" />
          <div className="h-6 bg-gray-200 rounded-full w-16" />
        </div>
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded w-1/2" />
          <div className="h-4 bg-gray-200 rounded w-2/3" />
        </div>
        <div className="flex gap-3 pt-2">
          <div className="h-9 bg-gray-200 rounded-lg w-28" />
          <div className="h-9 bg-gray-200 rounded-lg w-24" />
          <div className="h-9 bg-gray-200 rounded-lg w-16" />
        </div>
      </div>
    </div>
  );
}
