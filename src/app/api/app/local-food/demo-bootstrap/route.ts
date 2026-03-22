import { NextRequest, NextResponse } from 'next/server'

import { LocalFoodServiceError, seedLocalFoodDemoForProvider } from '@/lib/local-food/local-food-service'
import { resolveOwnerPrivateAuthContext } from '@/lib/owner-private-auth-resolver'

export async function POST(request: NextRequest) {
  const ownerSession = await resolveOwnerPrivateAuthContext(request)
  if (!ownerSession) {
    return NextResponse.json(
      {
        error: {
          code: 'OWNER_AUTH_REQUIRED',
          message: 'Owner app session is required to bootstrap the local food demo',
        },
      },
      { status: 401 }
    )
  }

  try {
    const provider = seedLocalFoodDemoForProvider(ownerSession.activeProviderDid)
    return NextResponse.json({ provider }, { status: 201 })
  } catch (error) {
    const serviceError = error instanceof LocalFoodServiceError ? error : null
    return NextResponse.json(
      {
        error: {
          code: serviceError?.code || 'LOCAL_FOOD_DEMO_BOOTSTRAP_FAILED',
          message: serviceError?.message || 'Unable to bootstrap the local food demo',
        },
      },
      { status: serviceError?.status || 500 }
    )
  }
}
