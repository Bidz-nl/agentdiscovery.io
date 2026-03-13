import { NextRequest, NextResponse } from 'next/server'

import { getNativeNegotiationDetail } from '@/lib/adp-v2/native-negotiation-service'
import { getSessionNegotiationRecord } from '@/lib/adp-v2/session-negotiation-repository'

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
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
    return NextResponse.json({ negotiation: nativeNegotiation })
  }

  const sessionNegotiation = getSessionNegotiationRecord(negotiationId)
  if (sessionNegotiation) {
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
