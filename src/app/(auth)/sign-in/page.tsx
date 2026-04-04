"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
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
    <main className="flex min-h-screen w-full">
      {/* Left: Branding */}
      <section className="hidden md:flex md:w-1/2 relative items-center justify-center overflow-hidden bg-black">
        <div
          className="absolute inset-0 opacity-50"
          style={{
            backgroundImage:
              "linear-gradient(#1a1a1a 1px, transparent 1px), linear-gradient(90deg, #1a1a1a 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
        <div className="z-10 flex flex-col items-center">
          <h1 className="text-6xl font-black tracking-tighter uppercase">
            DRAWMATE.
          </h1>
          <p className="mt-4 text-neutral-500 font-bold tracking-widest uppercase text-sm">
            The Monolithic Canvas
          </p>
        </div>
      </section>

      {/* Right: Login Form */}
      <section className="w-full md:w-1/2 flex items-center justify-center bg-black p-8 md:p-24">
        <div className="w-full max-w-md">
          {/* Heading */}
          <div className="mb-12">
            <h2 className="text-4xl font-bold mb-2 leading-tight">
              다시 만나서 반가워요
            </h2>
            <div className="w-12 h-1 bg-white" />
          </div>

          {/* Social Logins */}
          <SocialLoginButtons nextPath={nextPath} />

          {/* Divider */}
          <div className="flex items-center gap-4 my-8">
            <div className="flex-grow h-px bg-neutral-800" />
            <span className="text-neutral-500 text-sm font-bold uppercase">
              또는
            </span>
            <div className="flex-grow h-px bg-neutral-800" />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-widest text-neutral-500">
                Email Address
              </label>
              <input
                name="email"
                type="email"
                placeholder="name@example.com"
                value={form.email}
                onChange={handleChange}
                required
                autoComplete="email"
                className="w-full bg-transparent border-b-2 border-neutral-800 border-x-0 border-t-0 focus:ring-0 focus:border-white text-white py-3 px-0 placeholder:text-neutral-700 rounded-none"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold uppercase tracking-widest text-neutral-500">
                  Password
                </label>
                <Link
                  href="/reset-password"
                  className="text-xs text-neutral-500 hover:text-white uppercase tracking-wider"
                >
                  비밀번호 찾기
                </Link>
              </div>
              <input
                name="password"
                type="password"
                placeholder="••••••••"
                value={form.password}
                onChange={handleChange}
                required
                autoComplete="current-password"
                className="w-full bg-transparent border-b-2 border-neutral-800 border-x-0 border-t-0 focus:ring-0 focus:border-white text-white py-3 px-0 placeholder:text-neutral-700 rounded-none"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-white text-black font-black py-5 uppercase tracking-tighter text-lg hover:bg-neutral-200 disabled:opacity-50 mt-4"
            >
              {loading ? "로그인 중..." : "로그인"}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-12 text-center">
            <p className="text-neutral-500 text-sm">
              계정이 없으신가요?{" "}
              <Link
                href="/sign-up"
                className="text-white font-bold underline underline-offset-4 hover:text-neutral-400 ml-1"
              >
                회원가입
              </Link>
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
