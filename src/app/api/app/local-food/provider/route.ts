import { NextRequest, NextResponse } from 'next/server'

import { getLocalFoodProviderAdminReadModel, LocalFoodServiceError, updateLocalFoodProviderByDid } from '@/lib/local-food/local-food-service'
import type { LocalFoodFulfilmentMode, LocalFoodProviderStatus } from '@/lib/local-food/local-food-types'
import { resolveOwnerPrivateAuthContext } from '@/lib/owner-private-auth-resolver'

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

export async function GET(request: NextRequest) {
  const ownerSession = await resolveOwnerPrivateAuthContext(request)
  if (!ownerSession) {
    return NextResponse.json(
      {
        error: {
          code: 'OWNER_AUTH_REQUIRED',
          message: 'Owner app session is required to manage local food provider settings',
        },
      },
      { status: 401 }
    )
  }

  return NextResponse.json(getLocalFoodProviderAdminReadModel(ownerSession.activeProviderDid))
}

export async function PATCH(request: NextRequest) {
  const ownerSession = await resolveOwnerPrivateAuthContext(request)
  if (!ownerSession) {
    return NextResponse.json(
      {
        error: {
          code: 'OWNER_AUTH_REQUIRED',
          message: 'Owner app session is required to update local food provider settings',
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
          code: 'INVALID_LOCAL_FOOD_PROVIDER_REQUEST',
          message: 'Request body must be valid JSON',
        },
      },
      { status: 400 }
    )
  }

  if (!isRecord(body)) {
    return NextResponse.json(
      {
        error: {
          code: 'INVALID_LOCAL_FOOD_PROVIDER_REQUEST',
          message: 'Request body must be a JSON object',
        },
      },
      { status: 400 }
    )
  }

  const serviceArea = isRecord(body.serviceArea) ? body.serviceArea : null
  try {
    const updated = updateLocalFoodProviderByDid(ownerSession.activeProviderDid, {
      status:
        body.status === 'draft' || body.status === 'active' || body.status === 'paused'
          ? body.status as LocalFoodProviderStatus
          : undefined,
      businessName: typeof body.businessName === 'string' ? body.businessName : undefined,
      summary: typeof body.summary === 'string' ? body.summary : undefined,
      phone: typeof body.phone === 'string' ? body.phone : undefined,
      locationLabel: typeof body.locationLabel === 'string' ? body.locationLabel : undefined,
      fulfilmentModes: Array.isArray(body.fulfilmentModes)
        ? body.fulfilmentModes.filter(
            (entry): entry is LocalFoodFulfilmentMode => entry === 'delivery' || entry === 'pickup'
          )
        : undefined,
      serviceArea: serviceArea
        ? {
            postcodePrefixes: Array.isArray(serviceArea.postcodePrefixes)
              ? serviceArea.postcodePrefixes.filter((entry): entry is string => typeof entry === 'string')
              : undefined,
            coverageLabel: typeof serviceArea.coverageLabel === 'string' ? serviceArea.coverageLabel : undefined,
            deliveryNotes: typeof serviceArea.deliveryNotes === 'string' ? serviceArea.deliveryNotes : undefined,
          }
        : undefined,
    })

    return NextResponse.json({ provider: updated })
  } catch (error) {
    const serviceError = error instanceof LocalFoodServiceError ? error : null
    return NextResponse.json(
      {
        error: {
          code: serviceError?.code || 'LOCAL_FOOD_PROVIDER_UPDATE_FAILED',
          message: serviceError?.message || 'Unable to update local food provider settings',
        },
      },
      { status: serviceError?.status || 500 }
    )
  }
}
