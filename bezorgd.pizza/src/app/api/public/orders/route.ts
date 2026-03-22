import { NextResponse } from 'next/server'

import { confirmPublicOrder, createPublicOrderDraft, validatePublicOrderInput } from '@/lib/local-food/local-food-service'
import type { LocalFoodPublicOrderInput } from '@/lib/local-food/local-food-types'

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as LocalFoodPublicOrderInput | null
  const validation = await validatePublicOrderInput(body)

  if (!validation.ok) {
    return NextResponse.json(
      {
        ok: false,
        scope: 'public',
        resource: 'orders',
        status: 'invalid_order',
        message: validation.message,
        fieldErrors: validation.fieldErrors,
      },
      { status: 400 }
    )
  }

  const input = validation.input

  if ((input.intent ?? 'draft') === 'confirm') {
    const confirmation = await confirmPublicOrder(input)

    if (!confirmation) {
      return NextResponse.json(
        {
          ok: false,
          scope: 'public',
          resource: 'orders',
          status: 'order_unavailable',
          message: 'De bestelling kon niet worden opgeslagen. Probeer het opnieuw.',
        },
        { status: 409 }
      )
    }

    return NextResponse.json({
      ok: true,
      scope: 'public',
      resource: 'orders',
      status: 'confirmed',
      message: 'Je bestelling is ontvangen en opgeslagen.',
      order: confirmation,
    })
  }

  const draft = await createPublicOrderDraft(input)

  if (!draft) {
    return NextResponse.json(
      {
        ok: false,
        scope: 'public',
        resource: 'orders',
        status: 'order_unavailable',
      },
      { status: 409 }
    )
  }

  return NextResponse.json({
    ok: true,
    scope: 'public',
    resource: 'orders',
    status: 'draft_ready',
    message: 'Controleer rustig je bestelling en bevestig daarna pas.',
    order: draft,
  })
}
