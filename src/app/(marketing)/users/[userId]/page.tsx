import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server-client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
    <div className="min-h-screen">
      {/* Cover area */}
      <div className="h-48 bg-gradient-to-r from-violet-500 to-indigo-500" />

      <div className="container max-w-4xl px-4">
        {/* Avatar + info */}
        <div className="-mt-16 flex items-end gap-4 pb-6">
          <Avatar className="h-32 w-32 border-4 border-background">
            <AvatarImage src={profile.avatar_path ?? undefined} alt={profile.display_name ?? "사용자"} />
            <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
          </Avatar>
          <div className="mb-2 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold">{profile.display_name ?? "사용자"}</h1>
              <Badge variant={availabilityVariant[status]}>
                {availabilityLabel[status]}
              </Badge>
            </div>
            {profile.headline && (
              <p className="text-muted-foreground mt-1">{profile.headline}</p>
            )}
          </div>
        </div>

        {/* Bio */}
        {profile.bio && (
          <Card className="mb-6">
            <CardContent className="pt-4">
              <p className="text-sm whitespace-pre-wrap">{profile.bio}</p>
            </CardContent>
          </Card>
        )}

        {/* Stats */}
        <div className="flex gap-4 mb-6 text-sm text-muted-foreground">
          <span>
            <strong className="text-foreground">{profile.portfolioCount}</strong> 작품
          </span>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="works">
          <TabsList>
            <TabsTrigger value="works">작품</TabsTrigger>
          </TabsList>
          <TabsContent value="works">
            {profile.portfolioCount === 0 ? (
              <div className="py-16 text-center text-muted-foreground">
                아직 공개된 작품이 없습니다.
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3 py-4">
                {profile.portfolios.map((p) => (
                  <a key={p.id} href={`/portfolio/${p.slug}`} className="group block">
                    <div className="relative aspect-[4/3] bg-muted rounded-lg overflow-hidden">
                      {p.thumbUrl ? (
                        <Image
                          src={p.thumbUrl}
                          alt={p.title}
                          fill
                          sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                          className="object-cover group-hover:scale-105 transition-transform"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">이미지 없음</div>
                      )}
                    </div>
                    <p className="mt-2 text-sm font-medium line-clamp-1">{p.title}</p>
                  </a>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
