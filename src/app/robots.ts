import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/app/onboarding/',
          '/app/consumer/order/',
          '/app/consumer/history',
          '/app/consumer/results',
          '/app/provider/services',
          '/app/profile',
        ],
      },
    ],
    sitemap: 'https://agentdiscovery.io/sitemap.xml',
  }
}
