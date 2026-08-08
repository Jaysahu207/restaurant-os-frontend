// components/reports/ReportsSkeleton.tsx

export function ReportsSkeleton() {
  return (
    <div className="space-y-6 p-6 md:p-10 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-8 w-56 bg-gray-200 rounded-lg" />
        <div className="h-10 w-72 bg-gray-200 rounded-lg" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-24 bg-gray-100 rounded-2xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-80 bg-gray-100 rounded-2xl" />
        <div className="h-80 bg-gray-100 rounded-2xl" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-72 bg-gray-100 rounded-2xl" />
        <div className="h-72 bg-gray-100 rounded-2xl" />
      </div>
    </div>
  );
}
