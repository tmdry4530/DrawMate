"use client";

import { useCallback, useRef, useState } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { useEditorStore } from "@/store/editor-store";
import { Star, StarOff, X, Upload, ImageIcon, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { unwrapApiData } from "@/lib/utils/client-api";

const MAX_IMAGES = 20;
const MAX_FILE_SIZE_MB = 10;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

interface UploadProgress {
  [key: string]: number; // clientId -> 0~100
}

interface UploadResult {
  uploadedId?: string;
  errorMessage?: string;
}

export function ImageUploader() {
  const { images, addImage, removeImage, updateImage, setCoverImage, portfolioId } =
    useEditorStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress>({});

  const uploadFile = useCallback(
    async (file: File, clientImageId: string): Promise<UploadResult> => {
      if (!portfolioId) return { errorMessage: "포트폴리오 ID가 없습니다." };

      const formData = new FormData();
      formData.append("file", file);

      return new Promise((resolve) => {
        const xhr = new XMLHttpRequest();
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            const pct = Math.round((e.loaded / e.total) * 100);
            setUploadProgress((prev) => ({ ...prev, [clientImageId]: pct }));
          }
        };
        xhr.onload = () => {
          setUploadProgress((prev) => {
            const next = { ...prev };
            delete next[clientImageId];
            return next;
          });
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const json = JSON.parse(xhr.responseText);
              const data = unwrapApiData<{ image?: { id?: string }; id?: string }>(json);
              resolve({ uploadedId: data?.image?.id ?? data?.id });
            } catch {
              resolve({ errorMessage: "업로드 응답을 해석하지 못했습니다." });
            }
          } else {
            try {
              const payload = JSON.parse(xhr.responseText);
              const message = payload?.error?.message as string | undefined;
              resolve({ errorMessage: message ?? "이미지 업로드에 실패했습니다." });
            } catch {
              resolve({ errorMessage: "이미지 업로드에 실패했습니다." });
            }
          }
        };
        xhr.onerror = () => {
          setUploadProgress((prev) => {
            const next = { ...prev };
            delete next[clientImageId];
            return next;
          });
          resolve({ errorMessage: "네트워크 오류로 업로드에 실패했습니다." });
        };
        xhr.open("POST", `/api/v1/portfolios/${portfolioId}/images`);
        xhr.send(formData);
      });
    },
    [portfolioId]
  );

  const processFiles = useCallback(
    async (files: FileList | File[]) => {
      const fileArray = Array.from(files);
      const remaining = MAX_IMAGES - images.length;
      if (remaining <= 0) {
        alert(`이미지는 최대 ${MAX_IMAGES}장까지 업로드할 수 있습니다.`);
        return;
      }
      const toProcess = fileArray.slice(0, remaining);
      const oversized = toProcess.filter((f) => f.size > MAX_FILE_SIZE_BYTES);
      if (oversized.length > 0) {
        alert(
          `파일 크기는 ${MAX_FILE_SIZE_MB}MB 이하여야 합니다. (${oversized
            .map((f) => f.name)
            .join(", ")} 제외됨)`
        );
      }
      const valid = toProcess.filter((f) => f.size <= MAX_FILE_SIZE_BYTES);

      for (let i = 0; i < valid.length; i++) {
        const file = valid[i];
        const previewUrl = URL.createObjectURL(file);
        const imageIndex = images.length + i;
        const clientImageId = crypto.randomUUID();
        addImage({
          clientId: clientImageId,
          file,
          previewUrl,
          caption: "",
          isCover: images.length === 0 && i === 0,
          sortOrder: imageIndex,
        });
        // 백그라운드 업로드 (portfolioId 있을 때만)
        if (portfolioId) {
          uploadFile(file, clientImageId).then(({ uploadedId, errorMessage }) => {
            const currentImages = useEditorStore.getState().images;
            const currentIndex = currentImages.findIndex(
              (image) => image.clientId === clientImageId
            );
            if (currentIndex < 0) return;

            if (uploadedId) {
              updateImage(currentIndex, { id: uploadedId });
              return;
            }

            URL.revokeObjectURL(currentImages[currentIndex].previewUrl);
            removeImage(currentIndex);
            toast.error(errorMessage ?? `${file.name} 업로드에 실패했습니다.`);
          });
        }
      }
    },
    [images, addImage, portfolioId, uploadFile, updateImage, removeImage]
  );

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      processFiles(e.target.files);
      e.target.value = "";
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleRemoveImage = useCallback(
    async (index: number, imageId?: string) => {
      if (!imageId || !portfolioId) {
        removeImage(index);
        return;
      }

      try {
        const res = await fetch(`/api/v1/portfolios/${portfolioId}/images/${imageId}`, {
          method: "DELETE",
        });
        if (!res.ok) {
          const payload = await res.json().catch(() => null);
          throw new Error(payload?.error?.message ?? "이미지 삭제에 실패했습니다.");
        }
        removeImage(index);
      } catch (err) {
        toast.error((err as Error).message);
      }
    },
    [portfolioId, removeImage]
  );

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">이미지 업로드</h2>
        <p className="text-neutral-500">
          작품 이미지를 업로드하세요. 최대 {MAX_IMAGES}장, 각 파일{" "}
          {MAX_FILE_SIZE_MB}MB 이하 (JPEG, PNG, WEBP)
        </p>
      </div>

      {/* 드래그 앤 드롭 영역 */}
      {images.length < MAX_IMAGES && (
        <div
          className="border-2 border-dashed border-neutral-700 p-10 text-center mb-6 cursor-pointer hover:border-white hover:bg-white/5"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="w-10 h-10 mx-auto mb-3 text-neutral-500" />
          <p className="font-medium mb-1">이미지를 드래그하거나 클릭하여 업로드</p>
          <p className="text-sm text-neutral-500">
            JPEG, PNG, WEBP 지원 · 최대 {MAX_FILE_SIZE_MB}MB
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            className="hidden"
            onChange={handleFileInput}
          />
        </div>
      )}

      {/* 이미지 목록 */}
      {images.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-neutral-500">
              {images.length} / {MAX_IMAGES}장
            </p>
            <p className="text-xs text-neutral-500">별 아이콘으로 대표 이미지 설정</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {images.map((img, index) => {
              const progress = uploadProgress[img.clientId];
              const isUploading = progress !== undefined;

              return (
                <div
                  key={img.clientId}
                  className={cn(
                    "relative overflow-hidden border-2 group",
                    img.isCover ? "border-yellow-400" : "border-transparent"
                  )}
                >
                  {/* 이미지 미리보기 */}
                  <div className="aspect-square bg-muted relative">
                    {img.previewUrl ? (
                      <Image
                        src={img.previewUrl}
                        alt={img.caption || `이미지 ${index + 1}`}
                        fill
                        unoptimized
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon className="w-8 h-8 text-neutral-500" />
                      </div>
                    )}

                    {/* 업로드 진행 표시 */}
                    {isUploading && (
                      <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center gap-1">
                        <Loader2 className="w-5 h-5 text-white animate-spin" />
                        <span className="text-white text-xs">{progress}%</span>
                        <div className="w-3/4 h-1 bg-white/30 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-white transition-all"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* 대표 이미지 배지 */}
                    {img.isCover && !isUploading && (
                      <div className="absolute top-1 left-1 bg-yellow-400 text-yellow-900 text-xs px-1.5 py-0.5 rounded font-medium">
                        대표
                      </div>
                    )}

                    {/* 호버 액션 */}
                    {!isUploading && (
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <button
                          onClick={() => setCoverImage(index)}
                          className="p-1.5 bg-white/90 rounded-full text-yellow-500 hover:bg-white"
                          title="대표 이미지로 설정"
                        >
                          {img.isCover ? (
                            <Star className="w-4 h-4 fill-yellow-500" />
                          ) : (
                            <StarOff className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          onClick={() => handleRemoveImage(index, img.id)}
                          className="p-1.5 bg-white/90 rounded-full text-red-500 hover:bg-white"
                          title="삭제"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* 캡션 입력 */}
                  <div className="p-2">
                    <Input
                      placeholder="캡션 입력 (선택)"
                      value={img.caption}
                      onChange={(e) =>
                        updateImage(index, { caption: e.target.value })
                      }
                      className="text-xs h-7"
                      maxLength={100}
                      disabled={isUploading}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {images.length === 0 && (
        <p className="text-center text-neutral-500 text-sm mt-4">
          이미지를 1장 이상 업로드해야 합니다.
        </p>
      )}
    </div>
  );
}
