import { NextRequest, NextResponse } from 'next/server'

import { applyNativeNegotiationAction, getNativeProviderInboxReadModel } from '@/lib/adp-v2/native-negotiation-service'
import { resolveOwnerPrivateAuthContext } from '@/lib/owner-private-auth-resolver'

function ownerScopeError() {
  return NextResponse.json(
    {
      error: {
        code: 'OWNER_PROVIDER_SCOPE_INVALID',
        message: 'Requested provider is not available in the active owner scope',
      },
    },
    { status: 403 }
  )
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ did: string }> }
) {
  const ownerSession = await resolveOwnerPrivateAuthContext(request)

  if (!ownerSession) {
    return NextResponse.json(
      {
        error: {
          code: 'OWNER_AUTH_REQUIRED',
          message: 'Owner app session is required to read private provider inbox',
        },
      },
      { status: 401 }
    )
  }

  const providerDid = decodeURIComponent((await context.params).did)

  if (providerDid !== ownerSession.activeProviderDid) {
    return ownerScopeError()
  }

  return NextResponse.json(getNativeProviderInboxReadModel(providerDid))
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ did: string }> }
) {
  const ownerSession = await resolveOwnerPrivateAuthContext(request)

  if (!ownerSession) {
    return NextResponse.json(
      {
        error: {
          code: 'OWNER_AUTH_REQUIRED',
          message: 'Owner app session is required to respond to private provider inbox items',
        },
      },
      { status: 401 }
    )
  }

  const providerDid = decodeURIComponent((await context.params).did)

  if (providerDid !== ownerSession.activeProviderDid) {
    return ownerScopeError()
  }

  let body: unknown

  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      {
        error: {
          code: 'INVALID_PROVIDER_INBOX_ACTION_REQUEST',
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
          code: 'INVALID_PROVIDER_INBOX_ACTION_REQUEST',
          message: 'Request body must be a JSON object',
        },
      },
      { status: 400 }
    )
  }

  const payload = body as Record<string, unknown>
  const negotiationId = typeof payload.negotiationId === 'number' ? payload.negotiationId : null

  if (!negotiationId) {
    return NextResponse.json(
      {
        error: {
          code: 'INVALID_NEGOTIATION_ID',
          message: 'negotiationId must be a number',
        },
      },
      { status: 400 }
    )
  }

  const action = payload.action

  if (action !== 'accept' && action !== 'reject' && action !== 'counter') {
    return NextResponse.json(
      {
        error: {
          code: 'UNSUPPORTED_NEGOTIATION_ACTION',
          message: 'Only accept, reject, and counter are supported',
        },
      },
      { status: 400 }
    )
  }

  const result = applyNativeNegotiationAction(negotiationId, providerDid, action, 'responder', payload)

  if (!result.ok) {
    return NextResponse.json(result.error.body, { status: result.error.status })
  }

  return NextResponse.json({
    ok: true,
    negotiation: {
      id: result.negotiation.id,
      status: result.negotiation.status,
    },
  })
}
