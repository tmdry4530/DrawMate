"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/browser-client";

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
    <div className="mx-auto w-full max-w-2xl py-8 space-y-4 px-4">
      <div className="border border-neutral-800 bg-[#131313]">
        <div className="border-b border-neutral-800 px-6 py-4">
          <h2 className="font-black uppercase tracking-tighter text-white">계정 설정</h2>
        </div>
        <div className="px-6 py-6 space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-neutral-400">이메일 변경</label>
            <input
              placeholder="현재 이메일 주소"
              type="email"
              disabled
              className="w-full bg-transparent border-b-2 border-neutral-800 outline-none py-3 text-neutral-600 placeholder:text-neutral-700 cursor-not-allowed text-sm"
            />
            <p className="text-xs text-neutral-600">준비 중</p>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-neutral-400">비밀번호 변경</label>
            <input
              placeholder="새 비밀번호"
              type="password"
              disabled
              className="w-full bg-transparent border-b-2 border-neutral-800 outline-none py-3 text-neutral-600 placeholder:text-neutral-700 cursor-not-allowed text-sm"
            />
            <p className="text-xs text-neutral-600">준비 중</p>
          </div>
        </div>
      </div>

      <div className="border border-red-900/50 bg-[#131313]">
        <div className="border-b border-red-900/50 px-6 py-4">
          <h2 className="font-black uppercase tracking-tighter text-red-500">프로필 삭제</h2>
        </div>
        <div className="px-6 py-6 space-y-4">
          <p className="text-sm text-neutral-400">
            프로필을 삭제하면 작성한 포트폴리오와 메시지 데이터도 함께 제거될 수 있습니다.
          </p>
          <button
            onClick={handleDeleteProfile}
            disabled={deleting}
            className="w-full bg-red-600 text-white font-black uppercase tracking-widest py-3 text-sm hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            {deleting ? "삭제 중..." : "프로필 삭제"}
          </button>
        </div>
      </div>
    </div>
  );
}
