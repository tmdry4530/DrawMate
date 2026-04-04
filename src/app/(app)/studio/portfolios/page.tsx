"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";
import { ImageIcon, Edit2, Eye, Trash2, MoreVertical } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  draft: "초안",
  published: "발행됨",
  archived: "보관됨",
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
        if (!res.ok) throw new Error("포트폴리오 목록을 불러오지 못했습니다.");
        const json = await res.json();
        const data = unwrapApiData<{ items: Portfolio[] }>(json);
        if (mounted) setPortfolios(data?.items ?? []);
      } catch (err) {
        if (mounted) toast.error((err as Error).message);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    void loadPortfolios();
    return () => { mounted = false; };
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

  const tabs = ["all", "published", "draft", "archived"] as const;

  return (
    <div className="min-h-screen bg-black text-white -mt-20 pt-20">
      <div className="p-6 md:p-12 max-w-[1600px] mx-auto space-y-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
          <div>
            <p className="text-neutral-500 text-sm font-bold uppercase tracking-widest mb-2">
              관리 및 편집이 가능한 작업물 목록입니다.
            </p>
            <h1 className="text-4xl md:text-6xl font-black tracking-tighter italic">
              Portfolios
            </h1>
          </div>
          <Link
            href="/studio/portfolios/new"
            className="bg-white text-black px-8 py-4 font-black uppercase tracking-tighter hover:bg-neutral-200 shrink-0"
          >
            새로 만들기
          </Link>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-0 border-b border-neutral-800">
          {tabs.map((tab) => {
            const count =
              tab === "all"
                ? portfolios.length
                : portfolios.filter((p) => p.status === tab).length;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-3 font-bold uppercase tracking-wider text-sm border-b-2 ${
                  activeTab === tab
                    ? "text-white border-white"
                    : "text-neutral-500 border-transparent hover:text-white"
                }`}
              >
                {STATUS_LABELS[tab]}
                {count > 0 && (
                  <span className="ml-2 text-xs text-neutral-500">{count}</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Portfolio Table */}
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-20 bg-neutral-900 animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-24 text-center border border-dashed border-neutral-800">
            <ImageIcon className="w-10 h-10 mx-auto mb-3 text-neutral-700" />
            <p className="font-bold uppercase mb-1">
              {activeTab === "all"
                ? "포트폴리오가 없습니다"
                : `${STATUS_LABELS[activeTab]} 상태의 포트폴리오가 없습니다`}
            </p>
            <p className="text-sm text-neutral-500 mb-6">
              {activeTab === "all"
                ? "첫 번째 포트폴리오를 만들어 보세요."
                : "다른 탭을 확인해 보세요."}
            </p>
            {activeTab === "all" && (
              <Link
                href="/studio/portfolios/new"
                className="inline-block bg-white text-black px-8 py-3 font-black uppercase"
              >
                새 포트폴리오 만들기
              </Link>
            )}
          </div>
        ) : (
          <div>
            {/* Table Header */}
            <div className="hidden md:grid grid-cols-[80px_1fr_120px_140px_100px] gap-4 px-4 py-3 text-xs font-bold uppercase tracking-widest text-neutral-500 border-b border-neutral-800">
              <span>Thumbnail</span>
              <span>Title &amp; Status</span>
              <span>Views</span>
              <span>Date</span>
              <span>Actions</span>
            </div>

            {/* Table Rows */}
            <div className="divide-y divide-neutral-800">
              {filtered.map((portfolio) => (
                <div
                  key={portfolio.id}
                  className="grid grid-cols-1 md:grid-cols-[80px_1fr_120px_140px_100px] gap-4 items-center px-4 py-5 hover:bg-neutral-900/50 group"
                >
                  {/* Thumbnail */}
                  <div className="w-16 h-16 md:w-20 md:h-16 bg-neutral-900 relative overflow-hidden shrink-0">
                    {portfolio.coverImageUrl ? (
                      <Image
                        src={portfolio.coverImageUrl}
                        alt={portfolio.title}
                        fill
                        sizes="80px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon className="w-5 h-5 text-neutral-700" />
                      </div>
                    )}
                  </div>

                  {/* Title + Status */}
                  <div className="min-w-0">
                    <h3 className="font-black text-lg uppercase tracking-tight truncate">
                      {portfolio.title || "제목 없음"}
                    </h3>
                    <span className="text-xs font-bold uppercase tracking-widest text-neutral-500">
                      {STATUS_LABELS[portfolio.status]}
                    </span>
                  </div>

                  {/* Views */}
                  <div>
                    <span className="text-lg font-black">
                      {(portfolio.viewCount ?? 0).toLocaleString()}
                    </span>
                    <p className="text-[10px] text-neutral-500 uppercase tracking-widest">
                      Total Views
                    </p>
                  </div>

                  {/* Date */}
                  <div>
                    <span className="text-sm font-bold">
                      {new Date(portfolio.updatedAt ?? portfolio.createdAt).toLocaleDateString("ko-KR")}
                    </span>
                    <p className="text-[10px] text-neutral-500 uppercase tracking-widest">
                      Last Edited
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/studio/portfolios/${portfolio.id}/edit`}
                      className="text-xs font-bold uppercase tracking-wider text-neutral-400 hover:text-white"
                    >
                      수정
                    </Link>
                    {portfolio.status === "published" && (
                      <Link
                        href={`/portfolio/${portfolio.slug}`}
                        target="_blank"
                        className="text-xs font-bold uppercase tracking-wider text-neutral-400 hover:text-white"
                      >
                        보기
                      </Link>
                    )}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="p-1 text-neutral-600 hover:text-white">
                          <MoreVertical className="w-4 h-4" />
                        </button>
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
                          className="text-red-500 focus:text-red-500"
                          onClick={() => void handleDelete(portfolio.id)}
                        >
                          <Trash2 className="w-3.5 h-3.5 mr-2" />
                          삭제
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
