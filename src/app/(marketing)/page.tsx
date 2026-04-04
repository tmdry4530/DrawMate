import Link from "next/link";
import Image from "next/image";
import { ChevronDown, PlusCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/server-client";

interface PortfolioRow {
  id: string;
  slug: string;
  title: string;
  bookmark_count: number;
  owner: {
    id: string;
    display_name: string | null;
    avatar_path: string | null;
  } | null;
  cover_image:
  | {
    thumb_path: string | null;
    display_path: string | null;
    original_path: string | null;
    is_cover: boolean;
    sort_order: number;
  }
  | {
    thumb_path: string | null;
    display_path: string | null;
    original_path: string | null;
    is_cover: boolean;
    sort_order: number;
  }[]
  | null;
}

interface CoverImageRow {
  thumb_path: string | null;
  display_path: string | null;
  original_path: string | null;
  is_cover: boolean;
  sort_order: number;
}

interface TagRow {
  id: string;
  slug: string;
  name: string;
  category: string;
}

async function getRecentPortfolios(): Promise<PortfolioRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("portfolios")
    .select(
      `id, slug, title, bookmark_count,
       owner:profiles!owner_id(id, display_name, avatar_path),
       cover_image:portfolio_images(thumb_path, display_path, original_path, is_cover, sort_order)`
    )
    .eq("status", "published")
    .eq("visibility", "public")
    .is("deleted_at", null)
    .order("published_at", { ascending: false })
    .limit(5);

  const rows = (data ?? []) as unknown as PortfolioRow[];
  return rows.map((row) => {
    const owner = Array.isArray(row.owner) ? row.owner[0] : row.owner;
    const rawCoverImages = Array.isArray(row.cover_image)
      ? row.cover_image
      : row.cover_image
        ? [row.cover_image]
        : [];
    const orderedCoverImages = [...rawCoverImages].sort(
      (a: CoverImageRow, b: CoverImageRow) => a.sort_order - b.sort_order
    );
    const selectedCoverImage =
      orderedCoverImages.find((image) => image.is_cover) ?? orderedCoverImages[0] ?? null;

    const avatarPath = owner?.avatar_path ?? null;
    const publicPath =
      selectedCoverImage?.thumb_path ??
      selectedCoverImage?.display_path ??
      selectedCoverImage?.original_path ??
      null;

    const avatarUrl = avatarPath
      ? supabase.storage.from("profile-avatars").getPublicUrl(avatarPath).data.publicUrl
      : null;
    const thumbUrl = publicPath
      ? supabase.storage.from("portfolio-public").getPublicUrl(publicPath).data.publicUrl
      : null;

    return {
      ...row,
      owner: owner
        ? {
          ...owner,
          avatar_path: avatarUrl,
        }
        : null,
      cover_image: selectedCoverImage
        ? {
          ...selectedCoverImage,
          thumb_path: thumbUrl,
        }
        : null,
    };
  });
}

async function getPopularTags(): Promise<TagRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("tags")
    .select("id, slug, name, category")
    .eq("category", "field")
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .limit(12);

  return (data ?? []) as TagRow[];
}

const TAG_LABELS = [
  "일러스트",
  "웹툰",
  "캐릭터 디자인",
  "컨셉아트",
  "UI/UX",
  "3D 아트",
];

export default async function HomePage() {
  const [portfolios, tags] = await Promise.all([getRecentPortfolios(), getPopularTags()]);

  const tagLabels = tags.length > 0 ? tags.map((t) => t.name) : TAG_LABELS;

  return (
    <div className="bg-black text-white -mt-20">
      {/* ── Hero Section ── */}
      <section className="relative flex min-h-screen w-full flex-col items-center justify-center px-6 pt-24 overflow-hidden">
        {/* Background watermark */}
        <div className="pointer-events-none absolute inset-0 flex select-none items-center justify-center opacity-[0.03]">
          <span className="text-[30vw] font-black leading-none tracking-tighter">DM.</span>
        </div>

        <div className="relative z-10 flex flex-col items-center text-center">
          <h1 className="text-7xl font-black tracking-tighter leading-none md:text-[10rem] lg:text-[12rem]">
            DRAWMATE.
          </h1>

          <div className="mt-12 flex w-full max-w-2xl flex-col gap-4 px-4 sm:flex-row sm:gap-6">
            <Link
              href="/studio/portfolios/new"
              className="flex-1 bg-white py-5 px-10 text-center text-lg font-black text-black uppercase transition-colors hover:bg-neutral-200 sm:py-6 sm:text-xl"
            >
              포트폴리오 만들기
            </Link>
            <Link
              href="/explore"
              className="flex-1 border-2 border-white py-5 px-10 text-center text-lg font-black text-white uppercase transition-colors hover:bg-white hover:text-black sm:py-6 sm:text-xl"
            >
              작가 구인
            </Link>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 animate-bounce">
          <ChevronDown className="h-10 w-10 text-white/60" />
        </div>
      </section>

      {/* ── Recent Portfolios ── */}
      <section className="w-full bg-[#0e0e0e] py-24 px-6 md:px-16">
        <div className="mx-auto max-w-[1400px]">
          <header className="mb-16">
            <h2 className="mb-4 text-3xl font-black uppercase tracking-tight md:text-5xl">
              최근 등록된 포트폴리오
            </h2>
            <div className="h-2 w-24 bg-white" />
          </header>

          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 lg:gap-12">
            {portfolios.map((portfolio, i) => {
              const owner = Array.isArray(portfolio.owner)
                ? portfolio.owner[0]
                : portfolio.owner;
              const coverImage = Array.isArray(portfolio.cover_image)
                ? portfolio.cover_image[0]
                : portfolio.cover_image;
              const tagLabel = tagLabels[i % tagLabels.length];

              return (
                <Link
                  key={portfolio.id}
                  href={`/portfolio/${portfolio.slug}`}
                  className="group cursor-pointer overflow-hidden border border-neutral-800 bg-black transition-colors hover:border-white"
                >
                  <div className="relative aspect-video overflow-hidden bg-neutral-900">
                    {coverImage?.thumb_path ? (
                      <Image
                        src={coverImage.thumb_path}
                        alt={portfolio.title}
                        fill
                        className="object-cover opacity-80 transition-all duration-300 group-hover:scale-105 group-hover:opacity-100"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-neutral-600">
                        이미지 없음
                      </div>
                    )}
                    <div className="absolute left-4 top-4">
                      <span className="inline-block border border-white bg-black px-3 py-1 text-xs font-bold uppercase">
                        {tagLabel}
                      </span>
                    </div>
                  </div>
                  <div className="p-6 md:p-8">
                    <h3 className="mb-1 text-xl font-black uppercase group-hover:text-neutral-300 md:text-2xl">
                      {owner?.display_name ?? "익명"}
                    </h3>
                    <p className="text-sm uppercase tracking-widest text-neutral-500">
                      {portfolio.title}
                    </p>
                  </div>
                </Link>
              );
            })}

            {/* Upload CTA card */}
            <Link
              href="/studio/portfolios/new"
              className="group cursor-pointer overflow-hidden border border-neutral-800 bg-black transition-colors hover:border-white"
            >
              <div className="flex aspect-video items-center justify-center bg-[#131313]">
                <PlusCircle className="h-16 w-16 text-neutral-700 transition-colors group-hover:text-neutral-500" />
              </div>
              <div className="flex flex-col items-center justify-center p-6 text-center md:p-8">
                <h3 className="mb-1 text-xl font-black uppercase md:text-2xl">
                  내 포트폴리오 올리기
                </h3>
                <p className="text-sm uppercase tracking-widest text-neutral-500">
                  Join the collective today
                </p>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Value Prop Section ── */}
      {/* <section className="overflow-hidden bg-white py-32 px-6 text-black md:px-16">
        <div className="mx-auto grid max-w-[1400px] grid-cols-1 items-center gap-16 md:grid-cols-2 md:gap-24">
          <div>
            <h2 className="mb-8 text-6xl font-black uppercase leading-none tracking-tighter md:text-8xl">
              THE BRUTAL<br />STANDARD.
            </h2>
            <p className="max-w-md text-xl font-medium leading-relaxed">
              불필요한 것은 걷어냅니다. 잡음도, 장식도 없이 오직 당신의 작업만을
              가장 날것 그대로, 가장 강렬하게 보여줍니다. 비전을 알아보는
              업계 리더들과 연결되세요.
            </p>
            <div className="mt-12">
              <Link
                href="/sign-up"
                className="inline-block bg-black px-12 py-6 text-xl font-black uppercase text-white transition-colors hover:bg-neutral-800"
              >
                지금 시작하기
              </Link>
            </div>
          </div>
          <div className="relative">
            <div className="flex aspect-square w-full items-center justify-center bg-black p-12">
              <span className="select-none text-[12rem] font-black leading-none text-white md:text-[15rem]">
                DM.
              </span>
            </div>
            <div className="absolute -bottom-8 -right-8 -z-10 h-48 w-48 bg-neutral-200" />
          </div>
        </div>
      </section> */}
    </div>
  );
}
