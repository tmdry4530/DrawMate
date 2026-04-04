import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "DrawMate | 아직 오픈전",
  description: "DrawMate는 현재 서비스 오픈을 준비하고 있습니다.",
  openGraph: {
    title: "DrawMate | 아직 오픈전",
    description: "DrawMate는 현재 서비스 오픈을 준비하고 있습니다.",
    images: [
      {
        url: "/meta/homepage-og.png",
        width: 1200,
        height: 630,
        alt: "DrawMate 메인페이지 썸네일",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "DrawMate | 아직 오픈전",
    description: "DrawMate는 현재 서비스 오픈을 준비하고 있습니다.",
    images: ["/meta/homepage-og.png"],
  },
};

export default function HomePage() {
  return (
    <main className="flex min-h-svh items-center justify-center bg-black px-6 text-white">
      <div className="flex max-w-2xl flex-col items-center text-center">
        <p className="mb-4 text-xs font-black uppercase tracking-[0.35em] text-white/50">
          Pre Open
        </p>
        <h1 className="text-5xl font-black uppercase tracking-tighter md:text-7xl">
          아직 오픈전.
        </h1>
        <p className="mt-6 text-sm text-white/60 md:text-base">
          DrawMate는 현재 서비스 오픈을 준비 중입니다. 정식 오픈 전까지 메인 브랜치는 접근이
          제한됩니다.
        </p>
      </div>
    </main>
  );
}
