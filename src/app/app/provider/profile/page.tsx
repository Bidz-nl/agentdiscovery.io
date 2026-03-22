"use client"

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Loader2, Save, Shield, Sparkles } from 'lucide-react'

import ADPClient, { type OwnerAgentProfileResponse } from '@/app/app/lib/adp-client'
import { useAgentStore } from '@/app/app/lib/agent-store'

function toCommaList(value: string) {
  return Array.from(
    new Set(
      value
        .split(',')
        .map((entry) => entry.trim())
        .filter(Boolean)
    )
  )
}

export default function ProviderProfilePage() {
  const { appSession } = useAgentStore()
  const appApiKey = appSession.apiKey

  const [profileResponse, setProfileResponse] = useState<OwnerAgentProfileResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)

  const [displayName, setDisplayName] = useState('')
  const [purpose, setPurpose] = useState('')
  const [specialtyInput, setSpecialtyInput] = useState('')
  const [selectedSkillKeys, setSelectedSkillKeys] = useState<string[]>([])
  const [toolModes, setToolModes] = useState<Record<string, string>>({})
  const [toolApproval, setToolApproval] = useState<Record<string, boolean>>({})
  const [autonomyMode, setAutonomyMode] = useState('advisory')
  const [defaultApprovalMode, setDefaultApprovalMode] = useState('conditional')
  const [spendCapUsd, setSpendCapUsd] = useState('5')
  const [allowExternalSideEffects, setAllowExternalSideEffects] = useState(false)
  const [allowCrossCounterpartyMemory, setAllowCrossCounterpartyMemory] = useState(false)
  const [memoryMode, setMemoryMode] = useState('session')
  const [retentionDays, setRetentionDays] = useState('30')
  const [storesPreferenceMemory, setStoresPreferenceMemory] = useState(false)
  const [storesExecutionMemory, setStoresExecutionMemory] = useState(true)

  const applyProfile = useCallback((response: OwnerAgentProfileResponse) => {
    setProfileResponse(response)
    setDisplayName(response.profile.identity.displayName)
    setPurpose(response.profile.identity.purpose)
    setSpecialtyInput(response.profile.identity.ownerDefinedSpecialty.join(', '))
    setSelectedSkillKeys(response.profile.skills.map((skill) => skill.key))
    setToolModes(
      Object.fromEntries(response.profile.toolGrants.map((toolGrant) => [toolGrant.toolKey, toolGrant.mode]))
    )
    setToolApproval(
      Object.fromEntries(response.profile.toolGrants.map((toolGrant) => [toolGrant.toolKey, toolGrant.requiresApproval]))
    )
    setAutonomyMode(response.profile.policyProfile.autonomyMode)
    setDefaultApprovalMode(response.profile.policyProfile.defaultApprovalMode)
    setSpendCapUsd(String(response.profile.policyProfile.spendCapUsd))
    setAllowExternalSideEffects(response.profile.policyProfile.allowExternalSideEffects)
    setAllowCrossCounterpartyMemory(response.profile.policyProfile.allowCrossCounterpartyMemory)
    setMemoryMode(response.profile.memoryScope.mode)
    setRetentionDays(response.profile.memoryScope.retentionDays === null ? '' : String(response.profile.memoryScope.retentionDays))
    setStoresPreferenceMemory(response.profile.memoryScope.storesPreferenceMemory)
    setStoresExecutionMemory(response.profile.memoryScope.storesExecutionMemory)
  }, [])

  const loadProfile = useCallback(async () => {
    if (!appApiKey) {
      setLoading(false)
      return
    }

    try {
      setErrorMessage(null)
      const client = new ADPClient(appApiKey)
      const response = await client.getOwnerAgentProfile()
      applyProfile(response)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to load bot profile')
    } finally {
      setLoading(false)
    }
  }, [appApiKey, applyProfile])

  useEffect(() => {
    loadProfile()
  }, [loadProfile])

  const availableSkills = profileResponse?.editor.availableSkills ?? []
  const availableTools = profileResponse?.editor.availableTools ?? []
  const discoverySummary = useMemo(() => profileResponse?.profile.discoveryProfile.specialties.join(', ') || 'No specialties yet', [profileResponse])

  const toggleSkill = (skillKey: string) => {
    setSelectedSkillKeys((current) =>
      current.includes(skillKey) ? current.filter((entry) => entry !== skillKey) : [...current, skillKey]
    )
  }

  const handleSave = async () => {
    if (!appApiKey) {
      setErrorMessage('Owner app session is required to update the bot profile')
      return
    }

    setSaving(true)
    setErrorMessage(null)
    setStatusMessage(null)

    try {
      const client = new ADPClient(appApiKey)
      const response = await client.updateOwnerAgentProfile({
        displayName,
        purpose,
        ownerDefinedSpecialty: toCommaList(specialtyInput),
        selectedSkillKeys,
        toolGrants: availableTools.map((tool) => ({
          toolKey: tool.toolKey,
          mode: toolModes[tool.toolKey] || tool.mode,
          requiresApproval: toolApproval[tool.toolKey] ?? tool.requiresApproval,
        })),
        policyProfile: {
          autonomyMode,
          defaultApprovalMode,
          spendCapUsd: Number.parseFloat(spendCapUsd),
          allowExternalSideEffects,
          allowCrossCounterpartyMemory,
        },
        memoryScope: {
          mode: memoryMode,
          retentionDays: retentionDays.trim() ? Number.parseInt(retentionDays, 10) : null,
          storesPreferenceMemory,
          storesExecutionMemory,
        },
      })
      applyProfile(response)
      setStatusMessage('Bot profile saved')
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to save bot profile')
    } finally {
      setSaving(false)
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
            Restore your owner session with the bot API key before editing the private bot profile.
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
            <h1 className="mt-4 text-3xl font-bold text-white">Bot profile</h1>
            <p className="mt-2 max-w-3xl text-sm text-white/45">
              Give this bot a distinct identity, specialty, safe tool boundary, and memory stance beyond its model backend.
            </p>
          </div>
          <button type="button" onClick={handleSave} disabled={saving || loading} className="inline-flex items-center gap-2 rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-3 text-sm font-medium text-cyan-100 transition-colors hover:bg-cyan-500/20 disabled:cursor-not-allowed disabled:opacity-60">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save profile
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center rounded-3xl border border-white/5 bg-[#111827] p-10">
            <Loader2 className="h-6 w-6 animate-spin text-white/30" />
          </div>
        ) : null}

        {errorMessage ? (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">{errorMessage}</div>
        ) : null}

        {statusMessage ? (
          <div className="rounded-2xl border border-green-500/20 bg-green-500/10 px-4 py-3 text-sm text-green-200">{statusMessage}</div>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
          <div className="space-y-6">
            <div className="rounded-3xl border border-white/5 bg-[#111827] p-6">
              <div className="flex items-center gap-3">
                <Sparkles className="h-5 w-5 text-cyan-300" />
                <div>
                  <h2 className="text-lg font-semibold text-white">Identity and purpose</h2>
                  <p className="mt-1 text-sm text-white/45">These are the first fields that make bots with the same model backend feel materially different.</p>
                </div>
              </div>
              <div className="mt-5 space-y-4">
                <label className="block space-y-2 text-sm text-white/70">
                  <span>Display name</span>
                  <input value={displayName} onChange={(event) => setDisplayName(event.target.value)} className="w-full rounded-xl border border-white/10 bg-[#0A0E17] px-4 py-3 text-white focus:border-cyan-500/50 focus:outline-none" />
                </label>
                <label className="block space-y-2 text-sm text-white/70">
                  <span>Purpose</span>
                  <textarea value={purpose} onChange={(event) => setPurpose(event.target.value)} rows={4} className="w-full rounded-2xl border border-white/10 bg-[#0A0E17] px-4 py-3 text-white focus:border-cyan-500/50 focus:outline-none" />
                </label>
                <label className="block space-y-2 text-sm text-white/70">
                  <span>Owner-defined specialty</span>
                  <input value={specialtyInput} onChange={(event) => setSpecialtyInput(event.target.value)} placeholder="procurement, quote comparison, logistics" className="w-full rounded-xl border border-white/10 bg-[#0A0E17] px-4 py-3 text-white placeholder:text-white/20 focus:border-cyan-500/50 focus:outline-none" />
                </label>
              </div>
            </div>

            <div className="rounded-3xl border border-white/5 bg-[#111827] p-6">
              <h2 className="text-lg font-semibold text-white">Selected skills</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {availableSkills.map((skill) => (
                  <label key={skill.key} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/75">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-medium text-white">{skill.name}</div>
                        <div className="mt-1 text-xs text-white/45">{skill.summary}</div>
                      </div>
                      <input type="checkbox" checked={selectedSkillKeys.includes(skill.key)} onChange={() => toggleSkill(skill.key)} />
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-white/5 bg-[#111827] p-6">
              <h2 className="text-lg font-semibold text-white">Tool grants</h2>
              <div className="mt-4 space-y-3">
                {availableTools.map((tool) => (
                  <div key={tool.toolKey} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <div className="font-medium text-white">{tool.title}</div>
                        <div className="mt-1 text-xs text-white/45">{tool.toolKey}</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <select value={toolModes[tool.toolKey] || tool.mode} onChange={(event) => setToolModes((current) => ({ ...current, [tool.toolKey]: event.target.value }))} className="rounded-xl border border-white/10 bg-[#0A0E17] px-3 py-2 text-sm text-white focus:border-cyan-500/50 focus:outline-none">
                          <option value="deny">deny</option>
                          <option value="read">read</option>
                          <option value="write">write</option>
                          <option value="execute">execute</option>
                        </select>
                        <label className="flex items-center gap-2 text-sm text-white/70">
                          <input type="checkbox" checked={toolApproval[tool.toolKey] ?? tool.requiresApproval} onChange={(event) => setToolApproval((current) => ({ ...current, [tool.toolKey]: event.target.checked }))} />
                          Approval
                        </label>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-white/5 bg-[#111827] p-6">
              <div className="flex items-center gap-3">
                <Shield className="h-5 w-5 text-green-300" />
                <div>
                  <h2 className="text-lg font-semibold text-white">Policy and memory basics</h2>
                  <p className="mt-1 text-sm text-white/45">Keep this first editor intentionally narrow: autonomy, approval, spend, and memory posture.</p>
                </div>
              </div>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <label className="space-y-2 text-sm text-white/70">
                  <span>Autonomy mode</span>
                  <select value={autonomyMode} onChange={(event) => setAutonomyMode(event.target.value)} className="w-full rounded-xl border border-white/10 bg-[#0A0E17] px-4 py-3 text-white focus:border-green-500/50 focus:outline-none">
                    {(profileResponse?.editor.allowedAutonomyModes || []).map((mode) => <option key={mode} value={mode}>{mode}</option>)}
                  </select>
                </label>
                <label className="space-y-2 text-sm text-white/70">
                  <span>Default approval</span>
                  <select value={defaultApprovalMode} onChange={(event) => setDefaultApprovalMode(event.target.value)} className="w-full rounded-xl border border-white/10 bg-[#0A0E17] px-4 py-3 text-white focus:border-green-500/50 focus:outline-none">
                    {(profileResponse?.editor.allowedApprovalModes || []).map((mode) => <option key={mode} value={mode}>{mode}</option>)}
                  </select>
                </label>
                <label className="space-y-2 text-sm text-white/70">
                  <span>Spend cap (USD)</span>
                  <input value={spendCapUsd} onChange={(event) => setSpendCapUsd(event.target.value)} className="w-full rounded-xl border border-white/10 bg-[#0A0E17] px-4 py-3 text-white focus:border-green-500/50 focus:outline-none" />
                </label>
                <label className="space-y-2 text-sm text-white/70">
                  <span>Memory scope</span>
                  <select value={memoryMode} onChange={(event) => setMemoryMode(event.target.value)} className="w-full rounded-xl border border-white/10 bg-[#0A0E17] px-4 py-3 text-white focus:border-green-500/50 focus:outline-none">
                    {(profileResponse?.editor.allowedMemoryScopes || []).map((mode) => <option key={mode} value={mode}>{mode}</option>)}
                  </select>
                </label>
                <label className="space-y-2 text-sm text-white/70">
                  <span>Retention days</span>
                  <input value={retentionDays} onChange={(event) => setRetentionDays(event.target.value)} className="w-full rounded-xl border border-white/10 bg-[#0A0E17] px-4 py-3 text-white focus:border-green-500/50 focus:outline-none" />
                </label>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <label className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/75">
                  <span>Allow external side effects</span>
                  <input type="checkbox" checked={allowExternalSideEffects} onChange={(event) => setAllowExternalSideEffects(event.target.checked)} />
                </label>
                <label className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/75">
                  <span>Allow cross-counterparty memory</span>
                  <input type="checkbox" checked={allowCrossCounterpartyMemory} onChange={(event) => setAllowCrossCounterpartyMemory(event.target.checked)} />
                </label>
                <label className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/75">
                  <span>Store preference memory</span>
                  <input type="checkbox" checked={storesPreferenceMemory} onChange={(event) => setStoresPreferenceMemory(event.target.checked)} />
                </label>
                <label className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/75">
                  <span>Store execution memory</span>
                  <input type="checkbox" checked={storesExecutionMemory} onChange={(event) => setStoresExecutionMemory(event.target.checked)} />
                </label>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-3xl border border-white/5 bg-[#111827] p-6">
              <h2 className="text-lg font-semibold text-white">Public discovery summary</h2>
              <div className="mt-4 space-y-3 text-sm text-white/65">
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                  Display name: <span className="font-medium text-white">{displayName || 'Unnamed bot'}</span>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                  Specialties: <span className="font-medium text-white">{discoverySummary}</span>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                  Selected skills: <span className="font-medium text-white">{selectedSkillKeys.length}</span>
                </div>
                <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-xs text-amber-100">
                  Only safe public profile fields are exposed in discovery. Hidden policy internals, private knowledge descriptors, and full memory settings stay private.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
