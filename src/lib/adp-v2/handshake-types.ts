export type HandshakeRole = 'consumer' | 'provider' | 'broker'

export type HandshakeStatus = 'pending' | 'open' | 'rejected' | 'expired'

export type HandshakeTrustLevel = 'provisional' | 'verified' | 'restricted'

export interface HandshakeReputationRef {
  score?: number
  completed_transactions?: number
}

export interface HandshakeRequest {
  message_type?: 'HELLO'
  protocol_version: string
  did: string
  role: HandshakeRole
  supported_versions: string[]
  supported_modes?: string[]
  authority_digest?: Record<string, unknown>
  reputation_ref?: HandshakeReputationRef
  nonce: string
  timestamp: string
  signature?: string
}

export interface HandshakeAckResponse {
  message_type: 'ACK'
  accepted: true
  session_id: string
  status: HandshakeStatus
  trust_level: HandshakeTrustLevel
  expires_at: string
}

export interface HandshakeSession {
  session_id: string
  initiator_did: string
  protocol_version: string
  role: HandshakeRole
  supported_versions: string[]
  supported_modes: string[]
  authority_digest: Record<string, unknown>
  reputation_ref?: HandshakeReputationRef
  nonce: string
  timestamp: string
  signature?: string
  status: HandshakeStatus
  trust_level: HandshakeTrustLevel
  created_at: string
  expires_at: string
}
