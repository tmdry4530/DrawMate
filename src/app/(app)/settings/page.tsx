"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  User,
  Briefcase,
  Shield,
  Bell,
  CreditCard,
  MapPin,
  Camera,
  Trash2,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createClient } from "@/lib/supabase/browser-client";
import { unwrapApiData } from "@/lib/utils/client-api";
import { cn } from "@/lib/utils";

type TabId = "account" | "portfolio" | "privacy" | "notifications" | "billing";

const NAV_ITEMS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: "account", label: "계정", icon: <User className="h-4 w-4" /> },
  { id: "portfolio", label: "포트폴리오", icon: <Briefcase className="h-4 w-4" /> },
  { id: "privacy", label: "개인정보", icon: <Shield className="h-4 w-4" /> },
  { id: "notifications", label: "알림", icon: <Bell className="h-4 w-4" /> },
  { id: "billing", label: "결제", icon: <CreditCard className="h-4 w-4" /> },
];

export default function SettingsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabId>("account");

  // Profile state (Account tab)
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [headline, setHeadline] = useState("");
  const [snsLinks, setSnsLinks] = useState<string[]>([""]);
  const [availabilityStatus, setAvailabilityStatus] = useState<
    "open" | "busy" | "unavailable"
  >("open");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Privacy state
  const [isProfilePublic, setIsProfilePublic] = useState(true);

  // Notifications state
  const [notifyNewMessage, setNotifyNewMessage] = useState(true);
  const [notifyBookmark, setNotifyBookmark] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);

  // General state
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const res = await fetch("/api/v1/me");
        if (!res.ok) throw new Error("설정 정보를 불러오지 못했습니다.");
        const json = await res.json();
        const data = unwrapApiData<{
          profile?: {
            displayName?: string;
            username?: string;
            headline?: string;
            bio?: string;
            location?: string;
            snsLinks?: string[];
            avatarUrl?: string | null;
            availabilityStatus?: "open" | "busy" | "unavailable";
            isProfilePublic?: boolean;
            notifyNewMessage?: boolean;
            notifyBookmark?: boolean;
          };
        }>(json);
        const p = data?.profile;
        if (p && mounted) {
          setDisplayName(p.displayName ?? "");
          setUsername(p.username ?? "");
          setHeadline(p.headline ?? "");
          setBio(p.bio ?? "");
          setLocation(p.location ?? "");
          setSnsLinks(p.snsLinks?.length ? p.snsLinks : [""]);
          setAvailabilityStatus(p.availabilityStatus ?? "open");
          setAvatarUrl(p.avatarUrl ?? null);
          setIsProfilePublic(p.isProfilePublic ?? true);
          setNotifyNewMessage(p.notifyNewMessage ?? true);
          setNotifyBookmark(p.notifyBookmark ?? true);
        }
      } catch {
        if (mounted) toast.error("설정 정보를 불러오지 못했습니다.");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    void load();
    return () => { mounted = false; };
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
      if (data?.avatarUrl) setAvatarUrl(data.avatarUrl);
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
      if (!res.ok) throw new Error("프로필 이미지 삭제에 실패했습니다.");
      setAvatarUrl(null);
      toast.success("프로필 이미지가 삭제되었습니다.");
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const filteredLinks = snsLinks.filter((l) => l.trim() !== "");
      const res = await fetch("/api/v1/me/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: displayName || undefined,
          username: username || undefined,
          headline: headline || undefined,
          bio: bio || undefined,
          location: location || undefined,
          snsLinks: filteredLinks.length > 0 ? filteredLinks : undefined,
          availabilityStatus,
          isProfilePublic,
          notifyNewMessage,
          notifyBookmark,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data?.error?.message ?? "저장에 실패했습니다.");
        return;
      }
      toast.success("변경사항이 저장되었습니다.");
      setIsDirty(false);
    } catch {
      toast.error("네트워크 오류가 발생했습니다.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDiscard = () => {
    setIsDirty(false);
    toast("변경사항이 취소되었습니다.");
  };

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/");
  };

  const markDirty = () => setIsDirty(true);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-background px-6 py-8">
        <div className="mx-auto max-w-5xl">
          <h1 className="font-headline text-3xl font-bold tracking-tight">Settings</h1>
          <p className="mt-1 text-sm text-muted-foreground">나만의 크리에이티브 공간을 관리하세요</p>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-6 py-8">
        <div className="flex gap-8">
          {/* Side Navigation */}
          <aside className="w-52 shrink-0">
            <nav className="flex flex-col gap-1">
              {NAV_ITEMS.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors text-left",
                    activeTab === item.id
                      ? "bg-primary text-white"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  {item.icon}
                  {item.label}
                </button>
              ))}
            </nav>
          </aside>

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            {/* Account Tab */}
            {activeTab === "account" && (
              <div className="space-y-8">
                {/* Profile Picture Section */}
                <section className="rounded-2xl border bg-card p-6">
                  <h2 className="mb-4 text-base font-semibold">프로필 사진</h2>
                  <div className="flex items-center gap-5">
                    <div className="relative group">
                      <Avatar className="h-20 w-20">
                        <AvatarImage src={avatarUrl ?? undefined} alt={displayName || "프로필"} />
                        <AvatarFallback className="text-xl font-bold">
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
                        className="rounded-xl"
                      >
                        {isUploadingAvatar ? "업로드 중..." : "아바타 변경"}
                      </Button>
                      {avatarUrl && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={handleAvatarDelete}
                          disabled={isUploadingAvatar}
                          className="text-destructive hover:text-destructive rounded-xl"
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
                  <p className="mt-3 text-xs text-muted-foreground">JPEG, PNG, WebP / 최대 5MB</p>
                </section>

                {/* Personal Information */}
                <section className="rounded-2xl border bg-card p-6">
                  <div className="mb-5">
                    <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">01</span>
                    <h2 className="mt-1 text-base font-semibold">기본 정보</h2>
                  </div>

                  <div className="space-y-4">
                    {/* Full Name + Username */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium">이름</label>
                        <Input
                          value={displayName}
                          onChange={(e) => { setDisplayName(e.target.value); markDirty(); }}
                          placeholder="표시 이름"
                          maxLength={40}
                          disabled={loading}
                          className="bg-muted border-0 rounded-xl py-3 px-4"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium">사용자명</label>
                        <Input
                          value={username}
                          onChange={(e) => { setUsername(e.target.value); markDirty(); }}
                          placeholder="@username"
                          maxLength={40}
                          disabled={loading}
                          className="bg-muted border-0 rounded-xl py-3 px-4"
                        />
                      </div>
                    </div>

                    {/* Bio */}
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium">자기소개</label>
                      <textarea
                        value={bio}
                        onChange={(e) => { setBio(e.target.value); markDirty(); }}
                        placeholder="간단한 소개를 작성해보세요"
                        maxLength={500}
                        rows={4}
                        disabled={loading}
                        className="w-full rounded-xl border-0 bg-muted px-4 py-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none disabled:opacity-50"
                      />
                    </div>

                    {/* Location */}
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium">위치</label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          value={location}
                          onChange={(e) => { setLocation(e.target.value); markDirty(); }}
                          placeholder="도시, 국가"
                          maxLength={100}
                          disabled={loading}
                          className="bg-muted border-0 rounded-xl py-3 pl-9 pr-4"
                        />
                      </div>
                    </div>

                    {/* Headline */}
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium">한 줄 소개</label>
                      <Input
                        value={headline}
                        onChange={(e) => { setHeadline(e.target.value); markDirty(); }}
                        placeholder="일러스트레이터 / 브랜드 디자이너"
                        maxLength={80}
                        disabled={loading}
                        className="bg-muted border-0 rounded-xl py-3 px-4"
                      />
                    </div>

                    {/* Availability */}
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium">활동 상태</label>
                      <Select
                        value={availabilityStatus}
                        onValueChange={(v) => {
                          setAvailabilityStatus(v as "open" | "busy" | "unavailable");
                          markDirty();
                        }}
                        disabled={loading}
                      >
                        <SelectTrigger className="bg-muted border-0 rounded-xl py-3 px-4">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="open">활동 가능</SelectItem>
                          <SelectItem value="busy">바쁨</SelectItem>
                          <SelectItem value="unavailable">활동 불가</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* SNS Links */}
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium">SNS 링크 (최대 5개)</label>
                      <div className="space-y-2">
                        {snsLinks.map((link, index) => (
                          <div key={index} className="flex gap-2">
                            <Input
                              value={link}
                              onChange={(e) => {
                                const updated = [...snsLinks];
                                updated[index] = e.target.value;
                                setSnsLinks(updated);
                                markDirty();
                              }}
                              placeholder="https://..."
                              type="url"
                              className="bg-muted border-0 rounded-xl py-3 px-4"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSnsLinks(snsLinks.filter((_, i) => i !== index));
                                markDirty();
                              }}
                              disabled={snsLinks.length === 1}
                              className="rounded-xl"
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
                            onClick={() => { setSnsLinks([...snsLinks, ""]); markDirty(); }}
                            className="rounded-xl"
                          >
                            링크 추가
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </section>

                {/* Preferences */}
                <section className="rounded-2xl border bg-card p-6">
                  <div className="mb-5">
                    <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">02</span>
                    <h2 className="mt-1 text-base font-semibold">환경설정</h2>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">이메일 알림</p>
                        <p className="text-xs text-muted-foreground">중요한 업데이트를 이메일로 받습니다</p>
                      </div>
                      <Switch
                        checked={emailNotifications}
                        onCheckedChange={(v) => { setEmailNotifications(v); markDirty(); }}
                        disabled={loading}
                      />
                    </div>

                    <div className="flex items-center justify-between opacity-50">
                      <div>
                        <p className="text-sm font-medium">다크 모드</p>
                        <p className="text-xs text-muted-foreground">준비 중</p>
                      </div>
                      <Switch checked={false} disabled />
                    </div>
                  </div>
                </section>

                {/* Danger Zone */}
                <section className="rounded-2xl border border-destructive/20 bg-card p-6">
                  <h2 className="mb-2 text-base font-semibold text-destructive">위험 영역</h2>
                  <p className="mb-4 text-sm text-muted-foreground">
                    계정을 삭제하면 모든 포트폴리오와 메시지 데이터가 함께 삭제됩니다.
                  </p>
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={handleLogout}
                      className="rounded-xl"
                    >
                      로그아웃
                    </Button>
                  </div>
                </section>
              </div>
            )}

            {/* Portfolio Tab */}
            {activeTab === "portfolio" && (
              <div className="rounded-2xl border bg-card p-6">
                <div className="mb-5">
                  <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">01</span>
                  <h2 className="mt-1 text-base font-semibold">포트폴리오 설정</h2>
                </div>
                <p className="text-sm text-muted-foreground">포트폴리오 관련 설정은 준비 중입니다.</p>
              </div>
            )}

            {/* Privacy Tab */}
            {activeTab === "privacy" && (
              <div className="space-y-6">
                <section className="rounded-2xl border bg-card p-6">
                  <div className="mb-5">
                    <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">01</span>
                    <h2 className="mt-1 text-base font-semibold">공개 설정</h2>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">프로필 공개</p>
                      <p className="text-xs text-muted-foreground">
                        다른 사용자가 내 프로필을 볼 수 있습니다.
                      </p>
                    </div>
                    <Switch
                      checked={isProfilePublic}
                      onCheckedChange={(v) => { setIsProfilePublic(v); markDirty(); }}
                      disabled={loading}
                    />
                  </div>
                </section>
              </div>
            )}

            {/* Notifications Tab */}
            {activeTab === "notifications" && (
              <div className="space-y-6">
                <section className="rounded-2xl border bg-card p-6">
                  <div className="mb-5">
                    <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">01</span>
                    <h2 className="mt-1 text-base font-semibold">알림 설정</h2>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">새 메시지 알림</p>
                        <p className="text-xs text-muted-foreground">새 메시지가 도착하면 알림을 받습니다</p>
                      </div>
                      <Switch
                        checked={notifyNewMessage}
                        onCheckedChange={(v) => { setNotifyNewMessage(v); markDirty(); }}
                        disabled={loading}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">북마크 알림</p>
                        <p className="text-xs text-muted-foreground">누군가 내 포트폴리오를 북마크하면 알림을 받습니다</p>
                      </div>
                      <Switch
                        checked={notifyBookmark}
                        onCheckedChange={(v) => { setNotifyBookmark(v); markDirty(); }}
                        disabled={loading}
                      />
                    </div>
                    <div className="flex items-center justify-between opacity-50">
                      <div>
                        <p className="text-sm font-medium">Push 알림</p>
                        <p className="text-xs text-muted-foreground">준비 중</p>
                      </div>
                      <Switch checked={false} disabled />
                    </div>
                  </div>
                </section>
              </div>
            )}

            {/* Billing Tab */}
            {activeTab === "billing" && (
              <div className="rounded-2xl border bg-card p-6">
                <div className="mb-5">
                  <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">01</span>
                  <h2 className="mt-1 text-base font-semibold">결제 및 구독</h2>
                </div>
                <p className="text-sm text-muted-foreground">결제 관련 기능은 준비 중입니다.</p>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Bottom Save Bar */}
      {isDirty && (
        <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur-sm px-6 py-4">
          <div className="mx-auto flex max-w-5xl items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              저장하지 않은 변경사항이 있습니다
            </p>
            <div className="flex gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDiscard}
                disabled={isSaving}
                className="rounded-xl"
              >
                취소
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={isSaving}
                className="gradient-primary rounded-xl text-white"
              >
                {isSaving ? "저장 중..." : "변경사항 저장"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
