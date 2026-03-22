import assert from 'node:assert/strict'
import test from 'node:test'

process.env.ADP_RUNTIME_TEST_STUB = '1'
process.env.AGENT_SECRET_ENCRYPTION_KEY = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef'
process.env.OPENAI_API_KEY = 'hosted-openai-key'
process.env.ANTHROPIC_API_KEY = 'hosted-anthropic-key'

const { registerNativeAgent } = await import('../src/lib/adp-v2/agent-registration-service.ts')
const { listAgentCredentialRecords } = await import('../src/lib/adp-v2/agent-credential-repository.ts')
const { createOwnerServiceRecord } = await import('../src/lib/owner-service-repository.ts')
const {
  connectAgentRuntimeProvider,
  getAgentRuntimeReadModelByDid,
  runAgentSandbox,
  updateAgentRuntimePolicy,
} = await import('../src/lib/agent-runtime-service.ts')

async function registerProvider(name: string) {
  return registerNativeAgent({
    name,
    role: 'provider',
    supported_protocol_versions: ['2.0'],
    description: `${name} provider`,
  })
}

test('runtime provider connect flow derives ready hosted runtime state', async () => {
  const { agent } = await registerProvider('Runtime Connect Bot')

  const result = await connectAgentRuntimeProvider(agent.did, { provider: 'openai' })

  assert.equal(result.runtime?.agent.runtimeMode, 'hosted')
  assert.equal(result.runtime?.agent.runtimeStatus, 'ready')
  assert.equal(result.runtime?.agent.preferredProvider, 'openai')
  assert.equal(result.runtime?.providerConnection.credential?.source, 'hosted_managed')
  assert.equal(result.runtime?.providerConnection.validationStatus, 'valid')
  assert.equal(result.runtime?.state.canRunSandbox, true)
  assert.equal(result.runtime?.state.blockReason, 'none')
})

test('BYO credential validation flow stores encrypted secret and masked read model', async () => {
  const { agent } = await registerProvider('BYO Bot')

  const result = await connectAgentRuntimeProvider(agent.did, {
    provider: 'anthropic',
    label: 'my anthropic key',
    apiKey: 'byok-valid-key-123',
  })

  const credentials = await listAgentCredentialRecords(agent.id)
  const providerCredential = credentials.find((credential) => credential.kind === 'provider_api_key' && credential.status === 'active')

  assert.ok(providerCredential)
  assert.equal(providerCredential?.source, 'bring_your_own')
  assert.equal(providerCredential?.validationStatus, 'valid')
  assert.ok(providerCredential?.encryptedSecret)
  assert.ok(providerCredential?.maskedSecret)
  assert.notEqual(providerCredential?.maskedSecret, 'byok-valid-key-123')
  assert.equal(result.runtime?.providerConnection.credential?.maskedSecret, providerCredential?.maskedSecret)
})

test('credential reconnect revokes older active provider credential', async () => {
  const { agent } = await registerProvider('Reconnect Bot')

  await connectAgentRuntimeProvider(agent.did, {
    provider: 'openai',
    label: 'first key',
    apiKey: 'byok-first-key',
  })

  await connectAgentRuntimeProvider(agent.did, {
    provider: 'openai',
    label: 'second key',
    apiKey: 'byok-second-key',
  })

  const credentials = (await listAgentCredentialRecords(agent.id)).filter(
    (credential) => credential.kind === 'provider_api_key' && credential.provider === 'openai'
  )

  assert.equal(credentials.length, 2)
  assert.equal(credentials.filter((credential) => credential.status === 'active').length, 1)
  assert.equal(credentials.filter((credential) => credential.status === 'revoked').length, 1)
  assert.ok(credentials.find((credential) => credential.status === 'revoked')?.revokedAt)
})

test('policy disable blocks sandbox runs via normalized runtime state', async () => {
  const { agent } = await registerProvider('Policy Bot')

  await connectAgentRuntimeProvider(agent.did, { provider: 'openai' })
  await updateAgentRuntimePolicy(agent.did, { enabled: false })

  const runtime = await getAgentRuntimeReadModelByDid(agent.did)

  assert.equal(runtime?.agent.runtimeStatus, 'disabled')
  assert.equal(runtime?.state.policyEnabled, false)
  assert.equal(runtime?.state.canRunSandbox, false)
  assert.equal(runtime?.state.blockReason, 'policy_disabled')

  await assert.rejects(
    () => runAgentSandbox(agent.did, agent.did, { prompt: 'test sandbox', useTool: false }),
    /disabled by policy/
  )
})

test('sandbox run uses only owner-scoped safe read-only tool output', async () => {
  const { agent } = await registerProvider('Scoped Tool Bot')
  const { agent: otherAgent } = await registerProvider('Other Tool Bot')

  await createOwnerServiceRecord(agent.did, {
    title: 'Own service',
    category: 'copywriting',
    description: 'owned by active provider',
  })
  await createOwnerServiceRecord(otherAgent.did, {
    title: 'Foreign service',
    category: 'plumbing',
    description: 'should not leak',
  })

  await connectAgentRuntimeProvider(agent.did, { provider: 'openai' })

  const result = await runAgentSandbox(agent.did, agent.did, {
    prompt: 'Summarize my capabilities',
    useTool: true,
  })

  assert.equal(result.run.status, 'completed')
  assert.equal(result.run.toolCalls.length, 1)

  const toolCall = result.run.toolCalls[0]
  const output = toolCall.output as {
    scope: { ownerScoped: boolean; providerDid: string; metadataExposure: string }
    services: Array<Record<string, unknown>>
  }

  assert.equal(toolCall.toolName, 'list_capabilities')
  assert.deepEqual(output.scope, {
    ownerScoped: true,
    providerDid: agent.did,
    metadataExposure: 'minimal_runtime_summary',
  })
  assert.equal(output.services.length, 1)
  assert.equal(output.services[0].title, 'Own service')
  assert.equal(output.services[0].category, 'copywriting')
  assert.equal(output.services.some((service) => service.title === 'Foreign service'), false)
  assert.deepEqual(Object.keys(output.services[0]).sort(), ['category', 'id', 'published', 'status', 'title'])
  assert.equal(result.runtime?.recentRuns[0]?.usage.accountingMode, 'token_estimate_scaffold')
})

test('spend guard scaffold evaluates stored run totals before sandbox execution', async () => {
  const { agent } = await registerProvider('Spend Guard Bot')

  await connectAgentRuntimeProvider(agent.did, { provider: 'openai' })
  await updateAgentRuntimePolicy(agent.did, { spendCapUsd: 0.005 })

  const runtime = await getAgentRuntimeReadModelByDid(agent.did)

  assert.equal(runtime?.spend.mode, 'token_estimate_scaffold')
  assert.equal(runtime?.spend.blocked, true)
  assert.equal(runtime?.state.blockReason, 'spend_guard_blocked')
  assert.match(runtime?.spend.note || '', /Temporary spend guard scaffold/)

  await assert.rejects(
    () => runAgentSandbox(agent.did, agent.did, { prompt: 'blocked sandbox', useTool: false }),
    /temporary spend guard scaffold/
  )
})
