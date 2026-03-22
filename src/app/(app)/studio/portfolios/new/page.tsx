"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useEditorStore } from "@/store/editor-store";
import { EditorWizard } from "@/components/portfolio-editor/editor-wizard";
import { unwrapApiData } from "@/lib/utils/client-api";

export default function NewPortfolioPage() {
  const router = useRouter();
  const { setPortfolioId, reset } = useEditorStore();
  const [creating, setCreating] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    reset();
    // 포트폴리오 초안 생성
    fetch("/api/v1/portfolios", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    })
      .then((res) => {
        if (!res.ok) throw new Error("포트폴리오 생성에 실패했습니다.");
        return res.json();
      })
      .then((json) => {
        const data = unwrapApiData<{ portfolio?: { id?: string }; id?: string }>(json);
        const id = data?.portfolio?.id ?? data?.id;
        if (!id) throw new Error("포트폴리오 ID를 받지 못했습니다.");
        setPortfolioId(id);
        setCreating(false);
      })
      .catch((err) => {
        setError(err.message);
        setCreating(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleComplete = () => {
    router.push("/studio");
  };

  if (creating) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">포트폴리오를 생성하는 중...</p>
      </div>
    );
  }

  if (error) {
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

  return <EditorWizard onComplete={handleComplete} />;
}
