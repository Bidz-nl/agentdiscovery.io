import { NextRequest, NextResponse } from 'next/server'

import type { ConnectRuntimeProviderRequest } from '@/lib/agent-runtime'
import { connectAgentRuntimeProvider, getAgentRuntimeReadModelByDid } from '@/lib/agent-runtime-service'
import { resolveOwnerPrivateAuthContext } from '@/lib/owner-private-auth-resolver'

export async function GET(request: NextRequest) {
  const ownerSession = await resolveOwnerPrivateAuthContext(request)

  if (!ownerSession) {
    return NextResponse.json({ error: { code: 'OWNER_AUTH_REQUIRED', message: 'Owner app session is required to read bot runtime settings' } }, { status: 401 })
  }

  const runtime = await getAgentRuntimeReadModelByDid(ownerSession.activeAgentDid)

  if (!runtime) {
    return NextResponse.json({ error: { code: 'AGENT_NOT_FOUND', message: 'Bot runtime could not be found' } }, { status: 404 })
  }

  return NextResponse.json({ runtime })
}

export async function POST(request: NextRequest) {
  const ownerSession = await resolveOwnerPrivateAuthContext(request)

  if (!ownerSession) {
    return NextResponse.json({ error: { code: 'OWNER_AUTH_REQUIRED', message: 'Owner app session is required to connect a runtime provider' } }, { status: 401 })
  }

  let body: unknown

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: { code: 'INVALID_RUNTIME_CONNECT_REQUEST', message: 'Request body must be valid JSON' } }, { status: 400 })
  }

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return NextResponse.json({ error: { code: 'INVALID_RUNTIME_CONNECT_REQUEST', message: 'Runtime connect request body must be a JSON object' } }, { status: 400 })
  }

  const input = body as ConnectRuntimeProviderRequest

  if (input.provider !== 'openai' && input.provider !== 'anthropic') {
    return NextResponse.json({ error: { code: 'INVALID_PROVIDER', message: 'Supported providers are openai and anthropic' } }, { status: 400 })
  }

  try {
    const result = await connectAgentRuntimeProvider(ownerSession.activeAgentDid, input)
    return NextResponse.json({
      validation: {
        ok: result.validation.ok,
        provider: input.provider,
        message: result.validation.message,
        model: result.validation.resolvedModel,
      },
      runtime: result.runtime,
    })
  } catch (error) {
    return NextResponse.json({ error: { code: 'RUNTIME_CONNECT_FAILED', message: error instanceof Error ? error.message : 'Unable to connect provider runtime' } }, { status: 400 })
  }
}
