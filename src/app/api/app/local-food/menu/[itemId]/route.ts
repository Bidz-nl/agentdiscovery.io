import { NextRequest, NextResponse } from 'next/server'

import { updateLocalFoodMenuItemForProvider } from '@/lib/local-food/local-food-service'
import type { LocalFoodMenuCategory } from '@/lib/local-food/local-food-types'
import { resolveOwnerPrivateAuthContext } from '@/lib/owner-private-auth-resolver'

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function isCategory(value: unknown): value is LocalFoodMenuCategory {
  return value === 'pizza' || value === 'sides' || value === 'drinks' || value === 'desserts'
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ itemId: string }> }
) {
  const ownerSession = await resolveOwnerPrivateAuthContext(request)
  if (!ownerSession) {
    return NextResponse.json(
      {
        error: {
          code: 'OWNER_AUTH_REQUIRED',
          message: 'Owner app session is required to update local food menu items',
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
          code: 'INVALID_LOCAL_FOOD_MENU_REQUEST',
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
          code: 'INVALID_LOCAL_FOOD_MENU_REQUEST',
          message: 'Request body must be a JSON object',
        },
      },
      { status: 400 }
    )
  }

  const { itemId } = await context.params
  const updated = updateLocalFoodMenuItemForProvider(ownerSession.activeProviderDid, itemId, {
    category: isCategory(body.category) ? body.category : undefined,
    name: typeof body.name === 'string' ? body.name : undefined,
    description: typeof body.description === 'string' ? body.description : undefined,
    priceCents: typeof body.priceCents === 'number' ? body.priceCents : undefined,
    available: typeof body.available === 'boolean' ? body.available : undefined,
    tags: Array.isArray(body.tags) ? body.tags.filter((entry): entry is string => typeof entry === 'string') : undefined,
  })

  if (!updated) {
    return NextResponse.json(
      {
        error: {
          code: 'LOCAL_FOOD_MENU_ITEM_NOT_FOUND',
          message: 'Menu item not found for this provider',
        },
      },
      { status: 404 }
    )
  }

  return NextResponse.json({ menuItem: updated })
}
