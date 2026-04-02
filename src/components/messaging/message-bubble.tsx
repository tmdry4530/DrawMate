import Image from "next/image"
import { formatDistanceToNow } from "date-fns"
import { ko } from "date-fns/locale"

interface Message {
  id: string
  content: string
  imageUrl?: string | null
  createdAt: string
  senderId: string
}

interface MessageBubbleProps {
  message: Message
  isMine: boolean
}

export function MessageBubble({ message, isMine }: MessageBubbleProps) {
  return (
    <div className={`flex ${isMine ? "justify-end" : "justify-start"} mb-3`}>
      <div className={`max-w-[70%] flex flex-col ${isMine ? "items-end" : "items-start"}`}>
        {message.imageUrl && (
          <div className="mb-1 bg-card p-2 rounded-2xl shadow-sm border border-primary/10">
            <Image
              src={message.imageUrl}
              alt="첨부 이미지"
              width={240}
              height={180}
              className="rounded-xl object-cover"
            />
          </div>
        )}

        {message.content && (
          <div
            className={`px-5 py-3.5 rounded-2xl text-sm leading-relaxed break-words ${
              isMine
                ? "bg-primary text-white rounded-br-none shadow-md"
                : "bg-card text-foreground rounded-bl-none shadow-sm"
            }`}
          >
            {message.content}
          </div>
        )}

        <span className="text-[10px] font-bold text-muted-foreground uppercase mt-1">
          {formatDistanceToNow(new Date(message.createdAt), {
            addSuffix: true,
            locale: ko,
          })}
        </span>
      </div>
    </div>
  )
}
