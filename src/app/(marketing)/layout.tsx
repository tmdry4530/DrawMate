import { Suspense } from "react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { MobileNav } from "@/components/layout/mobile-nav";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative overflow-hidden grain-overlay">
      <Suspense
        fallback={
          <div className="h-16 border-b bg-background relative overflow-hidden">
            <div className="absolute bottom-0 left-0 right-0 h-0.5 animate-shimmer bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
          </div>
        }
      >
        <Header />
      </Suspense>
      <main className="flex-1 pb-16 md:pb-0 px-4">
        <div className="animate-fade-in">{children}</div>
      </main>
      <Footer />
      <MobileNav />
    </div>
  );
}
