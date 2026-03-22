import { NextRequest, NextResponse } from 'next/server'

import { getLocalFoodPublicProvider } from '@/lib/local-food/local-food-service'

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ providerDid: string }> }
) {
  const { providerDid } = await context.params
  const result = getLocalFoodPublicProvider(providerDid)

  if (!result) {
    return NextResponse.json(
      {
        error: {
          code: 'LOCAL_FOOD_PROVIDER_NOT_FOUND',
          message: 'Provider not found or not active for ordering',
        },
      },
      { status: 404 }
    )
  }

  return NextResponse.json(result)
}
