import { NextRequest, NextResponse } from 'next/server'

import { createNativeNegotiationFromAppEngagePayload } from '@/lib/adp-v2/native-negotiation-service'

export async function POST(request: NextRequest) {
  let body: unknown

  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      {
        error: {
          code: 'INVALID_NEGOTIATION_ENGAGE_REQUEST',
          message: 'Request body must be valid JSON',
        },
      },
      { status: 400 }
    )
  }

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return NextResponse.json(
      {
        error: {
          code: 'INVALID_NEGOTIATION_ENGAGE_REQUEST',
          message: 'Request body must be a JSON object',
        },
      },
      { status: 400 }
    )
  }

  const result = createNativeNegotiationFromAppEngagePayload(body as Record<string, unknown>)

  if (!result.ok) {
    return NextResponse.json(result.error.body, { status: result.error.status })
  }

  return NextResponse.json({
    negotiation: {
      id: result.negotiation.id,
      status: result.negotiation.status,
    },
  })
}
