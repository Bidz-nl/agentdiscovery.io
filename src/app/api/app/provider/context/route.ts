import { NextRequest, NextResponse } from 'next/server'

import { resolveOwnerPrivateAuthContext } from '@/lib/owner-private-auth-resolver'
import type { OwnerProviderContextResponse } from '@/lib/owner-private-auth'

export async function GET(request: NextRequest) {
  const ownerSession = await resolveOwnerPrivateAuthContext(request)

  if (!ownerSession) {
    return NextResponse.json(
      {
        error: {
          code: 'OWNER_AUTH_REQUIRED',
          message: 'Owner app session is required to read private provider context',
        },
      },
      { status: 401 }
    )
  }

  const result: OwnerProviderContextResponse = {
    owner: {
      ownerId: ownerSession.ownerId,
      sessionId: ownerSession.sessionId,
    },
    providerScope: {
      activeProviderDid: ownerSession.activeProviderDid,
      authorizedProviderDids: ownerSession.authorizedProviderDids,
    },
  }

  return NextResponse.json(result)
}
