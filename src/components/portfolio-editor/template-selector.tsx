"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { useEditorStore } from "@/store/editor-store";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface Template {
  id: string;
  name: string;
  description?: string;
  previewImageUrl?: string;
}

const FALLBACK_TEMPLATES: Template[] = [
  { id: "minimal", name: "미니멀 그리드", description: "깔끔하고 심플한 레이아웃으로 작품에 집중" },
  { id: "full_showcase", name: "풀 쇼케이스", description: "대형 이미지 중심의 몰입감 있는 레이아웃" },
  { id: "compact_card", name: "콤팩트 카드", description: "카드형 그리드로 다양한 작품을 한눈에" },
];

const ACCENT_COLORS = ["bg-gray-900", "bg-blue-600", "bg-amber-700"];
const BG_COLORS = ["bg-gray-50", "bg-slate-50", "bg-amber-50"];

export function TemplateSelector() {
  const { selectedTemplateId, setTemplate } = useEditorStore();
  const [templates, setTemplates] = useState<Template[]>(FALLBACK_TEMPLATES);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/v1/templates")
      .then((res) => {
        if (!res.ok) throw new Error("templates fetch failed");
        return res.json();
      })
      .then((data) => {
        const list = data?.templates ?? data;
        if (Array.isArray(list) && list.length > 0) setTemplates(list);
      })
      .catch(() => {
        // fallback already set
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">템플릿 선택</h2>
        <p className="text-muted-foreground">
          포트폴리오에 어울리는 레이아웃 템플릿을 선택하세요.
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {templates.map((template, idx) => {
          const isSelected = selectedTemplateId === template.id;
          const accent = ACCENT_COLORS[idx % ACCENT_COLORS.length];
          const bg = BG_COLORS[idx % BG_COLORS.length];

          return (
            <Card
              key={template.id}
              className={cn(
                "cursor-pointer transition-all border-2",
                isSelected
                  ? "border-primary shadow-md"
                  : "border-transparent hover:border-muted-foreground/30",
                loading && "opacity-70"
              )}
              onClick={() => !loading && setTemplate(template.id)}
            >
              <CardContent className="p-0">
                <div
                  className={cn(
                    "relative h-40 rounded-t-lg flex items-center justify-center",
                    bg
                  )}
                >
                  {template.previewImageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={template.previewImageUrl}
                      alt={template.name}
                      className="w-full h-full object-cover rounded-t-lg"
                    />
                  ) : (
                    <div className="w-3/4 space-y-2 opacity-60">
                      <div className={cn("h-3 rounded", accent)} />
                      <div className="h-2 rounded bg-gray-300 w-5/6" />
                      <div className="h-2 rounded bg-gray-200 w-4/6" />
                      <div className="flex gap-1 mt-3">
                        <div className="h-10 flex-1 rounded border border-gray-200" />
                        <div className="h-10 flex-1 rounded border border-gray-200" />
                      </div>
                    </div>
                  )}
                  {isSelected && (
                    <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-0.5">
                      <Check className="w-4 h-4" />
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold">{template.name}</h3>
                    {isSelected && (
                      <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                        선택됨
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {template.description}
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
