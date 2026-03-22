import { NextResponse } from 'next/server'

import { findPublicRestaurantBySlug } from '@/lib/local-food/local-food-service'

export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string }> }
) {
  const { slug } = await context.params
  const restaurant = await findPublicRestaurantBySlug(slug)

  if (!restaurant) {
    return NextResponse.json(
      {
        ok: false,
        scope: 'public',
        resource: 'restaurant',
        status: 'not_found',
      },
      { status: 404 }
    )
  }

  return NextResponse.json({
    ok: true,
    scope: 'public',
    resource: 'restaurant',
    status: 'ready',
    restaurant,
  })
}
