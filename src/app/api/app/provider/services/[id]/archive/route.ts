import { NextRequest, NextResponse } from 'next/server'

import { resolveOwnerPrivateAuthContext } from '@/lib/owner-private-auth-resolver'
import { archiveOwnerServiceRecord } from '@/lib/owner-service-repository'
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
          message: 'Owner app session is required to archive private provider services',
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

  if (service.status === 'archived') {
    return NextResponse.json({ service })
  }

  if (service.publishedCapabilityKey) {
    return NextResponse.json(
      {
        error: {
          code: 'OWNER_SERVICE_ARCHIVE_REQUIRES_UNPUBLISH',
          message: 'Published services must be unpublished before they can be archived',
        },
      },
      { status: 409 }
    )
  }

  const archived = archiveOwnerServiceRecord(id)

  if (!archived) {
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

  const result = await fetchOwnerServiceById(ownerSession.activeProviderDid, id)

  return NextResponse.json({
    service: result,
  })
}
