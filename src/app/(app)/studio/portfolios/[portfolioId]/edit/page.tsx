"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useEditorStore } from "@/store/editor-store";
import { EditorWizard } from "@/components/portfolio-editor/editor-wizard";
import { unwrapApiData } from "@/lib/utils/client-api";

export default function EditPortfolioPage() {
  const params = useParams();
  const router = useRouter();
  const portfolioId = params.portfolioId as string;
  const { setPortfolioId, setTemplate, setFormData, setTags, setImages, reset } =
    useEditorStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    reset();
    setPortfolioId(portfolioId);

    fetch(`/api/v1/portfolios/${portfolioId}`)
      .then((res) => {
        if (!res.ok) throw new Error("포트폴리오를 불러오지 못했습니다.");
        return res.json();
      })
      .then((json) => {
        const p = unwrapApiData<Record<string, unknown>>(json);
        if (typeof p.templateId === "string") setTemplate(p.templateId);
        setFormData({
          title: (p.title as string) ?? "",
          summary: (p.summary as string) ?? "",
          description: (p.description as string) ?? "",
          startingPriceKrw: (p.startingPriceKrw as number | null) ?? null,
          durationDays: (p.durationDays as number | null) ?? null,
        });
        if (p.tags) {
          const tags = p.tags as Array<{ id: string; category: string }>;
          setTags({
            field: tags.filter((t) => t.category === "field").map((t) => t.id),
            skill: tags.filter((t) => t.category === "skill").map((t) => t.id),
            tool: tags.filter((t) => t.category === "tool").map((t) => t.id),
            style: tags.filter((t) => t.category === "style").map((t) => t.id),
          });
        }
        if (p.images) {
          const images = p.images as Array<{
            id: string;
            url?: string | null;
            displayPath?: string | null;
            thumbPath?: string | null;
            caption?: string | null;
            isCover?: boolean;
            sortOrder?: number;
          }>;
          setImages(
            images.map((img, idx) => ({
              id: img.id,
              previewUrl: img.url ?? img.thumbPath ?? img.displayPath ?? "",
              caption: img.caption ?? "",
              isCover: img.isCover ?? idx === 0,
              sortOrder: img.sortOrder ?? idx,
            }))
          );
        }
        useEditorStore.setState({ isDirty: false });
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [portfolioId]);

  const handleComplete = () => {
    router.push(`/studio/portfolios`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">포트폴리오를 불러오는 중...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-red-500">{error}</p>
        <button
          onClick={() => router.push("/studio/portfolios")}
          className="text-sm underline text-muted-foreground"
        >
          목록으로 돌아가기
        </button>
      </div>
    );
  }

  return <EditorWizard onComplete={handleComplete} />;
}
