"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, ImageIcon, Edit2, Eye, Trash2, MoreVertical } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { unwrapApiData } from "@/lib/utils/client-api";
import { cn } from "@/lib/utils";

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

const STATUS_BADGE: Record<string, string> = {
  published: "bg-green-100 text-green-700",
  draft: "bg-amber-100 text-amber-700",
  archived: "bg-muted text-muted-foreground",
};

export default function PortfoliosPage() {
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"all" | "draft" | "published" | "archived">("all");

  useEffect(() => {
    let mounted = true;
    const loadPortfolios = async () => {
      try {
        const res = await fetch("/api/v1/portfolios/mine");
        if (!res.ok) {
          throw new Error("포트폴리오 목록을 불러오지 못했습니다.");
        }
        const json = await res.json();
        const data = unwrapApiData<{ items: Portfolio[] }>(json);
        if (mounted) {
          setPortfolios(data?.items ?? []);
        }
      } catch (err) {
        if (mounted) {
          toast.error((err as Error).message);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    void loadPortfolios();
    return () => {
      mounted = false;
    };
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
      toast.success("포트폴리오가 삭제되었습니다.");
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* 헤더 */}
      <div className="flex items-end justify-between mb-8">
        <div>
          <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase mb-1">
            YOUR CREATIVE STUDIO
          </p>
          <h1 className="text-3xl font-bold tracking-tight">Portfolios</h1>
        </div>
        <Button
          asChild
          className="bg-gradient-to-r from-violet-600 to-purple-500 hover:from-violet-700 hover:to-purple-600 text-white shadow-md shadow-purple-200 border-0"
        >
          <Link href="/studio/portfolios/new">
            <Plus className="w-4 h-4 mr-2" />
            새 포트폴리오 만들기
          </Link>
        </Button>
      </div>

      {/* 상태 필터 탭 */}
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as typeof activeTab)}
        className="mb-6"
      >
        <TabsList className="bg-muted/50">
          {(["all", "published", "draft", "archived"] as const).map((tab) => {
            const count =
              tab === "all"
                ? portfolios.length
                : portfolios.filter((p) => p.status === tab).length;
            return (
              <TabsTrigger key={tab} value={tab} className="text-sm">
                {STATUS_LABELS[tab]}
                {count > 0 && (
                  <span className="ml-1.5 text-xs bg-background/80 rounded-full px-1.5 py-0.5 font-medium">
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-xl bg-muted animate-pulse aspect-[4/3]" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-24 border-2 border-dashed rounded-2xl bg-muted/20">
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
            <ImageIcon className="w-8 h-8 text-muted-foreground" />
          </div>
          <p className="font-semibold text-lg mb-1">
            {activeTab === "all"
              ? "포트폴리오가 없습니다"
              : `${STATUS_LABELS[activeTab]} 상태의 포트폴리오가 없습니다`}
          </p>
          <p className="text-sm text-muted-foreground mb-5">
            {activeTab === "all"
              ? "첫 번째 포트폴리오를 만들어 보세요."
              : "다른 탭을 확인해 보세요."}
          </p>
          {activeTab === "all" && (
            <Button
              asChild
              className="bg-gradient-to-r from-violet-600 to-purple-500 hover:from-violet-700 hover:to-purple-600 text-white border-0"
            >
              <Link href="/studio/portfolios/new">
                <Plus className="w-4 h-4 mr-1" />
                새 포트폴리오 만들기
              </Link>
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((portfolio) => (
            <div
              key={portfolio.id}
              className="group bg-card rounded-xl overflow-hidden shadow-sm border hover:shadow-md hover:border-primary/30 transition-all duration-200"
            >
              {/* 썸네일 */}
              <div className="aspect-[4/3] bg-muted relative overflow-hidden">
                {portfolio.coverImageUrl ? (
                  <Image
                    src={portfolio.coverImageUrl}
                    alt={portfolio.title}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon className="w-10 h-10 text-muted-foreground/40" />
                  </div>
                )}

                {/* 호버 오버레이 */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-2">
                  <Button size="sm" variant="secondary" asChild>
                    <Link href={`/studio/portfolios/${portfolio.id}/edit`}>
                      <Edit2 className="w-3.5 h-3.5 mr-1.5" />
                      편집
                    </Link>
                  </Button>
                  {portfolio.status === "published" && (
                    <Button size="sm" variant="secondary" asChild>
                      <Link href={`/portfolio/${portfolio.slug}`} target="_blank">
                        <Eye className="w-3.5 h-3.5 mr-1.5" />
                        보기
                      </Link>
                    </Button>
                  )}
                </div>

                {/* 상태 배지 */}
                <div className="absolute top-2.5 left-2.5">
                  <span
                    className={cn(
                      "text-xs font-semibold px-2 py-0.5 rounded-full",
                      STATUS_BADGE[portfolio.status]
                    )}
                  >
                    {STATUS_LABELS[portfolio.status]}
                  </span>
                </div>

                {/* 더보기 메뉴 */}
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        size="icon"
                        variant="secondary"
                        className="w-7 h-7 rounded-full shadow"
                      >
                        <MoreVertical className="w-3.5 h-3.5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-36">
                      <DropdownMenuItem asChild>
                        <Link href={`/studio/portfolios/${portfolio.id}/edit`}>
                          <Edit2 className="w-3.5 h-3.5 mr-2" />
                          편집
                        </Link>
                      </DropdownMenuItem>
                      {portfolio.status === "published" && (
                        <DropdownMenuItem asChild>
                          <Link href={`/portfolio/${portfolio.slug}`} target="_blank">
                            <Eye className="w-3.5 h-3.5 mr-2" />
                            보기
                          </Link>
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem
                        className="text-red-600 focus:text-red-600 focus:bg-red-50"
                        onClick={() => void handleDelete(portfolio.id)}
                      >
                        <Trash2 className="w-3.5 h-3.5 mr-2" />
                        삭제
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {/* 카드 하단 */}
              <div className="p-3.5">
                <p className="font-semibold text-sm truncate mb-1">
                  {portfolio.title || "제목 없음"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {portfolio.viewCount !== undefined && (
                    <span className="mr-2">조회 {portfolio.viewCount}</span>
                  )}
                  수정일{" "}
                  {new Date(
                    portfolio.updatedAt ?? portfolio.createdAt
                  ).toLocaleDateString("ko-KR")}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
