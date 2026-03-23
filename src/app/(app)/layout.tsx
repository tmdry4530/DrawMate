import { Suspense } from "react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { MobileNav } from "@/components/layout/mobile-nav";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Suspense fallback={<div className="h-16 border-b bg-background" />}>
        <Header />
      </Suspense>
      <main className="flex-1 pb-16 md:pb-0 px-4">{children}</main>
      <Footer />
      <MobileNav />
    </>
  );
}
