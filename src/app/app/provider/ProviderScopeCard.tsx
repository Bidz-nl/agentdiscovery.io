"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronDown, Loader2 } from 'lucide-react'

import { useProviderScope } from '@/app/app/provider/use-provider-scope'

export default function ProviderScopeCard({
  appApiKey,
  redirectTo = '/app/provider',
}: {
  appApiKey: string | null
  redirectTo?: string
}) {
  const router = useRouter()
  const { context, isLoading, isSwitching, errorMessage, switchProvider } = useProviderScope(appApiKey)
  const [selectedProviderDid, setSelectedProviderDid] = useState('')

  const authorizedProviderDids = context?.providerScope.authorizedProviderDids ?? []
  const activeProviderDid = context?.providerScope.activeProviderDid ?? null
  const canSwitch = authorizedProviderDids.length > 1

  const handleSwitch = async () => {
    const nextProviderDid = selectedProviderDid || activeProviderDid
    if (!nextProviderDid || nextProviderDid === activeProviderDid) {
      return
    }

    try {
      await switchProvider(nextProviderDid)
      router.replace(redirectTo)
      router.refresh()
    } catch {}
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-white/35">Active provider scope</p>
          <p className="mt-1 text-sm font-medium text-white/80">
            {isLoading ? 'Loading provider scope…' : activeProviderDid ?? 'No active provider scope'}
          </p>
          <p className="mt-1 text-xs text-white/40">All private drafts and publish actions apply to this provider.</p>
        </div>

        {canSwitch ? (
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <select
                value={selectedProviderDid || activeProviderDid || ''}
                onChange={(event) => setSelectedProviderDid(event.target.value)}
                disabled={isSwitching || isLoading}
                className="appearance-none rounded-xl border border-white/10 bg-[#0A0E17] px-3 py-2 pr-9 text-sm text-white/80 outline-none transition-colors hover:border-white/20 disabled:text-white/40"
              >
                {authorizedProviderDids.map((providerDid) => (
                  <option key={providerDid} value={providerDid}>
                    {providerDid}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
            </div>
            <button
              type="button"
              onClick={handleSwitch}
              disabled={isSwitching || isLoading || !selectedProviderDid || selectedProviderDid === activeProviderDid}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-blue-500/30 bg-blue-500/10 px-3 py-2 text-sm font-medium text-blue-300 transition-colors hover:bg-blue-500/20 disabled:border-white/10 disabled:bg-white/5 disabled:text-white/35"
            >
              {isSwitching ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Switch provider
            </button>
          </div>
        ) : null}
      </div>

      {errorMessage ? <p className="mt-2 text-xs text-red-300">{errorMessage}</p> : null}
    </div>
  )
}
