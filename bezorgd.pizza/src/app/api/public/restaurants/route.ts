import { NextRequest, NextResponse } from 'next/server'

import { listPublicRestaurants } from '@/lib/local-food/local-food-service'

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const restaurants = await listPublicRestaurants({
    postcode: searchParams.get('postcode') ?? undefined,
    location: searchParams.get('location') ?? undefined,
    query: searchParams.get('q') ?? undefined,
  })

  return NextResponse.json({
    ok: true,
    scope: 'public',
    resource: 'restaurants',
    status: 'ready',
    restaurants,
  })
}
