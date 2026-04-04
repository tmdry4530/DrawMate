export default function MarketingLoading() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 bg-black">
      {/* 스피너 */}
      <div className="relative h-10 w-10">
        <div className="absolute inset-0 border-2 border-neutral-800" />
        <div className="absolute inset-0 border-2 border-transparent border-t-white animate-spin" />
      </div>
      <p className="text-sm text-white animate-pulse tracking-widest uppercase font-black">
        Loading...
      </p>
    </div>
  );
}
