import Link from "next/link"
import { ConversationList } from "@/components/messaging/conversation-list"
import { Button } from "@/components/ui/button"

export default function MessagesPage() {
  return (
    <div className="flex h-full">
      {/* Left: conversation list */}
      <aside className="w-full md:w-80 md:border-r shrink-0 flex flex-col">
        <div className="px-4 py-3 border-b">
          <h1 className="text-lg font-semibold">메시지</h1>
        </div>
        <ConversationList />
      </aside>

      {/* Right: empty state on desktop */}
      <main className="hidden md:flex flex-1 items-center justify-center px-6">
        <div className="max-w-sm space-y-3 text-center">
          <h2 className="text-xl font-semibold">대화를 선택하세요</h2>
          <p className="text-sm leading-6 text-muted-foreground">
            포트폴리오 상세에서 메시지를 보내면 이곳에서 바로 대화를 이어갈 수 있습니다.
          </p>
          <Button asChild variant="outline">
            <Link href="/explore">포트폴리오 탐색</Link>
          </Button>
        </div>
      </main>
    </div>
  )
}
