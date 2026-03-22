import { NextRequest, NextResponse } from 'next/server'

import { listIncomingLocalFoodOrders } from '@/lib/local-food/local-food-service'
import { resolveOwnerPrivateAuthContext } from '@/lib/owner-private-auth-resolver'

export async function GET(request: NextRequest) {
  const ownerSession = await resolveOwnerPrivateAuthContext(request)
  if (!ownerSession) {
    return NextResponse.json(
      {
        error: {
          code: 'OWNER_AUTH_REQUIRED',
          message: 'Owner app session is required to read incoming local food orders',
        },
      },
      { status: 401 }
    )
  }

  return NextResponse.json({ orders: listIncomingLocalFoodOrders(ownerSession.activeProviderDid) })
}
