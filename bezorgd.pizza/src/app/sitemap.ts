import type { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: 'https://bezorgd.pizza',
      changeFrequency: 'weekly',
      priority: 1,
    },
  ]
}
