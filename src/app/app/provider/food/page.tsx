"use client"

import { useCallback, useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, Loader2, Pizza, Save, ShoppingBag, Store } from 'lucide-react'

import ADPClient, { type LocalFoodOrderReadModel, type LocalFoodProviderAdminResponse } from '@/app/app/lib/adp-client'
import { useAgentStore } from '@/app/app/lib/agent-store'

type MenuDraft = {
  name: string
  category: 'pizza' | 'sides' | 'drinks' | 'desserts'
  description: string
  priceCents: string
  available: boolean
  tags: string
}

type ProviderFoodTab = 'overview' | 'menu' | 'orders'

type RequestError = Error & {
  status?: number
  code?: string
}

function toEuroDisplay(priceCents: number) {
  return `€${(priceCents / 100).toFixed(2)}`
}

function toProviderStatusLabel(status: 'draft' | 'active' | 'paused') {
  switch (status) {
    case 'draft':
      return 'Concept'
    case 'active':
      return 'Live'
    case 'paused':
      return 'Gepauzeerd'
  }
}

function toFulfilmentLabel(mode: 'delivery' | 'pickup') {
  return mode === 'delivery' ? 'Bezorgen' : 'Afhalen'
}

function toOrderStatusLabel(status: LocalFoodOrderReadModel['status']) {
  switch (status) {
    case 'submitted':
      return 'Nieuw'
    case 'confirmed':
      return 'Bevestigd'
    case 'preparing':
      return 'In bereiding'
    case 'ready':
      return 'Klaar'
    case 'completed':
      return 'Afgerond'
    case 'cancelled':
      return 'Geannuleerd'
  }
}

function nextOrderActions(status: LocalFoodOrderReadModel['status']) {
  switch (status) {
    case 'submitted':
      return ['confirmed', 'cancelled'] as const
    case 'confirmed':
      return ['preparing', 'cancelled'] as const
    case 'preparing':
      return ['ready', 'cancelled'] as const
    case 'ready':
      return ['completed', 'cancelled'] as const
    default:
      return [] as const
  }
}

function isOwnerAuthError(error: unknown) {
  const requestError = error as RequestError | null
  return requestError?.status === 401 || requestError?.code === 'OWNER_AUTH_REQUIRED'
}

export default function ProviderFoodPage() {
  const { appSession } = useAgentStore()
  const appApiKey = appSession.apiKey

  const [providerResponse, setProviderResponse] = useState<LocalFoodProviderAdminResponse | null>(null)
  const [orders, setOrders] = useState<LocalFoodOrderReadModel[]>([])
  const [loading, setLoading] = useState(true)
  const [savingProvider, setSavingProvider] = useState(false)
  const [bootstrappingDemo, setBootstrappingDemo] = useState(false)
  const [creatingItem, setCreatingItem] = useState(false)
  const [importingCsv, setImportingCsv] = useState(false)
  const [activeMenuItemId, setActiveMenuItemId] = useState<string | null>(null)
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [needsReauth, setNeedsReauth] = useState(false)
  const [activeTab, setActiveTab] = useState<ProviderFoodTab>('overview')
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null)

  const [businessName, setBusinessName] = useState('')
  const [summary, setSummary] = useState('')
  const [phone, setPhone] = useState('')
  const [locationLabel, setLocationLabel] = useState('')
  const [coverageLabel, setCoverageLabel] = useState('')
  const [postcodePrefixes, setPostcodePrefixes] = useState('')
  const [deliveryNotes, setDeliveryNotes] = useState('')
  const [status, setStatus] = useState<'draft' | 'active' | 'paused'>('draft')
  const [deliveryEnabled, setDeliveryEnabled] = useState(true)
  const [pickupEnabled, setPickupEnabled] = useState(false)

  const [newItem, setNewItem] = useState<MenuDraft>({
    name: '',
    category: 'pizza',
    description: '',
    priceCents: '',
    available: true,
    tags: '',
  })
  const [csvText, setCsvText] = useState('name,category,description,price,available,tags\nMargherita,pizza,Tomato mozzarella basil,11.50,true,classics|vegetarian')
  const [menuDrafts, setMenuDrafts] = useState<Record<string, MenuDraft>>({})

  const syncProviderState = useCallback((response: LocalFoodProviderAdminResponse) => {
    setProviderResponse(response)
    setBusinessName(response.provider.businessName)
    setSummary(response.provider.summary)
    setPhone(response.provider.phone)
    setLocationLabel(response.provider.locationLabel)
    setCoverageLabel(response.provider.serviceArea.coverageLabel)
    setPostcodePrefixes(response.provider.serviceArea.postcodePrefixes.join(', '))
    setDeliveryNotes(response.provider.serviceArea.deliveryNotes)
    setStatus(response.provider.status)
    setDeliveryEnabled(response.provider.fulfilmentModes.includes('delivery'))
    setPickupEnabled(response.provider.fulfilmentModes.includes('pickup'))
    setMenuDrafts(
      Object.fromEntries(
        response.menuItems.map((item) => [
          item.id,
          {
            name: item.name,
            category: item.category,
            description: item.description,
            priceCents: String(item.priceCents),
            available: item.available,
            tags: item.tags.join(', '),
          },
        ])
      )
    )
  }, [])

  const loadPage = useCallback(async () => {
    if (!appApiKey) {
      setNeedsReauth(false)
      setProviderResponse(null)
      setOrders([])
      setLoading(false)
      return
    }

    try {
      setNeedsReauth(false)
      setErrorMessage(null)
      const client = new ADPClient(appApiKey)
      const [provider, incomingOrders] = await Promise.all([
        client.getLocalFoodProviderAdmin(),
        client.getLocalFoodOrders(),
      ])
      syncProviderState(provider)
      setOrders(incomingOrders.orders || [])
    } catch (error) {
      if (isOwnerAuthError(error)) {
        setNeedsReauth(true)
        setProviderResponse(null)
        setOrders([])
        setErrorMessage('Your owner session is missing or expired. Restore your session to manage local pizza ordering.')
      } else {
        setErrorMessage(error instanceof Error ? error.message : 'Unable to load local food workspace')
      }
    } finally {
      setLoading(false)
    }
  }, [appApiKey, syncProviderState])

  useEffect(() => {
    loadPage()
  }, [loadPage])

  const activeMenuItems = useMemo(() => providerResponse?.menuItems ?? [], [providerResponse?.menuItems])
  const dashboard = providerResponse?.dashboard
  const launchChecklist = useMemo(() => {
    const hasBusinessBasics = businessName.trim().length > 0 && summary.trim().length > 0 && locationLabel.trim().length > 0
    const hasServiceArea = coverageLabel.trim().length > 0 && postcodePrefixes.split(',').map((entry) => entry.trim()).filter(Boolean).length > 0
    const hasMenu = activeMenuItems.some((item) => item.available)

    return {
      hasBusinessBasics: providerResponse?.launchChecklist.hasBusinessBasics ?? hasBusinessBasics,
      hasServiceArea: providerResponse?.launchChecklist.hasServiceArea ?? hasServiceArea,
      hasMenu: providerResponse?.launchChecklist.hasMenu ?? hasMenu,
      readyToLaunch: providerResponse?.launchChecklist.canGoLive ?? (hasBusinessBasics && hasServiceArea && hasMenu),
      nextRecommendedAction: providerResponse?.launchChecklist.nextRecommendedAction || 'Complete setup basics before going live.',
    }
  }, [activeMenuItems, businessName, coverageLabel, locationLabel, postcodePrefixes, providerResponse?.launchChecklist, summary])

  const fulfilmentModes = useMemo(() => {
    const modes: Array<'delivery' | 'pickup'> = []
    if (deliveryEnabled) {
      modes.push('delivery')
    }
    if (pickupEnabled) {
      modes.push('pickup')
    }
    return modes.length > 0 ? modes : ['delivery']
  }, [deliveryEnabled, pickupEnabled])

  useEffect(() => {
    if (orders.length === 0) {
      setSelectedOrderId(null)
      return
    }

    setSelectedOrderId((current) => (current && orders.some((order) => order.id === current) ? current : orders[0].id))
  }, [orders])

  const selectedOrder = useMemo(
    () => orders.find((order) => order.id === selectedOrderId) ?? orders[0] ?? null,
    [orders, selectedOrderId]
  )

  const saveProvider = async () => {
    if (!appApiKey) {
      setErrorMessage('Owner app session is required to manage the pizza ordering wedge')
      return
    }

    if (!businessName.trim()) {
      setErrorMessage('Add a business name before saving the supplier setup.')
      return
    }

    setSavingProvider(true)
    setErrorMessage(null)
    setStatusMessage(null)

    try {
      const client = new ADPClient(appApiKey)
      await client.updateLocalFoodProvider({
        status,
        businessName,
        summary,
        phone,
        locationLabel,
        fulfilmentModes,
        serviceArea: {
          postcodePrefixes: postcodePrefixes
            .split(',')
            .map((entry) => entry.trim())
            .filter(Boolean),
          coverageLabel,
          deliveryNotes,
        },
      })
      await loadPage()
      setStatusMessage('Overzicht opgeslagen.')
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to save provider setup')
    } finally {
      setSavingProvider(false)
    }
  }

  const createMenuItem = async () => {
    if (!appApiKey) {
      setErrorMessage('Owner app session is required to create menu items')
      return
    }

    if (!newItem.name.trim()) {
      setErrorMessage('Enter a menu item name before adding it.')
      return
    }

    setCreatingItem(true)
    setErrorMessage(null)
    setStatusMessage(null)

    try {
      const client = new ADPClient(appApiKey)
      await client.createLocalFoodMenuItem({
        item: {
          name: newItem.name,
          category: newItem.category,
          description: newItem.description,
          priceCents: Number.parseInt(newItem.priceCents || '0', 10),
          available: newItem.available,
          tags: newItem.tags
            .split(',')
            .map((entry) => entry.trim())
            .filter(Boolean),
        },
      })
      setNewItem({
        name: '',
        category: 'pizza',
        description: '',
        priceCents: '',
        available: true,
        tags: '',
      })
      await loadPage()
      setStatusMessage('Menu-item toegevoegd.')
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to add menu item')
    } finally {
      setCreatingItem(false)
    }
  }

  const bootstrapDemo = async () => {
    if (!appApiKey) {
      setErrorMessage('Owner app session is required to bootstrap the pizza demo')
      return
    }

    setBootstrappingDemo(true)
    setErrorMessage(null)
    setStatusMessage(null)

    try {
      const client = new ADPClient(appApiKey)
      await client.bootstrapLocalFoodDemo()
      setNeedsReauth(false)
      await loadPage()
      setStatusMessage('Demo supplier data is ready. You can now test discovery and checkout immediately.')
    } catch (error) {
      if (isOwnerAuthError(error)) {
        setNeedsReauth(true)
        setProviderResponse(null)
        setOrders([])
        setErrorMessage('Your owner session is missing or expired. Restore it before creating demo supplier data.')
      } else {
        setErrorMessage(error instanceof Error ? error.message : 'Unable to bootstrap demo data')
      }
    } finally {
      setBootstrappingDemo(false)
    }
  }

  const importCsvMenu = async () => {
    if (!appApiKey) {
      setErrorMessage('Owner app session is required to import a menu')
      return
    }

    if (!csvText.trim()) {
      setErrorMessage('Paste a CSV menu before importing.')
      return
    }

    setImportingCsv(true)
    setErrorMessage(null)
    setStatusMessage(null)

    try {
      const client = new ADPClient(appApiKey)
      await client.importLocalFoodMenuCsv(csvText)
      await loadPage()
      setStatusMessage('CSV-menu geïmporteerd.')
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to import CSV menu')
    } finally {
      setImportingCsv(false)
    }
  }

  const saveMenuItem = async (itemId: string) => {
    if (!appApiKey) {
      setErrorMessage('Owner app session is required to update menu items')
      return
    }

    const draft = menuDrafts[itemId]
    if (!draft) {
      return
    }

    setActiveMenuItemId(itemId)
    setErrorMessage(null)
    setStatusMessage(null)

    try {
      const client = new ADPClient(appApiKey)
      await client.updateLocalFoodMenuItem(itemId, {
        name: draft.name,
        category: draft.category,
        description: draft.description,
        priceCents: Number.parseInt(draft.priceCents || '0', 10),
        available: draft.available,
        tags: draft.tags
          .split(',')
          .map((entry) => entry.trim())
          .filter(Boolean),
      })
      await loadPage()
      setStatusMessage('Menu-item bijgewerkt.')
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to update menu item')
    } finally {
      setActiveMenuItemId(null)
    }
  }

  const updateOrderStatus = async (orderId: string, nextStatus: LocalFoodOrderReadModel['status']) => {
    if (!appApiKey) {
      setErrorMessage('Owner app session is required to update orders')
      return
    }

    setActiveOrderId(orderId)
    setErrorMessage(null)
    setStatusMessage(null)

    try {
      const client = new ADPClient(appApiKey)
      await client.updateLocalFoodOrderStatus(orderId, { status: nextStatus })
      await loadPage()
      setStatusMessage(`Bestelling bijgewerkt naar ${toOrderStatusLabel(nextStatus)}.`)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to update order status')
    } finally {
      setActiveOrderId(null)
    }
  }

  if (!appApiKey) {
    return (
      <div className="min-h-screen px-4 pb-24 pt-12">
        <div className="mx-auto max-w-5xl space-y-6">
          <Link href="/app/provider" className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/70 transition-colors hover:bg-white/10">
            <ArrowLeft className="h-4 w-4" />
            Terug naar bot-werkruimte
          </Link>
          <div className="rounded-3xl border border-amber-500/20 bg-amber-500/10 p-6 text-sm text-amber-100">
            Herstel eerst de owner-sessie met de API-sleutel van deze bot voordat je leveranciersbeheer opent.
          </div>
        </div>
      </div>
    )
  }

  if (needsReauth) {
    return (
      <div className="min-h-screen px-4 pb-24 pt-12">
        <div className="mx-auto max-w-5xl space-y-6">
          <Link href="/app/provider" className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/70 transition-colors hover:bg-white/10">
            <ArrowLeft className="h-4 w-4" />
            Terug naar bot-werkruimte
          </Link>
          <div className="rounded-3xl border border-amber-500/20 bg-amber-500/10 p-6">
            <h1 className="text-2xl font-semibold text-white">Herstel je owner-sessie</h1>
            <p className="mt-2 max-w-3xl text-sm text-amber-100">
              Deze pagina heeft een geldige owner API-sessie nodig voor laden, demo-bootstrap en leveranciersbeheer. De opgeslagen sessie op dit apparaat ontbreekt of is verlopen.
            </p>
            {errorMessage ? (
              <div className="mt-4 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {errorMessage}
              </div>
            ) : null}
            <div className="mt-5 flex flex-wrap gap-3">
              <Link href="/app/restore" className="inline-flex items-center gap-2 rounded-xl border border-amber-400/30 bg-amber-400/15 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-amber-400/25">
                Sessie herstellen
              </Link>
              <Link href="/app/provider" className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white/80 transition-colors hover:bg-white/10">
                Terug naar provider-home
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen px-4 pb-24 pt-12">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Link href="/app/provider" className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/70 transition-colors hover:bg-white/10">
              <ArrowLeft className="h-4 w-4" />
              Terug naar bot-werkruimte
            </Link>
            <h1 className="mt-4 text-3xl font-bold text-white">Leveranciersweergave</h1>
            <p className="mt-2 max-w-3xl text-sm text-white/45">
              Houd de demo rustig en presentatieklaar: bekijk de status, pas het menu aan en verwerk binnenkomende bestellingen in aparte stappen.
            </p>
          </div>
          {activeTab === 'overview' ? (
            <button type="button" onClick={saveProvider} disabled={savingProvider || loading} className="inline-flex items-center gap-2 rounded-xl border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm font-medium text-green-100 transition-colors hover:bg-green-500/20 disabled:cursor-not-allowed disabled:opacity-60">
              {savingProvider ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Overzicht opslaan
            </button>
          ) : null}
        </div>

        {loading ? (
          <div className="flex items-center justify-center rounded-3xl border border-white/5 bg-[#111827] p-10">
            <Loader2 className="h-6 w-6 animate-spin text-white/30" />
          </div>
        ) : null}

        {errorMessage ? <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">{errorMessage}</div> : null}
        {statusMessage ? <div className="rounded-2xl border border-green-500/20 bg-green-500/10 px-4 py-3 text-sm text-green-200">{statusMessage}</div> : null}

        <div className="rounded-3xl border border-white/5 bg-[#111827] p-2">
          <div className="grid gap-2 md:grid-cols-3">
            {([
              ['overview', 'Overzicht', 'Status, checklist en basisinstellingen'],
              ['menu', 'Menu aanpassen', 'Handmatig toevoegen, CSV import en bewerken'],
              ['orders', 'Binnenkomende orders', 'Queue, details en statusacties'],
            ] as const).map(([tabKey, label, description]) => (
              <button
                key={tabKey}
                type="button"
                onClick={() => setActiveTab(tabKey)}
                className={`rounded-2xl px-4 py-3 text-left transition-colors ${
                  activeTab === tabKey
                    ? 'border border-orange-500/30 bg-orange-500/10 text-white'
                    : 'border border-transparent bg-white/5 text-white/70 hover:bg-white/10'
                }`}
              >
                <div className="text-sm font-medium">{label}</div>
                <div className="mt-1 text-xs text-white/45">{description}</div>
              </button>
            ))}
          </div>
        </div>

        {!loading && !providerResponse ? (
          <div className="rounded-3xl border border-white/5 bg-[#111827] p-6 text-sm text-white/60">
            De leveranciersweergave kon niet worden geladen.
          </div>
        ) : null}

        {!loading && providerResponse && activeTab === 'overview' ? (
          <div className="space-y-6">
            <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
              <div className="space-y-6">
                <div className="rounded-3xl border border-white/5 bg-[#111827] p-6">
                  <div className="flex items-center gap-3">
                    <Store className="h-5 w-5 text-orange-300" />
                    <div>
                      <h2 className="text-lg font-semibold text-white">Overzicht</h2>
                      <p className="mt-1 text-sm text-white/45">Een korte samenvatting van wat klanten zien en wat nog nodig is voor de demo.</p>
                    </div>
                  </div>
                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/75">
                      Status: <span className="font-medium text-white">{toProviderStatusLabel(providerResponse.provider.status)}</span>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/75">
                      Levering: <span className="font-medium text-white">{providerResponse.provider.fulfilmentModes.map(toFulfilmentLabel).join(' · ')}</span>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/75">
                      Gebied: <span className="font-medium text-white">{providerResponse.provider.serviceArea.coverageLabel || providerResponse.provider.locationLabel || 'Nog niet ingevuld'}</span>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/75">
                      Contact: <span className="font-medium text-white">{providerResponse.provider.phone || 'Nog niet ingevuld'}</span>
                    </div>
                  </div>
                  <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
                    <div className="text-sm font-medium text-white">Korte samenvatting</div>
                    <div className="mt-2 text-sm text-white/60">
                      {providerResponse.provider.summary || 'Voeg een korte omschrijving toe zodat de demo meteen duidelijk voelt voor klanten.'}
                    </div>
                  </div>
                  <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-white/60">
                    Volgende stap: <span className="text-white">{launchChecklist.nextRecommendedAction}</span>
                  </div>
                </div>

                <div className="rounded-3xl border border-white/5 bg-[#111827] p-6">
                  <h2 className="text-lg font-semibold text-white">Demo launch checklist</h2>
                  <p className="mt-1 text-sm text-white/45">
                    Houd het simpel: basisgegevens, postcodegebied en minstens één beschikbaar menu-item.
                  </p>
                  <div className="mt-5 grid gap-3 sm:grid-cols-3">
                    <div className={`rounded-2xl border px-4 py-3 text-sm ${launchChecklist.hasBusinessBasics ? 'border-green-500/20 bg-green-500/10 text-green-100' : 'border-white/10 bg-white/5 text-white/70'}`}>
                      Basisgegevens
                    </div>
                    <div className={`rounded-2xl border px-4 py-3 text-sm ${launchChecklist.hasServiceArea ? 'border-green-500/20 bg-green-500/10 text-green-100' : 'border-white/10 bg-white/5 text-white/70'}`}>
                      Postcodegebied
                    </div>
                    <div className={`rounded-2xl border px-4 py-3 text-sm ${launchChecklist.hasMenu ? 'border-green-500/20 bg-green-500/10 text-green-100' : 'border-white/10 bg-white/5 text-white/70'}`}>
                      Live menu-item
                    </div>
                  </div>
                  <div className={`mt-4 rounded-2xl border px-4 py-3 text-sm ${launchChecklist.readyToLaunch ? 'border-green-500/20 bg-green-500/10 text-green-100' : 'border-amber-500/20 bg-amber-500/10 text-amber-100'}`}>
                    {launchChecklist.readyToLaunch
                      ? 'Deze leverancier is demo-klaar. Zet de status op Live wanneer je zichtbaar wilt zijn voor klanten.'
                      : 'Rond eerst deze drie onderdelen af voordat je de leverancier op Live zet.'}
                  </div>
                  <button type="button" onClick={bootstrapDemo} disabled={bootstrappingDemo} className="mt-4 inline-flex items-center gap-2 rounded-xl border border-orange-500/30 bg-orange-500/10 px-4 py-3 text-sm font-medium text-orange-100 transition-colors hover:bg-orange-500/20 disabled:cursor-not-allowed disabled:opacity-60">
                    {bootstrappingDemo ? <Loader2 className="h-4 w-4 animate-spin" /> : <Pizza className="h-4 w-4" />}
                    Demo-ready leverancier maken
                  </button>
                </div>

                <div className="rounded-3xl border border-white/5 bg-[#111827] p-6">
                  <div className="flex items-center gap-3">
                    <Store className="h-5 w-5 text-orange-300" />
                    <div>
                      <h2 className="text-lg font-semibold text-white">Basisinstellingen</h2>
                      <p className="mt-1 text-sm text-white/45">Werk hier de leverancierstekst, zichtbaarheid en bezorggegevens bij.</p>
                    </div>
                  </div>
                  <div className="mt-5 grid gap-4 md:grid-cols-2">
                    <label className="space-y-2 text-sm text-white/70">
                      <span>Business name</span>
                      <input value={businessName} onChange={(event) => setBusinessName(event.target.value)} className="w-full rounded-xl border border-white/10 bg-[#0A0E17] px-4 py-3 text-white focus:border-orange-500/50 focus:outline-none" />
                    </label>
                    <label className="space-y-2 text-sm text-white/70">
                      <span>Status</span>
                      <select value={status} onChange={(event) => setStatus(event.target.value as 'draft' | 'active' | 'paused')} className="w-full rounded-xl border border-white/10 bg-[#0A0E17] px-4 py-3 text-white focus:border-orange-500/50 focus:outline-none">
                        <option value="draft">Concept</option>
                        <option value="active">Live</option>
                        <option value="paused">Gepauzeerd</option>
                      </select>
                      <p className="text-xs text-white/40">
                        Gebruik Draft tijdens setup, Live voor postcode-discovery en Paused om bestellingen tijdelijk te stoppen.
                      </p>
                    </label>
                    <label className="space-y-2 text-sm text-white/70 md:col-span-2">
                      <span>Business summary</span>
                      <textarea value={summary} onChange={(event) => setSummary(event.target.value)} rows={3} className="w-full rounded-2xl border border-white/10 bg-[#0A0E17] px-4 py-3 text-white focus:border-orange-500/50 focus:outline-none" />
                    </label>
                    <label className="space-y-2 text-sm text-white/70">
                      <span>Phone</span>
                      <input value={phone} onChange={(event) => setPhone(event.target.value)} className="w-full rounded-xl border border-white/10 bg-[#0A0E17] px-4 py-3 text-white focus:border-orange-500/50 focus:outline-none" />
                    </label>
                    <label className="space-y-2 text-sm text-white/70">
                      <span>Location label</span>
                      <input value={locationLabel} onChange={(event) => setLocationLabel(event.target.value)} placeholder="Amsterdam West" className="w-full rounded-xl border border-white/10 bg-[#0A0E17] px-4 py-3 text-white focus:border-orange-500/50 focus:outline-none" />
                    </label>
                    <label className="space-y-2 text-sm text-white/70">
                      <span>Coverage label</span>
                      <input value={coverageLabel} onChange={(event) => setCoverageLabel(event.target.value)} placeholder="Serving Amsterdam West & Centrum" className="w-full rounded-xl border border-white/10 bg-[#0A0E17] px-4 py-3 text-white focus:border-orange-500/50 focus:outline-none" />
                    </label>
                    <label className="space-y-2 text-sm text-white/70">
                      <span>Postcode coverage</span>
                      <input value={postcodePrefixes} onChange={(event) => setPostcodePrefixes(event.target.value)} placeholder="1012, 1013, 1055" className="w-full rounded-xl border border-white/10 bg-[#0A0E17] px-4 py-3 text-white focus:border-orange-500/50 focus:outline-none" />
                    </label>
                    <label className="space-y-2 text-sm text-white/70 md:col-span-2">
                      <span>Delivery notes</span>
                      <textarea value={deliveryNotes} onChange={(event) => setDeliveryNotes(event.target.value)} rows={3} className="w-full rounded-2xl border border-white/10 bg-[#0A0E17] px-4 py-3 text-white focus:border-orange-500/50 focus:outline-none" />
                    </label>
                  </div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <label className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/75">
                      <span>Delivery</span>
                      <input type="checkbox" checked={deliveryEnabled} onChange={(event) => setDeliveryEnabled(event.target.checked)} />
                    </label>
                    <label className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/75">
                      <span>Pickup</span>
                      <input type="checkbox" checked={pickupEnabled} onChange={(event) => setPickupEnabled(event.target.checked)} />
                    </label>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="rounded-3xl border border-white/5 bg-[#111827] p-6">
                  <h2 className="text-lg font-semibold text-white">Kerncijfers</h2>
                  <div className="mt-4 grid gap-3">
                    <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/70">
                      Beschikbare items: <span className="font-medium text-white">{dashboard?.availableMenuItems || 0}</span>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/70">
                      Totaal menu-items: <span className="font-medium text-white">{dashboard?.totalMenuItems || 0}</span>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/70">
                      Binnenkomende orders: <span className="font-medium text-white">{dashboard?.incomingOrders || 0}</span>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/70">
                      Wachten op actie: <span className="font-medium text-white">{dashboard?.awaitingAction || 0}</span>
                    </div>
                  </div>
                </div>

                <div className="relative min-h-[240px] overflow-hidden rounded-3xl border border-white/5 bg-[#111827]">
                  <Image
                    src="/images/pizza/warm-dutch-local-delivery-photography.png"
                    alt="Warm Dutch local delivery scene"
                    fill
                    className="object-cover"
                    sizes="420px"
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-[#0A0E17] via-[#0A0E17]/55 to-[#0A0E17]/10" />
                  <div className="absolute inset-x-0 bottom-0 p-6">
                    <div className="inline-flex rounded-full border border-white/10 bg-[#0A0E17]/70 px-3 py-1 text-xs text-orange-100">
                      Demo-uitstraling
                    </div>
                    <div className="mt-3 text-lg font-semibold text-white">Warm, lokaal en makkelijk te presenteren</div>
                    <div className="mt-2 max-w-xs text-sm text-white/65">
                      Deze leveranciersweergave blijft bewust rustig: status en operatie voorop, met alleen een zachte lokale sfeerlaag.
                    </div>
                  </div>
                </div>

                <div className="rounded-3xl border border-white/5 bg-[#111827] p-6">
                  <div className="text-sm font-medium text-white">Presentatie-opmerking</div>
                  <div className="mt-2 text-sm text-white/60">
                    Betaling blijft in deze demo een placeholder. De leverancier- en orderflow zijn wel zichtbaar en bruikbaar voor de presentatie.
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {!loading && providerResponse && activeTab === 'menu' ? (
          <div className="space-y-6">
            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.9fr)]">
              <div className="space-y-6">
                <div className="rounded-3xl border border-white/5 bg-[#111827] p-6">
                  <div className="flex items-center gap-3">
                    <Pizza className="h-5 w-5 text-red-300" />
                    <div>
                      <h2 className="text-lg font-semibold text-white">Menu aanpassen</h2>
                      <p className="mt-1 text-sm text-white/45">Voeg handmatig items toe of gebruik CSV om snel een demo-menu neer te zetten.</p>
                    </div>
                  </div>
                  <div className="mt-5 grid gap-4 md:grid-cols-2">
                    <label className="space-y-2 text-sm text-white/70">
                      <span>Name</span>
                      <input value={newItem.name} onChange={(event) => setNewItem((current) => ({ ...current, name: event.target.value }))} className="w-full rounded-xl border border-white/10 bg-[#0A0E17] px-4 py-3 text-white focus:border-red-500/50 focus:outline-none" />
                    </label>
                    <label className="space-y-2 text-sm text-white/70">
                      <span>Category</span>
                      <select value={newItem.category} onChange={(event) => setNewItem((current) => ({ ...current, category: event.target.value as MenuDraft['category'] }))} className="w-full rounded-xl border border-white/10 bg-[#0A0E17] px-4 py-3 text-white focus:border-red-500/50 focus:outline-none">
                        <option value="pizza">pizza</option>
                        <option value="sides">sides</option>
                        <option value="drinks">drinks</option>
                        <option value="desserts">desserts</option>
                      </select>
                    </label>
                    <label className="space-y-2 text-sm text-white/70 md:col-span-2">
                      <span>Description</span>
                      <textarea value={newItem.description} onChange={(event) => setNewItem((current) => ({ ...current, description: event.target.value }))} rows={2} className="w-full rounded-2xl border border-white/10 bg-[#0A0E17] px-4 py-3 text-white focus:border-red-500/50 focus:outline-none" />
                    </label>
                    <label className="space-y-2 text-sm text-white/70">
                      <span>Price in cents</span>
                      <input value={newItem.priceCents} onChange={(event) => setNewItem((current) => ({ ...current, priceCents: event.target.value }))} placeholder="1250" className="w-full rounded-xl border border-white/10 bg-[#0A0E17] px-4 py-3 text-white focus:border-red-500/50 focus:outline-none" />
                    </label>
                    <label className="space-y-2 text-sm text-white/70">
                      <span>Tags</span>
                      <input value={newItem.tags} onChange={(event) => setNewItem((current) => ({ ...current, tags: event.target.value }))} placeholder="vegetarian, classic" className="w-full rounded-xl border border-white/10 bg-[#0A0E17] px-4 py-3 text-white focus:border-red-500/50 focus:outline-none" />
                    </label>
                  </div>
                  <label className="mt-4 flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/75">
                    <span>Available now</span>
                    <input type="checkbox" checked={newItem.available} onChange={(event) => setNewItem((current) => ({ ...current, available: event.target.checked }))} />
                  </label>
                  <button type="button" onClick={createMenuItem} disabled={creatingItem} className="mt-5 inline-flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-medium text-red-100 transition-colors hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-60">
                    {creatingItem ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    Menu-item toevoegen
                  </button>
                </div>

                <div className="rounded-3xl border border-white/5 bg-[#111827] p-6">
                  <div className="text-sm font-medium text-white">Bestaande menu-items</div>
                  <div className="mt-1 text-sm text-white/45">Werk huidige items bij zonder de rest van de leverancierspagina erbij te hoeven zien.</div>
                  <div className="mt-6 space-y-3">
                    {activeMenuItems.length === 0 ? (
                      <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-6 text-sm text-white/45">
                        Nog geen menu-items. Voeg er handmatig één toe of importeer een CSV om deze leverancier bestelbaar te maken.
                      </div>
                    ) : (
                      activeMenuItems.map((item) => {
                        const draft = menuDrafts[item.id]
                        if (!draft) {
                          return null
                        }

                        return (
                          <div key={item.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                            <div className="mb-3 flex items-center justify-between gap-3">
                              <div className="text-sm font-medium text-white">{item.name}</div>
                              <div className="text-xs text-white/45">{item.category}</div>
                            </div>
                            <div className="grid gap-3 md:grid-cols-2">
                              <input value={draft.name} onChange={(event) => setMenuDrafts((current) => ({ ...current, [item.id]: { ...draft, name: event.target.value } }))} className="rounded-xl border border-white/10 bg-[#0A0E17] px-4 py-3 text-sm text-white focus:border-red-500/50 focus:outline-none" />
                              <input value={draft.priceCents} onChange={(event) => setMenuDrafts((current) => ({ ...current, [item.id]: { ...draft, priceCents: event.target.value } }))} className="rounded-xl border border-white/10 bg-[#0A0E17] px-4 py-3 text-sm text-white focus:border-red-500/50 focus:outline-none" />
                              <textarea value={draft.description} onChange={(event) => setMenuDrafts((current) => ({ ...current, [item.id]: { ...draft, description: event.target.value } }))} rows={2} className="rounded-2xl border border-white/10 bg-[#0A0E17] px-4 py-3 text-sm text-white focus:border-red-500/50 focus:outline-none md:col-span-2" />
                            </div>
                            <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                              <label className="flex items-center gap-2 text-sm text-white/70">
                                <input type="checkbox" checked={draft.available} onChange={(event) => setMenuDrafts((current) => ({ ...current, [item.id]: { ...draft, available: event.target.checked } }))} />
                                Beschikbaar · {toEuroDisplay(item.priceCents)} huidig
                              </label>
                              <button type="button" onClick={() => saveMenuItem(item.id)} disabled={activeMenuItemId === item.id} className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white/80 transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60">
                                {activeMenuItemId === item.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                Item opslaan
                              </button>
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="rounded-3xl border border-white/5 bg-[#111827] p-6">
                  <div className="text-sm font-medium text-white">Menu samenvatting</div>
                  <div className="mt-4 grid gap-3">
                    <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/70">
                      Beschikbaar: <span className="font-medium text-white">{dashboard?.availableMenuItems || 0}</span>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/70">
                      Totaal items: <span className="font-medium text-white">{dashboard?.totalMenuItems || 0}</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-3xl border border-white/5 bg-[#111827] p-6">
                  <div className="text-sm font-medium text-white">CSV import</div>
                  <div className="mt-1 text-xs text-white/45">
                    Verwachte kolommen: `name,category,description,price,available,tags`
                  </div>
                  <textarea value={csvText} onChange={(event) => setCsvText(event.target.value)} rows={8} className="mt-3 w-full rounded-2xl border border-white/10 bg-[#0A0E17] px-4 py-3 text-sm text-white focus:border-red-500/50 focus:outline-none" />
                  <button type="button" onClick={importCsvMenu} disabled={importingCsv} className="mt-4 inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white/80 transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60">
                    {importingCsv ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    CSV importeren
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {!loading && providerResponse && activeTab === 'orders' ? (
          <div className="space-y-6">
            <div className="grid gap-6 xl:grid-cols-[minmax(300px,0.9fr)_minmax(0,1.1fr)]">
              <div className="space-y-6">
                <div className="rounded-3xl border border-white/5 bg-[#111827] p-6">
                  <div className="flex items-center gap-3">
                    <ShoppingBag className="h-5 w-5 text-green-300" />
                    <div>
                      <h2 className="text-lg font-semibold text-white">Binnenkomende orders</h2>
                      <p className="mt-1 text-sm text-white/45">Selecteer een bestelling links en werk de status rechts bij.</p>
                    </div>
                  </div>
                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/70">
                      Binnengekomen: <span className="font-medium text-white">{dashboard?.incomingOrders || 0}</span>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/70">
                      Wachten op actie: <span className="font-medium text-white">{dashboard?.awaitingAction || 0}</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-3xl border border-white/5 bg-[#111827] p-6">
                  <div className="space-y-3">
                    {orders.length === 0 ? (
                      <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-6 text-sm text-white/45">
                        Nog geen directe bestellingen. Zet de leverancier live en plaats een demo-bestelling om deze queue te vullen.
                      </div>
                    ) : (
                      orders.map((order) => (
                        <button
                          key={order.id}
                          type="button"
                          onClick={() => setSelectedOrderId(order.id)}
                          className={`w-full rounded-2xl border p-4 text-left transition-colors ${
                            selectedOrder?.id === order.id
                              ? 'border-green-500/30 bg-green-500/10'
                              : 'border-white/10 bg-white/5 hover:bg-white/10'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="text-sm font-medium text-white">{order.customerName}</div>
                              <div className="mt-1 text-xs text-white/45">
                                {order.customerPostcode} · {toFulfilmentLabel(order.fulfilmentMode)} · {toEuroDisplay(order.totalCents)}
                              </div>
                            </div>
                            <div className="rounded-full border border-white/10 bg-[#0A0E17] px-3 py-1 text-xs text-white/70">
                              {toOrderStatusLabel(order.status)}
                            </div>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                {selectedOrder ? (
                  <div className="rounded-3xl border border-white/5 bg-[#111827] p-6">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <h2 className="text-lg font-semibold text-white">{selectedOrder.customerName}</h2>
                        <p className="mt-1 text-sm text-white/45">
                          {selectedOrder.customerPostcode} · {toFulfilmentLabel(selectedOrder.fulfilmentMode)} · {toEuroDisplay(selectedOrder.totalCents)}
                        </p>
                      </div>
                      <div className="rounded-full border border-white/10 bg-[#0A0E17] px-3 py-1 text-xs text-white/70">
                        {toOrderStatusLabel(selectedOrder.status)}
                      </div>
                    </div>

                    <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4">
                      <div className="text-sm font-medium text-white">Besteldetails</div>
                      <div className="mt-3 space-y-2 text-sm text-white/70">
                        {selectedOrder.items.map((item) => (
                          <div key={`${selectedOrder.id}-${item.menuItemId}`} className="flex items-center justify-between gap-3">
                            <span>{item.quantity} × {item.name}</span>
                            <span>{toEuroDisplay(item.lineTotalCents)}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="mt-4 grid gap-4 md:grid-cols-2">
                      <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/65">
                        <div className="font-medium text-white">Contact</div>
                        <div className="mt-2">{selectedOrder.customerPhone}</div>
                        <div className="mt-1">{selectedOrder.customerAddressLine}</div>
                        {selectedOrder.customerNotes ? <div className="mt-2 text-white/45">{selectedOrder.customerNotes}</div> : null}
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/65">
                        <div className="font-medium text-white">Betaling</div>
                        <div className="mt-2">{selectedOrder.payment.displayLabel}</div>
                      </div>
                    </div>

                    <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4">
                      <div className="text-sm font-medium text-white">Statusactie</div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {nextOrderActions(selectedOrder.status).map((nextStatus) => (
                          <button key={`${selectedOrder.id}-${nextStatus}`} type="button" onClick={() => updateOrderStatus(selectedOrder.id, nextStatus)} disabled={activeOrderId === selectedOrder.id} className="rounded-xl border border-white/10 bg-[#0A0E17] px-3 py-2 text-xs text-white/80 transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60">
                            {activeOrderId === selectedOrder.id ? 'Opslaan…' : toOrderStatusLabel(nextStatus)}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4">
                      <div className="text-sm font-medium text-white">Statusverloop</div>
                      <div className="mt-3 space-y-2 text-sm text-white/65">
                        {selectedOrder.statusTimeline.map((event, index) => (
                          <div key={`${selectedOrder.id}-${event.status}-${event.at}-${index}`} className="rounded-2xl border border-white/10 bg-[#0A0E17] px-4 py-3">
                            <div className="font-medium text-white">{toOrderStatusLabel(event.status)}</div>
                            <div className="mt-1 text-xs text-white/45">{new Date(event.at).toLocaleString()}</div>
                            {event.note ? <div className="mt-2 text-xs text-white/55">{event.note}</div> : null}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-3xl border border-white/5 bg-[#111827] p-6 text-sm text-white/60">
                    Selecteer een bestelling om de details te bekijken.
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}
