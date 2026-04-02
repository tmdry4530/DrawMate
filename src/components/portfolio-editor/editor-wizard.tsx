"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useEditorStore } from "@/store/editor-store";
import { TemplateSelector } from "./template-selector";
import { ImageUploader } from "./image-uploader";
import { InfoForm } from "./info-form";
import { TagSelector } from "./tag-selector";
import { Layout, Upload, Info, Tag, Save, Send, ArrowLeft, ArrowRight, LogOut, Loader2 } from "lucide-react";

const STEPS = [
  { label: "템플릿 선택", icon: Layout, component: TemplateSelector },
  { label: "이미지 업로드", icon: Upload, component: ImageUploader },
  { label: "기본 정보", icon: Info, component: InfoForm },
  { label: "태그 선택", icon: Tag, component: TagSelector },
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
  const completionPct = Math.round(((currentStep - 1) / STEPS.length) * 100);

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

  const stepTitles = [
    "캔버스를 꾸며보세요.",
    "작품을 올려주세요.",
    "작품을 소개해주세요.",
    "태그로 발견되세요.",
  ];

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* 상단 헤더 - 스텝 타이틀 + 스테퍼 */}
      <div className="sticky top-0 z-10 bg-background border-b">
        <div className="max-w-4xl mx-auto px-6 pt-6 pb-4">
          {/* 타이틀 행 */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-1">
                Step {currentStep} of {STEPS.length}
              </p>
              <h1 className="text-2xl font-headline font-bold tracking-tight">
                {stepTitles[currentStep - 1]}
              </h1>
            </div>
            <div className="flex items-center gap-2 pt-1">
              {saving && (
                <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  저장 중...
                </span>
              )}
              {!saving && lastSaved && (
                <span className="text-xs text-muted-foreground hidden sm:block">
                  {lastSaved.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })} 저장됨
                </span>
              )}
            </div>
          </div>

          {/* 수평 스테퍼 */}
          <div className="relative flex items-start justify-between">
            {/* 연결선 (원 중심 사이) */}
            <div
              className="absolute top-4 left-0 right-0 h-px bg-muted"
              style={{ left: "calc(12.5%)", right: "calc(12.5%)" }}
            />
            {/* 진행된 구간 강조선 */}
            <div
              className="absolute top-4 h-px bg-primary transition-all duration-500"
              style={{
                left: "calc(12.5%)",
                width: `calc(${((currentStep - 1) / (STEPS.length - 1)) * 75}%)`,
              }}
            />

            {STEPS.map((step, index) => {
              const stepNum = index + 1;
              const isActive = stepNum === currentStep;
              const isCompleted = stepNum < currentStep;
              const StepIcon = step.icon;
              return (
                <div key={step.label} className="relative flex flex-col items-center gap-2 z-10" style={{ width: `${100 / STEPS.length}%` }}>
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center ring-4 ring-background transition-all duration-300 ${
                      isActive
                        ? "bg-primary text-white shadow-lg"
                        : isCompleted
                        ? "bg-primary/20 text-primary"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    <StepIcon className="w-3.5 h-3.5" />
                  </div>
                  <span
                    className={`text-xs text-center leading-tight transition-colors ${
                      isActive
                        ? "text-primary font-semibold"
                        : isCompleted
                        ? "text-primary/70"
                        : "text-muted-foreground"
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 스텝 컨텐츠 */}
      <div className="flex-1 max-w-4xl mx-auto w-full px-6 py-8 pb-28">
        <div className="rounded-xl bg-card shadow-sm border p-6 sm:p-8">
          {StepComponent && <StepComponent />}
        </div>
      </div>

      {/* 고정 하단 액션 바 */}
      <div className="fixed bottom-0 left-0 w-full bg-white/80 backdrop-blur-xl z-50 shadow-[0_-10px_40px_rgba(22,29,31,0.04)] border-t">
        <div className="max-w-4xl mx-auto px-6 py-3 flex items-center justify-between gap-3">
          {/* 왼쪽: 에디터 나가기 */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSaveAndExit}
            disabled={saving || publishing}
            className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">에디터 나가기</span>
          </Button>

          {/* 오른쪽: 임시저장 + 다음/게시 */}
          <div className="flex items-center gap-2">
            {/* 힌트 메시지 */}
            {currentStep === 2 && !canProceed() && (
              <span className="text-xs text-muted-foreground hidden md:block">
                1장 이상의 이미지를 업로드해주세요
              </span>
            )}

            {/* 임시 저장 */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => { void saveDraft(); }}
              disabled={saving || !portfolioId || !isDirty}
              className="flex items-center gap-1.5"
            >
              {saving ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Save className="w-3.5 h-3.5" />
              )}
              <span className="hidden sm:inline">임시저장</span>
            </Button>

            {/* 이전 버튼 (첫 스텝 제외) */}
            {!isFirstStep && (
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrev}
                disabled={saving}
                className="flex items-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">이전</span>
              </Button>
            )}

            {/* 게시하기 (마지막 스텝) */}
            {isLastStep && (
              <Button
                onClick={handlePublish}
                disabled={publishing || saving || !formData.title.trim()}
                className="flex items-center gap-1.5"
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
              <Button
                onClick={handleNext}
                disabled={!canProceed() || saving}
                className="flex items-center gap-1.5"
              >
                다음
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
