export default function MarketingLoading() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
      {/* 스피너 */}
      <div className="relative h-10 w-10">
        <div className="absolute inset-0 rounded-full border-2 border-border" />
        <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-primary animate-spin" />
      </div>
      <p className="text-sm text-muted-foreground animate-pulse-soft tracking-wide">
        Loading...
      </p>
    </div>
  );
}
