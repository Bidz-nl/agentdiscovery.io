import { getAgentRecordByName } from '@/lib/adp-v2/agent-record-repository'

function normalizeAgentName(name: string) {
  return name.trim()
}

function validateReservedAgentName(name: string) {
  const normalizedName = name.trim().toLowerCase()
  const reservedExactNames = new Set<string>()

  if (reservedExactNames.has(normalizedName)) {
    return {
      code: 'AGENT_NAME_RESTRICTED',
      message: 'This bot name is not available. Choose a different name.',
    }
  }

  return null
}

export function validateAgentNamePolicy(name: string, options?: { excludeDid?: string | null }) {
  const normalizedName = normalizeAgentName(name)

  if (!normalizedName) {
    return {
      code: 'INVALID_AGENT_NAME',
      message: 'Bot name is required.',
    }
  }

  const reservedNameError = validateReservedAgentName(normalizedName)
  if (reservedNameError) {
    return reservedNameError
  }

  const existingAgent = getAgentRecordByName(normalizedName)
  if (existingAgent && existingAgent.did !== (options?.excludeDid ?? null)) {
    return {
      code: 'AGENT_NAME_TAKEN',
      message: 'This bot name already exists. Choose a different name.',
    }
  }

  return null
}

export function sanitizeAgentName(name: string) {
  return normalizeAgentName(name)
}
