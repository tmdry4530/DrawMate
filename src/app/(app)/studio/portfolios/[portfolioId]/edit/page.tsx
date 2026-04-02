"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useEditorStore } from "@/store/editor-store";
import { EditorWizard } from "@/components/portfolio-editor/editor-wizard";
import { unwrapApiData } from "@/lib/utils/client-api";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Eye, Loader2 } from "lucide-react";

export default function EditPortfolioPage() {
  const params = useParams();
  const router = useRouter();
  const portfolioId = params.portfolioId as string;
  const { setPortfolioId, setTemplate, setFormData, setTags, setImages, reset } =
    useEditorStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [portfolioSlug, setPortfolioSlug] = useState<string | null>(null);
  const [portfolioStatus, setPortfolioStatus] = useState<string | null>(null);

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
        if (typeof p.slug === "string") setPortfolioSlug(p.slug);
        if (typeof p.status === "string") setPortfolioStatus(p.status);
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
              clientId: crypto.randomUUID(),
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
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">포트폴리오를 불러오는 중...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-red-500 text-sm">{error}</p>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/studio/portfolios")}
          className="text-muted-foreground"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          목록으로 돌아가기
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* 편집 상단 바 */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur border-b px-4 py-2.5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Button
            variant="ghost"
            size="icon"
            asChild
            className="shrink-0 w-8 h-8 text-muted-foreground hover:text-foreground"
          >
            <Link href="/studio/portfolios">
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </Button>
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground uppercase tracking-widest font-medium hidden sm:block">
              포트폴리오 편집
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {portfolioStatus === "published" && portfolioSlug && (
            <Button variant="outline" size="sm" asChild>
              <Link href={`/portfolio/${portfolioSlug}`} target="_blank">
                <Eye className="w-3.5 h-3.5 mr-1.5" />
                미리보기
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* 에디터 위저드 */}
      <div className="flex-1">
        <EditorWizard onComplete={handleComplete} />
      </div>
    </div>
  );
}
