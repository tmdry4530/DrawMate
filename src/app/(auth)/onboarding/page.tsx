"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Palette, Briefcase } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

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
    setStep(2);
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
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-lg">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold">어떤 역할로 시작하시나요?</h1>
            <p className="mt-2 text-muted-foreground">역할에 맞는 기능을 제공해드립니다.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => handleRoleSelect("assistant")}
              className="group rounded-xl border bg-card p-6 text-left shadow-sm transition-all hover:border-primary hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Palette className="size-6" />
              </div>
              <h2 className="text-lg font-semibold">어시스턴트로 시작</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                작가 및 PD를 보조하며 프로젝트에 참여합니다.
              </p>
            </button>
            <button
              type="button"
              onClick={() => handleRoleSelect("recruiter")}
              className="group rounded-xl border bg-card p-6 text-left shadow-sm transition-all hover:border-primary hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Briefcase className="size-6" />
              </div>
              <h2 className="text-lg font-semibold">작가/PD로 시작</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                프로젝트를 만들고 어시스턴트를 모집합니다.
              </p>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">프로필 설정</CardTitle>
          <CardDescription>
            {role === "assistant" ? "어시스턴트" : "작가/PD"}로 사용할 프로필 정보를 입력해주세요.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="headline" className="text-sm font-medium">
                한 줄 소개 <span className="text-muted-foreground">(선택)</span>
              </label>
              <Input
                id="headline"
                name="headline"
                type="text"
                placeholder="간략한 소개를 입력해주세요"
                value={form.headline}
                onChange={handleChange}
                maxLength={80}
              />
            </div>
            <div className="mt-2 flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setStep(1)}
                disabled={loading}
              >
                이전
              </Button>
              <Button type="submit" className="flex-1" disabled={loading}>
                {loading ? "저장 중..." : "시작하기"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
