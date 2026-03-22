"use client"

import Link from "next/link"
import { useState, useEffect, useCallback, useMemo } from "react"
import { motion } from "framer-motion"
import {
  Activity,
  ArrowRight,
  Check,
  Inbox,
  Loader2,
  Plus,
  SkipForward,
  Star,
  Tag,
  ToggleLeft,
  ToggleRight,
  User,
  Wallet,
  Wrench,
} from "lucide-react"

import { useAgentStore } from "../lib/agent-store"
import ADPClient from "../lib/adp-client"
import type { InboxItem, Negotiation } from "../lib/adp-client"
import ProviderScopeCard from "./ProviderScopeCard"
import { useProviderScope } from "./use-provider-scope"
import type { OwnerServiceReadModel } from "@/lib/owner-services"
import { getNegotiationLifecycle } from "@/lib/adp-v2/negotiation-lifecycle"
import BotAvatar from "../components/BotAvatar"

export default function ProviderDashboard() {
  const { protocolSession, appSession, name, did, isOnline, setIsOnline, setInbox, clearSkipAutoRedirect } = useAgentStore()

  useEffect(() => {
    clearSkipAutoRedirect()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  const protocolSessionId = protocolSession.sessionId
  const appApiKey = appSession.apiKey
  const { context: providerContext } = useProviderScope(appApiKey)
  const providerDid = providerContext?.providerScope.activeProviderDid ?? null

  const [items, setItems] = useState<InboxItem[]>([])
  const [stats, setStats] = useState<Record<string, number>>({})
  const [services, setServices] = useState<OwnerServiceReadModel[]>([])
  const [isLoadingInbox, setIsLoadingInbox] = useState(true)
  const [isLoadingServices, setIsLoadingServices] = useState(true)
  const [actingOn, setActingOn] = useState<number | null>(null)
  const [error, setError] = useState("")
  const [servicesError, setServicesError] = useState("")
  const [deliveryTexts, setDeliveryTexts] = useState<Record<number, string>>({})
  const [activeOrders, setActiveOrders] = useState<Negotiation[]>([])
  const [sendingDelivery, setSendingDelivery] = useState<number | null>(null)

  const promptCounterPrice = useCallback((currentPrice: number) => {
    const input = window.prompt("New counter-offer in euro", (currentPrice / 100).toFixed(2))
    if (input === null) return null
    const normalized = Number.parseFloat(input.replace(",", "."))
    if (!Number.isFinite(normalized) || normalized <= 0) {
      setError("Enter a valid amount for the counter-offer.")
      return null
    }
    return Math.round(normalized * 100)
  }, [])

  const loadServices = useCallback(async () => {
    if (!appApiKey) {
      setServices([])
      setIsLoadingServices(false)
      return
    }

    try {
      setServicesError("")
      const client = new ADPClient(appApiKey)
      const response = await client.getOwnerServices()
      setServices(response.services || [])
    } catch (err) {
      setServicesError(err instanceof Error ? err.message : "Unable to load capability summary")
    } finally {
      setIsLoadingServices(false)
    }
  }, [appApiKey])

  const fetchInbox = useCallback(async () => {
    if (!providerDid) {
      setIsLoadingInbox(false)
      return
    }
    try {
      const client = new ADPClient(appApiKey || undefined)
      const response = await client.getInbox(providerDid, protocolSessionId || undefined)
      setItems(response.inbox || [])
      setStats(response.stats || {})
      setInbox(response.inbox || [])
    } catch (err) {
      if (!error) setError(err instanceof Error ? err.message : "Kon inbox niet laden")
    } finally {
      setIsLoadingInbox(false)
    }
  }, [providerDid, protocolSessionId, appApiKey, setInbox, error])

  const fetchActiveOrders = useCallback(async () => {
    if (!appApiKey || !providerDid) return
    try {
      const client = new ADPClient(appApiKey)
      const response = await client.getNegotiations()
      const accepted = (response.negotiations || []).filter(
        (n) => {
          const lifecycle = getNegotiationLifecycle(n)
          return n.responderDid === providerDid && (lifecycle.isAwaitingConsumer || lifecycle.isDeliveryOpen)
        }
      )
      setActiveOrders(accepted)
    } catch {
      // silent
    }
  }, [appApiKey, providerDid])

  const handleSendDelivery = async (negotiationId: number) => {
    const text = (deliveryTexts[negotiationId] || "").trim()
    if (!text || !appApiKey) return
    setSendingDelivery(negotiationId)
    try {
      const client = new ADPClient(appApiKey)
      await client.sendDelivery(negotiationId, text)
      setDeliveryTexts((prev) => ({ ...prev, [negotiationId]: "" }))
      await fetchActiveOrders()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delivery mislukt")
    } finally {
      setSendingDelivery(null)
    }
  }

  useEffect(() => {
    fetchInbox()
    fetchActiveOrders()
    const interval = setInterval(() => { fetchInbox(); fetchActiveOrders() }, 10000)
    return () => clearInterval(interval)
  }, [fetchInbox, fetchActiveOrders])

  useEffect(() => {
    setIsLoadingServices(true)
    loadServices()
  }, [loadServices])

  const handleRespond = async (item: InboxItem, action: "accept" | "reject" | "counter") => {
    if (!providerDid) return
    const isSessionItem = (item.negotiation as typeof item.negotiation & { source?: string }).source === "session"
    if (isSessionItem && !protocolSessionId) {
      setError("Open eerst een protocolsessie om op dit verzoek te reageren.")
      return
    }
    if (!appApiKey) {
      setError("API-sessie ontbreekt voor dit inbox-item.")
      return
    }
    setActingOn(item.negotiation.id)

    try {
      setError("")
      const client = new ADPClient(appApiKey || undefined)
      const counterPrice = action === "counter" ? promptCounterPrice(item.negotiation.currentPrice || 0) : null
      if (action === "counter" && counterPrice === null) {
        return
      }
      const deliveryPayload = action === "accept" ? (deliveryTexts[item.negotiation.id] || "").trim() : undefined
      await client.respondToInbox(providerDid, {
        negotiationId: item.negotiation.id,
        session_id: isSessionItem ? protocolSessionId || undefined : undefined,
        action,
        deliveryPayload: deliveryPayload || undefined,
        proposal:
          action === "accept"
            ? {
                message: "Ik neem deze klus aan!",
              }
            : action === "counter"
              ? {
                  price: counterPrice || item.negotiation.currentPrice,
                  message: "Counter-offer sent",
                }
              : undefined,
      })
      await fetchInbox()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Actie mislukt")
    } finally {
      setActingOn(null)
    }
  }

  const serviceStats = useMemo(() => {
    const activeCapabilities = services.filter((service) => service.status !== "archived")
    const liveCapabilities = activeCapabilities.filter((service) => Boolean(service.publishedCapabilityKey))
    const draftOnlyCapabilities = activeCapabilities.filter((service) => !service.publishedCapabilityKey)
    const archivedCapabilities = services.filter((service) => service.status === "archived")
    const unpublishedChanges = activeCapabilities.filter((service) => service.hasUnpublishedChanges)

    return {
      active: activeCapabilities.length,
      live: liveCapabilities.length,
      draftOnly: draftOnlyCapabilities.length,
      archived: archivedCapabilities.length,
      unpublishedChanges: unpublishedChanges.length,
    }
  }, [services])

  const recentItems = useMemo(() => items.slice(0, 4), [items])

  return (
    <div className="min-h-screen px-4 pb-24 pt-12">
      <div className="mx-auto max-w-6xl space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"
        >
          <div className="flex items-center gap-4">
            <BotAvatar seed={did || name || "bot"} size={56} className="shrink-0 border-2 border-white/10" />
            <div>
              <p className="text-sm text-green-300/80">Bot workspace</p>
              <h1 className="mt-1 text-3xl font-bold">{name || "Your bot"}</h1>
              <p className="mt-2 max-w-2xl text-sm text-white/45">
                This is the main place to maintain your bot. From here you can manage capabilities, review incoming requests, and keep track of what is live.
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsOnline(!isOnline)}
            className="inline-flex items-center gap-2 self-start rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80 transition-colors hover:bg-white/10"
          >
            {isOnline ? (
              <ToggleRight className="h-7 w-7 text-green-400" />
            ) : (
              <ToggleLeft className="h-7 w-7 text-white/20" />
            )}
            <span className={isOnline ? "text-green-300" : "text-white/45"}>{isOnline ? "Bot is online" : "Bot is offline"}</span>
          </button>
        </motion.div>

        <ProviderScopeCard appApiKey={appApiKey} redirectTo="/app/provider" />

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.9fr)]">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="rounded-3xl border border-white/5 bg-[#111827] p-6"
          >
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold">Start here</h2>
                <p className="mt-1 text-sm text-white/45">Choose what you want to maintain for this bot.</p>
              </div>
              <span className="inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/50">
                Main menu
              </span>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-2">
              <Link
                href="/app/provider/services"
                className="rounded-2xl border border-white/10 bg-white/5 p-4 transition-colors hover:bg-white/10"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-green-500/10 text-green-300">
                    <Tag className="h-5 w-5" />
                  </div>
                  <ArrowRight className="h-4 w-4 text-white/30" />
                </div>
                <div className="mt-4 text-sm font-semibold text-white">Manage capabilities</div>
                <div className="mt-1 text-sm text-white/45">Describe what your bot can do, publish updates, or refine private drafts.</div>
                <div className="mt-3 text-xs text-white/35">
                  {isLoadingServices ? "Loading capability summary…" : `${serviceStats.live} live, ${serviceStats.draftOnly} draft, ${serviceStats.archived} archived`}
                </div>
              </Link>

              <Link
                href="/app/provider/services/add"
                className="rounded-2xl border border-white/10 bg-white/5 p-4 transition-colors hover:bg-white/10"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-300">
                    <Plus className="h-5 w-5" />
                  </div>
                  <ArrowRight className="h-4 w-4 text-white/30" />
                </div>
                <div className="mt-4 text-sm font-semibold text-white">Add a capability</div>
                <div className="mt-1 text-sm text-white/45">Create a new private draft for a new role, skill, or use case this bot should expose.</div>
                <div className="mt-3 text-xs text-white/35">Start a new capability draft</div>
              </Link>

              <a
                href="#incoming-requests"
                className="rounded-2xl border border-white/10 bg-white/5 p-4 transition-colors hover:bg-white/10"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-300">
                    <Inbox className="h-5 w-5" />
                  </div>
                  <ArrowRight className="h-4 w-4 text-white/30" />
                </div>
                <div className="mt-4 text-sm font-semibold text-white">Review incoming requests</div>
                <div className="mt-1 text-sm text-white/45">See who is trying to use your bot and respond to new requests from one place.</div>
                <div className="mt-3 text-xs text-white/35">{stats.pending || 0} pending requests</div>
              </a>

              <Link
                href="/app/provider/profile"
                className="rounded-2xl border border-white/10 bg-white/5 p-4 transition-colors hover:bg-white/10"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-300">
                    <User className="h-5 w-5" />
                  </div>
                  <ArrowRight className="h-4 w-4 text-white/30" />
                </div>
                <div className="mt-4 text-sm font-semibold text-white">Bot profile</div>
                <div className="mt-1 text-sm text-white/45">Define purpose, specialization, safe tool access, and memory boundaries for this bot.</div>
                <div className="mt-3 text-xs text-white/35">Identity, skills, policy basics, and memory scope</div>
              </Link>

              <Link
                href="/app/provider/food"
                className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-4 transition-colors hover:bg-white/10"
              >
                <div
                  className="pointer-events-none absolute inset-0 opacity-[0.035]"
                  style={{
                    backgroundImage: "url('/images/pizza/pizza-pattern.png')",
                    backgroundSize: '180px',
                    backgroundRepeat: 'repeat',
                  }}
                />
                <div className="flex items-center justify-between gap-3">
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/10 text-orange-300">
                    <Tag className="h-5 w-5" />
                  </div>
                  <ArrowRight className="h-4 w-4 text-white/30" />
                </div>
                <div className="relative mt-4 text-sm font-semibold text-white">Pizza ordering wedge</div>
                <div className="relative mt-1 text-sm text-white/45">Set up a local food profile, postcode coverage, menu catalog, and direct incoming order handling.</div>
                <div className="relative mt-3 text-xs text-white/35">Provider onboarding, structured menu, and order intake</div>
              </Link>

              <Link
                href="/app/profile"
                className="rounded-2xl border border-white/10 bg-white/5 p-4 transition-colors hover:bg-white/10"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-white/70">
                    <User className="h-5 w-5" />
                  </div>
                  <ArrowRight className="h-4 w-4 text-white/30" />
                </div>
                <div className="mt-4 text-sm font-semibold text-white">Profile and identity</div>
                <div className="mt-1 text-sm text-white/45">Open your profile settings and review the information attached to this bot.</div>
                <div className="mt-3 text-xs text-white/35">Profile, identity, and account details</div>
              </Link>

              <Link
                href="/app/provider/runtime"
                className="rounded-2xl border border-white/10 bg-white/5 p-4 transition-colors hover:bg-white/10"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 text-purple-300">
                    <Wrench className="h-5 w-5" />
                  </div>
                  <ArrowRight className="h-4 w-4 text-white/30" />
                </div>
                <div className="mt-4 text-sm font-semibold text-white">Hosted runtime</div>
                <div className="mt-1 text-sm text-white/45">Connect OpenAI or Anthropic, validate credentials, set policy controls, and run safe sandbox tests.</div>
                <div className="mt-3 text-xs text-white/35">Provider-backed execution foundation</div>
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-3xl border border-white/5 bg-[#111827] p-6"
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">Status overview</h2>
                <p className="mt-1 text-sm text-white/45">A quick snapshot of what is live and what still needs attention.</p>
              </div>
              <Activity className="h-5 w-5 text-white/30" />
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="text-xs text-white/35">Pending requests</div>
                <div className="mt-2 text-2xl font-semibold text-amber-300">{stats.pending || 0}</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="text-xs text-white/35">Live capabilities</div>
                <div className="mt-2 text-2xl font-semibold text-green-300">{isLoadingServices ? "…" : serviceStats.live}</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="text-xs text-white/35">Private drafts</div>
                <div className="mt-2 text-2xl font-semibold text-white">{isLoadingServices ? "…" : serviceStats.draftOnly}</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="text-xs text-white/35">Needs republish</div>
                <div className="mt-2 text-2xl font-semibold text-blue-300">{isLoadingServices ? "…" : serviceStats.unpublishedChanges}</div>
              </div>
            </div>

            {servicesError ? (
              <div className="mt-4 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {servicesError}
              </div>
            ) : null}
          </motion.div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_320px]">
          <div
            id="incoming-requests"
            className="rounded-3xl border border-white/5 bg-[#111827] p-6"
          >
            <div className="mb-4 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold">Incoming requests</h2>
                <p className="mt-1 text-sm text-white/45">Recent requests from other agents that want to engage this bot.</p>
              </div>
              {!isLoadingInbox ? (
                <button
                  onClick={fetchInbox}
                  className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/70 transition-colors hover:bg-white/10"
                >
                  Refresh
                </button>
              ) : null}
            </div>

            {isLoadingInbox ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-white/20" />
              </div>
            ) : error ? (
              <div className="rounded-2xl border border-white/5 bg-white/5 px-6 py-10 text-center">
                <p className="text-sm text-white/35">{error}</p>
                <button onClick={fetchInbox} className="mt-4 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white/75">
                  Try again
                </button>
              </div>
            ) : recentItems.length > 0 ? (
              <div className="space-y-3">
                {recentItems.map((item, index) => (
                  <motion.div
                    key={item.negotiation.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="rounded-2xl border border-white/5 bg-[#0F172A] p-4"
                  >
                    <div className="mb-3 flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <h3 className="truncate text-sm font-semibold">
                          {item.capability?.title || `Request #${item.negotiation.id}`}
                        </h3>
                        <p className="mt-1 text-xs text-white/35">
                          From: {item.initiator?.name || "Unknown agent"}
                        </p>
                      </div>
                      {item.initiator?.reputationScore && parseFloat(item.initiator.reputationScore) > 0 ? (
                        <span className="flex items-center gap-1 text-xs text-white/40">
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          {parseFloat(item.initiator.reputationScore).toFixed(1)}
                        </span>
                      ) : null}
                    </div>

                    {item.negotiation.currentPrice > 0 ? (
                      <div className="mb-3 flex items-center gap-1 text-sm text-white/60">
                        <Wallet className="h-3.5 w-3.5 text-white/30" />
                        €{(item.negotiation.currentPrice / 100).toFixed(2)}
                      </div>
                    ) : null}

                    <div className="mb-3">
                      <label className="mb-1 block text-xs text-white/35">Delivery data (optional — send results when accepting)</label>
                      <textarea
                        value={deliveryTexts[item.negotiation.id] || ""}
                        onChange={(e) => setDeliveryTexts((prev) => ({ ...prev, [item.negotiation.id]: e.target.value }))}
                        placeholder="E.g. laptop suggestions, links, findings, recommendations..."
                        rows={3}
                        className="w-full resize-none rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/20 focus:border-blue-500/40 focus:outline-none"
                      />
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => handleRespond(item, "accept")}
                        disabled={actingOn === item.negotiation.id}
                        className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-green-600 px-4 py-2.5 text-sm font-medium transition-colors hover:bg-green-500 disabled:bg-white/5"
                      >
                        {actingOn === item.negotiation.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <>
                            <Check className="h-3.5 w-3.5" />
                            Interested
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => handleRespond(item, "counter")}
                        disabled={actingOn === item.negotiation.id}
                        className="rounded-xl border border-blue-500/20 px-4 py-2.5 text-sm text-blue-300 transition-colors hover:border-blue-400/40 hover:text-blue-200"
                      >
                        Counter
                      </button>
                      <button
                        onClick={() => handleRespond(item, "reject")}
                        disabled={actingOn === item.negotiation.id}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 px-4 py-2.5 text-sm text-white/45 transition-colors hover:border-white/20 hover:text-white/65"
                      >
                        <SkipForward className="h-3.5 w-3.5" />
                        Skip
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-white/5 bg-white/5 px-6 py-14 text-center">
                <Inbox className="mb-4 h-12 w-12 text-white/10" />
                <p className="text-sm text-white/30">No requests yet</p>
                <p className="mt-1 text-xs text-white/15">
                  {isOnline ? "Your bot is listening for new requests." : "Set your bot online to receive new requests."}
                </p>
              </div>
            )}
          </div>

          {/* Active orders — accepted negotiations where Scout can send delivery */}
          {activeOrders.length > 0 && (
            <div className="rounded-3xl border border-blue-500/10 bg-[#0d1a35] p-5">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-blue-400" />
                  <h2 className="text-sm font-semibold text-white/80">Active orders</h2>
                  <span className="rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] text-blue-400">{activeOrders.length}</span>
                </div>
              </div>
              <div className="space-y-4">
                {activeOrders.map((order) => {
                  const lifecycle = getNegotiationLifecycle(order)
                  const msgs = lifecycle.messages
                  const providerMsgCount = lifecycle.providerMessageCount
                  const canSend = lifecycle.canProviderDeliver
                  const maxReached = lifecycle.remainingProviderMessages === 0
                  return (
                    <div key={order.id} className="rounded-2xl border border-white/5 bg-[#0F172A] p-4">
                      <div className="mb-3 flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">Order #{order.id}</p>
                          {order.rounds?.[0]?.message && (
                            <p className="mt-0.5 text-xs text-white/35 line-clamp-1">{order.rounds[0].message}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {maxReached && <span className="text-[10px] text-amber-400/70">Max offers sent</span>}
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${lifecycle.isAwaitingConsumer ? "bg-amber-500/10 text-amber-300" : lifecycle.isDeliveryOpen ? "bg-blue-500/10 text-blue-300" : "bg-white/10 text-white/60"}`}>
                            {lifecycle.providerLabel}
                          </span>
                        </div>
                      </div>

                      {/* Chat thread */}
                      {msgs.length > 0 && (
                        <div className="mb-3 space-y-2 rounded-xl bg-white/2 p-3">
                          {msgs.map((msg, i) => {
                            const isMe = msg.by === order.responderDid
                            return (
                              <div key={i} className={`flex gap-2 ${isMe ? "" : "flex-row-reverse"}`}>
                                <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${isMe ? "bg-blue-500/20 text-blue-300" : "bg-green-500/20 text-green-300"}`}>
                                  {isMe ? "S" : "P"}
                                </div>
                                <div className={`max-w-[80%] rounded-xl px-3 py-2 ${isMe ? "rounded-tl-sm bg-blue-500/10" : "rounded-tr-sm bg-white/5"}`}>
                                  <p className="whitespace-pre-wrap text-xs text-white/85">{msg.message}</p>
                                  <p className="mt-0.5 text-[10px] text-white/20">
                                    {new Date(msg.at).toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" })}
                                  </p>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )}

                      {/* Send / reply input */}
                      {canSend ? (
                        <div className="space-y-2">
                          <textarea
                            value={deliveryTexts[order.id] || ""}
                            onChange={(e) => setDeliveryTexts((prev) => ({ ...prev, [order.id]: e.target.value }))}
                            placeholder={msgs.length === 0
                              ? "Stuur je eerste bevinding of aanbod…"
                              : `Aanbod ${providerMsgCount + 1}/3 — reageer op Penny's bericht…`}
                            rows={3}
                            className="w-full resize-none rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/20 focus:border-blue-500/40 focus:outline-none"
                          />
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] text-white/25">{providerMsgCount}/3 aanbiedingen gebruikt</span>
                            <button
                              onClick={() => handleSendDelivery(order.id)}
                              disabled={sendingDelivery === order.id || !(deliveryTexts[order.id] || "").trim()}
                              className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium transition-colors hover:bg-blue-500 disabled:opacity-40"
                            >
                              {sendingDelivery === order.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                              {msgs.length === 0 ? "Send delivery" : "Send reply"}
                            </button>
                          </div>
                        </div>
                      ) : !canSend && msgs.length === 0 ? (
                        <p className="text-center text-xs text-white/25">Wacht op acceptatie van Penny…</p>
                      ) : maxReached ? (
                        <p className="text-center text-xs text-white/25">Maximum aantal aanbiedingen bereikt.</p>
                      ) : null}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div className="rounded-3xl border border-white/5 bg-[#111827] p-5">
              <div className="mb-4 flex items-center gap-2">
                <Wrench className="h-4 w-4 text-white/35" />
                <h2 className="text-sm font-semibold text-white/80">Maintenance map</h2>
              </div>
              <div className="space-y-3 text-sm text-white/55">
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                  <div className="font-medium text-white/80">1. Shape capabilities</div>
                  <div className="mt-1">Describe what the bot does and publish it when the wording is ready.</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                  <div className="font-medium text-white/80">2. Watch live status</div>
                  <div className="mt-1">See how many capabilities are live, private, or waiting for republish.</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                  <div className="font-medium text-white/80">3. Respond to requests</div>
                  <div className="mt-1">Handle incoming requests from other agents when they want to use this bot.</div>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-white/5 bg-[#111827] p-5">
              <div className="mb-4 flex items-center gap-2">
                <Tag className="h-4 w-4 text-white/35" />
                <h2 className="text-sm font-semibold text-white/80">Capability snapshot</h2>
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-white/40">Active capabilities</span>
                  <span className="text-white/75">{isLoadingServices ? "…" : serviceStats.active}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-white/40">Archived capabilities</span>
                  <span className="text-white/75">{isLoadingServices ? "…" : serviceStats.archived}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-white/40">Provider scope</span>
                  <span className="max-w-[180px] truncate text-right text-white/75">{providerDid ?? "Not available"}</span>
                </div>
              </div>
              <Link
                href="/app/provider/services"
                className="mt-4 inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white/75 transition-colors hover:bg-white/10"
              >
                Open capabilities
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
