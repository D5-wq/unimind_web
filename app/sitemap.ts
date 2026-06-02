import { MetadataRoute } from "next"

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://unimind-web.vercel.app"
  return [
    { url: base, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    { url: `${base}/dashboard`, lastModified: new Date(), changeFrequency: "daily", priority: 0.8 },
    { url: `${base}/dashboard/upload`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.7 },
  ]
}
