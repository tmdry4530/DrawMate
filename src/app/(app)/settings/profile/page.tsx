"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Camera, Trash2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { unwrapApiData } from "@/lib/utils/client-api";

export default function ProfileSettingsPage() {
  const [displayName, setDisplayName] = useState("");
  const [headline, setHeadline] = useState("");
  const [bio, setBio] = useState("");
  const [snsLinks, setSnsLinks] = useState<string[]>([""]);
  const [availabilityStatus, setAvailabilityStatus] = useState<
    "open" | "busy" | "unavailable"
  >("open");
  const [isSaving, setIsSaving] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/v1/me")
      .then((res) => res.json())
      .then((json) => {
        const data = unwrapApiData<{
          profile?: {
            displayName?: string;
            headline?: string;
            bio?: string;
            snsLinks?: string[];
            avatarUrl?: string | null;
            availabilityStatus?: "open" | "busy" | "unavailable";
          };
        }>(json);
        const p = data?.profile;
        if (p) {
          setDisplayName(p.displayName ?? "");
          setHeadline(p.headline ?? "");
          setBio(p.bio ?? "");
          setSnsLinks(p.snsLinks?.length ? p.snsLinks : [""]);
          setAvailabilityStatus(p.availabilityStatus ?? "open");
          setAvatarUrl(p.avatarUrl ?? null);
        }
      })
      .catch(() => toast.error("프로필 정보를 불러오지 못했습니다."));
  }, []);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      toast.error("JPEG, PNG, WebP 형식의 이미지만 업로드 가능합니다.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("파일 크기는 최대 5MB까지 허용됩니다.");
      return;
    }

    setIsUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/v1/me/avatar", { method: "POST", body: formData });
      if (!res.ok) {
        const payload = await res.json().catch(() => null);
        throw new Error(payload?.error?.message ?? "아바타 업로드에 실패했습니다.");
      }
      const json = await res.json();
      const data = unwrapApiData<{ avatarUrl: string }>(json);
      if (data?.avatarUrl) {
        setAvatarUrl(data.avatarUrl);
      }
      toast.success("프로필 이미지가 변경되었습니다.");
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setIsUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleAvatarDelete = async () => {
    setIsUploadingAvatar(true);
    try {
      const res = await fetch("/api/v1/me/avatar", { method: "DELETE" });
      if (!res.ok) {
        throw new Error("프로필 이미지 삭제에 실패했습니다.");
      }
      setAvatarUrl(null);
      toast.success("프로필 이미지가 삭제되었습니다.");
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleAddSnsLink = () => {
    if (snsLinks.length >= 5) return;
    setSnsLinks([...snsLinks, ""]);
  };

  const handleRemoveSnsLink = (index: number) => {
    setSnsLinks(snsLinks.filter((_, i) => i !== index));
  };

  const handleSnsLinkChange = (index: number, value: string) => {
    const updated = [...snsLinks];
    updated[index] = value;
    setSnsLinks(updated);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const filteredLinks = snsLinks.filter((link) => link.trim() !== "");
      const res = await fetch("/api/v1/me/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: displayName || undefined,
          headline: headline || undefined,
          bio: bio || undefined,
          snsLinks: filteredLinks.length > 0 ? filteredLinks : undefined,
          availabilityStatus,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data?.error?.message ?? "프로필 저장에 실패했습니다.");
        return;
      }

      toast.success("프로필이 저장되었습니다.");
    } catch {
      toast.error("네트워크 오류가 발생했습니다.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-3xl space-y-8 py-8 md:py-12 px-4">
      <section className="space-y-3 text-center">
        <p className="text-sm font-semibold text-primary">프로필 관리</p>
        <h1 className="text-3xl font-bold tracking-tight">프로필 편집</h1>
        <p className="text-sm leading-6 text-muted-foreground max-w-xl mx-auto">
          협업 요청을 받을 때 가장 먼저 보이는 정보입니다. 이름, 소개, 활동 상태를 정리해
          신뢰도와 응답률을 높여보세요.
        </p>
      </section>

      <Card className="shadow-md rounded-2xl border-muted-foreground/10">

        <CardHeader>
          <CardTitle>기본 정보</CardTitle>
          <CardDescription>
            공개 프로필에 노출될 핵심 정보를 관리합니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 프로필 이미지 */}
          <div className="space-y-2">
            <label className="text-sm font-medium">프로필 이미지</label>
            <div className="flex items-center gap-4">
              <div className="relative group">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={avatarUrl ?? undefined} alt={displayName || "프로필"} />
                  <AvatarFallback className="text-xl">
                    {(displayName || "U").slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingAvatar}
                  className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                >
                  <Camera className="h-5 w-5 text-white" />
                </button>
              </div>
              <div className="flex flex-col gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingAvatar}
                >
                  {isUploadingAvatar ? "업로드 중..." : "이미지 변경"}
                </Button>
                {avatarUrl && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleAvatarDelete}
                    disabled={isUploadingAvatar}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-1" />
                    삭제
                  </Button>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleAvatarUpload}
                className="hidden"
              />
            </div>
            <p className="text-xs text-muted-foreground">JPEG, PNG, WebP / 최대 5MB</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">이름 (2~40자)</label>
            <Input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="표시할 이름을 입력하세요"
              maxLength={40}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">한 줄 소개 (최대 80자)</label>
            <Input
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              placeholder="간단한 소개를 입력하세요"
              maxLength={80}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">자기소개 (최대 500자)</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="자세한 소개를 입력하세요"
              maxLength={500}
              rows={5}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">SNS 링크 (최대 5개)</label>
            <div className="space-y-2">
              {snsLinks.map((link, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={link}
                    onChange={(e) => handleSnsLinkChange(index, e.target.value)}
                    placeholder="https://..."
                    type="url"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleRemoveSnsLink(index)}
                    disabled={snsLinks.length === 1}
                  >
                    삭제
                  </Button>
                </div>
              ))}
              {snsLinks.length < 5 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddSnsLink}
                >
                  링크 추가
                </Button>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">활동 상태</label>
            <Select
              value={availabilityStatus}
              onValueChange={(value) =>
                setAvailabilityStatus(value as "open" | "busy" | "unavailable")
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="open">활동 가능</SelectItem>
                <SelectItem value="busy">바쁨</SelectItem>
                <SelectItem value="unavailable">활동 불가</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button onClick={handleSave} disabled={isSaving} className="w-full">
            {isSaving ? "저장 중..." : "저장"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
