import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: ['GPTBot', 'ClaudeBot', 'PerplexityBot', 'cohere-ai', 'anthropic-ai'],
        allow: ['/', '/api/adp/'],
        disallow: [
          '/app/onboarding/',
          '/app/consumer/order/',
          '/app/consumer/history',
          '/app/consumer/results',
          '/app/provider/services',
          '/app/profile',
        ],
      },
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/app/onboarding/',
          '/app/consumer/order/',
          '/app/consumer/history',
          '/app/consumer/results',
          '/app/provider/services',
          '/app/profile',
        ],
      },
    ],
    sitemap: 'https://www.agentdiscovery.io/sitemap.xml',
  }
}
