import { NextRequest, NextResponse } from 'next/server'

import { getAgentProfilePrivateReadModel, updateAgentProfileByDid, type UpdateAgentProfileInput } from '@/lib/adp-v2/agent-profile-service'
import { resolveOwnerPrivateAuthContext } from '@/lib/owner-private-auth-resolver'

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

export async function GET(request: NextRequest) {
  const ownerSession = await resolveOwnerPrivateAuthContext(request)

  if (!ownerSession) {
    return NextResponse.json(
      {
        error: {
          code: 'OWNER_AUTH_REQUIRED',
          message: 'Owner app session is required to read the private bot profile',
        },
      },
      { status: 401 }
    )
  }

  const result = getAgentProfilePrivateReadModel(ownerSession.activeProviderDid)
  if (!result) {
    return NextResponse.json(
      {
        error: {
          code: 'AGENT_PROFILE_NOT_FOUND',
          message: 'Bot profile could not be found',
        },
      },
      { status: 404 }
    )
  }

  return NextResponse.json(result)
}

export async function PATCH(request: NextRequest) {
  const ownerSession = await resolveOwnerPrivateAuthContext(request)

  if (!ownerSession) {
    return NextResponse.json(
      {
        error: {
          code: 'OWNER_AUTH_REQUIRED',
          message: 'Owner app session is required to update the private bot profile',
        },
      },
      { status: 401 }
    )
  }

  let body: unknown

  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      {
        error: {
          code: 'INVALID_AGENT_PROFILE_UPDATE_REQUEST',
          message: 'Request body must be valid JSON',
        },
      },
      { status: 400 }
    )
  }

  if (!isRecord(body)) {
    return NextResponse.json(
      {
        error: {
          code: 'INVALID_AGENT_PROFILE_UPDATE_REQUEST',
          message: 'Agent profile update request body must be a JSON object',
        },
      },
      { status: 400 }
    )
  }

  const policyProfileBody = isRecord(body.policyProfile) ? body.policyProfile : null
  const memoryScopeBody = isRecord(body.memoryScope) ? body.memoryScope : null

  const input: UpdateAgentProfileInput = {
    displayName: typeof body.displayName === 'string' ? body.displayName : undefined,
    purpose: typeof body.purpose === 'string' ? body.purpose : undefined,
    ownerDefinedSpecialty: Array.isArray(body.ownerDefinedSpecialty)
      ? body.ownerDefinedSpecialty.filter((entry): entry is string => typeof entry === 'string')
      : undefined,
    selectedSkillKeys: Array.isArray(body.selectedSkillKeys)
      ? body.selectedSkillKeys.filter((entry): entry is string => typeof entry === 'string')
      : undefined,
    toolGrants: Array.isArray(body.toolGrants)
      ? body.toolGrants
          .filter(isRecord)
          .map((toolGrant) => ({
            toolKey: typeof toolGrant.toolKey === 'string' ? toolGrant.toolKey : '',
            mode: typeof toolGrant.mode === 'string' ? toolGrant.mode as 'deny' | 'read' | 'write' | 'execute' : undefined,
            requiresApproval:
              typeof toolGrant.requiresApproval === 'boolean' ? toolGrant.requiresApproval : undefined,
          }))
          .filter((toolGrant) => toolGrant.toolKey)
      : undefined,
    policyProfile: policyProfileBody
      ? {
          autonomyMode:
            typeof policyProfileBody.autonomyMode === 'string'
              ? policyProfileBody.autonomyMode as 'advisory' | 'semi_autonomous' | 'autonomous'
              : undefined,
          defaultApprovalMode:
            typeof policyProfileBody.defaultApprovalMode === 'string'
              ? policyProfileBody.defaultApprovalMode as 'never' | 'always' | 'conditional'
              : undefined,
          spendCapUsd:
            typeof policyProfileBody.spendCapUsd === 'number' ? policyProfileBody.spendCapUsd : undefined,
          allowExternalSideEffects:
            typeof policyProfileBody.allowExternalSideEffects === 'boolean'
              ? policyProfileBody.allowExternalSideEffects
              : undefined,
          allowCrossCounterpartyMemory:
            typeof policyProfileBody.allowCrossCounterpartyMemory === 'boolean'
              ? policyProfileBody.allowCrossCounterpartyMemory
              : undefined,
        }
      : undefined,
    memoryScope: memoryScopeBody
      ? {
          mode:
            typeof memoryScopeBody.mode === 'string'
              ? memoryScopeBody.mode as 'none' | 'ephemeral' | 'session' | 'agent_private' | 'owner_private'
              : undefined,
          retentionDays:
            typeof memoryScopeBody.retentionDays === 'number' || memoryScopeBody.retentionDays === null
              ? memoryScopeBody.retentionDays as number | null
              : undefined,
          storesPreferenceMemory:
            typeof memoryScopeBody.storesPreferenceMemory === 'boolean'
              ? memoryScopeBody.storesPreferenceMemory
              : undefined,
          storesExecutionMemory:
            typeof memoryScopeBody.storesExecutionMemory === 'boolean'
              ? memoryScopeBody.storesExecutionMemory
              : undefined,
        }
      : undefined,
  }

  const updatedProfile = updateAgentProfileByDid(ownerSession.activeProviderDid, input)
  if (!updatedProfile) {
    return NextResponse.json(
      {
        error: {
          code: 'AGENT_PROFILE_NOT_FOUND',
          message: 'Bot profile could not be updated',
        },
      },
      { status: 404 }
    )
  }

  const result = getAgentProfilePrivateReadModel(ownerSession.activeProviderDid)
  if (!result) {
    return NextResponse.json(
      {
        error: {
          code: 'AGENT_PROFILE_NOT_FOUND',
          message: 'Bot profile could not be found after update',
        },
      },
      { status: 404 }
    )
  }

  return NextResponse.json(result)
}
