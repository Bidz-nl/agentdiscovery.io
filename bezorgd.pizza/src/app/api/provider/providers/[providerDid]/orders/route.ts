import { NextResponse } from 'next/server'

import { listProviderOrderQueue } from '@/lib/local-food/local-food-service'
import { isAuthorizedForProviderWorkspace } from '@/lib/provider-workspace/provider-workspace-auth'

export async function GET(_request: Request, context: { params: Promise<{ providerDid: string }> }) {
  const { providerDid } = await context.params
  const resolvedProviderDid = decodeURIComponent(providerDid)

  if (!(await isAuthorizedForProviderWorkspace(resolvedProviderDid))) {
    return NextResponse.json(
      {
        ok: false,
        scope: 'provider',
        resource: 'orders',
        status: 'provider_workspace_unauthorized',
        message: 'Open eerst de provider workspace voor dit restaurant.',
      },
      { status: 403 }
    )
  }

  const orders = await listProviderOrderQueue(resolvedProviderDid)

  return NextResponse.json({
    ok: true,
    scope: 'provider',
    resource: 'orders',
    status: 'provider_orders_ready',
    orders,
  })
}
