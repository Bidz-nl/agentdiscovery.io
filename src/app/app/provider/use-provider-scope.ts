"use client"

import { useCallback, useEffect, useState } from 'react'

import ADPClient from '@/app/app/lib/adp-client'
import type { OwnerProviderContextResponse } from '@/lib/owner-private-auth'

type RequestError = Error & {
  status?: number
  code?: string
}

export function useProviderScope(appApiKey: string | null) {
  const [context, setContext] = useState<OwnerProviderContextResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSwitching, setIsSwitching] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [needsReauth, setNeedsReauth] = useState(false)

  const loadContext = useCallback(async () => {
    if (!appApiKey) {
      setContext(null)
      setNeedsReauth(false)
      setIsLoading(false)
      return
    }

    try {
      setNeedsReauth(false)
      setErrorMessage(null)
      const client = new ADPClient(appApiKey)
      const response = await client.getOwnerProviderContext()
      setContext(response)
    } catch (error) {
      const requestError = error as RequestError | null
      if (requestError?.status === 401 || requestError?.code === 'OWNER_AUTH_REQUIRED') {
        setNeedsReauth(true)
      }
      setErrorMessage(error instanceof Error ? error.message : 'Unable to load active provider scope')
      setContext(null)
    } finally {
      setIsLoading(false)
    }
  }, [appApiKey])

  useEffect(() => {
    setIsLoading(true)
    loadContext()
  }, [loadContext])

  const switchProvider = useCallback(
    async (activeProviderDid: string) => {
      if (!appApiKey) {
        throw new Error('Owner app session is required to switch provider scope')
      }

      setIsSwitching(true)
      setNeedsReauth(false)
      setErrorMessage(null)

      try {
        const client = new ADPClient(appApiKey)
        const response = await client.switchOwnerProviderContext(activeProviderDid)
        setContext(response)
        return response
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unable to switch provider scope'
        const requestError = error as RequestError | null
        if (requestError?.status === 401 || requestError?.code === 'OWNER_AUTH_REQUIRED') {
          setNeedsReauth(true)
          setContext(null)
        }
        setErrorMessage(message)
        throw new Error(message)
      } finally {
        setIsSwitching(false)
      }
    },
    [appApiKey]
  )

  return {
    context,
    isLoading,
    isSwitching,
    errorMessage,
    needsReauth,
    loadContext,
    switchProvider,
  }
}
