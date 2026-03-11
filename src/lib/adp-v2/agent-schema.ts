import type {
  AgentCapability,
  AgentRegistrationRequest,
  AgentRegistrationValidationResult,
  AgentRole,
} from '@/lib/adp-v2/agent-types'

const VALID_AGENT_ROLES: AgentRole[] = ['consumer', 'provider', 'broker']

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.length > 0 && value.every(isNonEmptyString)
}

function isOptionalStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(isNonEmptyString)
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value)
}

function isValidCapability(value: unknown): value is AgentCapability {
  if (!isPlainObject(value)) {
    return false
  }

  if (!isNonEmptyString(value.key) || !isNonEmptyString(value.description)) {
    return false
  }

  if (value.input_schema !== undefined && !isPlainObject(value.input_schema)) {
    return false
  }

  if (value.output_schema !== undefined && !isPlainObject(value.output_schema)) {
    return false
  }

  return true
}

export function validateAgentRegistration(input: unknown): AgentRegistrationValidationResult {
  if (!isPlainObject(input)) {
    return {
      success: false,
      errors: ['Request body must be a JSON object'],
    }
  }

  const payload = input as Record<string, unknown>
  const errors: string[] = []

  if (!isNonEmptyString(payload.did)) {
    errors.push('did is required and must be a non-empty string')
  }

  if (!isNonEmptyString(payload.name)) {
    errors.push('name is required and must be a non-empty string')
  }

  if (!isNonEmptyString(payload.role) || !VALID_AGENT_ROLES.includes(payload.role as AgentRole)) {
    errors.push('role is required and must be one of: consumer, provider, broker')
  }

  if (payload.description !== undefined && typeof payload.description !== 'string') {
    errors.push('description must be a string when provided')
  }

  if (payload.categories !== undefined && !isOptionalStringArray(payload.categories)) {
    errors.push('categories must be an array of non-empty strings when provided')
  }

  if (!Array.isArray(payload.capabilities) || payload.capabilities.length === 0 || !payload.capabilities.every(isValidCapability)) {
    errors.push('capabilities is required and must be a non-empty array of valid capability objects')
  }

  if (!isStringArray(payload.supported_protocol_versions)) {
    errors.push('supported_protocol_versions is required and must be a non-empty string array')
  }

  if (payload.supported_modes !== undefined && !isOptionalStringArray(payload.supported_modes)) {
    errors.push('supported_modes must be an array of non-empty strings when provided')
  }

  if (payload.authority_summary !== undefined && !isPlainObject(payload.authority_summary)) {
    errors.push('authority_summary must be an object when provided')
  }

  if (errors.length > 0) {
    return { success: false, errors }
  }

  const capabilities = (payload.capabilities as AgentCapability[]).map((capability) => ({
    key: capability.key.trim(),
    description: capability.description.trim(),
    input_schema: capability.input_schema,
    output_schema: capability.output_schema,
  }))

  return {
    success: true,
    data: {
      did: (payload.did as string).trim(),
      name: (payload.name as string).trim(),
      role: payload.role as AgentRole,
      description: typeof payload.description === 'string' ? payload.description.trim() : undefined,
      categories: Array.isArray(payload.categories)
        ? payload.categories.map((category) => category.trim())
        : undefined,
      capabilities,
      supported_protocol_versions: (payload.supported_protocol_versions as string[]).map((version) => version.trim()),
      supported_modes: Array.isArray(payload.supported_modes)
        ? payload.supported_modes.map((mode) => mode.trim())
        : undefined,
      authority_summary: isPlainObject(payload.authority_summary)
        ? payload.authority_summary
        : undefined,
    } satisfies AgentRegistrationRequest,
  }
}
