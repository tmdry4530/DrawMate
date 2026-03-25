import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server-client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

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
    .select("id, slug, title, bookmark_count, portfolio_images(thumb_path, display_path, original_path, is_cover, sort_order)")
    .eq("owner_id", userId)
    .eq("status", "published")
    .is("deleted_at", null)
    .order("published_at", { ascending: false });

  const portfolioItems = (portfolios ?? []).map((p: Record<string, unknown>) => {
    const images = p.portfolio_images as Array<{ thumb_path: string | null; display_path: string | null; original_path: string | null; is_cover: boolean; sort_order: number }> | null;
    const sorted = [...(images ?? [])].sort((a, b) => a.sort_order - b.sort_order);
    const cover = sorted.find((i) => i.is_cover) ?? sorted[0];
    const coverPath = cover?.thumb_path ?? cover?.display_path ?? cover?.original_path ?? null;
    const thumbUrl = coverPath
      ? supabase.storage.from("portfolio-public").getPublicUrl(coverPath).data.publicUrl
      : null;
    return { id: p.id as string, slug: p.slug as string, title: p.title as string, thumbUrl, bookmarkCount: (p.bookmark_count as number) ?? 0 };
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

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* 헤더 */}
      <Card className="mb-8">
        <CardContent className="p-6">
          <div className="flex items-center gap-5">
            <Avatar className="h-20 w-20">
              <AvatarImage src={profile.avatar_path ?? undefined} alt={profile.display_name ?? "사용자"} />
              <AvatarFallback className="text-xl">{initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-bold">{profile.display_name ?? "사용자"}</h1>
                <Badge variant={availabilityVariant[status]}>
                  {availabilityLabel[status]}
                </Badge>
              </div>
              {profile.headline && (
                <p className="text-muted-foreground text-sm mt-1">{profile.headline}</p>
              )}
              {profile.bio && (
                <p className="text-sm text-muted-foreground mt-3 whitespace-pre-wrap line-clamp-3">
                  {profile.bio}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 통계 카드 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{profile.portfolioCount}</p>
            <p className="text-xs text-muted-foreground mt-0.5">작품</p>
          </CardContent>
        </Card>
      </div>

      {/* 포트폴리오 */}
      <div>
        <h2 className="font-semibold mb-4">작품</h2>
        {profile.portfolioCount === 0 ? (
          <div className="text-center py-16 border-2 border-dashed rounded-xl">
            <p className="text-sm text-muted-foreground">아직 공개된 작품이 없습니다.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {profile.portfolios.map((p) => (
              <Card key={p.id} className="overflow-hidden group">
                <a href={`/portfolio/${p.slug}`} className="block">
                  <div className="relative aspect-[4/3] bg-muted">
                    {p.thumbUrl ? (
                      <Image
                        src={p.thumbUrl}
                        alt={p.title}
                        fill
                        sizes="(max-width: 768px) 50vw, 33vw"
                        className="object-cover group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
                        이미지 없음
                      </div>
                    )}
                  </div>
                  <CardContent className="p-3">
                    <p className="text-sm font-medium line-clamp-1">{p.title}</p>
                  </CardContent>
                </a>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
