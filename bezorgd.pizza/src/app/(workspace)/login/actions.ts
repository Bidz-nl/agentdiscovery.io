'use server'

import { redirect } from 'next/navigation'

import {
  authenticateProviderWorkspace,
  clearProviderWorkspaceSession,
  setProviderWorkspaceSession,
} from '@/lib/provider-workspace/provider-workspace-auth'

export async function signInToProviderWorkspace(_previousState: { error: string }, formData: FormData) {
  const providerDid = String(formData.get('providerDid') ?? '').trim()
  const accessCode = String(formData.get('accessCode') ?? '')

  const session = authenticateProviderWorkspace(providerDid, accessCode)

  if (!session) {
    return {
      error: 'De combinatie van restaurant en werkvloer-code klopt nog niet.',
    }
  }

  await setProviderWorkspaceSession(session)
  redirect(`/provider/${encodeURIComponent(session.activeProviderDid)}/orders`)
}

export async function signOutFromProviderWorkspace() {
  await clearProviderWorkspaceSession()
  redirect('/login')
}
