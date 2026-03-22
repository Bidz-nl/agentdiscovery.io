import { NextRequest, NextResponse } from 'next/server'

import type { SandboxRunRequest } from '@/lib/agent-runtime'
import { runAgentSandbox } from '@/lib/agent-runtime-service'
import { resolveOwnerPrivateAuthContext } from '@/lib/owner-private-auth-resolver'

export async function POST(request: NextRequest) {
  const ownerSession = await resolveOwnerPrivateAuthContext(request)

  if (!ownerSession) {
    return NextResponse.json({ error: { code: 'OWNER_AUTH_REQUIRED', message: 'Owner app session is required to run a sandbox test' } }, { status: 401 })
  }

  let body: unknown

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: { code: 'INVALID_SANDBOX_REQUEST', message: 'Request body must be valid JSON' } }, { status: 400 })
  }

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return NextResponse.json({ error: { code: 'INVALID_SANDBOX_REQUEST', message: 'Sandbox request body must be a JSON object' } }, { status: 400 })
  }

  try {
    const result = await runAgentSandbox(ownerSession.activeAgentDid, ownerSession.activeProviderDid, body as SandboxRunRequest)
    return NextResponse.json({ run: result.run, runtime: result.runtime })
  } catch (error) {
    return NextResponse.json({ error: { code: 'SANDBOX_RUN_FAILED', message: error instanceof Error ? error.message : 'Unable to run sandbox test' } }, { status: 400 })
  }
}
