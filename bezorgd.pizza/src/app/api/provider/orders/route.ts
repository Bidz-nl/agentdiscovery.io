import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const providerDid = searchParams.get('providerDid')?.trim() ?? ''

  if (!providerDid) {
    return NextResponse.json(
      {
        ok: false,
        scope: 'provider',
        resource: 'orders',
        status: 'invalid_provider_scope',
      },
      { status: 400 }
    )
  }

  return NextResponse.json({
    ok: false,
    scope: 'provider',
    resource: 'orders',
    status: 'provider_route_moved',
    message: `Gebruik /api/provider/providers/${encodeURIComponent(providerDid)}/orders vanuit de provider workspace.`,
  })
}
