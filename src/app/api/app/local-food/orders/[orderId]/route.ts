import { NextRequest, NextResponse } from 'next/server'

import { LocalFoodServiceError, updateLocalFoodOrderStatusForProvider } from '@/lib/local-food/local-food-service'
import type { LocalFoodOrderStatus } from '@/lib/local-food/local-food-types'
import { resolveOwnerPrivateAuthContext } from '@/lib/owner-private-auth-resolver'

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ orderId: string }> }
) {
  const ownerSession = await resolveOwnerPrivateAuthContext(request)
  if (!ownerSession) {
    return NextResponse.json(
      {
        error: {
          code: 'OWNER_AUTH_REQUIRED',
          message: 'Owner app session is required to update local food orders',
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
          code: 'INVALID_LOCAL_FOOD_ORDER_REQUEST',
          message: 'Request body must be valid JSON',
        },
      },
      { status: 400 }
    )
  }

  if (!isRecord(body) || typeof body.status !== 'string') {
    return NextResponse.json(
      {
        error: {
          code: 'INVALID_LOCAL_FOOD_ORDER_REQUEST',
          message: 'A status field is required',
        },
      },
      { status: 400 }
    )
  }

  const { orderId } = await context.params

  try {
    const updated = updateLocalFoodOrderStatusForProvider(ownerSession.activeProviderDid, orderId, {
      status: body.status as LocalFoodOrderStatus,
      note: typeof body.note === 'string' ? body.note : undefined,
    })

    if (!updated) {
      return NextResponse.json(
        {
          error: {
            code: 'LOCAL_FOOD_ORDER_NOT_FOUND',
            message: 'Order not found for this provider',
          },
        },
        { status: 404 }
      )
    }

    return NextResponse.json({ order: updated })
  } catch (error) {
    const serviceError = error instanceof LocalFoodServiceError ? error : null
    return NextResponse.json(
      {
        error: {
          code: serviceError?.code || 'LOCAL_FOOD_ORDER_STATUS_INVALID',
          message: serviceError?.message || 'Invalid order status transition',
        },
      },
      { status: serviceError?.status || 409 }
    )
  }
}
