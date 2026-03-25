"use client";

import { Suspense } from "react";
import { usePathname } from "next/navigation";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { MobileNav } from "@/components/layout/mobile-nav";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isMessagesPage = pathname.startsWith("/messages");

  return (
    <div className={isMessagesPage ? "flex flex-col h-dvh overflow-hidden" : ""}>
      <Suspense fallback={<div className="h-16 border-b bg-background" />}>
        <Header />
      </Suspense>
      <main className={isMessagesPage ? "flex-1 min-h-0 p-0 md:p-4" : "flex-1 pb-16 md:pb-0 px-4"}>
        {isMessagesPage ? (
          <div className="h-full md:mx-auto md:max-w-6xl md:rounded-xl md:border md:shadow-sm md:overflow-hidden bg-background">
            {children}
          </div>
        ) : (
          children
        )}
      </main>
      {!isMessagesPage && <Footer />}
      {!isMessagesPage && <MobileNav />}
    </div>
  );
}
