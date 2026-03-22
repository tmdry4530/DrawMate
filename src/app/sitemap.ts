import type { MetadataRoute } from "next"
import { createClient } from "@/lib/supabase/server-client"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://drawmate.kr"
  const supabase = await createClient()

  const [{ data: portfolios }, { data: profiles }] = await Promise.all([
    supabase
      .from("portfolios")
      .select("slug, updated_at")
      .eq("status", "published")
      .eq("visibility", "public")
      .is("deleted_at", null),
    supabase.from("profiles").select("id, updated_at"),
  ])

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${baseUrl}/explore`,
      lastModified: new Date(),
      changeFrequency: "hourly",
      priority: 0.9,
    },
  ]

  const portfolioRoutes: MetadataRoute.Sitemap = (portfolios ?? []).map((p) => ({
    url: `${baseUrl}/portfolio/${p.slug}`,
    lastModified: p.updated_at ? new Date(p.updated_at) : new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }))

  const profileRoutes: MetadataRoute.Sitemap = (profiles ?? []).map((p) => ({
    url: `${baseUrl}/users/${p.id}`,
    lastModified: p.updated_at ? new Date(p.updated_at) : new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }))

  return [...staticRoutes, ...portfolioRoutes, ...profileRoutes]
}
