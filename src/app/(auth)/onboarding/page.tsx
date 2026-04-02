"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Palette, Briefcase, CheckCircle2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Role = "assistant" | "recruiter";

function sanitizeNextPath(next: string | null): string | null {
  if (!next) return null;
  if (!next.startsWith("/") || next.startsWith("//")) return null;
  return next;
}

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

  function handleRoleSelect(selected: Role) {
    setRole(selected);
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

  if (step === 1) {
    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background p-4">
        {/* Decorative blurred circles */}
        <div className="pointer-events-none absolute -top-32 -left-32 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-secondary/20 blur-3xl" />

        <div className="relative z-10 w-full max-w-2xl">
          {/* Header */}
          <div className="mb-10 text-center">
            <h1 className="font-headline text-4xl font-bold tracking-tight">
              Welcome to{" "}
              <span className="text-primary italic">DrawMate</span>
            </h1>
            <p className="mt-3 text-base text-muted-foreground">
              어떤 역할로 시작하시겠어요? 역할에 맞는 최적의 경험을 제공해드립니다.
            </p>
          </div>

          {/* Role Cards */}
          <div className="grid grid-cols-2 gap-5">
            {/* Creator Card */}
            <button
              type="button"
              onClick={() => handleRoleSelect("assistant")}
              className={cn(
                "group relative flex flex-col items-start rounded-2xl border bg-card p-6 text-left",
                "transition-all duration-300 hover:scale-[1.03] focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                role === "assistant"
                  ? "border-primary shadow-[0_0_30px_2px_rgba(var(--primary),0.35)]"
                  : "border-border hover:border-primary/50 hover:shadow-lg"
              )}
            >
              {/* Check badge */}
              {role === "assistant" && (
                <span className="absolute top-3 right-3 text-primary">
                  <CheckCircle2 className="size-5 fill-primary/20" />
                </span>
              )}

              {/* Icon */}
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Palette className="size-7" />
              </div>

              {/* Text */}
              <h2 className="text-lg font-semibold">크리에이터입니다</h2>
              <p className="mt-1.5 text-sm text-muted-foreground">
                포트폴리오를 공개하고 리크루터·협업 파트너의 문의를 받습니다.
              </p>
            </button>

            {/* Recruiter Card */}
            <button
              type="button"
              onClick={() => handleRoleSelect("recruiter")}
              className={cn(
                "group relative flex flex-col items-start rounded-2xl border bg-card p-6 text-left",
                "transition-all duration-300 hover:scale-[1.03] focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                role === "recruiter"
                  ? "border-primary shadow-[0_0_30px_2px_rgba(var(--primary),0.35)]"
                  : "border-border hover:border-primary/50 hover:shadow-lg"
              )}
            >
              {/* Check badge */}
              {role === "recruiter" && (
                <span className="absolute top-3 right-3 text-primary">
                  <CheckCircle2 className="size-5 fill-primary/20" />
                </span>
              )}

              {/* Icon */}
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-secondary/20 text-secondary-foreground">
                <Briefcase className="size-7" />
              </div>

              {/* Text */}
              <h2 className="text-lg font-semibold">리크루터입니다</h2>
              <p className="mt-1.5 text-sm text-muted-foreground">
                작가를 탐색하고 북마크하며 협업 문의 메시지를 보냅니다.
              </p>
            </button>
          </div>

          {/* CTA */}
          <div className="mt-8 flex flex-col items-center gap-3">
            <button
              type="button"
              disabled={!role}
              onClick={() => setStep(2)}
              className={cn(
                "gradient-primary w-full max-w-xs rounded-2xl px-8 py-3 text-base font-semibold text-white",
                "transition-all duration-200 hover:opacity-90 active:scale-[0.98]",
                "disabled:cursor-not-allowed disabled:opacity-40"
              )}
            >
              설정 완료
            </button>
            <p className="text-xs text-muted-foreground">단계 1/2: 역할 선택</p>
          </div>
        </div>
      </div>
    );
  }

  /* ── Step 2: Profile form ── */
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background p-4">
      {/* Decorative blurred circles */}
      <div className="pointer-events-none absolute -top-32 -left-32 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-secondary/20 blur-3xl" />

      <div className="relative z-10 w-full max-w-md">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="font-headline text-4xl font-bold tracking-tight">
            Welcome to{" "}
            <span className="text-primary italic">DrawMate</span>
          </h1>
          <p className="mt-3 text-base text-muted-foreground">
            {role === "assistant" ? "크리에이터" : "리크루터"}로 사용할 프로필 정보를 입력해주세요.
          </p>
        </div>

        {/* Form card */}
        <div className="rounded-2xl border bg-card p-7 shadow-sm">
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="displayName" className="text-sm font-medium">
                이름
              </label>
              <Input
                id="displayName"
                name="displayName"
                type="text"
                placeholder="표시될 이름"
                value={form.displayName}
                onChange={handleChange}
                required
                minLength={2}
                maxLength={40}
                autoComplete="name"
                className="rounded-xl border-0 bg-muted px-4 py-2.5 focus-visible:ring-1 focus-visible:ring-primary"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="headline" className="text-sm font-medium">
                한 줄 소개{" "}
                <span className="text-muted-foreground">(선택)</span>
              </label>
              <Input
                id="headline"
                name="headline"
                type="text"
                placeholder="간략한 소개를 입력해주세요"
                value={form.headline}
                onChange={handleChange}
                maxLength={80}
                className="rounded-xl border-0 bg-muted px-4 py-2.5 focus-visible:ring-1 focus-visible:ring-primary"
              />
            </div>

            <div className="mt-1 flex gap-3">
              <Button
                type="button"
                variant="outline"
                className="flex-1 rounded-xl"
                onClick={() => setStep(1)}
                disabled={loading}
              >
                이전
              </Button>
              <button
                type="submit"
                disabled={loading || !form.displayName.trim()}
                className={cn(
                  "gradient-primary flex-1 rounded-xl py-2 text-sm font-semibold text-white",
                  "transition-all duration-200 hover:opacity-90 active:scale-[0.98]",
                  "disabled:cursor-not-allowed disabled:opacity-40"
                )}
              >
                {loading ? "저장 중..." : "시작하기"}
              </button>
            </div>
          </form>
        </div>

        <p className="mt-4 text-center text-xs text-muted-foreground">단계 2/2: 프로필 설정</p>
      </div>
    </div>
  );
}
