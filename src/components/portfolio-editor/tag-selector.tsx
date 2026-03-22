"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { useEditorStore } from "@/store/editor-store";
import { cn } from "@/lib/utils";

interface Tag {
  id: string;
  name: string;
  category: "field" | "skill" | "tool" | "style";
}

const CATEGORY_LABELS: Record<string, string> = {
  field: "분야",
  skill: "스킬",
  tool: "도구",
  style: "스타일",
};

const CATEGORY_LIMITS: Record<string, { min?: number; max: number }> = {
  field: { min: 1, max: 3 },
  skill: { max: 10 },
  tool: { max: 5 },
  style: { max: 5 },
};

export function TagSelector() {
  const { tags, setTags } = useEditorStore();
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/v1/tags")
      .then((res) => {
        if (!res.ok) throw new Error("태그 목록을 불러오지 못했습니다.");
        return res.json();
      })
      .then((data) => {
        setAllTags(data?.tags ?? data ?? []);
      })
      .catch((err) => {
        setError(err.message);
      })
      .finally(() => setLoading(false));
  }, []);

  const grouped = (["field", "skill", "tool", "style"] as const).map(
    (category) => ({
      category,
      tags: allTags.filter((t) => t.category === category),
    })
  );

  const toggleTag = (tag: Tag) => {
    const category = tag.category;
    const current = tags[category];
    const { max } = CATEGORY_LIMITS[category];

    if (current.includes(tag.id)) {
      setTags({ [category]: current.filter((id) => id !== tag.id) });
    } else {
      if (current.length >= max) return;
      setTags({ [category]: [...current, tag.id] });
    }
  };

  if (loading) {
    return (
      <div>
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-2">태그 선택</h2>
        </div>
        <div className="space-y-6">
          {(["field", "skill", "tool", "style"] as const).map((cat) => (
            <div key={cat}>
              <div className="h-4 w-16 bg-muted rounded animate-pulse mb-3" />
              <div className="flex flex-wrap gap-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-7 w-16 bg-muted rounded-full animate-pulse" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-2">태그 선택</h2>
        </div>
        <p className="text-red-500 text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">태그 선택</h2>
        <p className="text-muted-foreground">
          작품과 관련된 태그를 선택하세요. 카테고리별 선택 한도가 있습니다.
        </p>
      </div>

      <div className="space-y-6">
        {grouped.map(({ category, tags: categoryTags }) => {
          const selected = tags[category];
          const { min, max } = CATEGORY_LIMITS[category];
          const limitLabel = min ? `${min}~${max}개` : `최대 ${max}개`;
          const atLimit = selected.length >= max;

          return (
            <div key={category}>
              <div className="flex items-center gap-2 mb-3">
                <h3 className="font-medium">{CATEGORY_LABELS[category]}</h3>
                <span className="text-xs text-muted-foreground">{limitLabel}</span>
                <span
                  className={cn(
                    "text-xs ml-auto",
                    atLimit ? "text-red-500 font-medium" : "text-muted-foreground"
                  )}
                >
                  {selected.length}/{max}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {categoryTags.length === 0 ? (
                  <p className="text-sm text-muted-foreground">태그가 없습니다.</p>
                ) : (
                  categoryTags.map((tag) => {
                    const isSelected = selected.includes(tag.id);
                    const isDisabled = !isSelected && atLimit;

                    return (
                      <Badge
                        key={tag.id}
                        variant={isSelected ? "default" : "outline"}
                        className={cn(
                          "cursor-pointer select-none transition-colors",
                          isDisabled && "opacity-40 cursor-not-allowed"
                        )}
                        onClick={() => !isDisabled && toggleTag(tag)}
                      >
                        {tag.name}
                      </Badge>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
