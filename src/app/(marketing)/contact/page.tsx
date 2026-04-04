import Link from "next/link";

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-3xl py-10">
      <div className="border border-neutral-800 bg-[#131313] p-6 md:p-8">
        <p className="text-xs font-black uppercase tracking-widest text-neutral-400">문의</p>
        <h1 className="mt-2 text-3xl font-black uppercase tracking-tighter text-white">DrawMate 문의 안내</h1>
        <p className="mt-3 text-sm leading-6 text-neutral-400">
          현재 DrawMate는 포트폴리오와 메시지 중심의 협업 문의 흐름을 우선 제공하고 있습니다.
          운영 문의 채널은 정식 오픈 전 별도 고지되어야 하며, 이 페이지는 그 전까지의 기본 안내 역할을 합니다.
        </p>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <section className="bg-[#1b1b1b] border border-neutral-800 p-5">
            <h2 className="text-lg font-black uppercase tracking-tighter text-white">협업 문의</h2>
            <p className="mt-2 text-sm leading-6 text-neutral-400">
              포트폴리오 상세에서 메시지를 보내면 바로 1:1 대화방이 열립니다.
            </p>
            <Link
              href="/explore"
              className="mt-4 inline-block bg-white text-black text-xs font-black uppercase tracking-widest px-4 py-2 hover:bg-neutral-200 transition-colors"
            >
              포트폴리오 탐색
            </Link>
          </section>

          <section className="bg-[#1b1b1b] border border-neutral-800 p-5">
            <h2 className="text-lg font-black uppercase tracking-tighter text-white">내 작업 등록</h2>
            <p className="mt-2 text-sm leading-6 text-neutral-400">
              협업 요청을 받고 싶다면 포트폴리오를 등록해 작업 범위와 스타일을 먼저 보여주세요.
            </p>
            <Link
              href="/studio/portfolios/new"
              className="mt-4 inline-block border border-neutral-600 text-white text-xs font-black uppercase tracking-widest px-4 py-2 hover:border-white transition-colors"
            >
              포트폴리오 등록
            </Link>
          </section>
        </div>
      </div>
    </div>
  );
}
