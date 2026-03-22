import assert from 'node:assert/strict'
import { mkdirSync, mkdtempSync, rmSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'
import { NextRequest } from 'next/server'

const tempDataRoot = mkdtempSync(path.join(os.tmpdir(), 'adp-profile-route-tests-'))

process.env.ADP_DATA_ROOT = tempDataRoot

const profileRoute = await import('../src/app/api/app/agents/profile/route.ts')
const { registerNativeAgent } = await import('../src/lib/adp-v2/agent-registration-service.ts')

function resetStores() {
  rmSync(tempDataRoot, { recursive: true, force: true })
  mkdirSync(tempDataRoot, { recursive: true })
}

test.beforeEach(() => {
  resetStores()
})

test('owner-private profile access is enforced', async () => {
  const profileGet = await profileRoute.GET(new NextRequest('http://localhost/api/app/agents/profile'))
  const profilePatch = await profileRoute.PATCH(
    new NextRequest('http://localhost/api/app/agents/profile', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ displayName: 'Blocked' }),
    })
  )

  assert.equal(profileGet.status, 401)
  assert.equal(profilePatch.status, 401)

  const getBody = await profileGet.json()
  const patchBody = await profilePatch.json()

  assert.equal(getBody.error.code, 'OWNER_AUTH_REQUIRED')
  assert.equal(patchBody.error.code, 'OWNER_AUTH_REQUIRED')
})

test('owner-private profile patch updates safe fields and ignores hidden fields', async () => {
  const registration = registerNativeAgent({
    name: 'Route Profile Bot',
    role: 'provider',
    supported_protocol_versions: ['2.0'],
    description: 'Profile route bot',
  })

  const getResponse = await profileRoute.GET(
    new NextRequest('http://localhost/api/app/agents/profile', {
      headers: { authorization: `Bearer ${registration.apiKey}` },
    })
  )

  assert.equal(getResponse.status, 200)
  const getBody = await getResponse.json()
  assert.equal(getBody.profile.identity.displayName, 'Route Profile Bot')

  const patchResponse = await profileRoute.PATCH(
    new NextRequest('http://localhost/api/app/agents/profile', {
      method: 'PATCH',
      headers: {
        authorization: `Bearer ${registration.apiKey}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        displayName: 'Route Profile Prime',
        purpose: 'Specialized provider bot for route-level editing.',
        ownerDefinedSpecialty: ['negotiation', 'quoting'],
        selectedSkillKeys: ['translate_services_into_offers', 'provider_negotiation_response'],
        toolGrants: [{ toolKey: 'list_capabilities', mode: 'deny', requiresApproval: true }],
        policyProfile: {
          autonomyMode: 'semi_autonomous',
          spendCapUsd: 9,
          allowExternalSideEffects: true,
        },
        memoryScope: {
          mode: 'owner_private',
          retentionDays: 20,
          storesPreferenceMemory: true,
          storesExecutionMemory: true,
        },
        reputationSummary: {
          trustTier: 'verified',
        },
        knowledgeSources: [
          {
            key: 'private-crm',
          },
        ],
      }),
    })
  )

  assert.equal(patchResponse.status, 200)
  const patchBody = await patchResponse.json()

  assert.equal(patchBody.profile.identity.displayName, 'Route Profile Prime')
  assert.deepEqual(patchBody.profile.identity.ownerDefinedSpecialty, ['negotiation', 'quoting'])
  assert.deepEqual(
    patchBody.profile.skills.map((skill: { key: string }) => skill.key),
    ['translate_services_into_offers', 'provider_negotiation_response']
  )
  assert.equal(
    patchBody.profile.toolGrants.find((grant: { toolKey: string }) => grant.toolKey === 'list_capabilities')?.mode,
    'deny'
  )
  assert.equal(patchBody.profile.policyProfile.allowExternalSideEffects, true)
  assert.equal(patchBody.profile.memoryScope.mode, 'owner_private')
  assert.equal(patchBody.profile.reputationSummary.trustTier, 'unrated')
  assert.ok(Array.isArray(patchBody.profile.knowledgeSources))
  assert.equal(
    patchBody.profile.knowledgeSources.some((source: { key: string }) => source.key === 'private-crm'),
    false
  )
})
