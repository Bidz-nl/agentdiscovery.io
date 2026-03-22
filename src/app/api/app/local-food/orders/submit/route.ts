import { NextRequest, NextResponse } from 'next/server'

import { createLocalFoodOrder, LocalFoodServiceError } from '@/lib/local-food/local-food-service'
import type { CreateLocalFoodOrderInput, LocalFoodFulfilmentMode } from '@/lib/local-food/local-food-types'

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

export async function POST(request: NextRequest) {
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

  if (!isRecord(body)) {
    return NextResponse.json(
      {
        error: {
          code: 'INVALID_LOCAL_FOOD_ORDER_REQUEST',
          message: 'Request body must be a JSON object',
        },
      },
      { status: 400 }
    )
  }

  const input: CreateLocalFoodOrderInput = {
    providerDid: typeof body.providerDid === 'string' ? body.providerDid : '',
    customerDid: typeof body.customerDid === 'string' ? body.customerDid : null,
    customerName: typeof body.customerName === 'string' ? body.customerName : '',
    customerPhone: typeof body.customerPhone === 'string' ? body.customerPhone : '',
    customerPostcode: typeof body.customerPostcode === 'string' ? body.customerPostcode : '',
    customerAddressLine: typeof body.customerAddressLine === 'string' ? body.customerAddressLine : '',
    customerNotes: typeof body.customerNotes === 'string' ? body.customerNotes : '',
    fulfilmentMode:
      body.fulfilmentMode === 'delivery' || body.fulfilmentMode === 'pickup'
        ? body.fulfilmentMode as LocalFoodFulfilmentMode
        : 'delivery',
    items: Array.isArray(body.items)
      ? body.items
          .filter(isRecord)
          .map((item) => ({
            menuItemId: typeof item.menuItemId === 'string' ? item.menuItemId : '',
            quantity: typeof item.quantity === 'number' ? item.quantity : 1,
          }))
          .filter((item) => item.menuItemId)
      : [],
  }

  try {
    const order = createLocalFoodOrder(input)
    return NextResponse.json({ order }, { status: 201 })
  } catch (error) {
    const serviceError = error instanceof LocalFoodServiceError ? error : null
    return NextResponse.json(
      {
        error: {
          code: serviceError?.code || 'LOCAL_FOOD_ORDER_CREATE_FAILED',
          message: serviceError?.message || 'Unable to create local food order',
        },
      },
      { status: serviceError?.status || 409 }
    )
  }
}
