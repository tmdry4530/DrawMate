"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";

export default function NotificationsSettingsPage() {
  const [newMessage, setNewMessage] = useState(true);
  const [bookmark, setBookmark] = useState(true);

  return (
    <div className="container max-w-2xl py-8">
      <Card>
        <CardHeader>
          <CardTitle>알림 설정</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <Checkbox
              id="new-message"
              checked={newMessage}
              onCheckedChange={(checked) => setNewMessage(!!checked)}
            />
            <div>
              <label htmlFor="new-message" className="text-sm font-medium cursor-pointer">
                새 메시지 알림
              </label>
              <p className="text-xs text-muted-foreground">In-app</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Checkbox
              id="bookmark"
              checked={bookmark}
              onCheckedChange={(checked) => setBookmark(!!checked)}
            />
            <div>
              <label htmlFor="bookmark" className="text-sm font-medium cursor-pointer">
                북마크 알림
              </label>
              <p className="text-xs text-muted-foreground">In-app</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Checkbox id="push" checked={false} disabled />
            <div>
              <label htmlFor="push" className="text-sm font-medium text-muted-foreground cursor-not-allowed">
                Push 알림
              </label>
              <p className="text-xs text-muted-foreground">준비 중</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
