"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useEditorStore } from "@/store/editor-store";
import { TemplateSelector } from "./template-selector";
import { ImageUploader } from "./image-uploader";
import { InfoForm } from "./info-form";
import { TagSelector } from "./tag-selector";
import { Save, Send, ArrowLeft, ArrowRight, LogOut, Loader2 } from "lucide-react";

const STEPS = [
  { label: "레이아웃", shortLabel: "1.레이아웃", component: TemplateSelector },
  { label: "업로드", shortLabel: "2.업로드", component: ImageUploader },
  { label: "정보", shortLabel: "3.정보", component: InfoForm },
  { label: "태그", shortLabel: "4.태그", component: TagSelector },
];

const AUTO_SAVE_DELAY_MS = 3000;

interface EditorWizardProps {
  onComplete?: (portfolioId: string) => void;
}

function buildPatchBody(state: ReturnType<typeof useEditorStore.getState>) {
  const tagIds = [
    ...state.tags.field,
    ...state.tags.skill,
    ...state.tags.tool,
    ...state.tags.style,
  ];

  return {
    templateId: state.selectedTemplateId ?? undefined,
    templateCustomization: state.templateCustomization,
    ...state.formData,
    tagIds,
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

  const canProceed = () => {
    if (currentStep === 1) return !!selectedTemplateId;
    if (currentStep === 2) return images.length > 0;
    if (currentStep === 3) return formData.title.trim().length > 0;
    return true;
  };

  // 임시 저장
  const saveDraft = useCallback(async (options?: { silent?: boolean }) => {
    if (!portfolioId || saving) return false;
    setSaving(true);
    try {
      const body = buildPatchBody(useEditorStore.getState());
      const res = await fetch(`/api/v1/portfolios/${portfolioId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => null);
        throw new Error(payload?.error?.message ?? "임시 저장에 실패했습니다.");
      }
      setLastSaved(new Date());
      useEditorStore.setState({ isDirty: false });
      return true;
    } catch (err) {
      if (!options?.silent) {
        toast.error((err as Error).message);
      }
      return false;
    } finally {
      setSaving(false);
    }
  }, [portfolioId, saving]);

  // isDirty 변경 시 자동 저장 트리거
  useEffect(() => {
    if (!isDirty || !portfolioId) return;
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => {
      saveDraft({ silent: true });
    }, AUTO_SAVE_DELAY_MS);
    return () => {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    };
  }, [isDirty, portfolioId, saveDraft]);

  const handleNext = async () => {
    // 스텝 변경 시 자동 저장
    if (isDirty && portfolioId) {
      const saved = await saveDraft();
      if (!saved) return;
    }
    if (isLastStep) {
      if (portfolioId && onComplete) onComplete(portfolioId);
      return;
    }
    setStep(currentStep + 1);
  };

  const handlePrev = async () => {
    if (isDirty && portfolioId) {
      const saved = await saveDraft();
      if (!saved) return;
    }
    if (!isFirstStep) setStep(currentStep - 1);
  };

  // 게시하기
  const handlePublish = async () => {
    if (!portfolioId) return;
    setPublishing(true);
    try {
      if (isDirty) {
        const saved = await saveDraft();
        if (!saved) return;
      }
      const res = await fetch(`/api/v1/portfolios/${portfolioId}/publish`, {
        method: "POST",
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        const msg = body?.error?.message ?? "게시에 실패했습니다.";
        throw new Error(msg);
      }
      toast.success("포트폴리오가 게시되었습니다!");
      if (onComplete) onComplete(portfolioId);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setPublishing(false);
    }
  };

  // 저장 및 종료
  const handleSaveAndExit = async () => {
    if (isDirty && portfolioId) {
      const saved = await saveDraft();
      if (!saved) return;
    }
    if (onComplete && portfolioId) onComplete(portfolioId);
  };

  return (
    <div className="flex flex-col min-h-screen bg-black text-white">
      {/* 수평 스테퍼 */}
      <div className="sticky top-0 z-10 bg-black border-b border-neutral-800">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center gap-6">
            {STEPS.map((step, index) => {
              const stepNum = index + 1;
              const isActive = stepNum === currentStep;
              const isCompleted = stepNum < currentStep;
              return (
                <span
                  key={step.label}
                  className={`text-sm tracking-wide transition-colors ${
                    isActive
                      ? "font-black text-white"
                      : isCompleted
                      ? "font-medium text-neutral-400"
                      : "font-medium text-neutral-600"
                  }`}
                >
                  {step.shortLabel}
                </span>
              );
            })}
            {/* 저장 상태 */}
            <div className="ml-auto flex items-center gap-2">
              {saving && (
                <span className="text-xs text-neutral-500 flex items-center gap-1.5">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  저장 중...
                </span>
              )}
              {!saving && lastSaved && (
                <span className="text-xs text-neutral-600 hidden sm:block">
                  {lastSaved.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })} 저장됨
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 스텝 컨텐츠 */}
      <div className="flex-1 max-w-4xl mx-auto w-full px-6 py-8 pb-28">
        {/* PORTFOLIO DETAILS 대형 헤딩 */}
        <h1 className="font-black text-4xl sm:text-5xl uppercase italic tracking-tighter text-white mb-8">
          PORTFOLIO DETAILS
        </h1>
        <div className="border border-neutral-800 p-6 sm:p-8">
          {StepComponent && <StepComponent />}
        </div>
      </div>

      {/* 고정 하단 액션 바 */}
      <div className="fixed bottom-0 left-0 w-full bg-black border-t border-neutral-800 z-50">
        <div className="max-w-4xl mx-auto px-6 py-3 flex items-center justify-between gap-3">
          {/* 왼쪽: 나가기 + 임시저장 */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSaveAndExit}
              disabled={saving || publishing}
              className="rounded-none border border-neutral-700 bg-transparent text-neutral-400 hover:text-white hover:bg-neutral-900 uppercase text-xs font-black tracking-widest px-3"
            >
              <LogOut className="w-4 h-4 mr-1.5" />
              나가기
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => { void saveDraft(); }}
              disabled={saving || !portfolioId || !isDirty}
              className="rounded-none border border-neutral-700 bg-transparent text-neutral-400 hover:text-white hover:bg-neutral-900 uppercase text-xs font-black tracking-widest px-3"
            >
              {saving ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
              ) : (
                <Save className="w-3.5 h-3.5 mr-1.5" />
              )}
              임시저장
            </Button>
          </div>

          {/* 오른쪽: 이전 + 다음/게시 */}
          <div className="flex items-center gap-2">
            {currentStep === 2 && !canProceed() && (
              <span className="text-xs text-neutral-600 hidden md:block uppercase tracking-wider">
                1장 이상 업로드
              </span>
            )}

            {!isFirstStep && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handlePrev}
                disabled={saving}
                className="rounded-none border border-neutral-700 bg-transparent text-neutral-400 hover:text-white hover:bg-neutral-900 uppercase text-xs font-black tracking-widest px-3"
              >
                <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
                이전
              </Button>
            )}

            {isLastStep ? (
              <Button
                onClick={handlePublish}
                disabled={publishing || saving || !formData.title.trim()}
                className="rounded-none bg-white text-black hover:bg-neutral-200 uppercase text-xs font-black tracking-widest px-4 border-0"
              >
                {publishing ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                ) : (
                  <Send className="w-3.5 h-3.5 mr-1.5" />
                )}
                발행→
              </Button>
            ) : (
              <Button
                onClick={handleNext}
                disabled={!canProceed() || saving}
                className="rounded-none bg-white text-black hover:bg-neutral-200 uppercase text-xs font-black tracking-widest px-4 border-0"
              >
                다음
                <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
