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
  const isEditorPage = pathname.includes("/edit");

  return (
    <div className={isMessagesPage ? "flex flex-col h-dvh overflow-hidden" : ""}>
      <Suspense fallback={<div className="h-20 border-b bg-black" />}>
        <Header />
      </Suspense>
      <main className={isMessagesPage ? "flex-1 min-h-0 pt-20" : "flex-1 pt-20 pb-16 md:pb-0"}>
        {isMessagesPage ? (
          <div className="h-full bg-black">
            {children}
          </div>
        ) : (
          children
        )}
      </main>
      {!isMessagesPage && !isEditorPage && <Footer />}
      {!isMessagesPage && !isEditorPage && <MobileNav />}
    </div>
  );
}
