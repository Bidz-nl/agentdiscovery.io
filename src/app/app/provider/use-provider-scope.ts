"use client"

import { useCallback, useEffect, useState } from 'react'

import ADPClient from '@/app/app/lib/adp-client'
import type { OwnerProviderContextResponse } from '@/lib/owner-private-auth'

export function useProviderScope(appApiKey: string | null) {
  const [context, setContext] = useState<OwnerProviderContextResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSwitching, setIsSwitching] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const loadContext = useCallback(async () => {
    if (!appApiKey) {
      setContext(null)
      setIsLoading(false)
      return
    }

    try {
      setErrorMessage(null)
      const client = new ADPClient(appApiKey)
      const response = await client.getOwnerProviderContext()
      setContext(response)
    } catch (error) {
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
      setErrorMessage(null)

      try {
        const client = new ADPClient(appApiKey)
        const response = await client.switchOwnerProviderContext(activeProviderDid)
        setContext(response)
        return response
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unable to switch provider scope'
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
    loadContext,
    switchProvider,
  }
}
