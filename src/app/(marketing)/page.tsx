import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "DrawMate | Opening Soon",
  description: "DrawMate는 지금, 가장 좋은 첫 장면을 준비하고 있습니다.",
  openGraph: {
    title: "DrawMate | Opening Soon",
    description: "DrawMate는 지금, 가장 좋은 첫 장면을 준비하고 있습니다.",
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
    title: "DrawMate | Opening Soon",
    description: "DrawMate는 지금, 가장 좋은 첫 장면을 준비하고 있습니다.",
    images: ["/meta/homepage-og.png"],
  },
};

export default function HomePage() {
  return (
    <main className="flex min-h-svh items-center justify-center bg-black px-6 text-white">
      <div className="flex max-w-2xl flex-col items-center text-center">
        <p className="mb-4 text-xs font-black uppercase tracking-[0.35em] text-white/50">
          Opening Soon
        </p>
        <h1 className="text-5xl font-black uppercase tracking-tighter md:text-7xl">
          The Canvas Opens Soon.
        </h1>
        <p className="mt-6 text-sm text-white/60 md:text-base">
          DrawMate는 지금, 창작자와 협업자를 잇는 가장 강렬한 첫 장면을 준비하고 있습니다.
          정식 오픈까지 조금만 기다려주세요.
        </p>
      </div>
    </main>
  );
}
