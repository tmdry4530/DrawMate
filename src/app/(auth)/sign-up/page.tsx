"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SocialLoginButtons } from "@/components/auth/social-login-buttons";
import { unwrapApiData } from "@/lib/utils/client-api";

export default function SignUpPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    email: "",
    password: "",
    displayName: "",
  });

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch("/api/v1/auth/sign-up", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.email,
          password: form.password,
          displayName: form.displayName || undefined,
        }),
      });

      const json = await response.json();
      const data = unwrapApiData<{ emailVerificationRequired?: boolean }>(json);

      if (!response.ok) {
        toast.error(json.error?.message ?? "회원가입에 실패했습니다.");
        return;
      }

      if (data?.emailVerificationRequired) {
        toast.success("회원가입이 완료되었습니다. 이메일 인증 후 로그인해주세요.");
        router.push("/sign-in?verify_email=1");
        return;
      }

      toast.success("회원가입이 완료되었습니다.");
      router.push("/onboarding");
    } catch {
      toast.error("네트워크 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="mb-8">
        <h1 className="font-headline font-extrabold text-3xl text-foreground tracking-tight">
          시작하기
        </h1>
        <p className="mt-2 text-muted-foreground">
          무료로 가입하고 포트폴리오를 공유해보세요.
        </p>
      </div>

      <div className="space-y-6">
        <SocialLoginButtons />

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border/60" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-3 text-muted-foreground tracking-wider">
              또는
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="displayName" className="text-sm font-medium text-foreground">
              이름 <span className="text-muted-foreground font-normal">(선택)</span>
            </label>
            <Input
              id="displayName"
              name="displayName"
              type="text"
              placeholder="표시될 이름"
              value={form.displayName}
              onChange={handleChange}
              autoComplete="name"
              className="h-12 rounded-xl bg-muted border-0 focus:bg-card transition-colors"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium text-foreground">
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
              className="h-12 rounded-xl bg-muted border-0 focus:bg-card transition-colors"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium text-foreground">
              비밀번호
            </label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="8자 이상"
              value={form.password}
              onChange={handleChange}
              required
              autoComplete="new-password"
              className="h-12 rounded-xl bg-muted border-0 focus:bg-card transition-colors"
            />
          </div>
          <Button
            type="submit"
            className="w-full h-12 rounded-xl text-base font-bold shadow-lg shadow-primary/20 gradient-primary text-white mt-2"
            disabled={loading}
          >
            {loading ? "처리 중..." : "회원가입"}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground pt-2">
          이미 계정이 있으신가요?{" "}
          <Link
            href="/sign-in"
            className="font-medium text-primary hover:text-primary/80 transition-colors"
          >
            로그인
          </Link>
        </p>
      </div>
    </>
  );
}
