"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Camera, Trash2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { createClient } from "@/lib/supabase/browser-client";
import { unwrapApiData } from "@/lib/utils/client-api";

type TabId = "account" | "portfolio" | "privacy" | "billing";

const NAV_ITEMS: { id: TabId; label: string }[] = [
  { id: "account", label: "계정" },
  { id: "portfolio", label: "포트폴리오" },
  { id: "privacy", label: "개인정보" },
  { id: "billing", label: "결제" },
];

export default function SettingsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabId>("account");

  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [headline, setHeadline] = useState("");
  const [snsLinks, setSnsLinks] = useState<string[]>([""]);
  const [availabilityStatus, setAvailabilityStatus] = useState<"open" | "busy" | "unavailable">("open");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isProfilePublic, setIsProfilePublic] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [newsletterNotifications, setNewsletterNotifications] = useState(false);

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

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/");
  };

  const markDirty = () => setIsDirty(true);

  return (
    <div className="min-h-screen bg-black text-white -mt-20 pt-20">
      <div className="p-6 md:p-12 max-w-[1200px] mx-auto">
        <div className="flex flex-col md:flex-row gap-8 md:gap-12">
          {/* Category Tabs */}
          <aside className="md:w-48 shrink-0">
            <h2 className="text-xs font-bold uppercase tracking-widest text-neutral-500 mb-4">
              Categories
            </h2>
            <nav className="flex md:flex-col gap-1">
              {NAV_ITEMS.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`px-4 py-3 text-left text-sm font-bold uppercase tracking-wider ${
                    activeTab === item.id
                      ? "bg-white text-black"
                      : "text-neutral-500 hover:text-white hover:bg-neutral-900"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </nav>
          </aside>

          {/* Main Content */}
          <main className="flex-1 min-w-0 space-y-12">
            {activeTab === "account" && (
              <>
                {/* Avatar */}
                <div className="flex items-center gap-6">
                  <div className="relative group">
                    <Avatar className="h-20 w-20 rounded-none">
                      <AvatarImage src={avatarUrl ?? undefined} alt={displayName || "프로필"} />
                      <AvatarFallback className="rounded-none text-xl font-black bg-neutral-800">
                        {(displayName || "U").slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploadingAvatar}
                      className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 cursor-pointer"
                    >
                      <Camera className="h-5 w-5" />
                    </button>
                  </div>
                  <div className="flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploadingAvatar}
                      className="text-xs font-bold uppercase tracking-wider text-neutral-400 hover:text-white"
                    >
                      {isUploadingAvatar ? "업로드 중..." : "아바타 변경"}
                    </button>
                    {avatarUrl && (
                      <button
                        type="button"
                        onClick={handleAvatarDelete}
                        disabled={isUploadingAvatar}
                        className="text-xs font-bold uppercase tracking-wider text-red-500 hover:text-red-400 flex items-center gap-1"
                      >
                        <Trash2 className="h-3 w-3" />
                        삭제
                      </button>
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

                {/* 01. Basic Info */}
                <section>
                  <h2 className="text-2xl font-black uppercase tracking-tighter mb-8">
                    01. 기본 정보
                  </h2>
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-neutral-500">
                          Display Name
                        </label>
                        <input
                          value={displayName}
                          onChange={(e) => { setDisplayName(e.target.value); markDirty(); }}
                          placeholder="표시 이름"
                          maxLength={40}
                          disabled={loading}
                          className="w-full bg-transparent border border-neutral-800 p-4 text-white placeholder:text-neutral-700 focus:border-white focus:ring-0 rounded-none disabled:opacity-50"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-neutral-500">
                          Username
                        </label>
                        <input
                          value={username}
                          onChange={(e) => { setUsername(e.target.value); markDirty(); }}
                          placeholder="@username"
                          maxLength={40}
                          disabled={loading}
                          className="w-full bg-transparent border border-neutral-800 p-4 text-white placeholder:text-neutral-700 focus:border-white focus:ring-0 rounded-none disabled:opacity-50"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-neutral-500">
                        Bio
                      </label>
                      <textarea
                        value={bio}
                        onChange={(e) => { setBio(e.target.value); markDirty(); }}
                        placeholder="자기소개를 작성해보세요"
                        maxLength={500}
                        rows={4}
                        disabled={loading}
                        className="w-full bg-transparent border border-neutral-800 p-4 text-white placeholder:text-neutral-700 focus:border-white focus:ring-0 rounded-none resize-none disabled:opacity-50"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-neutral-500">
                          Location
                        </label>
                        <input
                          value={location}
                          onChange={(e) => { setLocation(e.target.value); markDirty(); }}
                          placeholder="Seoul, South Korea"
                          maxLength={100}
                          disabled={loading}
                          className="w-full bg-transparent border border-neutral-800 p-4 text-white placeholder:text-neutral-700 focus:border-white focus:ring-0 rounded-none disabled:opacity-50"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-neutral-500">
                          Headline
                        </label>
                        <input
                          value={headline}
                          onChange={(e) => { setHeadline(e.target.value); markDirty(); }}
                          placeholder="Senior Digital Architect"
                          maxLength={80}
                          disabled={loading}
                          className="w-full bg-transparent border border-neutral-800 p-4 text-white placeholder:text-neutral-700 focus:border-white focus:ring-0 rounded-none disabled:opacity-50"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-neutral-500">
                        Availability Status
                      </label>
                      <select
                        value={availabilityStatus}
                        onChange={(e) => {
                          setAvailabilityStatus(e.target.value as "open" | "busy" | "unavailable");
                          markDirty();
                        }}
                        disabled={loading}
                        className="w-full bg-black border border-neutral-800 p-4 text-white focus:border-white focus:ring-0 rounded-none disabled:opacity-50"
                      >
                        <option value="open">Available for Work</option>
                        <option value="busy">Busy</option>
                        <option value="unavailable">Unavailable</option>
                      </select>
                    </div>
                  </div>
                </section>

                {/* 02. Preferences */}
                <section>
                  <h2 className="text-2xl font-black uppercase tracking-tighter mb-8">
                    02. 환경설정
                  </h2>
                  <div className="space-y-6">
                    <div className="flex items-center justify-between py-4 border-b border-neutral-800">
                      <div>
                        <p className="font-bold">Email Notifications</p>
                        <p className="text-sm text-neutral-500">
                          Receive updates about your portfolio performance.
                        </p>
                      </div>
                      <Switch
                        checked={emailNotifications}
                        onCheckedChange={(v) => { setEmailNotifications(v); markDirty(); }}
                        disabled={loading}
                      />
                    </div>
                    <div className="flex items-center justify-between py-4 border-b border-neutral-800">
                      <div>
                        <p className="font-bold">Newsletter &amp; Marketing</p>
                        <p className="text-sm text-neutral-500">
                          Get curated updates about new features and events.
                        </p>
                      </div>
                      <Switch
                        checked={newsletterNotifications}
                        onCheckedChange={(v) => { setNewsletterNotifications(v); markDirty(); }}
                        disabled={loading}
                      />
                    </div>
                  </div>
                </section>

                {/* Danger Zone */}
                <section className="border-t border-neutral-800 pt-12">
                  <h2 className="text-xs font-bold uppercase tracking-widest text-red-500/60 mb-6">
                    Danger Zone
                  </h2>
                  <div className="flex items-center justify-between bg-neutral-900/50 border border-neutral-800 p-6">
                    <div>
                      <p className="font-bold">Terminate Session</p>
                      <p className="text-sm text-neutral-500">
                        Log out of all devices and clear session cache.
                      </p>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="bg-red-600 text-white px-6 py-3 font-bold uppercase tracking-wider text-sm hover:bg-red-700"
                    >
                      로그아웃
                    </button>
                  </div>
                </section>

                {/* Save / Discard */}
                <div className="flex gap-4 pt-8 border-t border-neutral-800">
                  <button
                    onClick={handleSave}
                    disabled={isSaving || !isDirty}
                    className="bg-white text-black px-10 py-4 font-black uppercase tracking-wider hover:bg-neutral-200 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    {isSaving ? "저장 중..." : "Save Changes"}
                  </button>
                  <button
                    onClick={() => { setIsDirty(false); toast("변경사항이 취소되었습니다."); }}
                    disabled={isSaving || !isDirty}
                    className="border border-neutral-800 px-10 py-4 font-bold uppercase tracking-wider hover:border-white disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    Discard
                  </button>
                </div>
              </>
            )}

            {activeTab === "portfolio" && (
              <div className="py-16 text-center border border-dashed border-neutral-800">
                <p className="text-neutral-500 font-bold uppercase">준비 중</p>
              </div>
            )}

            {activeTab === "privacy" && (
              <section>
                <h2 className="text-2xl font-black uppercase tracking-tighter mb-8">
                  공개 설정
                </h2>
                <div className="flex items-center justify-between py-4 border-b border-neutral-800">
                  <div>
                    <p className="font-bold">프로필 공개</p>
                    <p className="text-sm text-neutral-500">
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
            )}

            {activeTab === "billing" && (
              <div className="py-16 text-center border border-dashed border-neutral-800">
                <p className="text-neutral-500 font-bold uppercase">준비 중</p>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
