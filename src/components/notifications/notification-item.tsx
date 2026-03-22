import { formatDistanceToNow } from "date-fns"
import { ko } from "date-fns/locale"
import {
  MessageSquare,
  Heart,
  Bell,
} from "lucide-react"
import { cn } from "@/lib/utils"

type NotificationType =
  | "message_received"
  | "message_replied"
  | "bookmark_added"
  | "system_notice"

interface Notification {
  id: string
  type: NotificationType
  title: string
  body: string
  isRead: boolean
  createdAt: string
}

const iconMap: Record<NotificationType, React.ReactNode> = {
  message_received: <MessageSquare className="h-4 w-4 text-blue-500" />,
  message_replied: <MessageSquare className="h-4 w-4 text-indigo-500" />,
  bookmark_added: <Heart className="h-4 w-4 text-red-500" />,
  system_notice: <Bell className="h-4 w-4 text-muted-foreground" />,
}

interface NotificationItemProps {
  notification: Notification
  onMarkAsRead?: (notificationId: string) => void
}

export function NotificationItem({ notification, onMarkAsRead }: NotificationItemProps) {
  const icon = iconMap[notification.type] ?? iconMap.system_notice

  return (
    <div
      className={cn(
        "border-b last:border-b-0 transition-colors",
        !notification.isRead && "bg-blue-50 dark:bg-blue-950/20"
      )}
    >
      <div className="flex items-start gap-3 px-4 py-3">
        <div className="mt-0.5 shrink-0 rounded-full bg-muted p-2">{icon}</div>

        <div className="flex-1 min-w-0">
          <p
            className={cn(
              "text-sm",
              !notification.isRead ? "font-semibold" : "font-normal"
            )}
          >
            {notification.title}
          </p>
          <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
            {notification.body}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {formatDistanceToNow(new Date(notification.createdAt), {
              addSuffix: true,
              locale: ko,
            })}
          </p>
        </div>

        {!notification.isRead && (
          <div className="mt-1.5 shrink-0 h-2 w-2 rounded-full bg-blue-500" />
        )}
      </div>

      {!notification.isRead && onMarkAsRead && (
        <div className="px-4 pb-3">
          <button
            type="button"
            onClick={() => onMarkAsRead(notification.id)}
            className="text-xs text-primary underline underline-offset-2"
          >
            읽음 처리
          </button>
        </div>
      )}
    </div>
  )
}
