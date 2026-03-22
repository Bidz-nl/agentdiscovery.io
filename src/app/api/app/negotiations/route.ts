import { NextRequest, NextResponse } from 'next/server'

import { resolveOwnerPrivateAuthContext } from '@/lib/owner-private-auth-resolver'
import { listSessionNegotiationRecords } from '@/lib/adp-v2/session-negotiation-repository'
import { listNativeNegotiationRecords } from '@/lib/adp-v2/native-negotiation-repository'

export async function GET(request: NextRequest) {
  const ownerSession = await resolveOwnerPrivateAuthContext(request)

  if (!ownerSession) {
    return NextResponse.json(
      { error: { code: 'AUTH_REQUIRED', message: 'Authentication required' } },
      { status: 401 }
    )
  }

  const activeDid = ownerSession.activeProviderDid

  const [allNative, allSession] = await Promise.all([
    listNativeNegotiationRecords(),
    listSessionNegotiationRecords(),
  ])

  const native = allNative.filter(
    (n) => n.initiatorDid === activeDid || n.responderDid === activeDid
  )

  const session = allSession.filter(
    (n) => n.initiatorDid === activeDid || n.responderDid === activeDid
  )

  const nativeIds = new Set(native.map((n) => n.id))
  const all = [...native, ...session.filter((n) => !nativeIds.has(n.id))]
  all.sort((a, b) => b.id - a.id)

  return NextResponse.json({ negotiations: all })
}
