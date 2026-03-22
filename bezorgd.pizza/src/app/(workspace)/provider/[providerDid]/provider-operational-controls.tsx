'use client'

import { useState, useTransition } from 'react'

import type {
  LocalFoodFulfilmentMode,
  LocalFoodPressureLevel,
  LocalFoodProviderControlsPatch,
  LocalFoodProviderOperationalControlsView,
} from '@/lib/local-food/local-food-types'

function getQuickButtonClassName(active: boolean) {
  return active
    ? 'border-[#c85b24] bg-[#c85b24] text-white'
    : 'border-orange-200 bg-white text-[#6a3c24] hover:bg-[#fff3ea]'
}

function getLeadTimeButtonLabel(minutes: number) {
  if (minutes === 0) {
    return 'Normaal'
  }

  return `+${minutes} min`
}

function getStandCardClassName(level: LocalFoodPressureLevel) {
  if (level === 'paused') {
    return 'border-[#c85b24] bg-[#fff1ea]'
  }

  if (level === 'very_busy') {
    return 'border-orange-300 bg-[#fff4ec]'
  }

  if (level === 'busy') {
    return 'border-orange-200 bg-[#fff8f1]'
  }

  return 'border-orange-200 bg-[#fffaf4]'
}

function getActionButtonClassName(tone: 'primary' | 'secondary' | 'danger') {
  if (tone === 'danger') {
    return 'border-[#c85b24] bg-[#fff1ea] text-[#8a3d1a] hover:bg-[#ffe5d8]'
  }

  if (tone === 'primary') {
    return 'border-[#c85b24] bg-[#c85b24] text-white hover:bg-[#b6501f]'
  }

  return 'border-orange-200 bg-white text-[#6a3c24] hover:bg-[#fff3ea]'
}

function getPresetButtonClassName(active: boolean) {
  return active
    ? 'border-[#c85b24] bg-[#2f160c] text-white'
    : 'border-orange-200 bg-white text-[#6a3c24] hover:bg-[#fff3ea]'
}

export function ProviderOperationalControls({
  providerDid,
  initialView,
}: {
  providerDid: string
  initialView: LocalFoodProviderOperationalControlsView
}) {
  const [view, setView] = useState(initialView)
  const [message, setMessage] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function submitUpdate(nextPayload: LocalFoodProviderControlsPatch) {
    setMessage(null)

    startTransition(async () => {
      try {
        const response = await fetch(`/api/provider/providers/${encodeURIComponent(providerDid)}/controls`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(nextPayload),
        })

        const result = (await response.json().catch(() => null)) as
          | { message?: string; view?: LocalFoodProviderOperationalControlsView }
          | null

        if (!response.ok || !result?.view) {
          setMessage(result?.message ?? 'De rustknoppen konden niet worden bijgewerkt.')
          return
        }

        setView(result.view)
        setMessage(result.message ?? 'Rustknoppen bijgewerkt.')
      } catch {
        setMessage('Er ging iets mis tijdens het bijwerken van de rustknoppen.')
      }
    })
  }

  function togglePause() {
    submitUpdate({
      paused: !view.controls.paused,
      pausedReason: view.controls.paused
        ? null
        : {
            code: 'busy_kitchen',
            label: 'Keuken draait vol en neemt even geen nieuwe bestellingen aan.',
          },
    })
  }

  function setForcedFulfilmentMode(mode: LocalFoodFulfilmentMode | null) {
    submitUpdate({
      forcedFulfilmentMode: view.controls.forcedFulfilmentMode === mode ? null : mode,
    })
  }

  function toggleDisabledFulfilment(mode: LocalFoodFulfilmentMode) {
    const nextModes = view.controls.disabledFulfilmentModes.includes(mode)
      ? view.controls.disabledFulfilmentModes.filter((entry) => entry !== mode)
      : [...view.controls.disabledFulfilmentModes, mode]

    submitUpdate({
      disabledFulfilmentModes: nextModes,
    })
  }

  function setLeadTimeOffsetMinutes(minutes: number) {
    submitUpdate({
      leadTimeOffsetMinutes: minutes,
    })
  }

  function toggleCategory(categoryId: string) {
    const nextCategoryIds = view.controls.disabledCategoryIds.includes(categoryId)
      ? view.controls.disabledCategoryIds.filter((entry) => entry !== categoryId)
      : [...view.controls.disabledCategoryIds, categoryId]

    submitUpdate({
      disabledCategoryIds: nextCategoryIds,
    })
  }

  function toggleMenuItem(itemId: string) {
    const nextItemIds = view.controls.disabledMenuItemIds.includes(itemId)
      ? view.controls.disabledMenuItemIds.filter((entry) => entry !== itemId)
      : [...view.controls.disabledMenuItemIds, itemId]

    submitUpdate({
      disabledMenuItemIds: nextItemIds,
    })
  }

  function resetControls() {
    submitUpdate({
      paused: false,
      pausedReason: null,
      disabledFulfilmentModes: [],
      forcedFulfilmentMode: null,
      leadTimeOffsetMinutes: 0,
      disabledCategoryIds: [],
      disabledMenuItemIds: [],
      pressureMessage: null,
    })
  }

  const stand = view.operationalStand

  return (
    <section className="space-y-5 rounded-4xl border border-orange-200 bg-white p-6 shadow-[0_14px_40px_rgba(96,42,16,0.06)] sm:p-8">
      <div className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#9a4a1b]">Rustknoppen</p>
        <h3 className="text-2xl font-semibold text-[#2f160c]">Snelle ingrepen voor drukke momenten</h3>
        <p className="max-w-3xl text-sm leading-6 text-[#6a3c24]">
          Geen diepe instellingen, maar directe operationele knoppen om de stroom rustiger te maken. Alles werkt meteen door naar de publieke kant.
        </p>
      </div>

      <div className={`rounded-4xl border p-5 sm:p-6 ${getStandCardClassName(stand.pressureLevel)}`}>
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-3">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#9a4a1b]">Bedrijfsstand</p>
              <h4 className="mt-2 text-2xl font-semibold text-[#2f160c]">{stand.pressureTitle}</h4>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[#6a3c24]">{stand.pressureMessage}</p>
            </div>
            <div className="flex flex-wrap gap-2 text-sm">
              <span className="rounded-full border border-white/60 bg-white px-3 py-2 font-semibold text-[#2f160c]">{stand.openStateLabel}</span>
              <span className="rounded-full border border-white/60 bg-white px-3 py-2 font-semibold text-[#2f160c]">{stand.fulfilmentLabel}</span>
              <span className="rounded-full border border-white/60 bg-white px-3 py-2 font-semibold text-[#2f160c]">{stand.leadTimeLabel}</span>
            </div>
          </div>

          <div className="grid min-w-full gap-3 sm:grid-cols-2 xl:min-w-[420px] xl:grid-cols-4">
            <div className="rounded-3xl border border-white/60 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#9a4a1b]">Open</p>
              <p className="mt-2 text-3xl font-semibold text-[#2f160c]">{stand.openOrdersCount}</p>
            </div>
            <div className="rounded-3xl border border-white/60 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#9a4a1b]">Received</p>
              <p className="mt-2 text-3xl font-semibold text-[#2f160c]">{stand.receivedCount}</p>
            </div>
            <div className="rounded-3xl border border-white/60 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#9a4a1b]">Bereiding</p>
              <p className="mt-2 text-3xl font-semibold text-[#2f160c]">{stand.preparingCount}</p>
            </div>
            <div className="rounded-3xl border border-white/60 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#9a4a1b]">Klaar</p>
              <p className="mt-2 text-3xl font-semibold text-[#2f160c]">{stand.readyCount}</p>
            </div>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {stand.activeRestrictions.map((restriction) => (
            <span key={restriction} className="rounded-full border border-white/60 bg-white px-3 py-2 text-sm font-semibold text-[#6a3c24]">
              {restriction}
            </span>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-sm font-semibold text-[#2f160c]">Operationele preset</p>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {view.presets.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => submitUpdate(preset.patch)}
              disabled={isPending}
              className={`rounded-3xl border p-4 text-left transition disabled:cursor-not-allowed disabled:opacity-60 ${getPresetButtonClassName(preset.active)}`}
            >
              <p className="text-base font-semibold">{preset.label}</p>
              <p className="mt-2 text-sm leading-6 opacity-90">{preset.description}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-3xl border border-orange-200 bg-[#fffaf4] p-4">
          <p className="text-sm font-semibold text-[#2f160c]">Automatische signalen</p>
          <div className="mt-3 space-y-3">
            {view.pressureSignals.length === 0 ? (
              <p className="text-sm leading-6 text-[#6a3c24]">Nog geen extra druktesignalen. De werkstroom oogt nu rustig.</p>
            ) : (
              view.pressureSignals.map((signal) => (
                <div key={signal.id} className="rounded-2xl border border-orange-200 bg-white p-4">
                  <p className="text-sm font-semibold text-[#2f160c]">{signal.label}</p>
                  <p className="mt-1 text-sm leading-6 text-[#6a3c24]">{signal.detail}</p>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-3xl border border-orange-200 bg-[#fffaf4] p-4">
          <p className="text-sm font-semibold text-[#2f160c]">Suggested actions</p>
          <div className="mt-3 space-y-3">
            {view.suggestedActions.length === 0 ? (
              <p className="text-sm leading-6 text-[#6a3c24]">Er is nu geen automatische ingreep nodig. Gebruik de rustknoppen alleen als jij dat wilt.</p>
            ) : (
              view.suggestedActions.map((action) => (
                <button
                  key={action.id}
                  type="button"
                  onClick={() => submitUpdate(action.patch)}
                  disabled={isPending}
                  className={`w-full rounded-3xl border p-4 text-left transition disabled:cursor-not-allowed disabled:opacity-60 ${getActionButtonClassName(action.tone)}`}
                >
                  <p className="text-sm font-semibold">{action.label}</p>
                  <p className="mt-1 text-sm leading-6 opacity-90">{action.description}</p>
                </button>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={togglePause}
          disabled={isPending}
          className={`rounded-full border px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${getQuickButtonClassName(view.controls.paused)}`}
        >
          {view.controls.paused ? 'Bestellen gepauzeerd' : 'Pauzeer bestellingen'}
        </button>
        <button
          type="button"
          onClick={resetControls}
          disabled={isPending}
          className="rounded-full border border-orange-200 bg-white px-4 py-2 text-sm font-semibold text-[#6a3c24] transition hover:bg-[#fff3ea] disabled:cursor-not-allowed disabled:opacity-60"
        >
          Alles terug normaal
        </button>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="rounded-3xl border border-orange-200 bg-[#fffaf4] p-4">
          <p className="text-sm font-semibold text-[#2f160c]">Fulfilment</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {view.supportedFulfilmentModes.map((mode) => {
              const label = mode === 'delivery' ? 'Bezorgen uit' : 'Afhalen uit'
              const active = view.controls.disabledFulfilmentModes.includes(mode)

              return (
                <button
                  key={mode}
                  type="button"
                  onClick={() => toggleDisabledFulfilment(mode)}
                  disabled={isPending}
                  className={`rounded-full border px-3 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${getQuickButtonClassName(active)}`}
                >
                  {label}
                </button>
              )
            })}
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {view.supportedFulfilmentModes.includes('pickup') ? (
              <button
                type="button"
                onClick={() => setForcedFulfilmentMode('pickup')}
                disabled={isPending}
                className={`rounded-full border px-3 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${getQuickButtonClassName(view.controls.forcedFulfilmentMode === 'pickup')}`}
              >
                Alleen afhalen
              </button>
            ) : null}
            {view.supportedFulfilmentModes.includes('delivery') ? (
              <button
                type="button"
                onClick={() => setForcedFulfilmentMode('delivery')}
                disabled={isPending}
                className={`rounded-full border px-3 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${getQuickButtonClassName(view.controls.forcedFulfilmentMode === 'delivery')}`}
              >
                Alleen bezorgen
              </button>
            ) : null}
          </div>
        </div>

        <div className="rounded-3xl border border-orange-200 bg-[#fffaf4] p-4">
          <p className="text-sm font-semibold text-[#2f160c]">Levertijd ophogen</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {[0, 10, 20, 30].map((minutes) => (
              <button
                key={minutes}
                type="button"
                onClick={() => setLeadTimeOffsetMinutes(minutes)}
                disabled={isPending}
                className={`rounded-full border px-3 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${getQuickButtonClassName(view.controls.leadTimeOffsetMinutes === minutes)}`}
              >
                {getLeadTimeButtonLabel(minutes)}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-orange-200 bg-[#fffaf4] p-4">
          <p className="text-sm font-semibold text-[#2f160c]">Directe stand</p>
          <div className="mt-3 space-y-2 text-sm text-[#6a3c24]">
            <p>{stand.openStateLabel}</p>
            <p>{stand.leadTimeLabel}</p>
            <p>{stand.fulfilmentLabel}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-3xl border border-orange-200 bg-[#fffaf4] p-4">
          <p className="text-sm font-semibold text-[#2f160c]">Categorie tijdelijk uit</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {view.categories.map((category) => (
              <button
                key={category.id}
                type="button"
                onClick={() => toggleCategory(category.id)}
                disabled={isPending}
                className={`rounded-full border px-3 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${getQuickButtonClassName(category.disabled)}`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-orange-200 bg-[#fffaf4] p-4">
          <p className="text-sm font-semibold text-[#2f160c]">Gerecht tijdelijk uit</p>
          <div className="mt-3 flex max-h-60 flex-wrap gap-2 overflow-y-auto pr-1">
            {view.menuItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => toggleMenuItem(item.id)}
                disabled={isPending}
                className={`rounded-full border px-3 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${getQuickButtonClassName(item.disabled)}`}
              >
                {item.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {message ? <p className="text-sm text-[#6a3c24]">{message}</p> : null}
    </section>
  )
}
