import { NextRequest } from 'next/server'
import { resolveOwnerPrivateAuthContext } from '@/lib/owner-private-auth-resolver'

export async function resolveOwnerAppSession(
  request: NextRequest
): Promise<{ ownerId: string; activeProviderDid: string } | null> {
  const context = await resolveOwnerPrivateAuthContext(request)
  if (!context) {
    return null
  }

  return {
    ownerId: context.ownerId,
    activeProviderDid: context.activeProviderDid,
  }
}
