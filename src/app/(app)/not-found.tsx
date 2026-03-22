import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function AppNotFound() {
  return (
    <div className="mx-auto flex min-h-[40vh] max-w-xl flex-col items-center justify-center gap-3 px-4 text-center">
      <h2 className="text-lg font-semibold">페이지를 찾을 수 없습니다.</h2>
      <p className="text-sm text-muted-foreground">요청한 주소가 없거나 이동되었습니다.</p>
      <Button asChild>
        <Link href="/">홈으로 이동</Link>
      </Button>
    </div>
  );
}
