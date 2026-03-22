"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useEditorStore } from "@/store/editor-store";
import { EditorWizard } from "@/components/portfolio-editor/editor-wizard";

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
      .then((data) => {
        const p = data?.portfolio ?? data;
        if (p.templateId) setTemplate(p.templateId);
        setFormData({
          title: p.title ?? "",
          summary: p.summary ?? "",
          description: p.description ?? "",
          startingPriceKrw: p.startingPriceKrw ?? null,
          durationDays: p.durationDays ?? null,
        });
        if (p.tags) {
          setTags({
            field: p.tags.filter((t: { category: string }) => t.category === "field").map((t: { id: string }) => t.id),
            skill: p.tags.filter((t: { category: string }) => t.category === "skill").map((t: { id: string }) => t.id),
            tool: p.tags.filter((t: { category: string }) => t.category === "tool").map((t: { id: string }) => t.id),
            style: p.tags.filter((t: { category: string }) => t.category === "style").map((t: { id: string }) => t.id),
          });
        }
        if (p.images) {
          setImages(
            p.images.map(
              (img: { id: string; url: string; caption: string; isCover: boolean; sortOrder: number }, idx: number) => ({
                id: img.id,
                previewUrl: img.url,
                caption: img.caption ?? "",
                isCover: img.isCover ?? idx === 0,
                sortOrder: img.sortOrder ?? idx,
              })
            )
          );
        }
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
