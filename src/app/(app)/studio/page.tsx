"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Plus,
  ImageIcon,
  Eye,
  Heart,
  MessageSquare,
  Share2,
  BarChart3,
  UserCog,
  TrendingUp,
  TrendingDown,
  Clock,
} from "lucide-react";
import { unwrapApiData } from "@/lib/utils/client-api";

interface Portfolio {
  id: string;
  slug: string;
  title: string;
  status: "draft" | "published" | "archived";
  coverImageUrl?: string;
  viewCount?: number;
  createdAt: string;
}

export default function StudioPage() {
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [loading, setLoading] = useState(true);

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

  const publishedCount = portfolios.filter((p) => p.status === "published").length;
  const featuredPortfolio = portfolios.find((p) => p.status === "published") ?? portfolios[0];
  const totalViews = portfolios.reduce((sum, p) => sum + (p.viewCount ?? 0), 0);

  // 프로필 완성도 (포트폴리오 등록 기준 간단 계산)
  const completionPercent = Math.min(100, publishedCount > 0 ? 80 : 40);
  const circumference = 2 * Math.PI * 36;
  const strokeDashoffset = circumference - (completionPercent / 100) * circumference;

  // 최근 활동 (포트폴리오 기반 모의 데이터)
  const recentActivity = portfolios.slice(0, 4).map((p) => ({
    id: p.id,
    type: "view" as const,
    label: `"${p.title || "제목 없음"}" 포트폴리오가 조회되었습니다`,
    time: p.createdAt,
  }));

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      {/* 헤더 */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-headline font-bold">Studio Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            안녕하세요! 오늘도 창작 활동을 이어가세요.
          </p>
        </div>
        <Button
          asChild
          className="shrink-0 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-0 shadow-md"
        >
          <Link href="/studio/portfolios/new">
            <Plus className="w-4 h-4 mr-2" />
            새 포트폴리오
          </Link>
        </Button>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* 조회수 */}
        <Card className="bg-card rounded-xl shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <Eye className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
                <TrendingUp className="w-3.5 h-3.5" />
                +12%
              </span>
            </div>
            <p className="text-3xl font-bold">{loading ? "—" : totalViews.toLocaleString()}</p>
            <p className="text-sm text-muted-foreground mt-1">전체 조회수</p>
          </CardContent>
        </Card>

        {/* 북마크 */}
        <Card className="bg-card rounded-xl shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 rounded-lg bg-pink-100 dark:bg-pink-900/30">
                <Heart className="w-5 h-5 text-pink-600 dark:text-pink-400" />
              </div>
              <span className="flex items-center gap-1 text-xs text-red-500 font-medium">
                <TrendingDown className="w-3.5 h-3.5" />
                -3%
              </span>
            </div>
            <p className="text-3xl font-bold">{loading ? "—" : publishedCount * 2}</p>
            <p className="text-sm text-muted-foreground mt-1">북마크</p>
          </CardContent>
        </Card>

        {/* 메시지 */}
        <Card className="bg-card rounded-xl shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                <MessageSquare className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
                <TrendingUp className="w-3.5 h-3.5" />
                +5%
              </span>
            </div>
            <p className="text-3xl font-bold">{loading ? "—" : 0}</p>
            <p className="text-sm text-muted-foreground mt-1">새 메시지</p>
          </CardContent>
        </Card>
      </div>

      {/* 메인 콘텐츠 그리드 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 왼쪽: 대표 포트폴리오 + 최근 활동 */}
        <div className="lg:col-span-2 space-y-6">
          {/* 대표 포트폴리오 */}
          <Card className="bg-card rounded-xl shadow-sm overflow-hidden">
            <CardContent className="p-0">
              <div className="px-6 pt-5 pb-3 flex items-center justify-between">
                <h2 className="font-semibold text-base">대표 포트폴리오</h2>
                <Button asChild variant="ghost" size="sm" className="text-xs text-muted-foreground">
                  <Link href="/studio/portfolios">전체 보기</Link>
                </Button>
              </div>

              {loading ? (
                <div className="mx-6 mb-6 aspect-video bg-muted rounded-lg animate-pulse" />
              ) : featuredPortfolio ? (
                <div className="mx-6 mb-6">
                  <div className="aspect-video bg-muted rounded-lg relative overflow-hidden group">
                    {featuredPortfolio.coverImageUrl ? (
                      <Image
                        src={featuredPortfolio.coverImageUrl}
                        alt={featuredPortfolio.title}
                        fill
                        sizes="(max-width: 1024px) 100vw, 66vw"
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon className="w-12 h-12 text-muted-foreground" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                      <div className="w-full flex items-end justify-between">
                        <p className="text-white font-medium truncate">
                          {featuredPortfolio.title || "제목 없음"}
                        </p>
                        {featuredPortfolio.status === "published" && (
                          <Button size="sm" variant="secondary" asChild className="shrink-0 ml-2">
                            <Link href={`/portfolio/${featuredPortfolio.slug}`}>
                              전체 갤러리 보기
                            </Link>
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                  <p className="mt-3 font-medium truncate">
                    {featuredPortfolio.title || "제목 없음"}
                  </p>
                  {featuredPortfolio.status === "published" && (
                    <Link
                      href={`/portfolio/${featuredPortfolio.slug}`}
                      className="text-sm text-primary hover:underline"
                    >
                      전체 갤러리 보기 →
                    </Link>
                  )}
                </div>
              ) : (
                <div className="mx-6 mb-6 py-12 border-2 border-dashed rounded-xl text-center">
                  <ImageIcon className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground mb-3">아직 포트폴리오가 없습니다</p>
                  <Button asChild size="sm">
                    <Link href="/studio/portfolios/new">
                      <Plus className="w-4 h-4 mr-1" />
                      포트폴리오 등록
                    </Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 최근 활동 */}
          <Card className="bg-card rounded-xl shadow-sm">
            <CardContent className="p-6">
              <h2 className="font-semibold text-base mb-4">최근 활동</h2>
              {loading ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="h-10 bg-muted rounded animate-pulse" />
                  ))}
                </div>
              ) : recentActivity.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  아직 활동 내역이 없습니다
                </p>
              ) : (
                <ul className="space-y-3">
                  {recentActivity.map((item) => (
                    <li key={item.id} className="flex items-start gap-3">
                      <div className="mt-0.5 p-1.5 rounded-full bg-blue-100 dark:bg-blue-900/30 shrink-0">
                        <Eye className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm line-clamp-1">{item.label}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3" />
                          {new Date(item.time).toLocaleDateString("ko-KR")}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        {/* 오른쪽: 프로필 완성도 + 빠른 실행 */}
        <div className="space-y-6">
          {/* 프로필 완성도 */}
          <Card className="bg-card rounded-xl shadow-sm">
            <CardContent className="p-6 text-center">
              <h2 className="font-semibold text-base mb-4">포트폴리오 완성도</h2>
              <div className="relative inline-flex items-center justify-center">
                <svg className="w-24 h-24 -rotate-90" viewBox="0 0 80 80">
                  <circle
                    cx="40"
                    cy="40"
                    r="36"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="6"
                    className="text-muted"
                  />
                  <circle
                    cx="40"
                    cy="40"
                    r="36"
                    fill="none"
                    stroke="url(#progressGradient)"
                    strokeWidth="6"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    className="transition-all duration-700"
                  />
                  <defs>
                    <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#a855f7" />
                      <stop offset="100%" stopColor="#ec4899" />
                    </linearGradient>
                  </defs>
                </svg>
                <span className="absolute text-xl font-bold">{completionPercent}%</span>
              </div>
              <p className="text-sm text-muted-foreground mt-3">
                {completionPercent < 100
                  ? "포트폴리오를 등록하면 완성도가 올라갑니다"
                  : "프로필이 완성되었습니다"}
              </p>
            </CardContent>
          </Card>

          {/* 빠른 실행 */}
          <Card className="bg-card rounded-xl shadow-sm">
            <CardContent className="p-6">
              <h2 className="font-semibold text-base mb-4">빠른 실행</h2>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  asChild
                  variant="outline"
                  className="h-auto flex-col gap-2 py-4 hover:bg-muted"
                >
                  <Link href="/studio/portfolios/new">
                    <Plus className="w-5 h-5 text-primary" />
                    <span className="text-xs font-medium">작품 추가</span>
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="h-auto flex-col gap-2 py-4 hover:bg-muted"
                >
                  <Link href="/studio/portfolios">
                    <Share2 className="w-5 h-5 text-primary" />
                    <span className="text-xs font-medium">작품 공유</span>
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="h-auto flex-col gap-2 py-4 hover:bg-muted"
                >
                  <Link href="/studio/portfolios">
                    <BarChart3 className="w-5 h-5 text-primary" />
                    <span className="text-xs font-medium">인사이트</span>
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="h-auto flex-col gap-2 py-4 hover:bg-muted"
                >
                  <Link href="/settings">
                    <UserCog className="w-5 h-5 text-primary" />
                    <span className="text-xs font-medium">프로필 편집</span>
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
