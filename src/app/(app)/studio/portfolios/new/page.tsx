"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { unwrapApiData } from "@/lib/utils/client-api";

let cachedDraftPromise: Promise<string> | null = null;

async function createDraft(): Promise<string> {
  if (!cachedDraftPromise) {
    cachedDraftPromise = fetch("/api/v1/portfolios", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    }).then(async (res) => {
      if (!res.ok) {
        cachedDraftPromise = null;
        throw new Error("포트폴리오 생성에 실패했습니다.");
      }
      const json = await res.json();
      const data = unwrapApiData<{ portfolio?: { id?: string }; id?: string }>(json);
      const id = data?.portfolio?.id ?? data?.id;
      if (!id) {
        cachedDraftPromise = null;
        throw new Error("포트폴리오 ID를 받지 못했습니다.");
      }
      return id;
    });
  }

  return cachedDraftPromise;
}

export default function NewPortfolioPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    createDraft()
      .then((id) => {
        if (!mounted) return;
        router.replace(`/studio/portfolios/${id}/edit`);
      })
      .catch((err) => {
        if (!mounted) return;
        setError((err as Error).message);
      });
    return () => {
      mounted = false;
    };
  }, [router]);

  if (!error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">포트폴리오를 준비하는 중...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
      <p className="text-red-500">{error}</p>
      <button
        onClick={() => router.push("/studio")}
        className="text-sm underline text-muted-foreground"
      >
        스튜디오로 돌아가기
      </button>
    </div>
  );
}
