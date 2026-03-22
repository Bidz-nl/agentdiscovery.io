'use client'

import { useEffect, useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

function formatTime(value: Date) {
  return new Intl.DateTimeFormat('nl-NL', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(value)
}

export function WorkspaceAutoRefresh({ intervalMs = 60_000 }: { intervalMs?: number }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [lastRefreshAt, setLastRefreshAt] = useState(() => new Date())

  useEffect(() => {
    const timer = window.setInterval(() => {
      startTransition(() => {
        setLastRefreshAt(new Date())
        router.refresh()
      })
    }, intervalMs)

    return () => {
      window.clearInterval(timer)
    }
  }, [intervalMs, router, startTransition])

  const lastRefreshLabel = useMemo(() => formatTime(lastRefreshAt), [lastRefreshAt])

  function handleRefreshNow() {
    startTransition(() => {
      setLastRefreshAt(new Date())
      router.refresh()
    })
  }

  return (
    <div className="flex flex-wrap items-center justify-end gap-3 rounded-3xl border border-orange-200 bg-[#fffaf4] px-4 py-3 text-sm text-[#6a3c24]">
      <div className="space-y-1">
        <p className="font-semibold text-[#2f160c]">Automatisch verversen</p>
        <p>
          Elke minuut bijgewerkt · Laatste refresh {lastRefreshLabel}
          {isPending ? ' · bezig…' : ''}
        </p>
      </div>
      <button
        type="button"
        onClick={handleRefreshNow}
        className="rounded-full border border-orange-200 bg-white px-4 py-2 font-semibold text-[#6a3c24] transition hover:bg-[#fff3ea]"
      >
        Ververs nu
      </button>
    </div>
  )
}
