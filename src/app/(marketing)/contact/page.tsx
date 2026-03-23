import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-3xl py-10">
      <div className="rounded-2xl border bg-card p-6 md:p-8">
        <p className="text-sm font-semibold text-primary">문의</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">DrawMate 문의 안내</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          현재 DrawMate는 포트폴리오와 메시지 중심의 협업 문의 흐름을 우선 제공하고 있습니다.
          운영 문의 채널은 정식 오픈 전 별도 고지되어야 하며, 이 페이지는 그 전까지의 기본 안내 역할을 합니다.
        </p>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <section className="rounded-2xl bg-muted/40 p-5">
            <h2 className="text-lg font-semibold">협업 문의</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              포트폴리오 상세에서 메시지를 보내면 바로 1:1 대화방이 열립니다.
            </p>
            <Button asChild className="mt-4">
              <Link href="/explore">포트폴리오 탐색</Link>
            </Button>
          </section>

          <section className="rounded-2xl bg-muted/40 p-5">
            <h2 className="text-lg font-semibold">내 작업 등록</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              협업 요청을 받고 싶다면 포트폴리오를 등록해 작업 범위와 스타일을 먼저 보여주세요.
            </p>
            <Button asChild variant="outline" className="mt-4">
              <Link href="/studio/portfolios/new">포트폴리오 등록</Link>
            </Button>
          </section>
        </div>
      </div>
    </div>
  );
}
