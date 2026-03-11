import { NextRequest } from 'next/server'

import { jsonAdpV2Error, jsonAdpV2Success } from '@/lib/adp-v2/response'
import { validateReputationRequest } from '@/lib/adp-v2/reputation-schema'
import { createReputationSignal } from '@/lib/adp-v2/reputation-service'
import type { ReputationSuccessResponse } from '@/lib/adp-v2/reputation-types'

export async function POST(request: NextRequest) {
  let body: unknown

  try {
    body = await request.json()
  } catch {
    return jsonAdpV2Error(400, 'INVALID_JSON', 'Request body must be valid JSON')
  }

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return jsonAdpV2Error(400, 'INVALID_REPUTATION_REQUEST', 'Reputation request body must be a JSON object')
  }

  const payload = body as Record<string, unknown>
  const validation = validateReputationRequest(payload)

  if (!validation.success) {
    return jsonAdpV2Error(400, validation.error.code, validation.error.message)
  }

  const result = createReputationSignal(validation.data)

  if (!result.success) {
    return jsonAdpV2Error(
      result.error.status,
      result.error.code,
      result.error.message,
      result.error.details
    )
  }

  const response: ReputationSuccessResponse = {
    ok: true,
    message: 'ADP v2 reputation recorded',
    reputation: result.reputation,
  }

  return jsonAdpV2Success(response)
}
