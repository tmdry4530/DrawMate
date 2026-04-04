import Link from "next/link"
import { ConversationList } from "@/components/messaging/conversation-list"
import { MessageSquare } from "lucide-react"

export default function MessagesPage() {
  return (
    <div className="flex h-full bg-black">
      {/* Conversation List Pane */}
      <section className="w-full md:w-80 lg:w-96 shrink-0 bg-[#131313] flex flex-col h-full border-r border-white/10">
        <div className="px-5 py-5 border-b border-white/10">
          <h1 className="font-mono text-xs font-bold tracking-[0.2em] uppercase text-white">메시지</h1>
        </div>
        <div className="flex-1 overflow-y-auto chat-scrollbar">
          <ConversationList />
        </div>
      </section>

      {/* Empty state chat pane */}
      <main className="hidden md:flex flex-1 flex-col bg-black items-center justify-center px-6">
        <div className="max-w-sm space-y-6 text-center">
          <div className="mx-auto w-14 h-14 bg-[#1f1f1f] border border-white/20 flex items-center justify-center">
            <MessageSquare className="h-6 w-6 text-white/40" />
          </div>
          <div className="space-y-2">
            <h2 className="font-mono text-sm font-bold tracking-[0.15em] uppercase text-white">대화를 선택하세요</h2>
            <p className="font-mono text-xs leading-6 text-white/40">
              포트폴리오 상세에서 메시지를 보내면<br />이곳에서 바로 대화를 이어갈 수 있습니다.
            </p>
          </div>
          <Link
            href="/explore"
            className="inline-flex items-center gap-2 px-6 py-3 bg-white text-black font-mono text-xs font-bold tracking-[0.15em] uppercase hover:bg-white/90 transition-colors"
          >
            포트폴리오 탐색
          </Link>
        </div>
      </main>
    </div>
  )
}
