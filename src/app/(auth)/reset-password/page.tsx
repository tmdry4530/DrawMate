"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/browser-client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

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
        <h1 className="font-headline font-extrabold text-3xl text-foreground tracking-tight">
          비밀번호 찾기
        </h1>
        <p className="mt-2 text-muted-foreground">
          가입한 이메일 주소로 재설정 링크를 보내드립니다.
        </p>
      </div>

      <div className="space-y-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium text-foreground">
              이메일
            </label>
            <Input
              id="email"
              name="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder="you@example.com"
              className="h-12 rounded-xl bg-muted border-0 focus:bg-card transition-colors"
            />
          </div>
          <Button
            type="submit"
            className="w-full h-12 rounded-xl text-base font-bold shadow-lg shadow-primary/20 gradient-primary text-white mt-2"
            disabled={submitting}
          >
            {submitting ? "발송 중..." : "재설정 링크 보내기"}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground pt-2">
          <Link
            href="/sign-in"
            className="font-medium text-primary hover:text-primary/80 transition-colors"
          >
            로그인으로 돌아가기
          </Link>
        </p>
      </div>
    </>
  );
}
