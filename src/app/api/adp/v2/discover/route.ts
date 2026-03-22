import { NextRequest, NextResponse } from 'next/server'

import { createDiscoverCompletedResponse } from '@/lib/adp-v2/discover-service'
import { jsonAdpV2Error, jsonAdpV2Success } from '@/lib/adp-v2/response'
import { validateDiscoverRequest } from '@/lib/adp-v2/discover-schema'
import type { DiscoverCompletedResponse } from '@/lib/adp-v2/discover-types'
import {
  requireHandshakeSession,
  toHandshakeSessionErrorResponse,
} from '@/lib/adp-v2/require-handshake-session'

export async function POST(request: NextRequest) {
  let body: unknown

  try {
    body = await request.json()
  } catch {
    return jsonAdpV2Error(400, 'INVALID_JSON', 'Request body must be valid JSON')
  }

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return jsonAdpV2Error(400, 'INVALID_DISCOVER_REQUEST', 'Discover request body must be a JSON object')
  }

  const payload = body as Record<string, unknown>

  if (typeof payload.session_id !== 'string' || payload.session_id.trim().length === 0) {
    return jsonAdpV2Error(400, 'MISSING_SESSION_ID', 'session_id is required and must be a non-empty string')
  }

  const sessionCheck = await requireHandshakeSession(payload.session_id)

  if (!sessionCheck.ok) {
    return toHandshakeSessionErrorResponse(NextResponse, sessionCheck.error)
  }

  const discoverValidation = validateDiscoverRequest(payload)

  if (!discoverValidation.success) {
    return jsonAdpV2Error(400, discoverValidation.error.code, discoverValidation.error.message)
  }

  const response: DiscoverCompletedResponse = await createDiscoverCompletedResponse(
    sessionCheck.session.session_id,
    discoverValidation.data
  )

  return jsonAdpV2Success(response)
}
