import { NextResponse } from 'next/server'

import { getProviderMenuEditorView, updateProviderMenu } from '@/lib/local-food/local-food-service'
import type { LocalFoodProviderMenuUpdateInput } from '@/lib/local-food/local-food-types'
import { isAuthorizedForProviderWorkspace } from '@/lib/provider-workspace/provider-workspace-auth'

type ProviderMenuBody = LocalFoodProviderMenuUpdateInput | null

function getUnauthorizedResponse() {
  return NextResponse.json(
    {
      ok: false,
      scope: 'provider',
      resource: 'menu',
      status: 'provider_workspace_unauthorized',
      message: 'Open eerst de provider workspace voor dit restaurant.',
    },
    { status: 403 }
  )
}

export async function GET(_request: Request, context: { params: Promise<{ providerDid: string }> }) {
  const { providerDid } = await context.params
  const resolvedProviderDid = decodeURIComponent(providerDid)

  if (!(await isAuthorizedForProviderWorkspace(resolvedProviderDid))) {
    return getUnauthorizedResponse()
  }

  const view = await getProviderMenuEditorView(resolvedProviderDid)

  if (!view) {
    return NextResponse.json(
      {
        ok: false,
        scope: 'provider',
        resource: 'menu',
        status: 'provider_not_found',
        message: 'Deze provider is niet gevonden.',
      },
      { status: 404 }
    )
  }

  return NextResponse.json({
    ok: true,
    scope: 'provider',
    resource: 'menu',
    status: 'provider_menu_ready',
    view,
  })
}

export async function PATCH(request: Request, context: { params: Promise<{ providerDid: string }> }) {
  const { providerDid } = await context.params
  const resolvedProviderDid = decodeURIComponent(providerDid)

  if (!(await isAuthorizedForProviderWorkspace(resolvedProviderDid))) {
    return getUnauthorizedResponse()
  }

  const body = (await request.json().catch(() => null)) as ProviderMenuBody

  if (!body || !Array.isArray(body.categories) || !Array.isArray(body.menuItems)) {
    return NextResponse.json(
      {
        ok: false,
        scope: 'provider',
        resource: 'menu',
        status: 'invalid_menu_update',
        message: 'Stuur een geldige menu-update mee.',
      },
      { status: 400 }
    )
  }

  const view = await updateProviderMenu(resolvedProviderDid, body)

  if (!view) {
    return NextResponse.json(
      {
        ok: false,
        scope: 'provider',
        resource: 'menu',
        status: 'provider_not_found',
        message: 'Deze provider is niet gevonden.',
      },
      { status: 404 }
    )
  }

  return NextResponse.json({
    ok: true,
    scope: 'provider',
    resource: 'menu',
    status: 'provider_menu_updated',
    message: 'Menu opgeslagen.',
    view,
  })
}
