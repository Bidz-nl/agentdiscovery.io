'use client'

import { useActionState } from 'react'

import { signInToProviderWorkspace } from './actions'

const INITIAL_STATE = {
  error: '',
}

export function ProviderLoginForm({
  providers,
}: {
  providers: Array<{
    providerDid: string
    businessName: string
    locationLabel: string
  }>
}) {
  const [state, formAction, isPending] = useActionState(signInToProviderWorkspace, INITIAL_STATE)

  return (
    <form action={formAction} className="space-y-5 rounded-4xl border border-orange-200 bg-white p-6 shadow-[0_14px_40px_rgba(96,42,16,0.06)] sm:p-8">
      <div className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#9a4a1b]">Workspace login</p>
        <h1 className="text-3xl font-semibold text-[#2f160c]">Open het operationele orderscherm</h1>
        <p className="text-sm leading-6 text-[#6a3c24]">
          Kies een restaurant en vul de werkvloer-code in om de orderqueue veilig te openen.
        </p>
      </div>

      <label className="grid gap-2 text-sm font-medium text-[#2f160c]">
        <span>Restaurant</span>
        <select
          name="providerDid"
          required
          className="rounded-2xl border border-orange-200 bg-[#fffaf4] px-4 py-3 text-base text-[#2f160c]"
          defaultValue={providers[0]?.providerDid ?? ''}
        >
          {providers.map((provider) => (
            <option key={provider.providerDid} value={provider.providerDid}>
              {provider.businessName} · {provider.locationLabel}
            </option>
          ))}
        </select>
      </label>

      <label className="grid gap-2 text-sm font-medium text-[#2f160c]">
        <span>Werkvloer-code</span>
        <input
          name="accessCode"
          type="password"
          required
          className="rounded-2xl border border-orange-200 bg-[#fffaf4] px-4 py-3 text-base text-[#2f160c]"
          placeholder="Vul de code van de zaak in"
        />
      </label>

      {state.error ? <p className="text-sm text-[#9a3f17]">{state.error}</p> : null}

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-full bg-[#c85b24] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#ab4715] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? 'Bezig met openen...' : 'Open orderscherm'}
      </button>
    </form>
  )
}
