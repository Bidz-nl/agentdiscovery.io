import { NextRequest, NextResponse } from 'next/server'

import { resolveOwnerPrivateAuthContext } from '@/lib/owner-private-auth-resolver'
import { deleteOwnerServiceRecord } from '@/lib/owner-service-repository'
import { fetchOwnerServiceById } from '@/lib/owner-service-source'

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const ownerSession = await resolveOwnerPrivateAuthContext(request)

  if (!ownerSession) {
    return NextResponse.json(
      {
        error: {
          code: 'OWNER_AUTH_REQUIRED',
          message: 'Owner app session is required to delete private provider services',
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

  if (service.publishedCapabilityKey) {
    return NextResponse.json(
      {
        error: {
          code: 'OWNER_SERVICE_DELETE_REQUIRES_UNPUBLISH',
          message: 'Published services must be unpublished before they can be deleted',
        },
      },
      { status: 409 }
    )
  }

  const deleted = deleteOwnerServiceRecord(id)

  if (!deleted) {
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

  return NextResponse.json({
    deleted: true,
    serviceId: id,
  })
}
