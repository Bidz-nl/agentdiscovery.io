import type { NextResponse } from 'next/server'

import { getHandshakeSession } from '@/lib/adp-v2/handshake-repository'
import type { HandshakeSession } from '@/lib/adp-v2/handshake-types'

export type HandshakeSessionGuardError = {
  status: number
  body: {
    error: {
      code: string
      message: string
      details?: Record<string, unknown>
    }
  }
}

export type HandshakeSessionGuardResult =
  | { ok: true; session: HandshakeSession }
  | { ok: false; error: HandshakeSessionGuardError }

export async function requireHandshakeSession(sessionId: string): Promise<HandshakeSessionGuardResult> {
  const normalizedSessionId = sessionId.trim()
  const session = await getHandshakeSession(normalizedSessionId)

  if (!session) {
    return {
      ok: false,
      error: {
        status: 404,
        body: {
          error: {
            code: 'HANDSHAKE_SESSION_NOT_FOUND',
            message: 'Handshake session not found',
            details: {
              session_id: normalizedSessionId,
            },
          },
        },
      },
    }
  }

  if (session.status === 'expired') {
    return {
      ok: false,
      error: {
        status: 410,
        body: {
          error: {
            code: 'HANDSHAKE_SESSION_EXPIRED',
            message: 'Handshake session has expired',
            details: {
              session_id: normalizedSessionId,
              expires_at: session.expires_at,
            },
          },
        },
      },
    }
  }

  if (session.status !== 'open') {
    return {
      ok: false,
      error: {
        status: 409,
        body: {
          error: {
            code: 'HANDSHAKE_SESSION_NOT_OPEN',
            message: 'Handshake session is not open for ADP v2 commerce routes',
            details: {
              session_id: normalizedSessionId,
              status: session.status,
            },
          },
        },
      },
    }
  }

  return {
    ok: true,
    session,
  }
}

export function toHandshakeSessionErrorResponse(
  nextResponseFactory: typeof NextResponse,
  error: HandshakeSessionGuardError
) {
  return nextResponseFactory.json(error.body, { status: error.status })
}
