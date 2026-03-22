import { NextRequest, NextResponse } from 'next/server'

import { createServiceMatchResponse } from '@/lib/service-match/service-match-output'
import { findNativeServiceMatches } from '@/lib/service-match/native-service-match'
import { parseServiceMatchRequest } from '@/lib/service-match/service-match-schema'

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const parsed = parseServiceMatchRequest(body)

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: parsed.error,
        },
        { status: parsed.status }
      )
    }

    return NextResponse.json(createServiceMatchResponse(await findNativeServiceMatches(parsed.data)))
  } catch (error) {
    console.error('[Service Match Route] Error:', error)
    return NextResponse.json(
      {
        error: {
          code: 'SERVICE_MATCH_ERROR',
          message: 'Unable to compute native service matches',
        },
      },
      { status: 502 }
    )
  }
}
