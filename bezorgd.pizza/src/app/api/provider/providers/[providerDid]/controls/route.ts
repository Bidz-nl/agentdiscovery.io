import { NextResponse } from 'next/server'

import { getProviderOperationalControlsView, updateProviderOperationalControls } from '@/lib/local-food/local-food-service'
import type { LocalFoodProviderControlsPatch } from '@/lib/local-food/local-food-types'
import { isAuthorizedForProviderWorkspace } from '@/lib/provider-workspace/provider-workspace-auth'

type ControlsPatchBody = LocalFoodProviderControlsPatch | null

function getUnauthorizedResponse() {
  return NextResponse.json(
    {
      ok: false,
      scope: 'provider',
      resource: 'controls',
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

  const view = await getProviderOperationalControlsView(resolvedProviderDid)

  if (!view) {
    return NextResponse.json(
      {
        ok: false,
        scope: 'provider',
        resource: 'controls',
        status: 'provider_not_found',
        message: 'Deze provider is niet gevonden.',
      },
      { status: 404 }
    )
  }

  return NextResponse.json({
    ok: true,
    scope: 'provider',
    resource: 'controls',
    status: 'provider_controls_ready',
    view,
  })
}

export async function PATCH(request: Request, context: { params: Promise<{ providerDid: string }> }) {
  const { providerDid } = await context.params
  const resolvedProviderDid = decodeURIComponent(providerDid)

  if (!(await isAuthorizedForProviderWorkspace(resolvedProviderDid))) {
    return getUnauthorizedResponse()
  }

  const body = (await request.json().catch(() => null)) as ControlsPatchBody

  if (!body) {
    return NextResponse.json(
      {
        ok: false,
        scope: 'provider',
        resource: 'controls',
        status: 'invalid_controls_update',
        message: 'Stuur een geldige controls-update mee.',
      },
      { status: 400 }
    )
  }

  const view = await updateProviderOperationalControls(resolvedProviderDid, body)

  if (!view) {
    return NextResponse.json(
      {
        ok: false,
        scope: 'provider',
        resource: 'controls',
        status: 'provider_not_found',
        message: 'Deze provider is niet gevonden.',
      },
      { status: 404 }
    )
  }

  return NextResponse.json({
    ok: true,
    scope: 'provider',
    resource: 'controls',
    status: 'provider_controls_updated',
    message: 'Rustknoppen bijgewerkt.',
    view,
  })
}
