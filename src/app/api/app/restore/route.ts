import { NextRequest, NextResponse } from 'next/server'

import { hashAgentApiKey, verifyRawAgentApiKey } from '@/lib/adp-v2/agent-api-key'
import { getAgentCredentialBySecretHash } from '@/lib/adp-v2/agent-credential-repository'
import { getAgentRecordById } from '@/lib/adp-v2/agent-record-repository'
import { resolveOwnerPrivateAuthContextFromApiKey } from '@/lib/owner-private-auth-resolver'
import type { OwnerProviderContextResponse } from '@/lib/owner-private-auth'

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

export async function POST(request: NextRequest) {
  let body: unknown

  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      {
        error: {
          code: 'INVALID_RESTORE_REQUEST',
          message: 'Restore request body must be valid JSON.',
        },
      },
      { status: 400 }
    )
  }

  if (!isRecord(body) || typeof body.apiKey !== 'string') {
    return NextResponse.json(
      {
        error: {
          code: 'INVALID_RESTORE_REQUEST',
          message: 'Paste a valid bot API key to restore this session.',
        },
      },
      { status: 400 }
    )
  }

  const apiKey = body.apiKey.trim()
  if (!apiKey) {
    return NextResponse.json(
      {
        error: {
          code: 'INVALID_RESTORE_REQUEST',
          message: 'Paste a valid bot API key to restore this session.',
        },
      },
      { status: 400 }
    )
  }

  const credential = await getAgentCredentialBySecretHash(hashAgentApiKey(apiKey))
  if (!credential) {
    return NextResponse.json(
      {
        error: {
          code: 'RESTORE_KEY_INVALID',
          message: 'This API key is not recognised in the current environment. Check that you copied the full bot API key and that you are using the right local data set.',
        },
      },
      { status: 401 }
    )
  }

  if (credential.status !== 'active') {
    return NextResponse.json(
      {
        error: {
          code: 'RESTORE_KEY_REVOKED',
          message: 'This API key is no longer active. Restore with a current bot API key for this environment.',
        },
      },
      { status: 401 }
    )
  }

  const verified = await verifyRawAgentApiKey(apiKey)
  if (!verified) {
    return NextResponse.json(
      {
        error: {
          code: 'RESTORE_KEY_STALE',
          message: 'This API key is stale or no longer usable for restore in the current environment.',
        },
      },
      { status: 401 }
    )
  }

  const agent = await getAgentRecordById(credential.agentId)
  if (!agent || agent.status !== 'active') {
    return NextResponse.json(
      {
        error: {
          code: 'RESTORE_AGENT_UNAVAILABLE',
          message: 'The bot for this API key is no longer available in the current environment.',
        },
      },
      { status: 409 }
    )
  }

  let providerContext: OwnerProviderContextResponse | null = null

  if (agent.role === 'provider') {
    const ownerSession = await resolveOwnerPrivateAuthContextFromApiKey(apiKey)
    if (!ownerSession) {
      return NextResponse.json(
        {
          error: {
            code: 'PROVIDER_SCOPE_ACTIVATION_FAILED',
            message: 'The API key was recognised, but provider scope could not be activated for this environment.',
          },
        },
        { status: 409 }
      )
    }

    providerContext = {
      owner: {
        ownerId: ownerSession.ownerId,
        sessionId: ownerSession.sessionId,
      },
      providerScope: {
        activeProviderDid: ownerSession.activeProviderDid,
        authorizedProviderDids: ownerSession.authorizedProviderDids,
      },
    }
  }

  return NextResponse.json({
    agent: {
      id: agent.id,
      did: agent.did,
      name: agent.name,
      description: agent.description ?? null,
      role: agent.role,
      updatedAt: agent.updatedAt,
    },
    providerContext,
  })
}
