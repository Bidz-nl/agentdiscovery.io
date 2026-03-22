import { NextRequest, NextResponse } from 'next/server'

import { getHandshakeSession } from '@/lib/adp-v2/handshake-repository'

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params
  const session = getHandshakeSession(id)

  if (!session) {
    return NextResponse.json(
      { error: { code: 'HANDSHAKE_SESSION_NOT_FOUND', message: 'Handshake session not found' } },
      { status: 404 }
    )
  }

  return NextResponse.json({ session })
}
