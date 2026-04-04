"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Bell } from "lucide-react"
import { toast } from "sonner"
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
    <div className="bg-black text-white -mt-20 pt-20 min-h-screen">
      <div className="max-w-2xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-black uppercase tracking-tighter">알림</h1>
          {hasUnread && (
            <button
              onClick={() => mutation.mutate()}
              disabled={mutation.isPending}
              className="text-sm font-bold uppercase tracking-tight text-white underline underline-offset-4 hover:text-neutral-300 transition-colors disabled:opacity-50"
            >
              모두 읽음
            </button>
          )}
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-neutral-500 text-sm uppercase tracking-widest">
            불러오는 중...
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-neutral-500">
            <Bell className="h-10 w-10" />
            <p className="text-sm uppercase tracking-widest">알림이 없습니다</p>
          </div>
        ) : (
          <div className="border border-white">
            {notifications.map((n, index) => (
              <div
                key={n.id}
                className={index !== notifications.length - 1 ? "border-b border-neutral-700" : ""}
              >
                <NotificationItem
                  notification={n}
                  onMarkAsRead={(notificationId) => markOneMutation.mutate(notificationId)}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
