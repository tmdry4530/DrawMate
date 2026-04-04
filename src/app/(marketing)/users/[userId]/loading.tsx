export default function UserProfileLoading() {
  return (
    <div className="pb-20 px-6 max-w-screen-2xl mx-auto bg-black min-h-screen">
      {/* Header */}
      <header className="flex flex-col md:flex-row items-center md:items-start gap-12 mb-20 pt-8">
        {/* Avatar */}
        <div className="relative">
          <div className="w-48 h-48 bg-neutral-900 animate-pulse" />
        </div>
        {/* Info */}
        <div className="flex-1 text-center md:text-left space-y-4">
          <div className="h-12 w-64 mx-auto md:mx-0 bg-neutral-900 animate-pulse" />
          <div className="h-4 w-40 mx-auto md:mx-0 bg-neutral-900 animate-pulse" />
          <div className="h-5 w-full max-w-lg mx-auto md:mx-0 bg-neutral-900 animate-pulse" />
          <div className="h-5 w-3/4 max-w-md mx-auto md:mx-0 bg-neutral-900 animate-pulse" />
          <div className="flex flex-wrap justify-center md:justify-start gap-4 pt-4">
            <div className="h-10 w-32 bg-neutral-900 animate-pulse" />
            <div className="h-10 w-32 bg-neutral-900 animate-pulse" />
          </div>
        </div>
      </header>

      {/* Featured */}
      <section className="mb-20">
        <div className="h-8 w-48 mb-8 bg-neutral-900 animate-pulse" />
        <div className="w-full h-[400px] bg-neutral-900 animate-pulse" />
      </section>

      {/* Gallery grid */}
      <section>
        <div className="flex gap-8 mb-12">
          <div className="h-10 w-24 bg-neutral-900 animate-pulse" />
          <div className="h-10 w-24 bg-neutral-900 animate-pulse" />
          <div className="h-10 w-24 bg-neutral-900 animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="aspect-square w-full bg-neutral-900 animate-pulse" />
          ))}
        </div>
      </section>
    </div>
  )
}
