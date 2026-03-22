import { formatDistanceToNow } from "date-fns"
import { ko } from "date-fns/locale"
import {
  MessageSquare,
  Heart,
  UserPlus,
  Bell,
  Briefcase,
  Star,
} from "lucide-react"
import { cn } from "@/lib/utils"

type NotificationType =
  | "message"
  | "like"
  | "follow"
  | "project_invite"
  | "review"
  | "general"

interface Notification {
  id: string
  type: NotificationType
  title: string
  body: string
  isRead: boolean
  createdAt: string
}

const iconMap: Record<NotificationType, React.ReactNode> = {
  message: <MessageSquare className="h-4 w-4 text-blue-500" />,
  like: <Heart className="h-4 w-4 text-red-500" />,
  follow: <UserPlus className="h-4 w-4 text-green-500" />,
  project_invite: <Briefcase className="h-4 w-4 text-purple-500" />,
  review: <Star className="h-4 w-4 text-yellow-500" />,
  general: <Bell className="h-4 w-4 text-muted-foreground" />,
}

interface NotificationItemProps {
  notification: Notification
}

export function NotificationItem({ notification }: NotificationItemProps) {
  const icon = iconMap[notification.type] ?? iconMap.general

  return (
    <div
      className={cn(
        "flex items-start gap-3 px-4 py-3 border-b last:border-b-0 transition-colors",
        !notification.isRead && "bg-blue-50 dark:bg-blue-950/20"
      )}
    >
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
  )
}
