"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function ProfileSettingsPage() {
  const [displayName, setDisplayName] = useState("");
  const [headline, setHeadline] = useState("");
  const [bio, setBio] = useState("");
  const [snsLinks, setSnsLinks] = useState<string[]>([""]);
  const [availabilityStatus, setAvailabilityStatus] = useState<
    "open" | "busy" | "unavailable"
  >("open");
  const [isSaving, setIsSaving] = useState(false);

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
    <div className="container max-w-2xl py-8">
      <Card>
        <CardHeader>
          <CardTitle>프로필 편집</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
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
