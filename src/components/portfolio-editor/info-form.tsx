"use client";

import { Input } from "@/components/ui/input";
import { useEditorStore } from "@/store/editor-store";
import { cn } from "@/lib/utils";

const TITLE_MAX = 100;
const SUMMARY_MAX = 200;
const DESCRIPTION_MAX = 5000;

export function InfoForm() {
  const { formData, setFormData } = useEditorStore();

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">기본 정보</h2>
        <p className="text-muted-foreground">
          포트폴리오의 제목과 설명을 입력해 주세요.
        </p>
      </div>

      <div className="space-y-6">
        {/* 제목 */}
        <div>
          <label className="block text-sm font-medium mb-1.5">
            제목 <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Input
              placeholder="포트폴리오 제목을 입력하세요"
              value={formData.title}
              onChange={(e) => setFormData({ title: e.target.value.slice(0, TITLE_MAX) })}
              className={cn(
                formData.title.length === 0 && "border-muted"
              )}
            />
            <span
              className={cn(
                "absolute right-2 top-1/2 -translate-y-1/2 text-xs",
                formData.title.length >= TITLE_MAX
                  ? "text-red-500"
                  : "text-muted-foreground"
              )}
            >
              {formData.title.length}/{TITLE_MAX}
            </span>
          </div>
        </div>

        {/* 한줄 요약 */}
        <div>
          <label className="block text-sm font-medium mb-1.5">한줄 소개</label>
          <div className="relative">
            <Input
              placeholder="작품을 한 줄로 소개해 주세요"
              value={formData.summary}
              onChange={(e) =>
                setFormData({ summary: e.target.value.slice(0, SUMMARY_MAX) })
              }
            />
            <span
              className={cn(
                "absolute right-2 top-1/2 -translate-y-1/2 text-xs",
                formData.summary.length >= SUMMARY_MAX
                  ? "text-red-500"
                  : "text-muted-foreground"
              )}
            >
              {formData.summary.length}/{SUMMARY_MAX}
            </span>
          </div>
        </div>

        {/* 상세 설명 */}
        <div>
          <label className="block text-sm font-medium mb-1.5">상세 설명</label>
          <div className="relative">
            <textarea
              placeholder="작품에 대한 상세한 설명을 입력하세요. 작업 과정, 사용 기법, 영감 등을 자유롭게 작성해 주세요."
              value={formData.description}
              onChange={(e) =>
                setFormData({
                  description: e.target.value.slice(0, DESCRIPTION_MAX),
                })
              }
              rows={8}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-y"
            />
            <span
              className={cn(
                "absolute right-2 bottom-2 text-xs",
                formData.description.length >= DESCRIPTION_MAX
                  ? "text-red-500"
                  : "text-muted-foreground"
              )}
            >
              {formData.description.length}/{DESCRIPTION_MAX}
            </span>
          </div>
        </div>

        {/* 가격 및 기간 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">
              시작 가격 (원)
            </label>
            <Input
              type="number"
              placeholder="예: 50000"
              value={formData.startingPriceKrw ?? ""}
              onChange={(e) =>
                setFormData({
                  startingPriceKrw: e.target.value
                    ? Number(e.target.value)
                    : null,
                })
              }
              min={0}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">
              작업 기간 (일)
            </label>
            <Input
              type="number"
              placeholder="예: 7"
              value={formData.durationDays ?? ""}
              onChange={(e) =>
                setFormData({
                  durationDays: e.target.value
                    ? Number(e.target.value)
                    : null,
                })
              }
              min={1}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
