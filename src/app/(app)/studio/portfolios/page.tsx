"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, ImageIcon, Edit2, Eye, Trash2 } from "lucide-react";
import { unwrapApiData } from "@/lib/utils/client-api";

interface Portfolio {
  id: string;
  slug: string;
  title: string;
  status: "draft" | "published" | "archived";
  coverImageUrl?: string;
  viewCount?: number;
  createdAt: string;
  updatedAt?: string;
}

const STATUS_LABELS: Record<string, string> = {
  all: "전체",
  draft: "임시저장",
  published: "공개",
  archived: "보관",
};

const STATUS_BADGE_VARIANTS: Record<string, "default" | "secondary" | "outline"> = {
  draft: "secondary",
  published: "default",
  archived: "outline",
};

export default function PortfoliosPage() {
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"all" | "draft" | "published" | "archived">("all");

  useEffect(() => {
    fetch("/api/v1/portfolios/mine")
      .then((res) => res.json())
      .then((json) => {
        const data = unwrapApiData<{ items: Portfolio[] }>(json);
        setPortfolios(data?.items ?? []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered =
    activeTab === "all"
      ? portfolios
      : portfolios.filter((p) => p.status === activeTab);

  const handleDelete = async (id: string) => {
    if (!confirm("포트폴리오를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.")) return;
    try {
      const res = await fetch(`/api/v1/portfolios/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("삭제에 실패했습니다.");
      setPortfolios((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      alert((err as Error).message);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">포트폴리오 관리</h1>
          <p className="text-muted-foreground text-sm mt-1">
            등록한 포트폴리오를 관리하세요.
          </p>
        </div>
        <Button asChild>
          <Link href="/studio/portfolios/new">
            <Plus className="w-4 h-4 mr-2" />
            새 포트폴리오
          </Link>
        </Button>
      </div>

      {/* 상태 필터 탭 */}
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as typeof activeTab)}
        className="mb-6"
      >
        <TabsList>
          {(["all", "published", "draft", "archived"] as const).map((tab) => {
            const count =
              tab === "all"
                ? portfolios.length
                : portfolios.filter((p) => p.status === tab).length;
            return (
              <TabsTrigger key={tab} value={tab}>
                {STATUS_LABELS[tab]}
                {count > 0 && (
                  <span className="ml-1.5 text-xs bg-muted rounded-full px-1.5 py-0.5">
                    {count}
                  </span>
                )}
              </TabsTrigger>
            );
          })}
        </TabsList>
      </Tabs>

      {/* 포트폴리오 목록 */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 bg-muted rounded-lg animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed rounded-xl">
          <ImageIcon className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
          <p className="font-medium mb-1">
            {activeTab === "all"
              ? "포트폴리오가 없습니다"
              : `${STATUS_LABELS[activeTab]} 상태의 포트폴리오가 없습니다`}
          </p>
          {activeTab === "all" && (
            <Button asChild size="sm" className="mt-3">
              <Link href="/studio/portfolios/new">
                <Plus className="w-4 h-4 mr-1" />
                새 포트폴리오
              </Link>
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((portfolio) => (
            <Card key={portfolio.id}>
              <CardContent className="p-4 flex items-center gap-4">
                {/* 썸네일 */}
                <div className="w-20 h-14 rounded-md bg-muted overflow-hidden shrink-0">
                  {portfolio.coverImageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={portfolio.coverImageUrl}
                      alt={portfolio.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon className="w-5 h-5 text-muted-foreground" />
                    </div>
                  )}
                </div>

                {/* 정보 */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium truncate">
                      {portfolio.title || "제목 없음"}
                    </p>
                    <Badge
                      variant={STATUS_BADGE_VARIANTS[portfolio.status]}
                      className="text-xs shrink-0"
                    >
                      {STATUS_LABELS[portfolio.status]}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {portfolio.viewCount !== undefined && (
                      <span className="mr-3">조회 {portfolio.viewCount}</span>
                    )}
                    수정일{" "}
                    {new Date(
                      portfolio.updatedAt ?? portfolio.createdAt
                    ).toLocaleDateString("ko-KR")}
                  </p>
                </div>

                {/* 액션 버튼 */}
                <div className="flex items-center gap-2 shrink-0">
                  <Button size="sm" variant="outline" asChild>
                    <Link href={`/studio/portfolios/${portfolio.id}/edit`}>
                      <Edit2 className="w-3.5 h-3.5 mr-1" />
                      편집
                    </Link>
                  </Button>
                  {portfolio.status === "published" && (
                    <Button size="sm" variant="outline" asChild>
                      <Link href={`/portfolio/${portfolio.slug}`}>
                        <Eye className="w-3.5 h-3.5 mr-1" />
                        보기
                      </Link>
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-red-500 hover:text-red-600 hover:bg-red-50"
                    onClick={() => handleDelete(portfolio.id)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
