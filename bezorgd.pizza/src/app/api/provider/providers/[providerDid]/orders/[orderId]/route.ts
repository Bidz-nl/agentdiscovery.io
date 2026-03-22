import { NextResponse } from 'next/server'

import { getProviderOrder, prepareProviderOrderPayment, updateProviderOrder } from '@/lib/local-food/local-food-service'
import type { LocalFoodOrderStatus } from '@/lib/local-food/local-food-types'
import { isAuthorizedForProviderWorkspace } from '@/lib/provider-workspace/provider-workspace-auth'

const MUTABLE_ORDER_STATUSES: LocalFoodOrderStatus[] = [
  'received',
  'preparing',
  'ready_for_pickup',
  'out_for_delivery',
  'completed',
  'cancelled',
]

function isOrderStatus(value: unknown): value is LocalFoodOrderStatus {
  return typeof value === 'string' && MUTABLE_ORDER_STATUSES.includes(value as LocalFoodOrderStatus)
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ providerDid: string; orderId: string }> }
) {
  const { providerDid, orderId } = await context.params
  const resolvedProviderDid = decodeURIComponent(providerDid)

  if (!(await isAuthorizedForProviderWorkspace(resolvedProviderDid))) {
    return NextResponse.json(
      {
        ok: false,
        scope: 'provider',
        resource: 'order',
        status: 'provider_workspace_unauthorized',
        message: 'Open eerst de provider workspace voor dit restaurant.',
      },
      { status: 403 }
    )
  }

  const order = await getProviderOrder(resolvedProviderDid, orderId)

  if (!order) {
    return NextResponse.json(
      {
        ok: false,
        scope: 'provider',
        resource: 'order',
        status: 'order_not_found',
        message: 'Deze bestelling is niet gevonden voor dit restaurant.',
      },
      { status: 404 }
    )
  }

  return NextResponse.json({
    ok: true,
    scope: 'provider',
    resource: 'order',
    status: 'provider_order_ready',
    order,
  })
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ providerDid: string; orderId: string }> }
) {
  const { providerDid, orderId } = await context.params
  const resolvedProviderDid = decodeURIComponent(providerDid)

  if (!(await isAuthorizedForProviderWorkspace(resolvedProviderDid))) {
    return NextResponse.json(
      {
        ok: false,
        scope: 'provider',
        resource: 'order',
        status: 'provider_workspace_unauthorized',
        message: 'Open eerst de provider workspace voor dit restaurant.',
      },
      { status: 403 }
    )
  }

  const body = (await request.json().catch(() => null)) as { status?: string; action?: string } | null

  if (body?.action === 'prepare_payment') {
    const order = await prepareProviderOrderPayment(resolvedProviderDid, orderId)

    if (!order) {
      return NextResponse.json(
        {
          ok: false,
          scope: 'provider',
          resource: 'order',
          status: 'order_not_found',
          message: 'Deze bestelling is niet gevonden voor dit restaurant.',
        },
        { status: 404 }
      )
    }

    return NextResponse.json({
      ok: true,
      scope: 'provider',
      resource: 'order',
      status: 'provider_payment_preparation_ready',
      message: 'Betaalvoorbereiding is klaargezet voor latere payment-koppeling.',
      order,
    })
  }

  if (!body || !isOrderStatus(body.status)) {
    return NextResponse.json(
      {
        ok: false,
        scope: 'provider',
        resource: 'order',
        status: 'invalid_order_status',
        message: 'Kies een geldige vervolgstap voor deze bestelling.',
      },
      { status: 400 }
    )
  }

  const order = await updateProviderOrder(resolvedProviderDid, orderId, body.status)

  if (!order) {
    return NextResponse.json(
      {
        ok: false,
        scope: 'provider',
        resource: 'order',
        status: 'order_transition_not_allowed',
        message: 'Deze statusovergang past nu niet bij de huidige orderstatus.',
      },
      { status: 409 }
    )
  }

  return NextResponse.json({
    ok: true,
    scope: 'provider',
    resource: 'order',
    status: 'provider_order_updated',
    message: 'Bestelling bijgewerkt.',
    order,
  })
}
