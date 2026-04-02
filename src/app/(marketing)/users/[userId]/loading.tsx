import { Skeleton } from "@/components/ui/skeleton"

export default function UserProfileLoading() {
  return (
    <div className="pb-20 px-6 max-w-screen-2xl mx-auto">
      {/* Header */}
      <header className="flex flex-col md:flex-row items-center md:items-start gap-12 mb-20 pt-8">
        {/* Avatar */}
        <div className="relative">
          <Skeleton className="w-48 h-48 rounded-full" />
        </div>
        {/* Info */}
        <div className="flex-1 text-center md:text-left space-y-4">
          <Skeleton className="h-12 w-64 mx-auto md:mx-0" />
          <Skeleton className="h-4 w-40 mx-auto md:mx-0" />
          <Skeleton className="h-5 w-full max-w-lg mx-auto md:mx-0" />
          <Skeleton className="h-5 w-3/4 max-w-md mx-auto md:mx-0" />
          <div className="flex flex-wrap justify-center md:justify-start gap-4 pt-4">
            <Skeleton className="h-10 w-32 rounded-full" />
            <Skeleton className="h-10 w-32 rounded-full" />
          </div>
        </div>
      </header>

      {/* Featured */}
      <section className="mb-20">
        <Skeleton className="h-8 w-48 mb-8" />
        <Skeleton className="w-full h-[400px] rounded-xl" />
      </section>

      {/* Gallery grid */}
      <section>
        <div className="flex gap-8 mb-12">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-24" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square w-full rounded-xl" />
          ))}
        </div>
      </section>
    </div>
  )
}
