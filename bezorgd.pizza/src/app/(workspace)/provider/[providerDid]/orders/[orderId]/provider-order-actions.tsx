'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'

import type {
  LocalFoodProviderOrderStatusAction,
  LocalFoodProviderPaymentPreparation,
} from '@/lib/local-food/local-food-types'

function getButtonClassName(tone: LocalFoodProviderOrderStatusAction['tone']) {
  if (tone === 'danger') {
    return 'border-[#c85b24] bg-[#fff1ea] text-[#9a3f17] hover:bg-[#ffe6da]'
  }

  if (tone === 'neutral') {
    return 'border-orange-200 bg-white text-[#6a3c24] hover:bg-[#fffaf4]'
  }

  return 'border-[#c85b24] bg-[#c85b24] text-white hover:bg-[#ab4715]'
}

export function ProviderOrderActions({
  providerDid,
  orderId,
  availableStatusActions,
  paymentPreparation,
}: {
  providerDid: string
  orderId: string
  availableStatusActions: LocalFoodProviderOrderStatusAction[]
  paymentPreparation: LocalFoodProviderPaymentPreparation
}) {
  const router = useRouter()
  const [message, setMessage] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [pendingAction, setPendingAction] = useState<string | null>(null)

  function runAction(payload: { status?: string; action?: string }, successMessage: string) {
    setPendingAction(payload.status ?? payload.action ?? 'update')
    setMessage(null)

    startTransition(async () => {
      try {
        const response = await fetch(`/api/provider/providers/${encodeURIComponent(providerDid)}/orders/${orderId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        })

        const result = (await response.json().catch(() => null)) as { message?: string } | null

        if (!response.ok) {
          setMessage(result?.message ?? 'De actie kon niet worden verwerkt.')
          return
        }

        setMessage(successMessage)
        router.refresh()
      } catch {
        setMessage('Er ging iets mis tijdens het bijwerken van deze bestelling.')
      } finally {
        setPendingAction(null)
      }
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        {availableStatusActions.map((action) => (
          <button
            key={action.status}
            type="button"
            onClick={() => runAction({ status: action.status }, `Status bijgewerkt naar ${action.label.toLowerCase()}.`)}
            disabled={isPending}
            className={`rounded-full border px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${getButtonClassName(action.tone)}`}
          >
            {pendingAction === action.status ? 'Bezig...' : action.label}
          </button>
        ))}
      </div>

      <div className="rounded-3xl border border-orange-200 bg-[#fffaf4] p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-1">
            <p className="text-sm font-semibold text-[#2f160c]">Payment startpunt</p>
            <p className="text-sm text-[#6a3c24]">{paymentPreparation.helperText}</p>
          </div>
          <button
            type="button"
            onClick={() => runAction({ action: 'prepare_payment' }, 'Betaalvoorbereiding is klaargezet voor later.')}
            disabled={isPending || !paymentPreparation.canStart}
            className="rounded-full border border-orange-200 bg-white px-4 py-2 text-sm font-semibold text-[#6a3c24] transition hover:bg-[#fff3ea] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pendingAction === 'prepare_payment' ? 'Bezig...' : paymentPreparation.actionLabel}
          </button>
        </div>
      </div>

      {message ? <p className="text-sm text-[#6a3c24]">{message}</p> : null}
    </div>
  )
}
