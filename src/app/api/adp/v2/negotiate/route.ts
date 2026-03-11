import { NextRequest, NextResponse } from 'next/server'

import { validateNegotiateProvider } from '@/lib/adp-v2/negotiate-service'
import { jsonAdpV2Error, jsonAdpV2Success } from '@/lib/adp-v2/response'
import { validateNegotiateRequest } from '@/lib/adp-v2/negotiate-schema'
import type { NegotiateSuccessResponse } from '@/lib/adp-v2/negotiate-types'
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
    return jsonAdpV2Error(400, 'INVALID_NEGOTIATE_REQUEST', 'Negotiate request body must be a JSON object')
  }

  const payload = body as Record<string, unknown>

  if (typeof payload.session_id !== 'string' || payload.session_id.trim().length === 0) {
    return jsonAdpV2Error(400, 'MISSING_SESSION_ID', 'session_id is required and must be a non-empty string')
  }

  const sessionCheck = requireHandshakeSession(payload.session_id)

  if (!sessionCheck.ok) {
    return toHandshakeSessionErrorResponse(NextResponse, sessionCheck.error)
  }

  const negotiateValidation = validateNegotiateRequest(payload)

  if (!negotiateValidation.success) {
    return jsonAdpV2Error(400, negotiateValidation.error.code, negotiateValidation.error.message)
  }

  const providerValidation = validateNegotiateProvider(negotiateValidation.data)

  if (!providerValidation.success) {
    return jsonAdpV2Error(
      providerValidation.error.status,
      providerValidation.error.code,
      providerValidation.error.message,
      providerValidation.error.details
    )
  }

  const response: NegotiateSuccessResponse = {
    ok: true,
    message: 'ADP v2 negotiate request accepted',
    session_id: sessionCheck.session.session_id,
    negotiate: negotiateValidation.data,
    provider: providerValidation.provider,
  }

  return jsonAdpV2Success(response)
}
