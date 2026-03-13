import type { AgentRole, NativeAgentRegistrationRequest } from '@/lib/adp-v2/agent-types'

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

function isAgentRole(value: unknown): value is AgentRole {
  return value === 'consumer' || value === 'provider' || value === 'broker'
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.length > 0 && value.every(isNonEmptyString)
}

export function validateNativeAgentRegistration(input: unknown):
  | { success: true; data: NativeAgentRegistrationRequest }
  | { success: false; errors: string[] } {
  if (!isRecord(input)) {
    return {
      success: false,
      errors: ['Request body must be a JSON object'],
    }
  }

  const payload = input as Record<string, unknown>
  const errors: string[] = []

  if (!isNonEmptyString(payload.name)) {
    errors.push('name is required and must be a non-empty string')
  }

  if (!isAgentRole(payload.role)) {
    errors.push('role is required and must be one of: consumer, provider, broker')
  }

  if (payload.description !== undefined && typeof payload.description !== 'string') {
    errors.push('description must be a string when provided')
  }

  if (payload.supported_protocol_versions !== undefined && !isStringArray(payload.supported_protocol_versions)) {
    errors.push('supported_protocol_versions must be a non-empty string array when provided')
  }

  if (payload.authority_summary !== undefined && !isRecord(payload.authority_summary)) {
    errors.push('authority_summary must be an object when provided')
  }

  if (errors.length > 0) {
    return {
      success: false,
      errors,
    }
  }

  const name = payload.name as string
  const role = payload.role as AgentRole
  const description = typeof payload.description === 'string' ? payload.description.trim() : undefined
  const supportedProtocolVersions = isStringArray(payload.supported_protocol_versions)
    ? payload.supported_protocol_versions.map((version) => version.trim())
    : ['2.0']
  const authoritySummary = isRecord(payload.authority_summary) ? payload.authority_summary : undefined

  return {
    success: true,
    data: {
      name: name.trim(),
      role,
      description,
      supported_protocol_versions: supportedProtocolVersions,
      authority_summary: authoritySummary,
    },
  }
}
