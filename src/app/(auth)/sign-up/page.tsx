"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
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
    <main className="flex min-h-screen w-full">
      {/* Left: Branding */}
      <section className="hidden md:flex md:w-1/2 relative overflow-hidden flex-col justify-between p-16 bg-black border-r border-neutral-800/20">
        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage: "radial-gradient(#1a1a1a 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />
        <div className="relative z-10">
          <h1 className="text-3xl font-black tracking-tighter uppercase">
            DRAWMATE.
          </h1>
        </div>
        <div className="relative z-10 max-w-md">
          <p className="text-5xl font-bold leading-tight mb-8">
            당신의 상상을 캔버스에 담으세요.
          </p>
          <div className="h-1 w-24 bg-white mb-6" />
          <p className="text-neutral-500 text-lg leading-relaxed">
            디지털 브루탈리즘의 정수, DRAWMATE에서 창작의 새로운 기준을 경험하세요.
          </p>
        </div>
        <div className="relative z-10 flex gap-4">
          <div className="w-12 h-12 border border-neutral-700/30 flex items-center justify-center text-neutral-500 text-sm">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" /></svg>
          </div>
          <div className="w-12 h-12 border border-neutral-700/30 flex items-center justify-center text-neutral-500 text-sm">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
          </div>
          <div className="w-12 h-12 border border-neutral-700/30 flex items-center justify-center text-neutral-500 text-sm">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
          </div>
        </div>
      </section>

      {/* Right: Sign Up Form */}
      <section className="w-full md:w-1/2 flex items-center justify-center p-8 md:p-24 bg-black">
        <div className="w-full max-w-md flex flex-col">
          {/* Mobile header */}
          <div className="md:hidden mb-12">
            <h1 className="text-2xl font-black tracking-tighter uppercase">
              DRAWMATE.
            </h1>
          </div>

          <h2 className="text-4xl font-bold mb-10 tracking-tight">시작하기</h2>

          {/* Social Logins */}
          <SocialLoginButtons />

          {/* Divider */}
          <div className="flex items-center gap-4 my-8">
            <div className="flex-1 h-px bg-neutral-800/30" />
            <span className="text-neutral-500 text-sm font-bold">또는</span>
            <div className="flex-1 h-px bg-neutral-800/30" />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold uppercase tracking-widest text-neutral-500">
                디스플레이 네임 (선택)
              </label>
              <input
                name="displayName"
                type="text"
                placeholder="홍길동"
                value={form.displayName}
                onChange={handleChange}
                autoComplete="name"
                className="bg-transparent border border-neutral-800 p-4 text-white placeholder:text-neutral-700 focus:border-white focus:ring-0 rounded-none"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold uppercase tracking-widest text-neutral-500">
                이메일
              </label>
              <input
                name="email"
                type="email"
                placeholder="name@example.com"
                value={form.email}
                onChange={handleChange}
                required
                autoComplete="email"
                className="bg-transparent border border-neutral-800 p-4 text-white placeholder:text-neutral-700 focus:border-white focus:ring-0 rounded-none"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold uppercase tracking-widest text-neutral-500">
                비밀번호
              </label>
              <input
                name="password"
                type="password"
                placeholder="••••••••"
                value={form.password}
                onChange={handleChange}
                required
                autoComplete="new-password"
                className="bg-transparent border border-neutral-800 p-4 text-white placeholder:text-neutral-700 focus:border-white focus:ring-0 rounded-none"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="mt-4 bg-white text-black py-5 px-8 font-bold text-lg uppercase tracking-widest hover:bg-neutral-200 disabled:opacity-50 rounded-none"
            >
              {loading ? "처리 중..." : "회원가입"}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-8 text-center md:text-left">
            <p className="text-neutral-500 text-sm">
              이미 계정이 있나요?{" "}
              <Link
                href="/sign-in"
                className="text-white font-bold ml-1 underline underline-offset-4 hover:text-neutral-400"
              >
                로그인
              </Link>
            </p>
          </div>

          {/* Compliance */}
          <div className="mt-24 pt-8 border-t border-neutral-800/10 text-[10px] text-neutral-700 uppercase tracking-[0.2em] leading-relaxed">
            <p>
              &copy; 2025 DRAWMATE. ALL RIGHTS RESERVED. BY SIGNING UP, YOU AGREE
              TO OUR TERMS OF SERVICE AND PRIVACY POLICY.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
