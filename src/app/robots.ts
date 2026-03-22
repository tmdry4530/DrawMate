import type { MetadataRoute } from "next"

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://drawmate.xyz"

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/explore", "/portfolio/", "/users/"],
        disallow: ["/settings/", "/studio/", "/messages/", "/notifications/", "/api/"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
