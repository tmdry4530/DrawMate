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
          <div className="mb-1 bg-[#1f1f1f] p-2 rounded-none border border-neutral-800">
            <Image
              src={message.imageUrl}
              alt="첨부 이미지"
              width={240}
              height={180}
              className="rounded-none object-cover"
            />
          </div>
        )}

        {message.content && (
          <div
            className={`px-5 py-3.5 rounded-none text-sm leading-relaxed break-words ${
              isMine
                ? "bg-[#353535] text-white"
                : "bg-[#1f1f1f] text-foreground"
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
