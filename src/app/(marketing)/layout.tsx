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
      <Suspense fallback={<div className="h-20 border-b bg-background" />}>
        <Header />
      </Suspense>
      <main className="flex-1 pt-20 pb-16 md:pb-0">
        <div className="animate-fade-in">{children}</div>
      </main>
      <Footer />
      <MobileNav />
    </div>
  );
}
