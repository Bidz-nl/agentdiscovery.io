import { NextRequest, NextResponse } from 'next/server'

import { listLocalFoodDiscoverableProviders } from '@/lib/local-food/local-food-service'

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

export async function POST(request: NextRequest) {
  let body: unknown

  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      {
        error: {
          code: 'INVALID_LOCAL_FOOD_DISCOVER_REQUEST',
          message: 'Request body must be valid JSON',
        },
      },
      { status: 400 }
    )
  }

  if (!isRecord(body) || typeof body.postcode !== 'string') {
    return NextResponse.json(
      {
        error: {
          code: 'INVALID_LOCAL_FOOD_DISCOVER_REQUEST',
          message: 'postcode is required',
        },
      },
      { status: 400 }
    )
  }

  return NextResponse.json({ providers: listLocalFoodDiscoverableProviders(body.postcode) })
}
