"use client"

import { useState, useRef, type ChangeEvent, type FormEvent } from "react"
import Image from "next/image"
import { Paperclip, Send, X } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

interface MessageInputProps {
  conversationId: string
  onMessageSent?: () => void
}

export function MessageInput({ conversationId, onMessageSent }: MessageInputProps) {
  const [content, setContent] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [filePreview, setFilePreview] = useState<string | null>(null)
  const [sending, setSending] = useState(false)
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

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!content.trim() && !file) return

    setSending(true)
    try {
      const formData = new FormData()
      formData.append("content", content.trim())
      if (file) formData.append("image", file)

      const res = await fetch(`/api/v1/conversations/${conversationId}/messages`, {
        method: "POST",
        body: formData,
      })

      if (!res.ok) {
        const payload = await res.json().catch(() => null)
        throw new Error(payload?.error?.message ?? "메시지 전송 실패")
      }

      setContent("")
      removeFile()
      onMessageSent?.()
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setSending(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e as unknown as FormEvent)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="border-t p-3 space-y-2 bg-background">
      {filePreview && (
        <div className="relative inline-block">
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

      <div className="flex items-end gap-2">
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="이미지 첨부"
          className="shrink-0"
          onClick={() => fileRef.current?.click()}
        >
          <Paperclip className="h-4 w-4" />
        </Button>

        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="메시지를 입력하세요..."
          className="resize-none min-h-[44px] max-h-[120px]"
          rows={1}
        />

        <Button
          type="submit"
          size="icon"
          aria-label="메시지 전송"
          className="shrink-0"
          disabled={sending || (!content.trim() && !file)}
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </form>
  )
}
