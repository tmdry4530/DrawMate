import { Skeleton } from "@/components/ui/skeleton"

export default function UserProfileLoading() {
  return (
    <div className="min-h-screen">
      {/* Cover area */}
      <div className="h-48 bg-gradient-to-r from-violet-500 to-indigo-500" />

      <div className="container max-w-4xl px-4">
        {/* Avatar + info */}
        <div className="-mt-16 flex items-end gap-4 pb-6">
          <Skeleton className="h-32 w-32 rounded-full border-4 border-background" />
          <div className="mb-2 flex-1 space-y-2">
            <Skeleton className="h-8 w-40" />
            <Skeleton className="h-4 w-60" />
          </div>
        </div>

        {/* Stats */}
        <div className="flex gap-4 mb-6">
          <Skeleton className="h-5 w-20" />
        </div>

        {/* Portfolio grid skeleton */}
        <Skeleton className="h-9 w-24 mb-4" />
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 py-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="aspect-video w-full rounded-lg" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
