"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/browser-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function AccountSettingsPage() {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function handleDeleteProfile() {
    if (!confirm("프로필을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.")) {
      return;
    }

    setDeleting(true);
    try {
      const res = await fetch("/api/v1/me/profile", { method: "DELETE" });
      if (!res.ok) {
        const payload = await res.json().catch(() => null);
        throw new Error(payload?.error?.message ?? "프로필 삭제에 실패했습니다.");
      }

      const supabase = createClient();
      await supabase.auth.signOut();
      toast.success("프로필이 삭제되었습니다.");
      router.replace("/sign-up");
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="container max-w-2xl py-8 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>계정 설정</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium">이메일 변경</label>
            <Input placeholder="현재 이메일 주소" type="email" disabled />
            <p className="text-xs text-muted-foreground">준비 중</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">비밀번호 변경</label>
            <Input placeholder="새 비밀번호" type="password" disabled />
            <p className="text-xs text-muted-foreground">준비 중</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>프로필 삭제</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            프로필을 삭제하면 작성한 포트폴리오와 메시지 데이터도 함께 제거될 수 있습니다.
          </p>
          <Button
            variant="destructive"
            onClick={handleDeleteProfile}
            disabled={deleting}
            className="w-full"
          >
            {deleting ? "삭제 중..." : "프로필 삭제"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
