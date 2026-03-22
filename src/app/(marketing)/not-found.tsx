import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function MarketingNotFound() {
  return (
    <div className="mx-auto flex min-h-[40vh] max-w-xl flex-col items-center justify-center gap-3 px-4 text-center">
      <h2 className="text-lg font-semibold">요청한 페이지가 없습니다.</h2>
      <p className="text-sm text-muted-foreground">다른 페이지로 이동해 주세요.</p>
      <Button asChild>
        <Link href="/">홈으로 이동</Link>
      </Button>
    </div>
  );
}
