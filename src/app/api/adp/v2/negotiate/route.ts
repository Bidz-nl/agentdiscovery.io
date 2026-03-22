import { NextRequest, NextResponse } from 'next/server'

import { createNativeNegotiationFromNegotiatePayload } from '@/lib/adp-v2/native-negotiation-service'
import { jsonAdpV2Error, jsonAdpV2Success } from '@/lib/adp-v2/response'
import type { NegotiateSuccessResponse } from '@/lib/adp-v2/negotiate-types'

export async function POST(request: NextRequest) {
  let body: unknown

  try {
    body = await request.json()
  } catch {
    return jsonAdpV2Error(400, 'INVALID_JSON', 'Request body must be valid JSON')
  }

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return jsonAdpV2Error(400, 'INVALID_NEGOTIATE_REQUEST', 'Negotiate request body must be a JSON object')
  }

  const result = await createNativeNegotiationFromNegotiatePayload(body as Record<string, unknown>)

  if (!result.ok) {
    return jsonAdpV2Error(
      result.error.status,
      result.error.body.error.code,
      result.error.body.error.message,
      result.error.body.error.details
    )
  }

  const response: NegotiateSuccessResponse = {
    ok: true,
    message: 'ADP v2 negotiate request accepted',
    session_id: result.session.session_id,
    negotiate: result.negotiate,
    provider: result.provider,
    negotiation: {
      id: result.negotiation.id,
      status: result.negotiation.status,
    },
  }

  return jsonAdpV2Success(response)
}
