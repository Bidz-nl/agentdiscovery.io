import { NextRequest, NextResponse } from 'next/server'

import { createLocalFoodManualMenuItem, getLocalFoodProviderAdminReadModel, importLocalFoodMenuCsv, LocalFoodServiceError } from '@/lib/local-food/local-food-service'
import type { CreateLocalFoodMenuItemInput, LocalFoodMenuCategory } from '@/lib/local-food/local-food-types'
import { resolveOwnerPrivateAuthContext } from '@/lib/owner-private-auth-resolver'

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function isCategory(value: unknown): value is LocalFoodMenuCategory {
  return value === 'pizza' || value === 'sides' || value === 'drinks' || value === 'desserts'
}

export async function GET(request: NextRequest) {
  const ownerSession = await resolveOwnerPrivateAuthContext(request)
  if (!ownerSession) {
    return NextResponse.json(
      {
        error: {
          code: 'OWNER_AUTH_REQUIRED',
          message: 'Owner app session is required to read local food menu items',
        },
      },
      { status: 401 }
    )
  }

  const adminReadModel = await getLocalFoodProviderAdminReadModel(ownerSession.activeProviderDid)
  return NextResponse.json({ menuItems: adminReadModel.menuItems })
}

export async function POST(request: NextRequest) {
  const ownerSession = await resolveOwnerPrivateAuthContext(request)
  if (!ownerSession) {
    return NextResponse.json(
      {
        error: {
          code: 'OWNER_AUTH_REQUIRED',
          message: 'Owner app session is required to update the local food menu',
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

  if (body.mode === 'csv') {
    if (typeof body.csvText !== 'string') {
      return NextResponse.json(
        {
          error: {
            code: 'INVALID_LOCAL_FOOD_MENU_REQUEST',
            message: 'csvText is required for CSV import',
          },
        },
        { status: 400 }
      )
    }

    try {
      const created = await importLocalFoodMenuCsv(ownerSession.activeProviderDid, body.csvText)
      return NextResponse.json({ menuItems: created })
    } catch (error) {
      const serviceError = error instanceof LocalFoodServiceError ? error : null
      return NextResponse.json(
        {
          error: {
            code: serviceError?.code || 'LOCAL_FOOD_MENU_IMPORT_FAILED',
            message: serviceError?.message || 'Unable to import local food CSV menu',
          },
        },
        { status: serviceError?.status || 500 }
      )
    }
  }

  const item = isRecord(body.item) ? body.item : body
  const input: CreateLocalFoodMenuItemInput = {
    category: isCategory(item.category) ? item.category : 'pizza',
    name: typeof item.name === 'string' ? item.name : '',
    description: typeof item.description === 'string' ? item.description : '',
    priceCents: typeof item.priceCents === 'number' ? item.priceCents : 0,
    available: typeof item.available === 'boolean' ? item.available : true,
    tags: Array.isArray(item.tags) ? item.tags.filter((entry): entry is string => typeof entry === 'string') : [],
  }

  try {
    const created = await createLocalFoodManualMenuItem(ownerSession.activeProviderDid, input)
    return NextResponse.json({ menuItem: created })
  } catch (error) {
    const serviceError = error instanceof LocalFoodServiceError ? error : null
    return NextResponse.json(
      {
        error: {
          code: serviceError?.code || 'LOCAL_FOOD_MENU_CREATE_FAILED',
          message: serviceError?.message || 'Unable to create local food menu item',
        },
      },
      { status: serviceError?.status || 500 }
    )
  }
}
