import { createHmac, timingSafeEqual } from 'node:crypto'

import { cookies } from 'next/headers'

const PROVIDER_WORKSPACE_SESSION_COOKIE = 'bezorgd_provider_workspace'
const PROVIDER_WORKSPACE_SESSION_TTL_SECONDS = 60 * 60 * 12
const PROVIDER_WORKSPACE_SESSION_SECRET = process.env.WORKSPACE_SESSION_SECRET ?? 'bezorgd-workspace-dev-secret'

const PROVIDER_WORKSPACE_ACCESS: Record<string, { accessCode: string }> = {
  'did:bezorgd:pizza-west': { accessCode: 'roma-west-werkvloer' },
  'did:bezorgd:noord-mix': { accessCode: 'noord-mix-shift' },
  'did:bezorgd:piazza-rotterdam': { accessCode: 'piazza-010-keuken' },
}

type ProviderWorkspaceSession = {
  activeProviderDid: string
  authorizedProviderDids: string[]
  signedInAt: string
}

function signPayload(payload: string) {
  return createHmac('sha256', PROVIDER_WORKSPACE_SESSION_SECRET).update(payload).digest('base64url')
}

function serializeSession(session: ProviderWorkspaceSession) {
  const payload = Buffer.from(JSON.stringify(session), 'utf8').toString('base64url')
  const signature = signPayload(payload)
  return `${payload}.${signature}`
}

function parseSessionValue(value: string | undefined | null): ProviderWorkspaceSession | null {
  if (!value) {
    return null
  }

  const [payload, signature] = value.split('.')

  if (!payload || !signature) {
    return null
  }

  const expectedSignature = signPayload(payload)

  if (signature.length !== expectedSignature.length) {
    return null
  }

  const left = Buffer.from(signature)
  const right = Buffer.from(expectedSignature)

  if (!timingSafeEqual(left, right)) {
    return null
  }

  try {
    const parsed = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as ProviderWorkspaceSession

    if (
      !parsed ||
      typeof parsed.activeProviderDid !== 'string' ||
      !Array.isArray(parsed.authorizedProviderDids) ||
      parsed.authorizedProviderDids.some((entry) => typeof entry !== 'string')
    ) {
      return null
    }

    return parsed
  } catch {
    return null
  }
}

export function getProviderWorkspaceAccessCode(providerDid: string) {
  return PROVIDER_WORKSPACE_ACCESS[providerDid]?.accessCode ?? null
}

export function authenticateProviderWorkspace(providerDid: string, accessCode: string) {
  const configuredAccessCode = getProviderWorkspaceAccessCode(providerDid)

  if (!configuredAccessCode || configuredAccessCode !== accessCode.trim()) {
    return null
  }

  return {
    activeProviderDid: providerDid,
    authorizedProviderDids: [providerDid],
    signedInAt: new Date().toISOString(),
  } satisfies ProviderWorkspaceSession
}

export async function setProviderWorkspaceSession(session: ProviderWorkspaceSession) {
  const cookieStore = await cookies()

  cookieStore.set(PROVIDER_WORKSPACE_SESSION_COOKIE, serializeSession(session), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: PROVIDER_WORKSPACE_SESSION_TTL_SECONDS,
  })
}

export async function clearProviderWorkspaceSession() {
  const cookieStore = await cookies()
  cookieStore.delete(PROVIDER_WORKSPACE_SESSION_COOKIE)
}

export async function getProviderWorkspaceSession() {
  const cookieStore = await cookies()
  return parseSessionValue(cookieStore.get(PROVIDER_WORKSPACE_SESSION_COOKIE)?.value)
}

export async function isAuthorizedForProviderWorkspace(providerDid: string) {
  const session = await getProviderWorkspaceSession()

  if (!session) {
    return false
  }

  return session.authorizedProviderDids.includes(providerDid)
}

export async function getAuthorizedProviderWorkspaceSession(providerDid: string) {
  const session = await getProviderWorkspaceSession()

  if (!session || !session.authorizedProviderDids.includes(providerDid)) {
    return null
  }

  return session
}
