"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { useEditorStore } from "@/store/editor-store";
import { TemplateSelector } from "./template-selector";
import { ImageUploader } from "./image-uploader";
import { InfoForm } from "./info-form";
import { TagSelector } from "./tag-selector";
import { Save, Send, LogOut, Loader2 } from "lucide-react";

const STEPS = [
  { label: "템플릿 선택", component: TemplateSelector },
  { label: "이미지 업로드", component: ImageUploader },
  { label: "기본 정보", component: InfoForm },
  { label: "태그 선택", component: TagSelector },
];

const AUTO_SAVE_DELAY_MS = 3000;

interface EditorWizardProps {
  onComplete?: (portfolioId: string) => void;
}

function buildPatchBody(state: ReturnType<typeof useEditorStore.getState>) {
  return {
    templateId: state.selectedTemplateId,
    templateCustomization: state.templateCustomization,
    ...state.formData,
    tags: [
      ...state.tags.field,
      ...state.tags.skill,
      ...state.tags.tool,
      ...state.tags.style,
    ],
  };
}

export function EditorWizard({ onComplete }: EditorWizardProps) {
  const store = useEditorStore();
  const {
    currentStep,
    setStep,
    portfolioId,
    selectedTemplateId,
    images,
    formData,
    isDirty,
  } = store;

  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const StepComponent = STEPS[currentStep - 1]?.component;
  const isFirstStep = currentStep === 1;
  const isLastStep = currentStep === STEPS.length;
  const completionPct = Math.round(((currentStep - 1) / STEPS.length) * 100);

  const canProceed = () => {
    if (currentStep === 1) return !!selectedTemplateId;
    if (currentStep === 2) return images.length > 0;
    if (currentStep === 3) return formData.title.trim().length > 0;
    return true;
  };

  // 임시 저장
  const saveDraft = useCallback(async () => {
    if (!portfolioId || saving) return;
    setSaving(true);
    try {
      const body = buildPatchBody(useEditorStore.getState());
      await fetch(`/api/v1/portfolios/${portfolioId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      setLastSaved(new Date());
      useEditorStore.setState({ isDirty: false });
    } catch {
      // silent fail — user can retry via button
    } finally {
      setSaving(false);
    }
  }, [portfolioId, saving]);

  // isDirty 변경 시 자동 저장 트리거
  useEffect(() => {
    if (!isDirty || !portfolioId) return;
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => {
      saveDraft();
    }, AUTO_SAVE_DELAY_MS);
    return () => {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    };
  }, [isDirty, portfolioId, saveDraft]);

  const handleNext = async () => {
    // 스텝 변경 시 자동 저장
    if (isDirty && portfolioId) await saveDraft();
    if (isLastStep) {
      if (portfolioId && onComplete) onComplete(portfolioId);
      return;
    }
    setStep(currentStep + 1);
  };

  const handlePrev = async () => {
    if (isDirty && portfolioId) await saveDraft();
    if (!isFirstStep) setStep(currentStep - 1);
  };

  // 게시하기
  const handlePublish = async () => {
    if (!portfolioId) return;
    setPublishing(true);
    try {
      await saveDraft();
      const res = await fetch(`/api/v1/portfolios/${portfolioId}/publish`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("게시에 실패했습니다.");
      if (onComplete) onComplete(portfolioId);
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setPublishing(false);
    }
  };

  // 저장 및 종료
  const handleSaveAndExit = async () => {
    await saveDraft();
    if (onComplete && portfolioId) onComplete(portfolioId);
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* 진행 표시 헤더 */}
      <div className="border-b bg-white sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-lg font-semibold">포트폴리오 편집</h1>
            <div className="flex items-center gap-3">
              {lastSaved && (
                <span className="text-xs text-muted-foreground hidden sm:block">
                  {lastSaved.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })} 저장됨
                </span>
              )}
              {saving && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  저장 중
                </span>
              )}
              <span className="text-sm text-muted-foreground">
                {currentStep} / {STEPS.length} ({completionPct}%)
              </span>
            </div>
          </div>
          {/* 프로그레스 바 */}
          <div className="flex gap-1">
            {STEPS.map((step, index) => (
              <div key={step.label} className="flex-1 flex flex-col gap-1">
                <div
                  className={`h-1.5 rounded-full transition-colors ${
                    index + 1 <= currentStep ? "bg-primary" : "bg-muted"
                  }`}
                />
                <span
                  className={`text-xs text-center hidden sm:block ${
                    index + 1 === currentStep
                      ? "text-primary font-medium"
                      : "text-muted-foreground"
                  }`}
                >
                  {step.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 스텝 컨텐츠 */}
      <div className="flex-1 max-w-4xl mx-auto w-full px-4 py-8">
        {StepComponent && <StepComponent />}
      </div>

      {/* 푸터 액션 */}
      <div className="border-t bg-white sticky bottom-0">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between gap-2">
          <Button variant="outline" onClick={handlePrev} disabled={isFirstStep || saving}>
            이전
          </Button>

          <div className="flex items-center gap-2">
            {/* 임시 저장 */}
            <Button
              variant="ghost"
              size="sm"
              onClick={saveDraft}
              disabled={saving || !portfolioId || !isDirty}
              className="hidden sm:flex items-center gap-1"
            >
              {saving ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Save className="w-3.5 h-3.5" />
              )}
              임시 저장
            </Button>

            {/* 저장 및 종료 */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleSaveAndExit}
              disabled={saving || publishing}
              className="flex items-center gap-1"
            >
              <LogOut className="w-3.5 h-3.5" />
              저장 및 종료
            </Button>

            {/* 게시하기 (마지막 스텝에서만) */}
            {isLastStep && (
              <Button
                onClick={handlePublish}
                disabled={publishing || saving || !formData.title.trim()}
                className="flex items-center gap-1"
              >
                {publishing ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
                게시하기
              </Button>
            )}

            {/* 다음 (마지막 스텝 아닐 때) */}
            {!isLastStep && (
              <Button onClick={handleNext} disabled={!canProceed() || saving}>
                다음
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
