import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server-client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Share2, Link as LinkIcon, Camera } from "lucide-react";

interface Props {
  params: Promise<{ userId: string }>;
}

async function getProfile(userId: string) {
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "id, role, display_name, avatar_path, headline, bio, availability_status, is_profile_public"
    )
    .eq("id", userId)
    .single();

  if (!profile || !profile.is_profile_public) return null;

  const avatarUrl = profile.avatar_path
    ? supabase.storage.from("profile-avatars").getPublicUrl(profile.avatar_path).data.publicUrl
    : null;

  const { data: portfolios } = await supabase
    .from("portfolios")
    .select("id, slug, title, description, bookmark_count, portfolio_images(thumb_path, display_path, original_path, is_cover, sort_order)")
    .eq("owner_id", userId)
    .eq("status", "published")
    .is("deleted_at", null)
    .order("published_at", { ascending: false });

  const portfolioItems = (portfolios ?? []).map((p: Record<string, unknown>) => {
    const images = p.portfolio_images as Array<{ thumb_path: string | null; display_path: string | null; original_path: string | null; is_cover: boolean; sort_order: number }> | null;
    const sorted = [...(images ?? [])].sort((a, b) => a.sort_order - b.sort_order);
    const cover = sorted.find((i) => i.is_cover) ?? sorted[0];
    const coverPath = cover?.thumb_path ?? cover?.display_path ?? cover?.original_path ?? null;
    const displayPath = cover?.display_path ?? cover?.original_path ?? cover?.thumb_path ?? null;
    const thumbUrl = coverPath
      ? supabase.storage.from("portfolio-public").getPublicUrl(coverPath).data.publicUrl
      : null;
    const heroUrl = displayPath
      ? supabase.storage.from("portfolio-public").getPublicUrl(displayPath).data.publicUrl
      : thumbUrl;
    return {
      id: p.id as string,
      slug: p.slug as string,
      title: p.title as string,
      description: (p.description as string | null) ?? null,
      thumbUrl,
      heroUrl,
      bookmarkCount: (p.bookmark_count as number) ?? 0,
    };
  });

  return { ...profile, avatar_path: avatarUrl, portfolioCount: portfolioItems.length, portfolios: portfolioItems };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { userId } = await params;
  const profile = await getProfile(userId);

  if (!profile) {
    return { title: "사용자를 찾을 수 없습니다." };
  }

  return {
    title: `${profile.display_name ?? "사용자"} | DrawMate`,
    description: profile.headline ?? profile.bio ?? undefined,
  };
}

export default async function UserProfilePage({ params }: Props) {
  const { userId } = await params;
  const profile = await getProfile(userId);

  if (!profile) {
    notFound();
  }

  const availabilityLabel: Record<string, string> = {
    open: "활동 가능",
    busy: "바쁨",
    unavailable: "활동 불가",
  };

  const availabilityVariant: Record<string, "default" | "secondary" | "destructive"> = {
    open: "default",
    busy: "secondary",
    unavailable: "destructive",
  };

  const status = profile.availability_status ?? "unavailable";
  const initials = (profile.display_name ?? "U").slice(0, 2).toUpperCase();
  const featuredPortfolio = profile.portfolios[0] ?? null;

  return (
    <div className="bg-background min-h-screen">
      {/* ── Hero Header ── */}
      <div className="bg-surface-container-low border-b border-border">
        <div className="max-w-5xl mx-auto px-4 py-12 sm:py-16">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-8">
            {/* Avatar with decorative ring */}
            <div className="relative flex-shrink-0">
              <div className="absolute inset-0 -m-3 rounded-full bg-primary-container opacity-10" />
              <Avatar className="relative w-48 h-48 ring-4 ring-background shadow-xl">
                <AvatarImage
                  src={profile.avatar_path ?? undefined}
                  alt={profile.display_name ?? "사용자"}
                />
                <AvatarFallback className="text-4xl font-headline font-bold bg-muted">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </div>

            {/* Profile info */}
            <div className="flex-1 min-w-0 text-center sm:text-left">
              {/* Headline label */}
              {profile.headline && (
                <p className="text-xs font-semibold uppercase tracking-widest text-tertiary mb-2">
                  {profile.headline}
                </p>
              )}

              {/* Display name */}
              <h1 className="text-5xl font-extrabold font-headline leading-tight text-foreground mb-3">
                {profile.display_name ?? "사용자"}
              </h1>

              {/* Availability badge */}
              <div className="flex items-center justify-center sm:justify-start gap-2 mb-4">
                <Badge variant={availabilityVariant[status]}>
                  {availabilityLabel[status]}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  작품 {profile.portfolioCount}개
                </span>
              </div>

              {/* Bio */}
              {profile.bio && (
                <p className="text-base text-muted-foreground leading-relaxed max-w-xl mb-6 whitespace-pre-wrap line-clamp-3">
                  {profile.bio}
                </p>
              )}

              {/* Social pill buttons */}
              <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-card border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors">
                  <Share2 className="w-4 h-4 text-primary" />
                  공유
                </span>
                <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-card border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors">
                  <LinkIcon className="w-4 h-4 text-primary" />
                  링크
                </span>
                <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-card border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors">
                  <Camera className="w-4 h-4 text-primary" />
                  포트폴리오
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-10 space-y-12">
        {/* ── Featured Project ── */}
        {featuredPortfolio && (
          <section>
            <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">
              Featured 프로젝트
            </h2>
            <Link href={`/portfolio/${featuredPortfolio.slug}`} className="block group">
              <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-muted shadow-lg">
                {featuredPortfolio.heroUrl ? (
                  <Image
                    src={featuredPortfolio.heroUrl}
                    alt={featuredPortfolio.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 960px"
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    priority
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                    <Camera className="w-12 h-12 opacity-30" />
                  </div>
                )}
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <p className="text-white text-xl font-bold font-headline line-clamp-1">
                    {featuredPortfolio.title}
                  </p>
                  {featuredPortfolio.description && (
                    <p className="text-white/80 text-sm mt-1 line-clamp-2">
                      {featuredPortfolio.description}
                    </p>
                  )}
                </div>
              </div>
            </Link>
          </section>
        )}

        {/* ── Gallery Tabs ── */}
        <section>
          {/* Tab bar */}
          <div className="flex items-center justify-between mb-6 border-b border-border pb-3">
            <div className="flex items-center gap-1">
              <span className="px-4 py-2 rounded-lg text-sm font-semibold bg-primary text-primary-foreground">
                포트폴리오
              </span>
              <span className="px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-default">
                컬렉션
              </span>
              <span className="px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-default">
                소개
              </span>
            </div>
          </div>

          {/* Portfolio grid */}
          {profile.portfolioCount === 0 ? (
            <div className="text-center py-20 border-2 border-dashed border-border rounded-xl">
              <Camera className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-40" />
              <p className="text-sm text-muted-foreground">아직 공개된 작품이 없습니다.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {profile.portfolios.map((p) => (
                <Link
                  key={p.id}
                  href={`/portfolio/${p.slug}`}
                  className="group relative aspect-square rounded-xl overflow-hidden bg-muted block"
                >
                  {p.thumbUrl ? (
                    <Image
                      src={p.thumbUrl}
                      alt={p.title}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                      <Camera className="w-8 h-8 opacity-30" />
                    </div>
                  )}
                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-primary/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                    <p className="text-white text-sm font-semibold line-clamp-2 font-headline">
                      {p.title}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
