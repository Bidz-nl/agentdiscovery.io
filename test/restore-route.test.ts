import assert from 'node:assert/strict'
import test from 'node:test'
import { NextRequest } from 'next/server'

const restoreRoute = await import('../src/app/api/app/restore/route.ts')
const { registerNativeAgent } = await import('../src/lib/adp-v2/agent-registration-service.ts')
const { hashAgentApiKey } = await import('../src/lib/adp-v2/agent-api-key.ts')
const { getAgentCredentialBySecretHash, revokeAgentCredential } = await import('../src/lib/adp-v2/agent-credential-repository.ts')

test('restore accepts a pasted provider API key without pre-existing session and activates provider scope', async () => {
  const registration = await registerNativeAgent({
    name: 'Restore Route Provider',
    role: 'provider',
    supported_protocol_versions: ['2.0'],
    description: 'Provider restore route test',
  })

  const response = await restoreRoute.POST(
    new NextRequest('http://localhost/api/app/restore', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ apiKey: registration.apiKey }),
    })
  )

  assert.equal(response.status, 200)
  const body = await response.json()
  assert.equal(body.agent.did, registration.agent.did)
  assert.equal(body.agent.role, 'provider')
  assert.equal(body.providerContext.providerScope.activeProviderDid, registration.agent.did)
  assert.deepEqual(body.providerContext.providerScope.authorizedProviderDids, [registration.agent.did])
})

test('restore accepts a pasted consumer API key without requiring provider scope', async () => {
  const registration = await registerNativeAgent({
    name: 'Restore Route Consumer',
    role: 'consumer',
    supported_protocol_versions: ['2.0'],
    description: 'Consumer restore route test',
  })

  const response = await restoreRoute.POST(
    new NextRequest('http://localhost/api/app/restore', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ apiKey: registration.apiKey }),
    })
  )

  assert.equal(response.status, 200)
  const body = await response.json()
  assert.equal(body.agent.did, registration.agent.did)
  assert.equal(body.agent.role, 'consumer')
  assert.equal(body.providerContext, null)
})

test('restore returns a clear invalid-environment error for unknown API keys', async () => {
  const response = await restoreRoute.POST(
    new NextRequest('http://localhost/api/app/restore', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ apiKey: 'adp_unknown_key' }),
    })
  )

  assert.equal(response.status, 401)
  const body = await response.json()
  assert.equal(body.error.code, 'RESTORE_KEY_INVALID')
})

test('restore returns a clear revoked-key error', async () => {
  const registration = await registerNativeAgent({
    name: 'Restore Revoked Provider',
    role: 'provider',
    supported_protocol_versions: ['2.0'],
    description: 'Revoked restore route test',
  })

  const credential = await getAgentCredentialBySecretHash(hashAgentApiKey(registration.apiKey))
  assert.ok(credential)
  await revokeAgentCredential(credential.id)

  const response = await restoreRoute.POST(
    new NextRequest('http://localhost/api/app/restore', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ apiKey: registration.apiKey }),
    })
  )

  assert.equal(response.status, 401)
  const body = await response.json()
  assert.equal(body.error.code, 'RESTORE_KEY_REVOKED')
})
