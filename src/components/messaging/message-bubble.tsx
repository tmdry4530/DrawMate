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
          <div className="mb-1 rounded-lg overflow-hidden">
            <Image
              src={message.imageUrl}
              alt="첨부 이미지"
              width={240}
              height={180}
              className="object-cover"
            />
          </div>
        )}

        {message.content && (
          <div
            className={`px-3 py-2 rounded-2xl text-sm leading-relaxed break-words ${
              isMine
                ? "bg-blue-500 text-white rounded-br-sm"
                : "bg-muted text-foreground rounded-bl-sm"
            }`}
          >
            {message.content}
          </div>
        )}

        <span className="text-xs text-muted-foreground mt-1">
          {formatDistanceToNow(new Date(message.createdAt), {
            addSuffix: true,
            locale: ko,
          })}
        </span>
      </div>
    </div>
  )
}
