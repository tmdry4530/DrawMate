"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Pencil, UserSearch, Fingerprint, Palette, PaintBucket, CheckCircle } from "lucide-react";

type Role = "assistant" | "recruiter";

function sanitizeNextPath(next: string | null): string | null {
  if (!next) return null;
  if (!next.startsWith("/") || next.startsWith("//")) return null;
  return next;
}

const SIDEBAR_STEPS = [
  { label: "Identity", icon: Fingerprint, step: 1 },
  { label: "Style", icon: Palette, step: 2 },
  { label: "Canvas", icon: PaintBucket, step: 3 },
  { label: "Finalize", icon: CheckCircle, step: 4 },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [role, setRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ displayName: "", headline: "" });
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
    if (!role) return;
    setLoading(true);
    try {
      const response = await fetch("/api/v1/me/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role,
          displayName: form.displayName,
          headline: form.headline || undefined,
        }),
      });

      const json = await response.json();

      if (!response.ok) {
        toast.error(json.error?.message ?? "프로필 저장에 실패했습니다.");
        return;
      }

      toast.success("프로필이 저장되었습니다.");
      router.push(nextPath ?? "/");
    } catch {
      toast.error("네트워크 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  const activeStep = step === 1 ? 1 : 2;

  return (
    <div className="flex min-h-screen bg-black text-white">
      {/* Top Nav */}
      <header className="fixed top-0 w-full z-50 flex justify-between items-center px-12 py-8 bg-black">
        <div className="text-2xl font-black tracking-tighter uppercase">
          DRAWMATE
        </div>
      </header>

      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full hidden md:flex flex-col pt-32 pb-12 bg-[#131313] w-72">
        <div className="px-8 mb-12">
          <h2 className="font-bold uppercase tracking-widest text-white text-xs opacity-40 mb-1">
            ONBOARDING
          </h2>
          <p className="font-bold uppercase tracking-widest text-white text-sm">
            STEP {String(activeStep).padStart(2, "0")}/02
          </p>
        </div>
        <nav className="flex flex-col flex-grow">
          {SIDEBAR_STEPS.map((s) => {
            const isActive = s.step === activeStep;
            const Icon = s.icon;
            return (
              <div
                key={s.label}
                className={`py-4 pl-4 font-bold uppercase tracking-widest flex items-center gap-3 text-sm ${
                  isActive
                    ? "bg-[#353535] text-white border-l-4 border-white"
                    : "text-white/20"
                }`}
              >
                <Icon className="h-5 w-5" />
                <span>{s.label}</span>
              </div>
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-grow flex items-center justify-center px-6 pt-24 pb-12 md:ml-72">
        {step === 1 ? (
          <div className="w-full max-w-[600px] flex flex-col">
            <span className="text-neutral-500 font-bold text-xs uppercase tracking-[0.2em] mb-6">
              Step 1 of 2
            </span>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-16 leading-tight">
              DrawMate에 오신 것을 환영합니다
            </h1>

            {/* Role Cards */}
            <div className="flex flex-row gap-8 mb-16">
              <button
                type="button"
                onClick={() => setRole("assistant")}
                className={`flex-1 aspect-square border flex flex-col items-center justify-center gap-4 cursor-pointer ${
                  role === "assistant"
                    ? "border-white"
                    : "border-neutral-800 hover:border-neutral-600"
                }`}
              >
                <Pencil className={`h-10 w-10 ${role === "assistant" ? "text-white" : "text-neutral-500"}`} />
                <span className={`font-bold text-lg uppercase tracking-wider ${role === "assistant" ? "text-white" : "text-neutral-500"}`}>
                  크리에이터
                </span>
              </button>

              <button
                type="button"
                onClick={() => setRole("recruiter")}
                className={`flex-1 aspect-square border flex flex-col items-center justify-center gap-4 cursor-pointer ${
                  role === "recruiter"
                    ? "border-white"
                    : "border-neutral-800 hover:border-neutral-600"
                }`}
              >
                <UserSearch className={`h-10 w-10 ${role === "recruiter" ? "text-white" : "text-neutral-500"}`} />
                <span className={`font-bold text-lg uppercase tracking-wider ${role === "recruiter" ? "text-white" : "text-neutral-500"}`}>
                  리크루터
                </span>
              </button>
            </div>

            {/* CTA */}
            <button
              type="button"
              disabled={!role}
              onClick={() => setStep(2)}
              className="w-full bg-white py-6 text-black font-black uppercase tracking-[0.2em] hover:bg-neutral-200 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              설정 완료
            </button>
          </div>
        ) : (
          <div className="w-full max-w-[600px] flex flex-col">
            <span className="text-neutral-500 font-bold text-xs uppercase tracking-[0.2em] mb-6">
              Step 2 of 2
            </span>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-12 leading-tight">
              프로필을 설정하세요
            </h1>

            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold uppercase tracking-widest text-neutral-500">
                  Display Name
                </label>
                <input
                  name="displayName"
                  type="text"
                  placeholder="표시될 이름"
                  value={form.displayName}
                  onChange={handleChange}
                  required
                  minLength={2}
                  maxLength={40}
                  autoComplete="name"
                  className="bg-transparent border border-neutral-800 p-4 text-white placeholder:text-neutral-700 focus:border-white focus:ring-0 rounded-none"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold uppercase tracking-widest text-neutral-500">
                  Headline <span className="text-neutral-600">(선택)</span>
                </label>
                <input
                  name="headline"
                  type="text"
                  placeholder="간략한 소개를 입력해주세요"
                  value={form.headline}
                  onChange={handleChange}
                  maxLength={80}
                  className="bg-transparent border border-neutral-800 p-4 text-white placeholder:text-neutral-700 focus:border-white focus:ring-0 rounded-none"
                />
              </div>

              <div className="mt-4 flex gap-4">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  disabled={loading}
                  className="flex-1 border border-neutral-800 py-5 font-bold uppercase tracking-wider hover:border-white disabled:opacity-50"
                >
                  이전
                </button>
                <button
                  type="submit"
                  disabled={loading || !form.displayName.trim()}
                  className="flex-1 bg-white text-black py-5 font-black uppercase tracking-wider hover:bg-neutral-200 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  {loading ? "저장 중..." : "시작하기"}
                </button>
              </div>
            </form>
          </div>
        )}
      </main>

      {/* Watermark */}
      <div className="fixed bottom-0 right-0 p-12 pointer-events-none select-none opacity-5 hidden lg:block">
        <span className="text-[12rem] font-black tracking-tighter leading-none">
          {String(activeStep).padStart(2, "0")}
        </span>
      </div>
    </div>
  );
}
