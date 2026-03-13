import { NextRequest, NextResponse } from 'next/server'

import { resolveOwnerPrivateAuthContext } from '@/lib/owner-private-auth-resolver'
import { createOwnerServiceRecord } from '@/lib/owner-service-repository'
import { fetchOwnerServices } from '@/lib/owner-service-source'
import type { CreateOwnerServiceRequest, OwnerServiceListResponse } from '@/lib/owner-services'

export async function GET(request: NextRequest) {
  const ownerSession = await resolveOwnerPrivateAuthContext(request)

  if (!ownerSession) {
    return NextResponse.json(
      {
        error: {
          code: 'OWNER_AUTH_REQUIRED',
          message: 'Owner app session is required to read private provider services',
        },
      },
      { status: 401 }
    )
  }

  try {
    const result: OwnerServiceListResponse = {
      services: await fetchOwnerServices(ownerSession.activeProviderDid),
    }

    return NextResponse.json(result)
  } catch {
    return NextResponse.json(
      {
        error: {
          code: 'OWNER_SERVICE_READ_FAILED',
          message: 'Unable to load private provider services',
        },
      },
      { status: 502 }
    )
  }
}

export async function POST(request: NextRequest) {
  const ownerSession = await resolveOwnerPrivateAuthContext(request)

  if (!ownerSession) {
    return NextResponse.json(
      {
        error: {
          code: 'OWNER_AUTH_REQUIRED',
          message: 'Owner app session is required to create private provider services',
        },
      },
      { status: 401 }
    )
  }

  let body: unknown

  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      {
        error: {
          code: 'INVALID_OWNER_SERVICE_CREATE_REQUEST',
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
          code: 'INVALID_OWNER_SERVICE_CREATE_REQUEST',
          message: 'Owner service create request body must be a JSON object',
        },
      },
      { status: 400 }
    )
  }

  const input = body as CreateOwnerServiceRequest

  const service = createOwnerServiceRecord(ownerSession.activeProviderDid, input)

  return NextResponse.json({
    service: {
      ...service,
      status: 'draft',
      protocolProjection: {
        publishedCapabilityKey: null,
        published: false,
      },
    },
  })
}
