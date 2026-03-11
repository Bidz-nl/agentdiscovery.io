import type { HandshakeRequest, HandshakeRole } from '@/lib/adp-v2/handshake-types'

const VALID_ROLES: HandshakeRole[] = ['consumer', 'provider', 'broker']

export type HandshakeValidationResult =
  | { success: true; data: HandshakeRequest }
  | { success: false; errors: string[] }

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.length > 0 && value.every(isNonEmptyString)
}

export function validateHandshakeRequest(input: unknown): HandshakeValidationResult {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
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

  if (!isNonEmptyString(payload.protocol_version)) {
    errors.push('protocol_version is required and must be a non-empty string')
  }

  if (!isNonEmptyString(payload.role) || !VALID_ROLES.includes(payload.role as HandshakeRole)) {
    errors.push('role is required and must be one of: consumer, provider, broker')
  }

  if (!isStringArray(payload.supported_versions)) {
    errors.push('supported_versions is required and must be a non-empty string array')
  }

  if (!isNonEmptyString(payload.nonce)) {
    errors.push('nonce is required and must be a non-empty string')
  }

  if (!isNonEmptyString(payload.timestamp) || Number.isNaN(Date.parse(payload.timestamp))) {
    errors.push('timestamp is required and must be a valid ISO date string')
  }

  if (payload.message_type !== undefined && payload.message_type !== 'HELLO') {
    errors.push('message_type must be HELLO when provided')
  }

  if (payload.signature !== undefined && typeof payload.signature !== 'string') {
    errors.push('signature must be a string when provided')
  }

  if (payload.supported_modes !== undefined) {
    const supportedModes = payload.supported_modes
    if (!Array.isArray(supportedModes) || !supportedModes.every(isNonEmptyString)) {
      errors.push('supported_modes must be an array of strings when provided')
    }
  }

  if (payload.authority_digest !== undefined) {
    const authorityDigest = payload.authority_digest
    if (!authorityDigest || typeof authorityDigest !== 'object' || Array.isArray(authorityDigest)) {
      errors.push('authority_digest must be an object when provided')
    }
  }

  if (payload.reputation_ref !== undefined) {
    const reputationRef = payload.reputation_ref
    if (!reputationRef || typeof reputationRef !== 'object' || Array.isArray(reputationRef)) {
      errors.push('reputation_ref must be an object when provided')
    }
  }

  if (errors.length > 0) {
    return { success: false, errors }
  }

  const did = payload.did as string
  const protocolVersion = payload.protocol_version as string
  const role = payload.role as HandshakeRole
  const supportedVersions = (payload.supported_versions as string[]).map((version) => version.trim())
  const nonce = payload.nonce as string
  const timestamp = payload.timestamp as string

  return {
    success: true,
    data: {
      message_type: payload.message_type === 'HELLO' ? 'HELLO' : undefined,
      did: did.trim(),
      protocol_version: protocolVersion.trim(),
      role,
      supported_versions: supportedVersions,
      supported_modes: Array.isArray(payload.supported_modes)
        ? payload.supported_modes.map((mode) => mode.trim())
        : undefined,
      authority_digest:
        payload.authority_digest && typeof payload.authority_digest === 'object' && !Array.isArray(payload.authority_digest)
          ? (payload.authority_digest as Record<string, unknown>)
          : undefined,
      reputation_ref:
        payload.reputation_ref && typeof payload.reputation_ref === 'object' && !Array.isArray(payload.reputation_ref)
          ? payload.reputation_ref as HandshakeRequest['reputation_ref']
          : undefined,
      nonce: nonce.trim(),
      timestamp: new Date(timestamp).toISOString(),
      signature: typeof payload.signature === 'string' ? payload.signature : undefined,
    },
  }
}
