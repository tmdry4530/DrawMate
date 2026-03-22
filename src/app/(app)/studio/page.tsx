"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, ImageIcon, Edit2, Eye } from "lucide-react";

interface Portfolio {
  id: string;
  title: string;
  status: "draft" | "published" | "archived";
  coverImageUrl?: string;
  viewCount?: number;
  createdAt: string;
}

const STATUS_LABELS: Record<string, string> = {
  draft: "임시저장",
  published: "공개",
  archived: "보관",
};

const STATUS_VARIANTS: Record<string, "default" | "secondary" | "outline"> = {
  draft: "secondary",
  published: "default",
  archived: "outline",
};

export default function StudioPage() {
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/v1/portfolios/mine")
      .then((res) => res.json())
      .then((data) => setPortfolios(data?.portfolios ?? data ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const recentPortfolios = portfolios.slice(0, 6);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">스튜디오</h1>
          <p className="text-muted-foreground text-sm mt-1">
            포트폴리오를 관리하고 새 작품을 등록하세요.
          </p>
        </div>
        <Button asChild>
          <Link href="/studio/portfolios/new">
            <Plus className="w-4 h-4 mr-2" />
            새 포트폴리오
          </Link>
        </Button>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { label: "전체", value: portfolios.length },
          { label: "공개", value: portfolios.filter((p) => p.status === "published").length },
          { label: "임시저장", value: portfolios.filter((p) => p.status === "draft").length },
          { label: "보관", value: portfolios.filter((p) => p.status === "archived").length },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 최근 포트폴리오 */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">최근 포트폴리오</h2>
          <Link
            href="/studio/portfolios"
            className="text-sm text-muted-foreground hover:text-foreground underline"
          >
            전체 보기
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="aspect-video bg-muted rounded-lg animate-pulse" />
            ))}
          </div>
        ) : recentPortfolios.length === 0 ? (
          <div className="text-center py-16 border-2 border-dashed rounded-xl">
            <ImageIcon className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
            <p className="font-medium mb-1">아직 포트폴리오가 없습니다</p>
            <p className="text-sm text-muted-foreground mb-4">
              첫 번째 작품을 등록해 보세요.
            </p>
            <Button asChild size="sm">
              <Link href="/studio/portfolios/new">
                <Plus className="w-4 h-4 mr-1" />
                새 포트폴리오
              </Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {recentPortfolios.map((portfolio) => (
              <Card key={portfolio.id} className="overflow-hidden group">
                <div className="aspect-video bg-muted relative">
                  {portfolio.coverImageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={portfolio.coverImageUrl}
                      alt={portfolio.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon className="w-8 h-8 text-muted-foreground" />
                    </div>
                  )}
                  {/* 호버 액션 */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Button size="sm" variant="secondary" asChild>
                      <Link href={`/studio/portfolios/${portfolio.id}/edit`}>
                        <Edit2 className="w-3.5 h-3.5 mr-1" />
                        편집
                      </Link>
                    </Button>
                    {portfolio.status === "published" && (
                      <Button size="sm" variant="secondary" asChild>
                        <Link href={`/portfolios/${portfolio.id}`}>
                          <Eye className="w-3.5 h-3.5 mr-1" />
                          보기
                        </Link>
                      </Button>
                    )}
                  </div>
                </div>
                <CardContent className="p-3">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium line-clamp-1 flex-1">
                      {portfolio.title || "제목 없음"}
                    </p>
                    <Badge
                      variant={STATUS_VARIANTS[portfolio.status]}
                      className="text-xs shrink-0"
                    >
                      {STATUS_LABELS[portfolio.status]}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
