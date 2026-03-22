import assert from 'node:assert/strict'
import { mkdirSync, mkdtempSync, rmSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'
import { NextRequest } from 'next/server'

const tempDataRoot = mkdtempSync(path.join(os.tmpdir(), 'adp-runtime-route-tests-'))

process.env.ADP_DATA_ROOT = tempDataRoot
process.env.ADP_RUNTIME_TEST_STUB = '1'
process.env.AGENT_SECRET_ENCRYPTION_KEY = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef'
process.env.OPENAI_API_KEY = 'hosted-openai-key'
process.env.ANTHROPIC_API_KEY = 'hosted-anthropic-key'

const runtimeRoute = await import('../src/app/api/app/agents/runtime/route.ts')
const policyRoute = await import('../src/app/api/app/agents/runtime/policy/route.ts')
const sandboxRoute = await import('../src/app/api/app/agents/runtime/sandbox/route.ts')

function resetStores() {
  rmSync(tempDataRoot, { recursive: true, force: true })
  mkdirSync(tempDataRoot, { recursive: true })
}

test.beforeEach(() => {
  resetStores()
})

test('owner-private access is enforced on runtime routes', async () => {
  const runtimeGet = await runtimeRoute.GET(new NextRequest('http://localhost/api/app/agents/runtime'))
  const runtimePost = await runtimeRoute.POST(
    new NextRequest('http://localhost/api/app/agents/runtime', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ provider: 'openai' }),
    })
  )
  const policyPatch = await policyRoute.PATCH(
    new NextRequest('http://localhost/api/app/agents/runtime/policy', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ enabled: false }),
    })
  )
  const sandboxPost = await sandboxRoute.POST(
    new NextRequest('http://localhost/api/app/agents/runtime/sandbox', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ prompt: 'test' }),
    })
  )

  assert.equal(runtimeGet.status, 401)
  assert.equal(runtimePost.status, 401)
  assert.equal(policyPatch.status, 401)
  assert.equal(sandboxPost.status, 401)

  const runtimeGetBody = await runtimeGet.json()
  const runtimePostBody = await runtimePost.json()
  const policyPatchBody = await policyPatch.json()
  const sandboxPostBody = await sandboxPost.json()

  assert.equal(runtimeGetBody.error.code, 'OWNER_AUTH_REQUIRED')
  assert.equal(runtimePostBody.error.code, 'OWNER_AUTH_REQUIRED')
  assert.equal(policyPatchBody.error.code, 'OWNER_AUTH_REQUIRED')
  assert.equal(sandboxPostBody.error.code, 'OWNER_AUTH_REQUIRED')
})
