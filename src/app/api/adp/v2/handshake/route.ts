import { NextRequest, NextResponse } from 'next/server'

import { jsonAdpV2Error, jsonAdpV2Success } from '@/lib/adp-v2/response'
import { validateHandshakeRequest } from '@/lib/adp-v2/handshake-schema'
import { createHandshakeSession } from '@/lib/adp-v2/handshake-service'

export async function POST(request: NextRequest) {
  let body: unknown

  try {
    body = await request.json()
  } catch {
    return jsonAdpV2Error(400, 'INVALID_JSON', 'Request body must be valid JSON')
  }

  const validation = validateHandshakeRequest(body)

  if (!validation.success) {
    return jsonAdpV2Error(
      400,
      'INVALID_HANDSHAKE_REQUEST',
      'Handshake request validation failed',
      validation.errors
    )
  }

  const { response } = createHandshakeSession(validation.data)

  return jsonAdpV2Success(response, 201)
}
