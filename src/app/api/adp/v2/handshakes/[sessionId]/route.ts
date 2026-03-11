import { NextRequest } from 'next/server'

import { getHandshakeSession } from '@/lib/adp-v2/handshake-repository'
import { jsonAdpV2Error, jsonAdpV2Success } from '@/lib/adp-v2/response'

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await context.params
  const session = getHandshakeSession(sessionId)

  if (!session) {
    return jsonAdpV2Error(404, 'HANDSHAKE_SESSION_NOT_FOUND', 'Handshake session not found', {
      session_id: sessionId,
    })
  }

  return jsonAdpV2Success({
    ok: true,
    session,
  })
}
