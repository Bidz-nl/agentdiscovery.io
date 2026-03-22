import { NextResponse } from 'next/server'

export async function GET(_request: Request, context: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await context.params

  return NextResponse.json({
    ok: false,
    scope: 'provider',
    resource: 'order',
    status: 'provider_route_moved',
    message: `Gebruik /api/provider/providers/[providerDid]/orders/${orderId} vanuit de provider workspace.`,
  })
}

export async function PATCH(request: Request, context: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await context.params
  await request.text().catch(() => null)

  return NextResponse.json({
    ok: false,
    scope: 'provider',
    resource: 'order',
    status: 'provider_route_moved',
    message: `Gebruik /api/provider/providers/[providerDid]/orders/${orderId} vanuit de provider workspace.`,
  })
}
