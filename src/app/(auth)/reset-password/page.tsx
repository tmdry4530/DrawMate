"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/browser-client";

export default function ResetPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/sign-in`,
      });
      if (error) {
        throw error;
      }
      toast.success("비밀번호 재설정 메일을 발송했습니다.");
    } catch {
      toast.error("비밀번호 재설정 메일 발송에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <div className="mb-8">
        <h1 className="font-black text-3xl text-white uppercase tracking-tighter">
          비밀번호 찾기
        </h1>
        <p className="mt-2 text-neutral-400">
          가입한 이메일 주소로 재설정 링크를 보내드립니다.
        </p>
      </div>

      <div className="space-y-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="email" className="text-xs font-black uppercase tracking-widest text-neutral-400">
              이메일
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder="you@example.com"
              className="w-full bg-transparent border-b-2 border-neutral-800 focus:border-white outline-none py-3 text-white placeholder:text-neutral-600 transition-colors"
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full h-12 bg-white text-black font-black uppercase tracking-widest text-sm mt-2 hover:bg-neutral-200 transition-colors disabled:opacity-50"
          >
            {submitting ? "발송 중..." : "재설정 링크 보내기"}
          </button>
        </form>

        <p className="text-center text-sm text-neutral-500 pt-2">
          <Link
            href="/sign-in"
            className="font-black uppercase tracking-widest text-white hover:text-neutral-300 transition-colors"
          >
            로그인으로 돌아가기
          </Link>
        </p>
      </div>
    </>
  );
}
