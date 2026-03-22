import { NextRequest, NextResponse } from 'next/server'

import { applyNativeNegotiationAction, getNativeNegotiationDetail } from '@/lib/adp-v2/native-negotiation-service'
import { requireHandshakeSession } from '@/lib/adp-v2/require-handshake-session'

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const negotiationId = Number.parseInt((await context.params).id, 10)

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

  let body: unknown

  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      {
        error: {
          code: 'INVALID_NEGOTIATION_ACTION_REQUEST',
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
          code: 'INVALID_NEGOTIATION_ACTION_REQUEST',
          message: 'Request body must be a JSON object',
        },
      },
      { status: 400 }
    )
  }

  const payload = body as Record<string, unknown>
  const negotiation = await getNativeNegotiationDetail(negotiationId)

  if (!negotiation) {
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

  if (typeof payload.session_id !== 'string' || payload.session_id.trim().length === 0) {
    return NextResponse.json(
      {
        error: {
          code: 'MISSING_SESSION_ID',
          message: 'session_id is required for negotiation actions',
        },
      },
      { status: 400 }
    )
  }

  const sessionCheck = await requireHandshakeSession(payload.session_id)
  if (!sessionCheck.ok) {
    return NextResponse.json(sessionCheck.error.body, { status: sessionCheck.error.status })
  }

  if (sessionCheck.session.session_id !== negotiation.sessionId) {
    return NextResponse.json(
      {
        error: {
          code: 'NEGOTIATION_SESSION_MISMATCH',
          message: 'Negotiation action session does not match the negotiation session',
        },
      },
      { status: 409 }
    )
  }

  const actorDid = typeof payload.agentDid === 'string' ? payload.agentDid.trim() : ''
  if (!actorDid || actorDid !== sessionCheck.session.initiator_did) {
    return NextResponse.json(
      {
        error: {
          code: 'NEGOTIATION_ACTION_FORBIDDEN',
          message: 'Only the negotiation initiator may perform this action here',
        },
      },
      { status: 403 }
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

  const result = await applyNativeNegotiationAction(negotiationId, actorDid, action, 'initiator', payload)

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
