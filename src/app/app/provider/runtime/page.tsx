"use client"

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Bot, CheckCircle2, Loader2, Shield, Wrench } from 'lucide-react'

import ADPClient from '@/app/app/lib/adp-client'
import { useAgentStore } from '@/app/app/lib/agent-store'
import type { AgentRuntimeReadModel } from '@/lib/agent-runtime'

export default function ProviderRuntimePage() {
  const { appSession, name } = useAgentStore()
  const appApiKey = appSession.apiKey

  const [runtime, setRuntime] = useState<AgentRuntimeReadModel | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [connectProvider, setConnectProvider] = useState<'openai' | 'anthropic'>('openai')
  const [credentialLabel, setCredentialLabel] = useState('sandbox runtime')
  const [providerKey, setProviderKey] = useState('')
  const [isConnecting, setIsConnecting] = useState(false)
  const [connectMessage, setConnectMessage] = useState<string | null>(null)
  const [prompt, setPrompt] = useState('Summarize what this bot can currently do in two short sentences.')
  const [useTool, setUseTool] = useState(true)
  const [isRunning, setIsRunning] = useState(false)
  const [sandboxMessage, setSandboxMessage] = useState<string | null>(null)
  const [policyEnabled, setPolicyEnabled] = useState(true)
  const [approvalRequired, setApprovalRequired] = useState(true)
  const [spendCapUsd, setSpendCapUsd] = useState('5')
  const [toolAllowed, setToolAllowed] = useState(true)
  const [isSavingPolicy, setIsSavingPolicy] = useState(false)

  const loadRuntime = useCallback(async () => {
    if (!appApiKey) {
      setLoading(false)
      return
    }

    try {
      setError(null)
      const client = new ADPClient(appApiKey)
      const response = await client.getAgentRuntime()
      setRuntime(response.runtime)
      setPolicyEnabled(response.runtime.policy.enabled)
      setApprovalRequired(response.runtime.policy.approvalRequired)
      setSpendCapUsd(String(response.runtime.policy.spendCapUsd))
      setToolAllowed(response.runtime.policy.allowedTools.includes('list_capabilities'))
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Unable to load hosted runtime settings')
    } finally {
      setLoading(false)
    }
  }, [appApiKey])

  useEffect(() => {
    loadRuntime()
  }, [loadRuntime])

  const recentRuns = runtime?.recentRuns ?? []
  const connectionState = runtime?.providerConnection
  const runtimeState = runtime?.state
  const spendState = runtime?.spend
  const runtimeProfile = runtime?.profile
  const policySummary = useMemo(() => {
    if (!runtime) {
      return 'Loading policy…'
    }

    return `${runtime.policy.enabled ? 'Enabled' : 'Disabled'} · $${runtime.policy.spendCapUsd.toFixed(2)} cap · ${runtime.policy.approvalRequired ? 'approval required' : 'self-serve sandbox'}`
  }, [runtime])

  const handleConnect = async () => {
    if (!appApiKey) {
      setError('Owner app session is required to connect a provider runtime')
      return
    }

    setIsConnecting(true)
    setConnectMessage(null)
    setError(null)

    try {
      const client = new ADPClient(appApiKey)
      const response = await client.connectAgentRuntime({
        provider: connectProvider,
        label: credentialLabel,
        apiKey: providerKey.trim() || undefined,
      })
      setRuntime(response.runtime)
      setConnectMessage(response.validation.message)
      setProviderKey('')
      if (response.runtime) {
        setPolicyEnabled(response.runtime.policy.enabled)
        setApprovalRequired(response.runtime.policy.approvalRequired)
        setSpendCapUsd(String(response.runtime.policy.spendCapUsd))
        setToolAllowed(response.runtime.policy.allowedTools.includes('list_capabilities'))
      }
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Unable to connect runtime provider')
    } finally {
      setIsConnecting(false)
    }
  }

  const handleSavePolicy = async () => {
    if (!appApiKey) {
      setError('Owner app session is required to update policy controls')
      return
    }

    setIsSavingPolicy(true)
    setError(null)

    try {
      const client = new ADPClient(appApiKey)
      const response = await client.updateAgentRuntimePolicy({
        enabled: policyEnabled,
        approvalRequired,
        spendCapUsd: Number.parseFloat(spendCapUsd),
        allowedTools: toolAllowed ? ['list_capabilities'] : [],
      })
      setRuntime(response.runtime)
      setSandboxMessage('Policy saved')
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Unable to update policy controls')
    } finally {
      setIsSavingPolicy(false)
    }
  }

  const handleRunSandbox = async () => {
    if (!appApiKey) {
      setError('Owner app session is required to run a sandbox test')
      return
    }

    setIsRunning(true)
    setSandboxMessage(null)
    setError(null)

    try {
      const client = new ADPClient(appApiKey)
      const response = await client.runAgentSandbox({
        prompt,
        useTool,
      })
      setRuntime(response.runtime)
      setSandboxMessage(response.run.status === 'completed' ? 'Sandbox run completed' : response.run.errorMessage)
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Sandbox run failed')
    } finally {
      setIsRunning(false)
    }
  }

  if (!appApiKey) {
    return (
      <div className="min-h-screen px-4 pb-24 pt-12">
        <div className="mx-auto max-w-4xl space-y-6">
          <Link href="/app/provider" className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/70 transition-colors hover:bg-white/10">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
          <div className="rounded-3xl border border-amber-500/20 bg-amber-500/10 p-6 text-amber-100">
            Restore your owner session with the bot API key before connecting a hosted runtime.
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen px-4 pb-24 pt-12">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Link href="/app/provider" className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/70 transition-colors hover:bg-white/10">
              <ArrowLeft className="h-4 w-4" />
              Back to bot workspace
            </Link>
            <h1 className="mt-4 text-3xl font-bold text-white">Hosted runtime</h1>
            <p className="mt-2 max-w-3xl text-sm text-white/45">
              Connect a model provider, validate the credential, set policy controls, and run a harmless sandbox test for {runtimeProfile?.displayName || name || 'this bot'}.
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/60">
            {policySummary}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center rounded-3xl border border-white/5 bg-[#111827] p-10">
            <Loader2 className="h-6 w-6 animate-spin text-white/30" />
          </div>
        ) : null}

        {error ? (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</div>
        ) : null}

        {connectMessage ? (
          <div className="rounded-2xl border border-green-500/20 bg-green-500/10 px-4 py-3 text-sm text-green-200">{connectMessage}</div>
        ) : null}

        {sandboxMessage ? (
          <div className="rounded-2xl border border-blue-500/20 bg-blue-500/10 px-4 py-3 text-sm text-blue-200">{sandboxMessage}</div>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
          <div className="space-y-6">
            <div className="rounded-3xl border border-white/5 bg-[#111827] p-6">
              <div className="flex items-center gap-3">
                <Bot className="h-5 w-5 text-blue-300" />
                <div>
                  <h2 className="text-lg font-semibold text-white">Connect provider runtime</h2>
                  <p className="mt-1 text-sm text-white/45">Use a platform-managed key or paste your own API key. Stored secrets stay server-side only.</p>
                </div>
              </div>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <label className="space-y-2 text-sm text-white/70">
                  <span>Provider</span>
                  <select value={connectProvider} onChange={(event) => setConnectProvider(event.target.value as 'openai' | 'anthropic')} className="w-full rounded-xl border border-white/10 bg-[#0A0E17] px-4 py-3 text-white focus:border-blue-500/50 focus:outline-none">
                    <option value="openai">OpenAI</option>
                    <option value="anthropic">Anthropic</option>
                  </select>
                </label>
                <label className="space-y-2 text-sm text-white/70">
                  <span>Credential label</span>
                  <input value={credentialLabel} onChange={(event) => setCredentialLabel(event.target.value)} className="w-full rounded-xl border border-white/10 bg-[#0A0E17] px-4 py-3 text-white focus:border-blue-500/50 focus:outline-none" />
                </label>
              </div>
              <label className="mt-4 block space-y-2 text-sm text-white/70">
                <span>Optional bring-your-own API key</span>
                <input type="password" value={providerKey} onChange={(event) => setProviderKey(event.target.value)} placeholder="Leave blank to use the server-hosted credential" className="w-full rounded-xl border border-white/10 bg-[#0A0E17] px-4 py-3 text-white placeholder:text-white/20 focus:border-blue-500/50 focus:outline-none" />
              </label>
              <button type="button" onClick={handleConnect} disabled={isConnecting} className="mt-5 inline-flex items-center gap-2 rounded-xl border border-blue-500/30 bg-blue-500/10 px-4 py-3 text-sm font-medium text-blue-100 transition-colors hover:bg-blue-500/20 disabled:cursor-not-allowed disabled:opacity-60">
                {isConnecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                Connect and validate
              </button>
            </div>

            <div className="rounded-3xl border border-white/5 bg-[#111827] p-6">
              <div className="flex items-center gap-3">
                <Shield className="h-5 w-5 text-green-300" />
                <div>
                  <h2 className="text-lg font-semibold text-white">Policy controls</h2>
                  <p className="mt-1 text-sm text-white/45">Restrict sandbox behavior before enabling more capable hosted actions later.</p>
                </div>
              </div>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <label className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/75">
                  <span>Runtime enabled</span>
                  <input type="checkbox" checked={policyEnabled} onChange={(event) => setPolicyEnabled(event.target.checked)} />
                </label>
                <label className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/75">
                  <span>Approval required</span>
                  <input type="checkbox" checked={approvalRequired} onChange={(event) => setApprovalRequired(event.target.checked)} />
                </label>
                <label className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/75 sm:col-span-2">
                  <span>Allow safe read-only tool: list capabilities</span>
                  <input type="checkbox" checked={toolAllowed} onChange={(event) => setToolAllowed(event.target.checked)} />
                </label>
              </div>
              <label className="mt-4 block space-y-2 text-sm text-white/70">
                <span>Spend cap (USD)</span>
                <input value={spendCapUsd} onChange={(event) => setSpendCapUsd(event.target.value)} className="w-full rounded-xl border border-white/10 bg-[#0A0E17] px-4 py-3 text-white focus:border-green-500/50 focus:outline-none" />
              </label>
              <button type="button" onClick={handleSavePolicy} disabled={isSavingPolicy} className="mt-5 inline-flex items-center gap-2 rounded-xl border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm font-medium text-green-100 transition-colors hover:bg-green-500/20 disabled:cursor-not-allowed disabled:opacity-60">
                {isSavingPolicy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Shield className="h-4 w-4" />}
                Save policy
              </button>
            </div>

            <div className="rounded-3xl border border-white/5 bg-[#111827] p-6">
              <div className="flex items-center gap-3">
                <Wrench className="h-5 w-5 text-amber-300" />
                <div>
                  <h2 className="text-lg font-semibold text-white">Sandbox run</h2>
                  <p className="mt-1 text-sm text-white/45">Run a harmless prompt and optionally include one safe read-only tool response.</p>
                </div>
              </div>
              <label className="mt-5 block space-y-2 text-sm text-white/70">
                <span>Prompt</span>
                <textarea value={prompt} onChange={(event) => setPrompt(event.target.value)} rows={5} className="w-full rounded-2xl border border-white/10 bg-[#0A0E17] px-4 py-3 text-white focus:border-amber-500/50 focus:outline-none" />
              </label>
              <label className="mt-4 flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/75">
                <span>Include safe read-only capability tool</span>
                <input type="checkbox" checked={useTool} onChange={(event) => setUseTool(event.target.checked)} />
              </label>
              <button type="button" onClick={handleRunSandbox} disabled={isRunning} className="mt-5 inline-flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm font-medium text-amber-100 transition-colors hover:bg-amber-500/20 disabled:cursor-not-allowed disabled:opacity-60">
                {isRunning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wrench className="h-4 w-4" />}
                Run sandbox test
              </button>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-3xl border border-white/5 bg-[#111827] p-6">
              <h2 className="text-lg font-semibold text-white">Connection status</h2>
              <div className="mt-4 space-y-3 text-sm text-white/65">
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                  Runtime: <span className="font-medium text-white">{runtime?.agent.runtimeMode || 'manual'}</span>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                  Status: <span className="font-medium text-white">{runtime?.agent.runtimeStatus || 'needs_setup'}</span>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                  Profile: <span className="font-medium text-white">{runtimeProfile?.displayName || runtime?.agent.name || 'unconfigured'}</span>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                  Validation: <span className="font-medium text-white">{connectionState?.validationStatus || 'unvalidated'}</span>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                  Sandbox access: <span className="font-medium text-white">{runtimeState?.canRunSandbox ? 'allowed' : runtimeState?.blockReason || 'blocked'}</span>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                  Provider: <span className="font-medium text-white">{connectionState?.provider || 'not connected'}</span>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                  Credential: <span className="font-medium text-white">{connectionState?.credential?.maskedSecret || 'none'}</span>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                  Last validated: <span className="font-medium text-white">{connectionState?.lastValidatedAt || 'never'}</span>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                  Specialty: <span className="font-medium text-white">{runtimeProfile?.specialties.join(', ') || 'general-purpose'}</span>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-white/5 bg-[#111827] p-6">
              <h2 className="text-lg font-semibold text-white">Spend guard</h2>
              <div className="mt-4 space-y-3 text-sm text-white/65">
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                  Mode: <span className="font-medium text-white">{spendState?.mode || 'token_estimate_scaffold'}</span>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                  Tracked estimated spend: <span className="font-medium text-white">${spendState?.trackedEstimatedCostUsd?.toFixed(6) || '0.000000'}</span>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                  Remaining budget: <span className="font-medium text-white">${spendState?.remainingBudgetUsd?.toFixed(6) || '0.000000'}</span>
                </div>
                <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-xs text-amber-100">
                  {spendState?.note || 'Temporary spend guard scaffold active. Real provider billing reconciliation is not complete yet.'}
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-white/5 bg-[#111827] p-6">
              <h2 className="text-lg font-semibold text-white">Recent sandbox runs</h2>
              <div className="mt-4 space-y-3">
                {recentRuns.length === 0 ? (
                  <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-white/45">No sandbox runs yet.</div>
                ) : recentRuns.map((run) => (
                  <div key={run.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className="font-medium text-white">{run.provider} · {run.model}</span>
                      <span className={run.status === 'completed' ? 'text-green-300' : run.status === 'failed' ? 'text-red-300' : 'text-white/45'}>{run.status}</span>
                    </div>
                    <p className="mt-2 text-xs text-white/45">{run.startedAt}</p>
                    <p className="mt-3 text-sm text-white/70 whitespace-pre-wrap">{run.outputText || run.errorMessage || 'Run pending'}</p>
                    {run.failure ? (
                      <div className="mt-3 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-100">
                        Failure: {run.failure.code} · {run.failure.message}
                      </div>
                    ) : null}
                    {run.toolCalls.length > 0 ? (
                      <div className="mt-3 rounded-xl border border-white/10 bg-[#0A0E17] px-3 py-2 text-xs text-white/45">
                        Safe tool used: {run.toolCalls.map((toolCall) => toolCall.toolName).join(', ')}
                      </div>
                    ) : null}
                    <div className="mt-3 rounded-xl border border-white/10 bg-[#0A0E17] px-3 py-2 text-xs text-white/45">
                      Usage: in {run.usage.inputTokens ?? 0} · out {run.usage.outputTokens ?? 0} · est ${run.usage.estimatedCostUsd?.toFixed(6) || '0.000000'} · {run.usage.accountingMode}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
