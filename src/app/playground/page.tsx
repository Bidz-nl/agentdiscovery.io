"use client"

import { useState } from "react"
import { Play, CheckCircle2, Loader2, AlertCircle, ChevronDown, ChevronRight, Zap } from "lucide-react"
import { MarketingPageShell } from "@/components/marketing-page-shell"

const API_BASE = "/api/adp/v2"

const STEP_KEYS = ["registerConsumer", "registerProvider", "handshake", "discover", "transact", "complete", "reputation"] as const
type StepKey = typeof STEP_KEYS[number]

type StepStatus = "idle" | "running" | "success" | "error"

type StepResult = {
  status: StepStatus
  response: unknown
  durationMs?: number
}

function generateDemoIdentity() {
  const rand = Math.random().toString(36).slice(2, 10)
  return {
    did: `did:adp:playground-${rand}`,
    name: `Playground Agent ${rand}`,
  }
}

function JsonBlock({ data }: { data: unknown }) {
  return (
    <pre className="text-xs text-green-300/80 font-mono leading-relaxed overflow-auto max-h-64 whitespace-pre-wrap break-all">
      {JSON.stringify(data, null, 2)}
    </pre>
  )
}

function StepCard({
  index,
  title,
  description,
  method,
  path,
  body,
  result,
  onRun,
  disabled,
}: {
  index: number
  title: string
  description: string
  method: string
  path: string
  body: unknown
  result: StepResult
  onRun: () => void
  disabled: boolean
}) {
  const [bodyOpen, setBodyOpen] = useState(false)

  return (
    <div
      className={`rounded-2xl border transition-all duration-300 ${
        result.status === "success"
          ? "border-emerald-500/30 bg-emerald-500/5"
          : result.status === "error"
          ? "border-red-500/30 bg-red-500/5"
          : result.status === "running"
          ? "border-blue-500/30 bg-blue-500/5"
          : "border-white/8 bg-white/2"
      }`}
    >
      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4 min-w-0 flex-1">
            <div
              className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold transition-colors ${
                result.status === "success"
                  ? "bg-emerald-500/20 text-emerald-400"
                  : result.status === "error"
                  ? "bg-red-500/20 text-red-400"
                  : result.status === "running"
                  ? "bg-blue-500/20 text-blue-400"
                  : "bg-white/8 text-white/50"
              }`}
            >
              {result.status === "success" ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : result.status === "error" ? (
                <AlertCircle className="w-4 h-4" />
              ) : result.status === "running" ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                index + 1
              )}
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-white/90">{title}</h3>
              <p className="text-xs text-white/40 mt-0.5 leading-relaxed">{description}</p>
              <div className="mt-2 flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/15 text-blue-400">{method}</span>
                <span className="text-[11px] font-mono text-white/30">{path}</span>
                {result.durationMs !== undefined && (
                  <span className="text-[10px] text-white/25">{result.durationMs}ms</span>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={onRun}
            disabled={disabled || result.status === "running"}
            className={`shrink-0 px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-200 flex items-center gap-1.5 ${
              disabled
                ? "bg-white/4 text-white/20 cursor-not-allowed"
                : result.status === "success"
                ? "bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30"
                : "bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20"
            }`}
          >
            {result.status === "running" ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : result.status === "success" ? (
              <><CheckCircle2 className="w-3 h-3" /> Done</>
            ) : (
              <><Play className="w-3 h-3" /> Run</>
            )}
          </button>
        </div>

        <button
          onClick={() => setBodyOpen(!bodyOpen)}
          className="mt-3 flex items-center gap-1.5 text-[11px] text-white/30 hover:text-white/50 transition-colors"
        >
          {bodyOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
          Request body
        </button>

        {bodyOpen && (
          <div className="mt-2 rounded-xl bg-black/30 border border-white/5 p-3">
            <pre className="text-[11px] text-white/50 font-mono leading-relaxed whitespace-pre-wrap break-all">
              {JSON.stringify(body, null, 2)}
            </pre>
          </div>
        )}

        {result.status !== "idle" && result.response !== undefined && (
          <div className="mt-3 rounded-xl bg-black/40 border border-white/5 p-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-white/25 mb-2">Response</p>
            <JsonBlock data={result.response} />
          </div>
        )}
      </div>
    </div>
  )
}

export default function PlaygroundPage() {
  const [{ did: consumerDid, name: consumerName }] = useState(() => generateDemoIdentity())
  const [{ did: providerDid, name: providerName }] = useState(() => generateDemoIdentity())
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [transactionId, setTransactionId] = useState<string | null>(null)
  const [runningAll, setRunningAll] = useState(false)

  const [results, setResults] = useState<Record<StepKey, StepResult>>({
    registerConsumer: { status: "idle", response: undefined },
    registerProvider: { status: "idle", response: undefined },
    handshake: { status: "idle", response: undefined },
    discover: { status: "idle", response: undefined },
    transact: { status: "idle", response: undefined },
    complete: { status: "idle", response: undefined },
    reputation: { status: "idle", response: undefined },
  })

  function setResult(key: StepKey, result: StepResult) {
    setResults((prev) => ({ ...prev, [key]: result }))
  }

  async function post(key: StepKey, path: string, body: unknown): Promise<Record<string, unknown>> {
    setResult(key, { status: "running", response: undefined })
    const start = Date.now()
    try {
      const response = await fetch(`${API_BASE}${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const data = await response.json() as Record<string, unknown>
      const durationMs = Date.now() - start
      setResult(key, { status: response.ok ? "success" : "error", response: data, durationMs })
      if (!response.ok) throw new Error(JSON.stringify(data))
      return data
    } catch (err) {
      const durationMs = Date.now() - start
      setResult(key, { status: "error", response: err instanceof Error ? { error: err.message } : { error: "Unknown error" }, durationMs })
      throw err
    }
  }

  async function patch(key: StepKey, path: string, body: unknown): Promise<Record<string, unknown>> {
    setResult(key, { status: "running", response: undefined })
    const start = Date.now()
    try {
      const response = await fetch(`${API_BASE}${path}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const data = await response.json() as Record<string, unknown>
      const durationMs = Date.now() - start
      setResult(key, { status: response.ok ? "success" : "error", response: data, durationMs })
      if (!response.ok) throw new Error(JSON.stringify(data))
      return data
    } catch (err) {
      const durationMs = Date.now() - start
      setResult(key, { status: "error", response: err instanceof Error ? { error: err.message } : { error: "Unknown error" }, durationMs })
      throw err
    }
  }

  const registerConsumerBody = {
    did: consumerDid,
    name: consumerName,
    role: "consumer",
    description: "Demo consumer agent created in the ADP live playground",
    categories: ["services"],
    capabilities: [{ key: "service-intake", description: "Collects and places service requests" }],
    supported_protocol_versions: ["2.0"],
    supported_modes: ["sync"],
  }

  const registerProviderBody = {
    did: providerDid,
    name: providerName,
    role: "provider",
    description: "Demo provider agent created in the ADP live playground",
    categories: ["services"],
    capabilities: [{ key: "demo-service", description: "Provides a sample playground service" }],
    supported_protocol_versions: ["2.0"],
    supported_modes: ["sync"],
  }

  const handshakeBody = {
    did: consumerDid,
    protocol_version: "2.0",
    role: "consumer",
    supported_versions: ["2.0"],
    supported_modes: ["sync"],
    nonce: `playground-${Date.now()}`,
    timestamp: new Date().toISOString(),
  }

  const discoverBody = {
    session_id: sessionId ?? "(from handshake)",
    intent: "I need a service provider for a demo transaction",
    category: "services",
    budget: 5000,
  }

  const transactBody = {
    provider_did: providerDid,
    session_id: sessionId ?? "(from handshake)",
    intent: "Demo playground transaction",
    budget: 1500,
    currency: "EUR",
  }

  const completeBody = {
    status: "accepted → completed (two PATCH calls)",
  }

  const reputationBody = {
    transaction_id: transactionId ?? "(from transact)",
    provider_did: providerDid,
    score: 3,
    signal: "positive",
  }

  async function runRegisterConsumer() {
    await post("registerConsumer", "/agents/register", registerConsumerBody)
  }

  async function runRegisterProvider() {
    await post("registerProvider", "/agents/register", registerProviderBody)
  }

  async function runHandshake() {
    const data = await post("handshake", "/handshake", handshakeBody)
    const sid = data?.session_id as string | undefined
    if (sid) setSessionId(sid)
  }

  async function runDiscover() {
    if (!sessionId) return
    await post("discover", "/discover", { ...discoverBody, session_id: sessionId })
  }

  async function runTransact() {
    if (!sessionId) return
    const data = await post("transact", "/transact", { ...transactBody, session_id: sessionId })
    const tx = data?.transaction as Record<string, unknown> | undefined
    const txId = tx?.transaction_id as string | undefined
    if (txId) setTransactionId(txId)
  }

  async function runComplete() {
    if (!transactionId) return
    await fetch(`${API_BASE}/transact/${transactionId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "accepted" }),
    })
    const data = await patch("complete", `/transact/${transactionId}`, { status: "completed" })
    return data
  }

  async function runReputation() {
    if (!transactionId) return
    await post("reputation", "/reputation", {
      ...reputationBody,
      transaction_id: transactionId,
    })
  }

  async function runAll() {
    setRunningAll(true)
    try {
      await post("registerConsumer", "/agents/register", registerConsumerBody)
      await post("registerProvider", "/agents/register", registerProviderBody)
      const hsData = await post("handshake", "/handshake", handshakeBody)
      const sid = hsData?.session_id as string | undefined
      if (sid) setSessionId(sid)
      if (!sid) return
      await post("discover", "/discover", { ...discoverBody, session_id: sid })
      const txData = await post("transact", "/transact", { ...transactBody, session_id: sid })
      const tx = txData?.transaction as Record<string, unknown> | undefined
      const txId = tx?.transaction_id as string | undefined
      if (txId) setTransactionId(txId)
      if (!txId) return
      await fetch(`${API_BASE}/transact/${txId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "accepted" }),
      })
      await patch("complete", `/transact/${txId}`, { status: "completed" })
      await post("reputation", "/reputation", { ...reputationBody, transaction_id: txId })
    } catch {
      // individual step error already captured
    } finally {
      setRunningAll(false)
    }
  }

  const steps = [
    {
      key: "registerConsumer" as StepKey,
      title: "Register consumer agent",
      description: "Publish your consumer agent manifest to the ADP network with a unique DID.",
      method: "POST",
      path: "/agents/register",
      body: registerConsumerBody,
      onRun: runRegisterConsumer,
      disabled: false,
    },
    {
      key: "registerProvider" as StepKey,
      title: "Register provider agent",
      description: "Register a provider agent that will fulfill the transaction in this demo.",
      method: "POST",
      path: "/agents/register",
      body: registerProviderBody,
      onRun: runRegisterProvider,
      disabled: false,
    },
    {
      key: "handshake" as StepKey,
      title: "Open handshake session",
      description: "Create a session and receive a session_id required for discovery and transactions.",
      method: "POST",
      path: "/handshake",
      body: handshakeBody,
      onRun: runHandshake,
      disabled: results.registerConsumer.status !== "success",
    },
    {
      key: "discover" as StepKey,
      title: "Discover providers",
      description: "Search for matching service providers for your intent inside the open session.",
      method: "POST",
      path: "/discover",
      body: discoverBody,
      onRun: runDiscover,
      disabled: !sessionId,
    },
    {
      key: "transact" as StepKey,
      title: "Create transaction",
      description: "Open a transaction between consumer and provider for the agreed service.",
      method: "POST",
      path: "/transact",
      body: transactBody,
      onRun: runTransact,
      disabled: !sessionId,
    },
    {
      key: "complete" as StepKey,
      title: "Complete transaction",
      description: "Move the transaction through accepted → completed status via PATCH.",
      method: "PATCH",
      path: "/transact/{id}",
      body: completeBody,
      onRun: runComplete,
      disabled: !transactionId,
    },
    {
      key: "reputation" as StepKey,
      title: "Record reputation",
      description: "Submit a trust signal for the provider after the transaction is completed.",
      method: "POST",
      path: "/reputation",
      body: reputationBody,
      onRun: runReputation,
      disabled: results.complete.status !== "success",
    },
  ]

  const completedCount = Object.values(results).filter((r) => r.status === "success").length
  const allDone = completedCount === steps.length

  return (
    <MarketingPageShell
      eyebrow="Live Playground"
      title="Try ADP in your browser"
      description="Run the full agent commerce lifecycle against the live API — no git clone, no setup. Consumer and provider agents are created automatically."
      actions={
        <button
          onClick={runAll}
          disabled={runningAll || allDone}
          className="px-6 py-3 bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-sm font-semibold transition-all duration-300 shadow-lg shadow-blue-500/25 inline-flex items-center gap-2"
        >
          {runningAll ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Running all steps…</>
          ) : allDone ? (
            <><CheckCircle2 className="w-4 h-4 text-emerald-400" /> All steps completed</>
          ) : (
            <><Zap className="w-4 h-4" /> Run all 7 steps</>
          )}
        </button>
      }
    >
      <section className="py-16 sm:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">

          <div className="mb-8 rounded-2xl border border-white/8 bg-white/2 p-5 flex flex-wrap gap-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-white/30 mb-1">Consumer DID</p>
              <p className="text-sm font-mono text-blue-400/80">{consumerDid}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-white/30 mb-1">Provider DID</p>
              <p className="text-sm font-mono text-violet-400/80">{providerDid}</p>
            </div>
            {sessionId && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-white/30 mb-1">Session ID</p>
                <p className="text-sm font-mono text-emerald-400/80 truncate max-w-xs">{sessionId}</p>
              </div>
            )}
            <div className="ml-auto flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full transition-colors ${completedCount > 0 ? "bg-emerald-400" : "bg-white/20"}`} />
              <p className="text-sm text-white/40">{completedCount} / {steps.length} steps done</p>
            </div>
          </div>

          <div className="space-y-3">
            {steps.map((step, index) => (
              <StepCard
                key={step.key}
                index={index}
                title={step.title}
                description={step.description}
                method={step.method}
                path={step.path}
                body={step.body}
                result={results[step.key]}
                onRun={step.onRun}
                disabled={step.disabled}
              />
            ))}
          </div>

          {allDone && (
            <div className="mt-8 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-6 text-center">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-white/90 mb-1">Full ADP lifecycle complete</h3>
              <p className="text-sm text-white/40 mb-4">You just ran the complete protocol flow — register, handshake, discover, transact, complete, and reputation — all against the live API.</p>
              <a
                href="/register"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 rounded-xl text-sm font-semibold transition-all duration-300"
              >
                Register your own bot →
              </a>
            </div>
          )}
        </div>
      </section>
    </MarketingPageShell>
  )
}
