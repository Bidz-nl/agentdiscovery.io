import { NextRequest, NextResponse } from 'next/server'

import { getNativeNegotiationDetail } from '@/lib/adp-v2/native-negotiation-service'
import { getSessionNegotiationRecord } from '@/lib/adp-v2/session-negotiation-repository'
import { resolveOwnerPrivateAuthContext } from '@/lib/owner-private-auth-resolver'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const ownerSession = await resolveOwnerPrivateAuthContext(request)

  if (!ownerSession) {
    return NextResponse.json(
      {
        error: {
          code: 'AUTH_REQUIRED',
          message: 'Authentication required',
        },
      },
      { status: 401 }
    )
  }

  const { id } = await context.params
  const negotiationId = Number.parseInt(id, 10)

  if (!Number.isFinite(negotiationId)) {
    return NextResponse.json(
      {
        error: {
          code: 'INVALID_NEGOTIATION_ID',
          message: 'Negotiation id must be a number',
        },
      },
      { status: 400 }
    )
  }

  const nativeNegotiation = getNativeNegotiationDetail(negotiationId)
  if (nativeNegotiation) {
    if (nativeNegotiation.initiatorDid !== ownerSession.activeAgentDid && nativeNegotiation.responderDid !== ownerSession.activeAgentDid) {
      return NextResponse.json(
        {
          error: {
            code: 'NEGOTIATION_FORBIDDEN',
            message: 'Negotiation is not available for the active bot',
          },
        },
        { status: 403 }
      )
    }
    return NextResponse.json({ negotiation: nativeNegotiation })
  }

  const sessionNegotiation = getSessionNegotiationRecord(negotiationId)
  if (sessionNegotiation) {
    if (sessionNegotiation.initiatorDid !== ownerSession.activeAgentDid && sessionNegotiation.responderDid !== ownerSession.activeAgentDid) {
      return NextResponse.json(
        {
          error: {
            code: 'NEGOTIATION_FORBIDDEN',
            message: 'Negotiation is not available for the active bot',
          },
        },
        { status: 403 }
      )
    }
    return NextResponse.json({ negotiation: sessionNegotiation })
  }

  return NextResponse.json(
    {
      error: {
        code: 'NEGOTIATION_NOT_FOUND',
        message: 'Negotiation not found',
      },
    },
    { status: 404 }
  )
}
