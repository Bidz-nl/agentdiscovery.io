export interface OwnerPrincipal {
  ownerId: string
  externalSubject: string
  createdAt: string
  status: 'active'
}

export interface OwnerProviderMembership {
  membershipId: string
  ownerId: string
  providerDid: string
  role: 'owner'
  createdAt: string
  status: 'active'
}

export interface OwnerAppSession {
  sessionId: string
  ownerId: string
  credentialFingerprint: string
  activeProviderDid: string | null
  authorizedProviderDids: string[]
  createdAt: string
  expiresAt: string
}

export interface OwnerPrivateAuthContext {
  ownerId: string
  sessionId: string
  activeAgentDid: string
  activeProviderDid: string
  authorizedProviderDids: string[]
}

export interface OwnerProviderContextResponse {
  owner: {
    ownerId: string
    sessionId: string
  }
  providerScope: {
    activeProviderDid: string
    authorizedProviderDids: string[]
  }
}

export interface SwitchActiveProviderRequest {
  activeProviderDid: string
}
