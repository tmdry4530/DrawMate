"use client"

import { useState, useRef, useCallback, type ChangeEvent, type FormEvent } from "react"
import Image from "next/image"
import { Paperclip, Send, X } from "lucide-react"
import { toast } from "sonner"
import { Textarea } from "@/components/ui/textarea"

interface MessageInputProps {
  conversationId: string
  currentUserId: string
  onMessageSent?: () => void
  onOptimisticMessage?: (msg: { id: string; content: string; senderId: string; createdAt: string }) => void
}

export function MessageInput({ conversationId, currentUserId, onMessageSent, onOptimisticMessage }: MessageInputProps) {
  const [content, setContent] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [filePreview, setFilePreview] = useState<string | null>(null)
  const [sending, setSending] = useState(false)
  const sendingRef = useRef(false)
  const composingRef = useRef(false)
  const fileRef = useRef<HTMLInputElement>(null)

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0]
    if (!selected) return
    setFile(selected)
    const url = URL.createObjectURL(selected)
    setFilePreview(url)
  }

  function removeFile() {
    setFile(null)
    if (filePreview) URL.revokeObjectURL(filePreview)
    setFilePreview(null)
    if (fileRef.current) fileRef.current.value = ""
  }

  const handleSubmit = useCallback(async (e: FormEvent) => {
    e.preventDefault()
    if (sendingRef.current) return
    if (!content.trim() && !file) return

    sendingRef.current = true
    const messageText = content.trim()
    setContent("")
    setSending(true)

    // 낙관적 업데이트: 서버 응답 전에 즉시 화면에 표시
    if (messageText && onOptimisticMessage) {
      onOptimisticMessage({
        id: `optimistic-${Date.now()}`,
        content: messageText,
        senderId: currentUserId,
        createdAt: new Date().toISOString(),
      })
    }

    try {
      let res: Response
      if (file) {
        const formData = new FormData()
        formData.append("content", messageText)
        formData.append("image", file)
        res = await fetch(`/api/v1/conversations/${conversationId}/messages`, {
          method: "POST",
          body: formData,
        })
      } else {
        res = await fetch(`/api/v1/conversations/${conversationId}/messages`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ body: messageText }),
        })
      }

      if (!res.ok) {
        const payload = await res.json().catch(() => null)
        throw new Error(payload?.error?.message ?? "메시지 전송 실패")
      }

      removeFile()
      onMessageSent?.()
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      sendingRef.current = false
      setSending(false)
    }
  }, [content, file, conversationId, currentUserId, onMessageSent, onOptimisticMessage])

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey && !composingRef.current) {
      e.preventDefault()
      handleSubmit(e as unknown as FormEvent)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="p-6 bg-white/30 backdrop-blur-sm">
      {filePreview && (
        <div className="relative inline-block mb-3">
          <Image
            src={filePreview}
            alt="첨부 미리보기"
            width={120}
            height={80}
            unoptimized
            className="h-20 w-auto rounded-lg object-cover border"
          />
          <button
            type="button"
            onClick={removeFile}
            aria-label="첨부 이미지 제거"
            className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-0.5"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      )}

      <div className="flex items-end gap-3 bg-card p-3 rounded-3xl shadow-lg border border-primary/5">
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
        <button
          type="button"
          aria-label="이미지 첨부"
          className="shrink-0 w-9 h-9 flex items-center justify-center rounded-full text-muted-foreground hover:bg-muted transition-colors"
          onClick={() => fileRef.current?.click()}
        >
          <Paperclip className="h-4 w-4" />
        </button>

        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          onCompositionStart={() => { composingRef.current = true }}
          onCompositionEnd={() => { composingRef.current = false }}
          placeholder="메시지를 입력하세요..."
          className="border-none focus:ring-0 bg-transparent py-2 resize-none min-h-[40px] max-h-[120px] shadow-none"
          rows={1}
        />

        <button
          type="submit"
          aria-label="메시지 전송"
          disabled={sending || (!content.trim() && !file)}
          className="shrink-0 w-10 h-10 flex items-center justify-center bg-primary text-white rounded-full hover:scale-110 active:scale-95 transition-all shadow-md shadow-primary/20 disabled:opacity-50 disabled:pointer-events-none"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </form>
  )
}
