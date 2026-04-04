"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { useEditorStore } from "@/store/editor-store";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { unwrapApiData } from "@/lib/utils/client-api";

interface Template {
  id: string;
  name: string;
  description?: string;
  previewImageUrl?: string | null;
}

const SKELETON_CARD_COUNT = 3;
const ACCENT_COLORS = ["bg-gray-900", "bg-blue-600", "bg-amber-700"];
const BG_COLORS = ["bg-gray-50", "bg-slate-50", "bg-amber-50"];

function TemplateCardSkeleton({ index }: { index: number }) {
  const accent = ACCENT_COLORS[index % ACCENT_COLORS.length];
  const bg = BG_COLORS[index % BG_COLORS.length];

  return (
    <Card className="pointer-events-none animate-pulse border-2 border-transparent opacity-70 transition-all">
      <CardContent className="p-0">
        <div className={cn("relative flex h-40 items-center justify-center rounded-t-lg", bg)}>
          <div className="w-3/4 space-y-2 opacity-60">
            <div className={cn("h-3 rounded", accent)} />
            <div className="h-2 w-5/6 rounded bg-gray-300" />
            <div className="h-2 w-4/6 rounded bg-gray-200" />
            <div className="mt-3 flex gap-1">
              <div className="h-10 flex-1 rounded border border-gray-200" />
              <div className="h-10 flex-1 rounded border border-gray-200" />
            </div>
          </div>
        </div>
        <div className="p-4">
          <div className="mb-1 flex items-center gap-2">
            <h3 className="font-semibold">템플릿 불러오는 중</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            레이아웃 옵션을 준비하고 있습니다.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function TemplateCard({
  template,
  index,
  isSelected,
  onSelect,
}: {
  template: Template;
  index: number;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const accent = ACCENT_COLORS[index % ACCENT_COLORS.length];
  const bg = BG_COLORS[index % BG_COLORS.length];

  return (
    <Card
      className={cn(
        "cursor-pointer border-2 transition-all",
        isSelected
          ? "border-primary shadow-md"
          : "border-transparent hover:border-muted-foreground/30"
      )}
      onClick={onSelect}
    >
      <CardContent className="p-0">
        <div className={cn("relative flex h-40 items-center justify-center rounded-t-lg", bg)}>
          {template.previewImageUrl ? (
            <Image
              src={template.previewImageUrl}
              alt={template.name}
              fill
              sizes="(max-width: 640px) 100vw, 33vw"
              className="rounded-t-lg object-cover"
            />
          ) : (
            <div className="w-3/4 space-y-2 opacity-60">
              <div className={cn("h-3 rounded", accent)} />
              <div className="h-2 w-5/6 rounded bg-gray-300" />
              <div className="h-2 w-4/6 rounded bg-gray-200" />
              <div className="mt-3 flex gap-1">
                <div className="h-10 flex-1 rounded border border-gray-200" />
                <div className="h-10 flex-1 rounded border border-gray-200" />
              </div>
            </div>
          )}
          {isSelected && (
            <div className="absolute right-2 top-2 rounded-full bg-primary p-0.5 text-primary-foreground">
              <Check className="h-4 w-4" />
            </div>
          )}
        </div>
        <div className="p-4">
          <div className="mb-1 flex items-center gap-2">
            <h3 className="font-semibold">{template.name}</h3>
            {isSelected && (
              <span className="rounded bg-primary/10 px-1.5 py-0.5 text-xs text-primary">
                선택됨
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {template.description ?? "설명이 준비되지 않았습니다."}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export function TemplateSelector() {
  const { selectedTemplateId, setTemplate } = useEditorStore();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    fetch("/api/v1/templates")
      .then((res) => {
        if (!res.ok) throw new Error("templates fetch failed");
        return res.json();
      })
      .then((json) => {
        if (!mounted) return;
        const list = unwrapApiData<Template[]>(json);
        if (Array.isArray(list) && list.length > 0) {
          setTemplates(list);
          setLoadError(null);
          return;
        }

        setLoadError("사용 가능한 템플릿이 없습니다.");
      })
      .catch(() => {
        if (!mounted) return;
        setLoadError("템플릿을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div>
      <div className="mb-6">
        <h2 className="mb-2 text-2xl font-bold">템플릿 선택</h2>
        <p className="text-muted-foreground">
          포트폴리오에 어울리는 레이아웃 템플릿을 선택하세요.
        </p>
      </div>

      {loadError && (
        <div className="mb-4 border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          {loadError}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {loading
          ? Array.from({ length: SKELETON_CARD_COUNT }).map((_, idx) => (
              <TemplateCardSkeleton key={`template-skeleton-${idx}`} index={idx} />
            ))
          : templates.map((template, idx) => (
              <TemplateCard
                key={template.id}
                template={template}
                index={idx}
                isSelected={selectedTemplateId === template.id}
                onSelect={() => setTemplate(template.id)}
              />
            ))}
      </div>
    </div>
  );
}
