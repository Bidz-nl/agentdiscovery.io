import assert from 'node:assert/strict'
import test from 'node:test'

const { registerNativeAgent } = await import('../src/lib/adp-v2/agent-registration-service.ts')
const { createAgentRecord } = await import('../src/lib/adp-v2/agent-record-repository.ts')
const { getAgentProfileRecord, listAgentProfileRecords } = await import('../src/lib/adp-v2/agent-profile-repository.ts')
const {
  ensureAgentProfileByDid,
  getAgentProfilePrivateReadModel,
  getPublicAgentProfileProjection,
  updateAgentProfileByDid,
} = await import('../src/lib/adp-v2/agent-profile-service.ts')

test('default profile is created during native registration', async () => {
  const { agent } = await registerNativeAgent({
    name: 'Profile Seed Bot',
    role: 'provider',
    supported_protocol_versions: ['2.0'],
    description: 'Provider bot with seeded profile',
  })

  const profile = await getAgentProfileRecord(agent.did)

  assert.ok(profile)
  assert.equal(profile?.identity.displayName, 'Profile Seed Bot')
  assert.equal(profile?.identity.purpose, 'Provider bot with seeded profile')
  assert.equal(profile?.toolGrants.some((grant) => grant.toolKey === 'list_capabilities'), true)
})

test('old agents lazily receive a default profile on first read', async () => {
  const agent = await createAgentRecord({
    did: 'did:adp:legacy-profile-bot',
    name: 'Legacy Profile Bot',
    role: 'consumer',
    description: 'Created before profile storage existed',
    status: 'active',
    supportedProtocolVersions: ['2.0'],
    authoritySummary: {},
    runtimeMode: 'manual',
    runtimeStatus: 'needs_setup',
    preferredProvider: null,
  })

  assert.equal((await listAgentProfileRecords()).length, 0)

  const profile = await ensureAgentProfileByDid(agent.did)

  assert.ok(profile)
  assert.equal(profile?.identity.displayName, 'Legacy Profile Bot')
  assert.equal((await listAgentProfileRecords()).length, 1)
})

test('public projection redacts private policy and memory internals', async () => {
  const { agent } = await registerNativeAgent({
    name: 'Projection Bot',
    role: 'provider',
    supported_protocol_versions: ['2.0'],
    description: 'Projection bot',
  })

  const projection = await getPublicAgentProfileProjection(agent.did)

  assert.ok(projection)
  assert.equal(projection?.displayName, 'Projection Bot')
  assert.equal('policyProfile' in (projection ?? {}), false)
  assert.equal('memoryScope' in (projection ?? {}), false)
  assert.equal('knowledgeSources' in (projection ?? {}), false)
  assert.ok(Array.isArray(projection?.visibleKnowledgeSummaries))
})

test('safe profile update changes allowed fields and preserves hidden fields', async () => {
  const { agent } = await registerNativeAgent({
    name: 'Safe Update Bot',
    role: 'provider',
    supported_protocol_versions: ['2.0'],
    description: 'Safe update bot',
  })

  const before = await getAgentProfilePrivateReadModel(agent.did)
  assert.ok(before)

  const updated = await updateAgentProfileByDid(agent.did, {
    displayName: 'Offer Desk Prime',
    purpose: 'Represent the provider with distinct service packaging behavior.',
    ownerDefinedSpecialty: ['quoting', 'service packaging'],
    selectedSkillKeys: ['translate_services_into_offers'],
    toolGrants: [{ toolKey: 'list_capabilities', mode: 'deny', requiresApproval: true }],
    policyProfile: {
      autonomyMode: 'semi_autonomous',
      defaultApprovalMode: 'conditional',
      spendCapUsd: 12.5,
      allowExternalSideEffects: true,
      allowCrossCounterpartyMemory: true,
    },
    memoryScope: {
      mode: 'owner_private',
      retentionDays: 45,
      storesPreferenceMemory: true,
      storesExecutionMemory: true,
    },
  })

  assert.ok(updated)
  assert.equal(updated?.identity.displayName, 'Offer Desk Prime')
  assert.equal(updated?.identity.purpose, 'Represent the provider with distinct service packaging behavior.')
  assert.deepEqual(updated?.identity.ownerDefinedSpecialty, ['quoting', 'service packaging'])
  assert.deepEqual(updated?.skills.map((skill) => skill.key), ['translate_services_into_offers'])
  assert.equal(updated?.toolGrants.find((grant) => grant.toolKey === 'list_capabilities')?.mode, 'deny')
  assert.equal(updated?.policyProfile.allowExternalSideEffects, true)
  assert.equal(updated?.memoryScope.mode, 'owner_private')
  assert.equal(updated?.reputationSummary.totalTransactions, before?.profile.reputationSummary.totalTransactions)
})
