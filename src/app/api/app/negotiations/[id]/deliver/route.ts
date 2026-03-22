import { randomUUID } from 'node:crypto'

import { NextRequest, NextResponse } from 'next/server'

import { resolveOwnerPrivateAuthContext } from '@/lib/owner-private-auth-resolver'
import { applyDeliverySentTransition } from '@/lib/adp-v2/negotiation-lifecycle'
import { getNativeNegotiationRecord, updateNativeNegotiationRecord } from '@/lib/adp-v2/native-negotiation-repository'

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const ownerSession = await resolveOwnerPrivateAuthContext(request)

  if (!ownerSession) {
    return NextResponse.json(
      { error: { code: 'OWNER_AUTH_REQUIRED', message: 'Owner app session required' } },
      { status: 401 }
    )
  }

  const negotiationId = Number((await context.params).id)
  if (!Number.isFinite(negotiationId)) {
    return NextResponse.json(
      { error: { code: 'INVALID_ID', message: 'Invalid negotiation ID' } },
      { status: 400 }
    )
  }

  const negotiation = getNativeNegotiationRecord(negotiationId)
  if (!negotiation) {
    return NextResponse.json(
      { error: { code: 'NOT_FOUND', message: 'Negotiation not found' } },
      { status: 404 }
    )
  }

  if (negotiation.responderDid !== ownerSession.activeProviderDid) {
    return NextResponse.json(
      { error: { code: 'FORBIDDEN', message: 'You are not the provider for this negotiation' } },
      { status: 403 }
    )
  }

  const transition = applyDeliverySentTransition(negotiation)
  if (!transition.ok) {
    return NextResponse.json(
      { error: { code: transition.error.code, message: transition.error.message } },
      { status: transition.error.status }
    )
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { error: { code: 'INVALID_JSON', message: 'Request body must be valid JSON' } },
      { status: 400 }
    )
  }

  const payload = body as Record<string, unknown>
  const message = typeof payload.deliveryPayload === 'string' ? payload.deliveryPayload.trim() : ''

  if (!message) {
    return NextResponse.json(
      { error: { code: 'MISSING_DELIVERY_PAYLOAD', message: 'deliveryPayload is required' } },
      { status: 400 }
    )
  }

  const createdAt = new Date().toISOString()

  const updated = updateNativeNegotiationRecord(negotiationId, (current) => ({
    ...current,
    status: transition.nextStatus,
    updatedAt: createdAt,
    transcript: [
      ...(current.transcript ?? []),
      {
        id: `neg_txn_${randomUUID().replace(/-/g, '')}`,
        kind: 'message',
        action: 'delivery_offer',
        by: negotiation.responderDid,
        message,
        at: createdAt,
      },
    ],
  }))

  return NextResponse.json({
    ok: true,
    negotiation: { id: updated?.id, status: updated?.status, transcript: updated?.transcript },
    remainingOffers: transition.remainingProviderMessagesAfter ?? 0,
  })
}
