import { NextResponse } from 'next/server'

import { listPublicRestaurants } from '@/lib/local-food/local-food-service'

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    postcode?: string
    location?: string
    query?: string
  }

  const restaurants = await listPublicRestaurants({
    postcode: body.postcode,
    location: body.location,
    query: body.query,
  })

  return NextResponse.json({
    ok: true,
    scope: 'public',
    resource: 'discover',
    status: 'ready',
    restaurants,
  })
}
