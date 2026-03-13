import { NextRequest, NextResponse } from 'next/server'

import { resolveOwnerPrivateAuthContext } from '@/lib/owner-private-auth-resolver'
import { setOwnerAppSessionActiveProvider } from '@/lib/owner-private-auth-repository'
import type {
  OwnerProviderContextResponse,
  SwitchActiveProviderRequest,
} from '@/lib/owner-private-auth'

export async function POST(request: NextRequest) {
  const ownerSession = await resolveOwnerPrivateAuthContext(request)

  if (!ownerSession) {
    return NextResponse.json(
      {
        error: {
          code: 'OWNER_AUTH_REQUIRED',
          message: 'Owner app session is required to switch private provider scope',
        },
      },
      { status: 401 }
    )
  }

  let body: unknown

  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      {
        error: {
          code: 'INVALID_OWNER_PROVIDER_SWITCH_REQUEST',
          message: 'Request body must be valid JSON',
        },
      },
      { status: 400 }
    )
  }

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return NextResponse.json(
      {
        error: {
          code: 'INVALID_OWNER_PROVIDER_SWITCH_REQUEST',
          message: 'Provider switch request body must be a JSON object',
        },
      },
      { status: 400 }
    )
  }

  const input = body as SwitchActiveProviderRequest
  const nextSession = setOwnerAppSessionActiveProvider(ownerSession.sessionId, input.activeProviderDid)

  if (!nextSession) {
    return NextResponse.json(
      {
        error: {
          code: 'OWNER_PROVIDER_SCOPE_INVALID',
          message: 'Requested provider is not available in the active owner scope',
        },
      },
      { status: 409 }
    )
  }

  const result: OwnerProviderContextResponse = {
    owner: {
      ownerId: nextSession.ownerId,
      sessionId: nextSession.sessionId,
    },
    providerScope: {
      activeProviderDid: nextSession.activeProviderDid ?? ownerSession.activeProviderDid,
      authorizedProviderDids: nextSession.authorizedProviderDids,
    },
  }

  return NextResponse.json(result)
}
