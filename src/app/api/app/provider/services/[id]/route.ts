import { NextRequest, NextResponse } from 'next/server'

import { resolveOwnerPrivateAuthContext } from '@/lib/owner-private-auth-resolver'
import { updateOwnerServiceRecord } from '@/lib/owner-service-repository'
import { fetchOwnerServiceById } from '@/lib/owner-service-source'
import type { OwnerServiceDetailResponse, UpdateOwnerServiceRequest } from '@/lib/owner-services'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
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

  const { id } = await context.params
  const service = await fetchOwnerServiceById(ownerSession.activeProviderDid, id)

  if (!service) {
    return NextResponse.json(
      {
        error: {
          code: 'OWNER_SERVICE_NOT_FOUND',
          message: 'Owner service not found',
        },
      },
      { status: 404 }
    )
  }

  const result: OwnerServiceDetailResponse = {
    service,
  }

  return NextResponse.json(result)
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const ownerSession = await resolveOwnerPrivateAuthContext(request)

  if (!ownerSession) {
    return NextResponse.json(
      {
        error: {
          code: 'OWNER_AUTH_REQUIRED',
          message: 'Owner app session is required to update private provider services',
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
          code: 'INVALID_OWNER_SERVICE_UPDATE_REQUEST',
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
          code: 'INVALID_OWNER_SERVICE_UPDATE_REQUEST',
          message: 'Owner service update request body must be a JSON object',
        },
      },
      { status: 400 }
    )
  }

  const { id } = await context.params
  const existing = await fetchOwnerServiceById(ownerSession.activeProviderDid, id)

  if (!existing) {
    return NextResponse.json(
      {
        error: {
          code: 'OWNER_SERVICE_NOT_FOUND',
          message: 'Owner service not found',
        },
      },
      { status: 404 }
    )
  }

  if (existing.status === 'archived') {
    return NextResponse.json(
      {
        error: {
          code: 'OWNER_SERVICE_ARCHIVED',
          message: 'Archived services must be restored before they can be edited',
        },
      },
      { status: 409 }
    )
  }

  const updated = updateOwnerServiceRecord(id, body as UpdateOwnerServiceRequest)

  if (!updated) {
    return NextResponse.json(
      {
        error: {
          code: 'OWNER_SERVICE_NOT_FOUND',
          message: 'Owner service not found',
        },
      },
      { status: 404 }
    )
  }

  const service = await fetchOwnerServiceById(ownerSession.activeProviderDid, id)

  return NextResponse.json({
    service,
  })
}
