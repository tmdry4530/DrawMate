"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Bell } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { NotificationItem } from "@/components/notifications/notification-item"
import { unwrapApiData } from "@/lib/utils/client-api"

interface Notification {
  id: string
  type: "message_received" | "message_replied" | "bookmark_added" | "system_notice"
  title: string
  body: string
  isRead: boolean
  createdAt: string
}

async function fetchNotifications(): Promise<Notification[]> {
  const res = await fetch("/api/v1/notifications")
  if (!res.ok) throw new Error("알림을 불러오는데 실패했습니다")
  const json = await res.json()
  const data = unwrapApiData<{
    items: Array<{
      id: string
      type: Notification["type"]
      title: string
      body: string
      readAt: string | null
      createdAt: string
    }>
  }>(json)

  return (data?.items ?? []).map((item) => ({
    id: item.id,
    type: item.type,
    title: item.title,
    body: item.body,
    isRead: !!item.readAt,
    createdAt: item.createdAt,
  }))
}

async function markAllRead(): Promise<void> {
  const res = await fetch("/api/v1/notifications/read-all", { method: "POST" })
  if (!res.ok) throw new Error("알림 읽음 처리 실패")
}

async function markOneRead(notificationId: string): Promise<void> {
  const res = await fetch(`/api/v1/notifications/${notificationId}/read`, {
    method: "PATCH",
  })
  if (!res.ok) throw new Error("알림 읽음 처리 실패")
}

export default function NotificationsPage() {
  const queryClient = useQueryClient()

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: fetchNotifications,
  })

  const mutation = useMutation({
    mutationFn: markAllRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] })
    },
    onError: (err) => {
      toast.error((err as Error).message)
    },
  })

  const markOneMutation = useMutation({
    mutationFn: markOneRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] })
    },
    onError: (err) => {
      toast.error((err as Error).message)
    },
  })

  const hasUnread = notifications.some((n) => !n.isRead)

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold">알림</h1>
        {hasUnread && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
          >
            모두 읽음
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground text-sm">
          불러오는 중...
        </div>
      ) : notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
          <Bell className="h-10 w-10" />
          <p className="text-sm">알림이 없습니다</p>
        </div>
      ) : (
        <ScrollArea className="rounded-lg border">
          {notifications.map((n) => (
            <NotificationItem
              key={n.id}
              notification={n}
              onMarkAsRead={(notificationId) => markOneMutation.mutate(notificationId)}
            />
          ))}
        </ScrollArea>
      )}
    </div>
  )
}
