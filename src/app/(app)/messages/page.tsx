import { ConversationList } from "@/components/messaging/conversation-list"

export default function MessagesPage() {
  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Left: conversation list */}
      <aside className="w-full md:w-80 md:border-r shrink-0 flex flex-col">
        <div className="px-4 py-3 border-b">
          <h1 className="text-lg font-semibold">메시지</h1>
        </div>
        <ConversationList />
      </aside>

      {/* Right: empty state on desktop */}
      <main className="hidden md:flex flex-1 items-center justify-center text-muted-foreground">
        <p className="text-sm">대화를 선택하세요</p>
      </main>
    </div>
  )
}
