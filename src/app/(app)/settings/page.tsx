"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/browser-client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";

export default function SettingsPage() {
  const [isProfilePublic, setIsProfilePublic] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();

  const handlePublicToggle = async (checked: boolean) => {
    setIsProfilePublic(checked);
    setIsSaving(true);
    try {
      const res = await fetch("/api/v1/me/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isProfilePublic: checked }),
      });
      if (!res.ok) {
        setIsProfilePublic(!checked);
        toast.error("설정 변경에 실패했습니다.");
      } else {
        toast.success(checked ? "프로필이 공개로 설정되었습니다." : "프로필이 비공개로 설정되었습니다.");
      }
    } catch {
      setIsProfilePublic(!checked);
      toast.error("네트워크 오류가 발생했습니다.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/sign-in");
  };

  return (
    <div className="container max-w-2xl py-8 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>설정</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">프로필 공개</p>
              <p className="text-sm text-muted-foreground">
                다른 사용자가 내 프로필을 볼 수 있습니다.
              </p>
            </div>
            <Switch
              checked={isProfilePublic}
              onCheckedChange={handlePublicToggle}
              disabled={isSaving}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>설정 메뉴</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Link href="/settings/profile">
            <Button variant="ghost" className="w-full justify-start">
              프로필 편집
            </Button>
          </Link>
          <Link href="/settings/account">
            <Button variant="ghost" className="w-full justify-start">
              계정 설정
            </Button>
          </Link>
          <Link href="/settings/notifications">
            <Button variant="ghost" className="w-full justify-start">
              알림 설정
            </Button>
          </Link>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <Button variant="destructive" className="w-full" onClick={handleLogout}>
            로그아웃
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
