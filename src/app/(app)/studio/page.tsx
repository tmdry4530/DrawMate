"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";
import {
  Plus,
  ImageIcon,
  MessageSquare,
  Share2,
  BarChart3,
  UserCog,
  Upload,
  Star,
  ArrowRight,
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
  const completionPercent = Math.min(100, publishedCount > 0 ? 85 : 40);

  const recentActivity = [
    { id: "1", icon: Upload, label: "새 에셋이 업로드됨", time: "2시간 전" },
    { id: "2", icon: MessageSquare, label: "새 메시지 수신", time: "5시간 전" },
    { id: "3", icon: Star, label: "포트폴리오가 추천됨", time: "어제" },
  ];

  return (
    <div className="min-h-screen bg-black text-white -mt-20 pt-20">
      <div className="p-6 md:p-12 space-y-12 max-w-[1600px] mx-auto">
        {/* Header */}
        <section className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 border-b-4 border-white pb-8">
          <h1 className="text-4xl md:text-6xl font-black tracking-tighter uppercase">
            Studio Dashboard
          </h1>
          <Link
            href="/studio/portfolios/new"
            className="bg-white text-black px-8 md:px-10 py-4 md:py-5 font-black text-base md:text-lg tracking-tighter uppercase hover:bg-neutral-200 shrink-0"
          >
            새 포트폴리오
          </Link>
        </section>

        {/* Metrics */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-0">
          <div className="border border-neutral-800 p-8 space-y-4 bg-[#0e0e0e]">
            <span className="text-neutral-400 text-sm font-bold uppercase tracking-widest">
              Views
            </span>
            <div className="flex items-baseline justify-between">
              <span className="text-4xl md:text-5xl font-black">
                {loading ? "—" : totalViews.toLocaleString()}
              </span>
              <span className="text-white text-sm font-bold">+12%</span>
            </div>
          </div>
          <div className="border border-neutral-800 md:border-l-0 p-8 space-y-4 bg-[#0e0e0e]">
            <span className="text-neutral-400 text-sm font-bold uppercase tracking-widest">
              Bookmarks
            </span>
            <div className="flex items-baseline justify-between">
              <span className="text-4xl md:text-5xl font-black">
                {loading ? "—" : (publishedCount * 2).toLocaleString()}
              </span>
              <span className="text-white text-sm font-bold">+5.2%</span>
            </div>
          </div>
          <div className="border border-neutral-800 md:border-l-0 p-8 space-y-4 bg-[#0e0e0e]">
            <span className="text-neutral-400 text-sm font-bold uppercase tracking-widest">
              Messages
            </span>
            <div className="flex items-baseline justify-between">
              <span className="text-4xl md:text-5xl font-black">
                {loading ? "—" : "0"}
              </span>
              <span className="text-neutral-500 text-sm font-bold">—</span>
            </div>
          </div>
        </section>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12 items-start">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-12">
            {/* Featured Work */}
            <div className="bg-[#1b1b1b] p-6 md:p-10 space-y-8">
              <h3 className="text-2xl font-black uppercase tracking-tighter">
                Featured Work
              </h3>
              {loading ? (
                <div className="aspect-video bg-neutral-800 animate-pulse" />
              ) : featuredPortfolio ? (
                <>
                  <div className="aspect-video bg-neutral-900 relative overflow-hidden">
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
                        <ImageIcon className="w-12 h-12 text-neutral-700" />
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <h4 className="text-2xl md:text-3xl font-black uppercase">
                        {featuredPortfolio.title || "제목 없음"}
                      </h4>
                      <p className="text-neutral-500 font-bold uppercase mt-2 text-sm">
                        {featuredPortfolio.status === "published" ? "PUBLISHED" : "DRAFT"} / {new Date(featuredPortfolio.createdAt).getFullYear()}
                      </p>
                    </div>
                    {featuredPortfolio.status === "published" && (
                      <Link
                        href={`/portfolio/${featuredPortfolio.slug}`}
                        className="border-2 border-white px-8 py-3 font-bold uppercase tracking-tighter hover:bg-white hover:text-black shrink-0"
                      >
                        갤러리 보기
                      </Link>
                    )}
                  </div>
                </>
              ) : (
                <div className="py-16 text-center border border-dashed border-neutral-700">
                  <ImageIcon className="w-10 h-10 mx-auto mb-3 text-neutral-600" />
                  <p className="text-neutral-500 mb-4">아직 포트폴리오가 없습니다</p>
                  <Link
                    href="/studio/portfolios/new"
                    className="inline-block bg-white text-black px-8 py-3 font-black uppercase"
                  >
                    <Plus className="w-4 h-4 inline mr-2" />
                    포트폴리오 등록
                  </Link>
                </div>
              )}
            </div>

            {/* Recent Activity */}
            <div className="space-y-6">
              <h3 className="text-2xl font-black uppercase tracking-tighter">
                Recent Activity
              </h3>
              <div className="border-y border-neutral-800">
                {recentActivity.map((item, i) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.id}
                      className={`py-6 flex items-center justify-between group cursor-pointer hover:bg-[#1f1f1f] px-4 ${i > 0 ? "border-t border-neutral-800" : ""}`}
                    >
                      <div className="flex items-center gap-6">
                        <Icon className="w-5 h-5 text-neutral-600" />
                        <div>
                          <p className="font-bold uppercase tracking-tight text-sm">
                            {item.label}
                          </p>
                          <p className="text-xs text-neutral-500">{item.time}</p>
                        </div>
                      </div>
                      <ArrowRight className="w-5 h-5 opacity-0 group-hover:opacity-100" />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-12">
            {/* Gauge */}
            <div className="bg-[#2a2a2a] p-6 md:p-10 space-y-8">
              <h3 className="text-2xl font-black uppercase tracking-tighter">
                완성도 게이지
              </h3>
              <div className="relative h-52 md:h-64 flex items-center justify-center">
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-5xl md:text-7xl font-black">
                    {completionPercent}%
                  </span>
                </div>
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="#353535"
                    strokeWidth="12"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="#FFFFFF"
                    strokeWidth="12"
                    strokeDasharray={`${(completionPercent / 100) * 251} 251`}
                    strokeLinecap="butt"
                  />
                </svg>
              </div>
              <p className="text-center text-neutral-500 font-bold uppercase text-sm">
                Portfolio Completion Status
              </p>
            </div>

            {/* Quick Actions */}
            <div className="space-y-6">
              <h3 className="text-2xl font-black uppercase tracking-tighter">
                Quick Actions
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <Link
                  href="/studio/portfolios/new"
                  className="bg-[#1b1b1b] border border-neutral-800 aspect-square flex flex-col items-center justify-center gap-4 hover:bg-white hover:text-black group"
                >
                  <Plus className="w-10 h-10" />
                  <span className="font-black uppercase tracking-widest text-xs">
                    작업추가
                  </span>
                </Link>
                <Link
                  href="/studio/portfolios"
                  className="bg-[#1b1b1b] border border-neutral-800 aspect-square flex flex-col items-center justify-center gap-4 hover:bg-white hover:text-black group"
                >
                  <Share2 className="w-10 h-10" />
                  <span className="font-black uppercase tracking-widest text-xs">
                    공유
                  </span>
                </Link>
                <Link
                  href="/studio/portfolios"
                  className="bg-[#1b1b1b] border border-neutral-800 aspect-square flex flex-col items-center justify-center gap-4 hover:bg-white hover:text-black group"
                >
                  <BarChart3 className="w-10 h-10" />
                  <span className="font-black uppercase tracking-widest text-xs">
                    인사이트
                  </span>
                </Link>
                <Link
                  href="/settings"
                  className="bg-[#1b1b1b] border border-neutral-800 aspect-square flex flex-col items-center justify-center gap-4 hover:bg-white hover:text-black group"
                >
                  <UserCog className="w-10 h-10" />
                  <span className="font-black uppercase tracking-widest text-xs">
                    프로필
                  </span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
