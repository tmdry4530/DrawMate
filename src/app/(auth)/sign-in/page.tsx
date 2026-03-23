"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/browser-client";
import { SocialLoginButtons } from "@/components/auth/social-login-buttons";

function sanitizeNextPath(next: string | null): string | null {
  if (!next) return null;
  if (!next.startsWith("/") || next.startsWith("//")) return null;
  return next;
}

export default function SignInPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ email: "", password: "" });
  const [nextPath, setNextPath] = useState<string | null>(null);

  useEffect(() => {
    const next = new URLSearchParams(window.location.search).get("next");
    setNextPath(sanitizeNextPath(next));
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email: form.email,
        password: form.password,
      });

      if (error) {
        toast.error("이메일 또는 비밀번호가 올바르지 않습니다.");
        return;
      }

      // Check if onboarding is needed
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", data.user.id)
        .single();

      if (!profile?.role) {
        const onboardingHref = nextPath
          ? `/onboarding?next=${encodeURIComponent(nextPath)}`
          : "/onboarding";
        router.push(onboardingHref);
      } else {
        router.push(nextPath ?? "/");
      }
    } catch {
      toast.error("네트워크 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">
          다시 만나서 반가워요
        </h1>
        <p className="mt-2 text-muted-foreground">
          계정에 로그인하고 작업을 이어가세요.
        </p>
      </div>

      <div className="space-y-6">
        <SocialLoginButtons nextPath={nextPath} />

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border/60" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-3 text-muted-foreground tracking-wider">
              또는
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">
              이메일
            </label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={handleChange}
              required
              autoComplete="email"
              className="h-12 rounded-xl bg-secondary/50 border-border/50 focus:bg-background transition-colors"
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="password" className="text-sm font-medium">
                비밀번호
              </label>
              <Link
                href="/reset-password"
                className="text-xs text-muted-foreground hover:text-primary transition-colors"
              >
                비밀번호 찾기
              </Link>
            </div>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="비밀번호 입력"
              value={form.password}
              onChange={handleChange}
              required
              autoComplete="current-password"
              className="h-12 rounded-xl bg-secondary/50 border-border/50 focus:bg-background transition-colors"
            />
          </div>
          <Button
            type="submit"
            className="w-full h-12 rounded-xl text-base font-semibold shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all mt-2"
            disabled={loading}
          >
            {loading ? "로그인 중..." : "로그인"}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground pt-2">
          아직 계정이 없으신가요?{" "}
          <Link
            href="/sign-up"
            className="font-medium text-primary hover:text-primary/80 transition-colors"
          >
            회원가입
          </Link>
        </p>
      </div>
    </>
  );
}
