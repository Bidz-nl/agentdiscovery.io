import { createHash } from 'node:crypto'

import type {
  AgentCredentialReadModel,
  AgentCredentialValidationStatus,
  AgentRunFailureCode,
  AgentRunRecord,
  AgentRuntimeBlockReason,
  AgentRuntimeReadModel,
  ConnectRuntimeProviderRequest,
  SandboxRunRequest,
  UpdateAgentPolicyRequest,
} from '@/lib/agent-runtime'
import {
  canEncryptAgentSecrets,
  decryptAgentSecret,
  encryptAgentSecret,
  fingerprintHostedManagedCredential,
  maskAgentSecret,
} from '@/lib/agent-runtime-crypto'
import { ensureAgentPolicyRecord, updateAgentPolicyRecord } from '@/lib/agent-policy-repository'
import { createAgentRunRecord, listAgentRunRecords, sumAgentRunEstimatedCostUsd, updateAgentRunRecord } from '@/lib/agent-run-repository'
import { fetchOwnerServices } from '@/lib/owner-service-source'
import {
  createAgentCredentialRecord,
  getActiveAgentProviderCredential,
  listAgentCredentialRecords,
  revokeAgentCredential,
  setAgentCredentialValidation,
} from '@/lib/adp-v2/agent-credential-repository'
import { getAgentRuntimeEnforcementProjection } from '@/lib/adp-v2/agent-profile-service'
import { getAgentRecordByDid, updateAgentRuntimeConfiguration } from '@/lib/adp-v2/agent-record-repository'
import { getProviderAdapter } from '@/lib/provider-adapters'

const SANDBOX_COST_RESERVE_USD = 0.01

function hashSecret(secret: string) {
  return createHash('sha256').update(secret).digest('hex')
}

function getHostedManagedProviderApiKey(provider: 'openai' | 'anthropic') {
  return provider === 'openai' ? process.env.OPENAI_API_KEY?.trim() || null : process.env.ANTHROPIC_API_KEY?.trim() || null
}

function sanitizeRuntimeErrorMessage(message: string) {
  return message
    .replace(/adp_[a-f0-9]{20,}/gi, '[redacted]')
    .replace(/\bsk-[a-z0-9_-]{10,}\b/gi, '[redacted]')
    .replace(/\b(?:api[_-]?key|authorization)\b[^,\n]*/gi, '[redacted]')
    .trim()
}

function toCredentialReadModel(record: Awaited<ReturnType<typeof getActiveAgentProviderCredential>>): AgentCredentialReadModel | null {
  if (!record || (record.provider !== 'openai' && record.provider !== 'anthropic')) {
    return null
  }

  return {
    id: record.id,
    label: record.label,
    provider: record.provider,
    source: record.source,
    status: record.status,
    validationStatus: record.validationStatus,
    validatedAt: record.validatedAt,
    lastUsedAt: record.lastUsedAt,
    createdAt: record.createdAt,
    revokedAt: record.revokedAt,
    maskedSecret: record.maskedSecret,
  }
}

function getConnectionValidationStatus(
  credential: Awaited<ReturnType<typeof getActiveAgentProviderCredential>>
): AgentCredentialValidationStatus {
  if (!credential) {
    return 'unvalidated'
  }

  if (credential.status !== 'active') {
    return 'invalid'
  }

  return credential.validationStatus
}

function estimateRunCostUsd(provider: 'openai' | 'anthropic', inputTokens: number | null, outputTokens: number | null) {
  const inputRatePerMillion = provider === 'openai' ? 0.15 : 0.25
  const outputRatePerMillion = provider === 'openai' ? 0.6 : 1.25
  const safeInputTokens = inputTokens ?? 0
  const safeOutputTokens = outputTokens ?? 0

  if (safeInputTokens === 0 && safeOutputTokens === 0) {
    return null
  }

  return Number((((safeInputTokens / 1_000_000) * inputRatePerMillion) + ((safeOutputTokens / 1_000_000) * outputRatePerMillion)).toFixed(6))
}

function buildSandboxPrompt(prompt: string, toolOutput?: Record<string, unknown>) {
  return [
    'You are a hosted ADP bot running a harmless sandbox test.',
    'Do not perform real-world actions or claim that you executed external side effects.',
    toolOutput ? `Safe read-only tool output: ${JSON.stringify(toolOutput)}` : null,
    `User sandbox prompt: ${prompt.trim()}`,
  ]
    .filter(Boolean)
    .join('\n\n')
}

async function runSafeReadOnlyTool(activeProviderDid: string) {
  const services = await fetchOwnerServices(activeProviderDid)
  return {
    scope: {
      ownerScoped: true,
      providerDid: activeProviderDid,
      metadataExposure: 'minimal_runtime_summary',
    },
    serviceCount: services.length,
    services: services.slice(0, 10).map((service) => ({
      id: service.id,
      title: service.title,
      category: service.category,
      status: service.status,
      published: service.protocolProjection.published,
    })),
  }
}

async function resolveRuntimeCredential(agentId: number, provider: 'openai' | 'anthropic') {
  const credential = await getActiveAgentProviderCredential(agentId, provider)
  if (!credential) {
    return null
  }

  if (credential.source === 'hosted_managed') {
    const apiKey = getHostedManagedProviderApiKey(provider)
    if (!apiKey) {
      throw new Error(`No hosted ${provider} credential is configured on the server`)
    }

    return {
      credential,
      apiKey,
    }
  }

  if (!credential.encryptedSecret) {
    throw new Error('Stored credential is missing encrypted secret material')
  }

  return {
    credential,
    apiKey: decryptAgentSecret(credential.encryptedSecret),
  }
}

async function toSpendSummary(agentId: number, spendCapUsd: number) {
  const trackedEstimatedCostUsd = Number((await sumAgentRunEstimatedCostUsd(agentId)).toFixed(6))
  const remainingBudgetUsd = Number(Math.max(0, spendCapUsd - trackedEstimatedCostUsd).toFixed(6))
  const blocked = spendCapUsd <= 0 || remainingBudgetUsd < SANDBOX_COST_RESERVE_USD

  return {
    mode: 'token_estimate_scaffold' as const,
    spendCapUsd,
    trackedEstimatedCostUsd,
    remainingBudgetUsd,
    blocked,
    accountingComplete: false as const,
    note: `Temporary spend guard scaffold: blocks sandbox runs when remaining estimated budget drops below $${SANDBOX_COST_RESERVE_USD.toFixed(2)}. Real provider billing reconciliation is not complete yet.`,
  }
}

function deriveRuntimeState(input: {
  runtimeStatus: AgentRuntimeReadModel['agent']['runtimeStatus']
  validationStatus: AgentCredentialValidationStatus
  policyEnabled: boolean
  hasProvider: boolean
  spendBlocked: boolean
}) {
  let blockReason: AgentRuntimeBlockReason = 'none'

  if (!input.policyEnabled) {
    blockReason = 'policy_disabled'
  } else if (!input.hasProvider) {
    blockReason = 'provider_not_connected'
  } else if (input.validationStatus !== 'valid') {
    blockReason = 'credential_invalid'
  } else if (input.runtimeStatus !== 'ready') {
    blockReason = 'runtime_not_ready'
  } else if (input.spendBlocked) {
    blockReason = 'spend_guard_blocked'
  }

  return {
    runtimeStatus: input.runtimeStatus,
    validationStatus: input.validationStatus,
    policyEnabled: input.policyEnabled,
    canRunSandbox: blockReason === 'none',
    blockReason,
  }
}

function determineRuntimeStatus(input: {
  policyEnabled: boolean
  preferredProvider: 'openai' | 'anthropic' | null
  validationStatus: AgentCredentialValidationStatus
}) {
  if (!input.policyEnabled) {
    return 'disabled' as const
  }

  if (!input.preferredProvider || input.validationStatus !== 'valid') {
    return 'needs_setup' as const
  }

  return 'ready' as const
}

function toBlockMessage(blockReason: AgentRuntimeBlockReason) {
  if (blockReason === 'policy_disabled') {
    return 'Runtime is disabled by policy'
  }

  if (blockReason === 'provider_not_connected') {
    return 'Connect a provider before running a sandbox test'
  }

  if (blockReason === 'credential_invalid') {
    return 'Runtime credential is not currently valid'
  }

  if (blockReason === 'runtime_not_ready') {
    return 'Runtime is not ready for sandbox runs'
  }

  if (blockReason === 'spend_guard_blocked') {
    return 'Sandbox run blocked by temporary spend guard scaffold'
  }

  return 'Sandbox run blocked'
}

function toFailureCode(errorMessage: string): AgentRunFailureCode {
  const normalizedMessage = errorMessage.toLowerCase()

  if (normalizedMessage.includes('policy') || normalizedMessage.includes('disabled')) {
    return 'policy_blocked'
  }

  if (normalizedMessage.includes('spend guard')) {
    return 'spend_guard_blocked'
  }

  if (normalizedMessage.includes('not ready')) {
    return 'runtime_not_ready'
  }

  if (normalizedMessage.includes('auth') || normalizedMessage.includes('credential')) {
    return 'provider_auth_failed'
  }

  return 'provider_run_failed'
}

export async function getAgentRuntimeReadModelByDid(agentDid: string): Promise<AgentRuntimeReadModel | null> {
  const agent = await getAgentRecordByDid(agentDid)
  if (!agent) {
    return null
  }

  const [policy, recentRuns, credential, profileProjection] = await Promise.all([
    ensureAgentPolicyRecord(agent.id),
    listAgentRunRecords(agent.id).then((runs) => runs.slice(0, 8)),
    agent.preferredProvider ? getActiveAgentProviderCredential(agent.id, agent.preferredProvider) : Promise.resolve(null),
    getAgentRuntimeEnforcementProjection(agent.did),
  ])
  const preferredProvider = agent.preferredProvider
  const validationStatus = getConnectionValidationStatus(credential)
  const effectiveRuntimeStatus = determineRuntimeStatus({
    policyEnabled: policy.enabled,
    preferredProvider,
    validationStatus,
  })
  const spend = await toSpendSummary(agent.id, policy.spendCapUsd)
  const state = deriveRuntimeState({
    runtimeStatus: effectiveRuntimeStatus,
    validationStatus,
    policyEnabled: policy.enabled,
    hasProvider: Boolean(preferredProvider && credential),
    spendBlocked: spend.blocked,
  })

  if (effectiveRuntimeStatus !== agent.runtimeStatus) {
    await updateAgentRuntimeConfiguration(agent.did, { runtimeStatus: effectiveRuntimeStatus })
  }

  return {
    agent: {
      id: agent.id,
      did: agent.did,
      name: agent.name,
      runtimeMode: agent.runtimeMode,
      runtimeStatus: effectiveRuntimeStatus,
      preferredProvider,
    },
    profile: profileProjection
      ? {
          displayName: profileProjection.displayName,
          purpose: profileProjection.purpose,
          specialties: profileProjection.specialties,
          memoryScopeMode: profileProjection.memoryScope.mode,
        }
      : null,
    providerConnection: {
      provider: preferredProvider,
      supportsTools: preferredProvider ? getProviderAdapter(preferredProvider).supportsTools : false,
      supportsStreaming: preferredProvider ? getProviderAdapter(preferredProvider).supportsStreaming : false,
      usingHostedCredential: credential?.source === 'hosted_managed',
      credential: toCredentialReadModel(credential),
      lastValidatedAt: credential?.validatedAt ?? null,
      validationStatus,
    },
    policy,
    state,
    spend,
    recentRuns,
  }
}

export async function connectAgentRuntimeProvider(agentDid: string, input: ConnectRuntimeProviderRequest) {
  const agent = await getAgentRecordByDid(agentDid)
  if (!agent) {
    throw new Error('Agent not found')
  }

  const provider = input.provider
  const adapter = getProviderAdapter(provider)
  const policy = await ensureAgentPolicyRecord(agent.id)
  const providedApiKey = typeof input.apiKey === 'string' ? input.apiKey.trim() : ''
  const source = providedApiKey ? 'bring_your_own' : 'hosted_managed'
  const apiKey = providedApiKey || getHostedManagedProviderApiKey(provider)

  if (!apiKey) {
    throw new Error(`No ${provider} API key was provided and no hosted server credential is configured`)
  }

  if (source === 'bring_your_own' && !canEncryptAgentSecrets()) {
    throw new Error('AGENT_SECRET_ENCRYPTION_KEY must be configured before bring-your-own provider keys can be stored')
  }

  const validation = await adapter.validateCredential({ apiKey })
  if (!validation.ok) {
    throw new Error(sanitizeRuntimeErrorMessage(validation.message))
  }

  for (const credential of await listAgentCredentialRecords(agent.id)) {
    if (credential.kind === 'provider_api_key' && credential.provider === provider && credential.status === 'active') {
      await revokeAgentCredential(credential.id)
    }
  }

  const credential = await createAgentCredentialRecord({
    agentId: agent.id,
    label: input.label?.trim() || `${provider} runtime`,
    kind: 'provider_api_key',
    provider,
    source,
    secretHash: source === 'hosted_managed' ? fingerprintHostedManagedCredential(provider, agent.id) : hashSecret(apiKey),
    encryptedSecret: source === 'bring_your_own' ? encryptAgentSecret(apiKey) : null,
    maskedSecret: source === 'bring_your_own' ? maskAgentSecret(apiKey) : 'Platform managed',
    status: 'active',
    validationStatus: 'valid',
    validatedAt: new Date().toISOString(),
  })

  await updateAgentRuntimeConfiguration(agent.did, {
    runtimeMode: 'hosted',
    runtimeStatus: determineRuntimeStatus({
      policyEnabled: policy.enabled,
      preferredProvider: provider,
      validationStatus: 'valid',
    }),
    preferredProvider: provider,
  })

  return {
    credential,
    validation,
    runtime: await getAgentRuntimeReadModelByDid(agent.did),
  }
}

export async function updateAgentRuntimePolicy(agentDid: string, input: UpdateAgentPolicyRequest) {
  const agent = await getAgentRecordByDid(agentDid)
  if (!agent) {
    throw new Error('Agent not found')
  }

  const allowedTools = Array.isArray(input.allowedTools)
    ? input.allowedTools.filter((tool): tool is 'list_capabilities' => tool === 'list_capabilities')
    : undefined

  const policy = await updateAgentPolicyRecord(agent.id, (current) => ({
    ...current,
    enabled: typeof input.enabled === 'boolean' ? input.enabled : current.enabled,
    approvalRequired: typeof input.approvalRequired === 'boolean' ? input.approvalRequired : current.approvalRequired,
    allowedTools: allowedTools ?? current.allowedTools,
    spendCapUsd:
      typeof input.spendCapUsd === 'number' && Number.isFinite(input.spendCapUsd) ? Math.max(0, input.spendCapUsd) : current.spendCapUsd,
  }))

  const rawCredential = agent.preferredProvider ? await getActiveAgentProviderCredential(agent.id, agent.preferredProvider) : null
  const credential = rawCredential ?? null
  const validationStatus = getConnectionValidationStatus(credential)

  await updateAgentRuntimeConfiguration(agent.did, {
    runtimeStatus: determineRuntimeStatus({
      policyEnabled: policy.enabled,
      preferredProvider: agent.preferredProvider,
      validationStatus,
    }),
  })

  return {
    policy,
    runtime: await getAgentRuntimeReadModelByDid(agent.did),
  }
}

export async function runAgentSandbox(
  agentDid: string,
  activeProviderDid: string,
  input: SandboxRunRequest
): Promise<{ run: AgentRunRecord; runtime: AgentRuntimeReadModel | null }> {
  const agent = await getAgentRecordByDid(agentDid)
  if (!agent) {
    throw new Error('Agent not found')
  }

  const prompt = input.prompt.trim()
  if (!prompt) {
    throw new Error('Sandbox prompt is required')
  }

  const runtime = await getAgentRuntimeReadModelByDid(agent.did)
  if (!runtime) {
    throw new Error('Agent runtime not found')
  }

  if (!runtime.state.canRunSandbox) {
    throw new Error(toBlockMessage(runtime.state.blockReason))
  }

  const provider = input.provider ?? runtime.agent.preferredProvider
  if (!provider) {
    throw new Error('Connect a provider before running a sandbox test')
  }

  const adapter = getProviderAdapter(provider)
  const credentialResolution = await resolveRuntimeCredential(agent.id, provider)
  if (!credentialResolution) {
    throw new Error(`No active ${provider} runtime credential is configured for this bot`)
  }

  const toolOutput = input.useTool && runtime.policy.allowedTools.includes('list_capabilities')
    ? await runSafeReadOnlyTool(activeProviderDid)
    : undefined

  const pendingRun = await createAgentRunRecord({
    agentId: agent.id,
    provider,
    model: input.model?.trim() || (provider === 'openai' ? 'gpt-4o-mini' : 'claude-3-5-haiku-latest'),
    kind: 'sandbox',
    status: 'pending',
    prompt,
    outputText: null,
    toolCalls: toolOutput
      ? [
          {
            toolName: 'list_capabilities',
            status: 'completed',
            input: { activeProviderDid },
            output: toolOutput,
          },
        ]
      : [],
    credentialId: credentialResolution.credential.id,
    completedAt: null,
    errorMessage: null,
    failure: null,
    usage: {
      inputTokens: null,
      outputTokens: null,
      estimatedCostUsd: null,
      accountingMode: 'unavailable',
    },
  })

  try {
    const result = await adapter.run({
      apiKey: credentialResolution.apiKey,
      model: input.model,
      systemPrompt: 'You are a safe sandbox test assistant for an ADP hosted bot.',
      prompt: buildSandboxPrompt(prompt, toolOutput),
    })

    const estimatedCostUsd = estimateRunCostUsd(provider, result.usage.inputTokens, result.usage.outputTokens)
    const completedRun = await updateAgentRunRecord(pendingRun.id, (record) => ({
      ...record,
      status: 'completed',
      model: result.model,
      outputText: result.outputText,
      completedAt: new Date().toISOString(),
      usage: {
        inputTokens: result.usage.inputTokens,
        outputTokens: result.usage.outputTokens,
        estimatedCostUsd,
        accountingMode: estimatedCostUsd === null ? 'unavailable' : 'token_estimate_scaffold',
      },
    }))

    await setAgentCredentialValidation(credentialResolution.credential.id, 'valid')
    await updateAgentRuntimeConfiguration(agent.did, {
      runtimeMode: 'hosted',
      runtimeStatus: determineRuntimeStatus({
        policyEnabled: runtime.policy.enabled,
        preferredProvider: provider,
        validationStatus: 'valid',
      }),
      preferredProvider: provider,
    })

    return {
      run: completedRun ?? pendingRun,
      runtime: await getAgentRuntimeReadModelByDid(agent.did),
    }
  } catch (error) {
    const sanitizedMessage = sanitizeRuntimeErrorMessage(error instanceof Error ? error.message : 'Sandbox run failed')
    const failureCode = toFailureCode(sanitizedMessage)

    await setAgentCredentialValidation(credentialResolution.credential.id, failureCode === 'provider_auth_failed' ? 'invalid' : 'valid')
    await updateAgentRuntimeConfiguration(agent.did, {
      runtimeMode: 'hosted',
      runtimeStatus: determineRuntimeStatus({
        policyEnabled: runtime.policy.enabled,
        preferredProvider: provider,
        validationStatus: failureCode === 'provider_auth_failed' ? 'invalid' : 'valid',
      }),
      preferredProvider: provider,
    })

    const failedRun = await updateAgentRunRecord(pendingRun.id, (record) => ({
      ...record,
      status: 'failed',
      completedAt: new Date().toISOString(),
      errorMessage: sanitizedMessage,
      failure: {
        code: failureCode,
        message: sanitizedMessage,
      },
      usage: {
        ...record.usage,
        accountingMode: 'unavailable',
      },
    }))

    throw new Error(failedRun?.errorMessage || 'Sandbox run failed')
  }
}
