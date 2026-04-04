import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server-client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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

  const availabilityColor: Record<string, string> = {
    open: "border-white text-white",
    busy: "border-neutral-400 text-neutral-400",
    unavailable: "border-neutral-600 text-neutral-600",
  };

  const status = profile.availability_status ?? "unavailable";
  const initials = (profile.display_name ?? "U").slice(0, 2).toUpperCase();
  const featuredPortfolio = profile.portfolios[0] ?? null;

  return (
    <div className="bg-black text-white min-h-screen -mt-20 pt-20">
      {/* ── Hero Header ── */}
      <div className="border-b border-neutral-800">
        <div className="max-w-5xl mx-auto px-4 py-12 sm:py-16">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-8">
            {/* Avatar - square, no rounded */}
            <div className="relative flex-shrink-0">
              <Avatar className="relative w-48 h-48 rounded-none border border-neutral-700">
                <AvatarImage
                  src={profile.avatar_path ?? undefined}
                  alt={profile.display_name ?? "사용자"}
                  className="rounded-none object-cover grayscale"
                />
                <AvatarFallback className="text-4xl font-black bg-neutral-900 text-white rounded-none">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </div>

            {/* Profile info */}
            <div className="flex-1 min-w-0 text-center sm:text-left">
              {/* Headline label */}
              {profile.headline && (
                <p className="text-xs font-black uppercase tracking-widest text-neutral-500 mb-2">
                  {profile.headline}
                </p>
              )}

              {/* Display name */}
              <h1 className="text-5xl font-black uppercase tracking-tighter text-white leading-none mb-3">
                {profile.display_name ?? "사용자"}
              </h1>

              {/* Availability badge - brutalist, no rounded */}
              <div className="flex items-center justify-center sm:justify-start gap-3 mb-4">
                <span
                  className={`inline-block px-3 py-1 text-xs font-black uppercase tracking-widest border ${availabilityColor[status]}`}
                >
                  {availabilityLabel[status]}
                </span>
                <span className="text-sm font-black uppercase tracking-widest text-neutral-500">
                  작품 {profile.portfolioCount}개
                </span>
              </div>

              {/* Bio */}
              {profile.bio && (
                <p className="text-sm text-neutral-400 leading-relaxed max-w-xl mb-6 whitespace-pre-wrap line-clamp-3">
                  {profile.bio}
                </p>
              )}

              {/* Action buttons - brutalist, no rounded */}
              <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-4 py-2 bg-transparent border border-neutral-700 text-xs font-black uppercase tracking-widest text-neutral-300 hover:border-white hover:text-white transition-colors cursor-default">
                  <Share2 className="w-3 h-3" />
                  공유
                </span>
                <span className="inline-flex items-center gap-1.5 px-4 py-2 bg-transparent border border-neutral-700 text-xs font-black uppercase tracking-widest text-neutral-300 hover:border-white hover:text-white transition-colors cursor-default">
                  <LinkIcon className="w-3 h-3" />
                  링크
                </span>
                <span className="inline-flex items-center gap-1.5 px-4 py-2 bg-transparent border border-neutral-700 text-xs font-black uppercase tracking-widest text-neutral-300 hover:border-white hover:text-white transition-colors cursor-default">
                  <Camera className="w-3 h-3" />
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
            <p className="text-xs font-black uppercase tracking-widest text-neutral-500 mb-4">
              Featured Project
            </p>
            <Link href={`/portfolio/${featuredPortfolio.slug}`} className="block group">
              <div className="relative w-full aspect-video overflow-hidden bg-neutral-900 border border-neutral-800 group-hover:border-white transition-colors duration-300">
                {featuredPortfolio.heroUrl ? (
                  <Image
                    src={featuredPortfolio.heroUrl}
                    alt={featuredPortfolio.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 960px"
                    className="object-cover grayscale group-hover:grayscale-0 group-hover:scale-105 transition-all duration-500"
                    priority
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-neutral-700">
                    <Camera className="w-12 h-12 opacity-30" />
                  </div>
                )}
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <p className="text-white text-2xl font-black uppercase tracking-tighter line-clamp-1">
                    {featuredPortfolio.title}
                  </p>
                  {featuredPortfolio.description && (
                    <p className="text-neutral-400 text-sm mt-1 line-clamp-2">
                      {featuredPortfolio.description}
                    </p>
                  )}
                </div>
              </div>
            </Link>
          </section>
        )}

        {/* ── Portfolio Section ── */}
        <section>
          {/* Section heading with number watermark */}
          <div className="relative flex items-end justify-between mb-6 border-b border-neutral-800 pb-4">
            <h2 className="text-4xl font-black uppercase tracking-tighter text-white">
              Portfolio
            </h2>
            {profile.portfolioCount > 0 && (
              <span className="text-6xl font-black text-neutral-800 leading-none select-none">
                {String(profile.portfolioCount).padStart(2, "0")}
              </span>
            )}
          </div>

          {/* Portfolio grid */}
          {profile.portfolioCount === 0 ? (
            <div className="text-center py-20 border border-neutral-800">
              <Camera className="w-10 h-10 text-neutral-700 mx-auto mb-3" />
              <p className="text-sm font-black uppercase tracking-widest text-neutral-600">
                아직 공개된 작품이 없습니다
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-px bg-neutral-800">
              {profile.portfolios.map((p) => (
                <Link
                  key={p.id}
                  href={`/portfolio/${p.slug}`}
                  className="group relative aspect-square overflow-hidden bg-neutral-900 block border border-neutral-800 hover:border-white transition-colors duration-200"
                >
                  {p.thumbUrl ? (
                    <Image
                      src={p.thumbUrl}
                      alt={p.title}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover grayscale group-hover:grayscale-0 group-hover:scale-105 transition-all duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-neutral-700">
                      <Camera className="w-8 h-8 opacity-30" />
                    </div>
                  )}
                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                    <p className="text-white text-sm font-black uppercase tracking-tight line-clamp-2">
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
