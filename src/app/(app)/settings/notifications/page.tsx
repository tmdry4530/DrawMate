"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { unwrapApiData } from "@/lib/utils/client-api";

export default function NotificationsSettingsPage() {
  const [newMessage, setNewMessage] = useState(true);
  const [bookmark, setBookmark] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const res = await fetch("/api/v1/me");
        if (!res.ok) {
          throw new Error("알림 설정을 불러오지 못했습니다.");
        }
        const json = await res.json();
        const data = unwrapApiData<{
          profile?: {
            notifyNewMessage?: boolean;
            notifyBookmark?: boolean;
          };
        }>(json);

        if (mounted) {
          setNewMessage(data?.profile?.notifyNewMessage ?? true);
          setBookmark(data?.profile?.notifyBookmark ?? true);
        }
      } catch (err) {
        if (mounted) {
          toast.error((err as Error).message);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    void load();
    return () => {
      mounted = false;
    };
  }, []);

  const persistSettings = async (nextValue: { notifyNewMessage: boolean; notifyBookmark: boolean }) => {
    setSaving(true);
    try {
      const res = await fetch("/api/v1/me/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(nextValue),
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => null);
        throw new Error(payload?.error?.message ?? "알림 설정 저장에 실패했습니다.");
      }
      toast.success("알림 설정이 저장되었습니다.");
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleNewMessageChange = (checked: boolean) => {
    setNewMessage(checked);
    void persistSettings({
      notifyNewMessage: checked,
      notifyBookmark: bookmark,
    });
  };

  const handleBookmarkChange = (checked: boolean) => {
    setBookmark(checked);
    void persistSettings({
      notifyNewMessage: newMessage,
      notifyBookmark: checked,
    });
  };

  return (
    <div className="mx-auto w-full max-w-2xl py-8 px-4">
      <div className="border border-neutral-800 bg-[#131313]">
        <div className="border-b border-neutral-800 px-6 py-4">
          <h2 className="font-black uppercase tracking-tighter text-white">알림 설정</h2>
        </div>
        <div className="px-6 py-6 space-y-6">
          <div className="flex items-center gap-4 border-b border-neutral-800 pb-6">
            <Checkbox
              id="new-message"
              checked={newMessage}
              onCheckedChange={(checked) => handleNewMessageChange(!!checked)}
              disabled={loading || saving}
              className="rounded-none border-neutral-600 data-[state=checked]:bg-white data-[state=checked]:text-black"
            />
            <div>
              <label htmlFor="new-message" className="text-sm font-black uppercase tracking-widest text-white cursor-pointer">
                새 메시지 알림
              </label>
              <p className="text-xs text-neutral-500 mt-0.5">In-app</p>
            </div>
          </div>

          <div className="flex items-center gap-4 border-b border-neutral-800 pb-6">
            <Checkbox
              id="bookmark"
              checked={bookmark}
              onCheckedChange={(checked) => handleBookmarkChange(!!checked)}
              disabled={loading || saving}
              className="rounded-none border-neutral-600 data-[state=checked]:bg-white data-[state=checked]:text-black"
            />
            <div>
              <label htmlFor="bookmark" className="text-sm font-black uppercase tracking-widest text-white cursor-pointer">
                북마크 알림
              </label>
              <p className="text-xs text-neutral-500 mt-0.5">In-app</p>
            </div>
          </div>

          <div className="flex items-center gap-4 opacity-40">
            <Checkbox
              id="push"
              checked={false}
              disabled
              className="rounded-none border-neutral-600"
            />
            <div>
              <label htmlFor="push" className="text-sm font-black uppercase tracking-widest text-neutral-500 cursor-not-allowed">
                Push 알림
              </label>
              <p className="text-xs text-neutral-600 mt-0.5">준비 중</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
