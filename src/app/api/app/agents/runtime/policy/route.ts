import { NextRequest, NextResponse } from 'next/server'

import type { UpdateAgentPolicyRequest } from '@/lib/agent-runtime'
import { updateAgentRuntimePolicy } from '@/lib/agent-runtime-service'
import { resolveOwnerPrivateAuthContext } from '@/lib/owner-private-auth-resolver'

export async function PATCH(request: NextRequest) {
  const ownerSession = await resolveOwnerPrivateAuthContext(request)

  if (!ownerSession) {
    return NextResponse.json({ error: { code: 'OWNER_AUTH_REQUIRED', message: 'Owner app session is required to update runtime policy' } }, { status: 401 })
  }

  let body: unknown

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: { code: 'INVALID_RUNTIME_POLICY_REQUEST', message: 'Request body must be valid JSON' } }, { status: 400 })
  }

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return NextResponse.json({ error: { code: 'INVALID_RUNTIME_POLICY_REQUEST', message: 'Runtime policy request body must be a JSON object' } }, { status: 400 })
  }

  try {
    const result = await updateAgentRuntimePolicy(ownerSession.activeAgentDid, body as UpdateAgentPolicyRequest)
    return NextResponse.json({ policy: result.policy, runtime: result.runtime })
  } catch (error) {
    return NextResponse.json({ error: { code: 'RUNTIME_POLICY_UPDATE_FAILED', message: error instanceof Error ? error.message : 'Unable to update runtime policy' } }, { status: 400 })
  }
}
