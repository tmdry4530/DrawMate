import Link from "next/link"
import { ConversationList } from "@/components/messaging/conversation-list"
import { MessageSquare } from "lucide-react"

export default function MessagesPage() {
  return (
    <div className="flex h-full">
      {/* Conversation List Pane */}
      <section className="w-full md:w-80 lg:w-96 shrink-0 bg-background flex flex-col h-full">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="font-headline text-2xl font-extrabold tracking-tight">메시지</h1>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto chat-scrollbar px-3 pb-6">
          <ConversationList />
        </div>
      </section>

      {/* Empty state chat pane */}
      <main className="hidden md:flex flex-1 flex-col bg-muted/50 items-center justify-center px-6">
        <div className="max-w-sm space-y-4 text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <MessageSquare className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-xl font-bold font-headline">대화를 선택하세요</h2>
          <p className="text-sm leading-6 text-muted-foreground">
            포트폴리오 상세에서 메시지를 보내면 이곳에서 바로 대화를 이어갈 수 있습니다.
          </p>
          <Link
            href="/explore"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-muted text-foreground font-medium text-sm hover:bg-muted/80 transition-colors"
          >
            포트폴리오 탐색
          </Link>
        </div>
      </main>
    </div>
  )
}
