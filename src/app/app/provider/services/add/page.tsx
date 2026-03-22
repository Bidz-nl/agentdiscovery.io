"use client"

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Plus } from 'lucide-react'

import ADPClient from '@/app/app/lib/adp-client'
import { useAgentStore } from '@/app/app/lib/agent-store'
import {
  OwnerServiceForm,
  toOwnerServiceFormValues,
  toOwnerServiceRequest,
  type OwnerServiceFormValues,
} from '@/app/app/provider/services/OwnerServiceForm'

export default function AddOwnerServicePage() {
  const router = useRouter()
  const { appSession, setAppSession, name: botName } = useAgentStore()
  const appApiKey = appSession.apiKey
  const [values, setValues] = useState<OwnerServiceFormValues>(() => toOwnerServiceFormValues())
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [manualApiKey, setManualApiKey] = useState('')

  const handleRestoreSession = () => {
    const trimmedApiKey = manualApiKey.trim()
    if (!trimmedApiKey) {
      setErrorMessage('Paste your API key to continue with this capability draft')
      return
    }

    setAppSession({
      apiKey: trimmedApiKey,
    })
    setErrorMessage(null)
  }

  const handleCreate = async () => {
    if (!appApiKey) {
      setErrorMessage('Owner app session is required to create a draft service')
      return
    }

    setIsSubmitting(true)
    setErrorMessage(null)

    try {
      const client = new ADPClient(appApiKey)
      const response = await client.createOwnerService(toOwnerServiceRequest(values))
      router.replace(`/app/provider/services/${response.service.id}`)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to create draft service')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen px-4 pb-24 pt-12">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <div className="mb-3 flex items-center gap-3 text-white/40">
              <Link
                href="/app/provider/services"
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/70 transition-colors hover:bg-white/10"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Link>
            </div>
            <h1 className="text-2xl font-bold">Add capability</h1>
            {botName ? (
              <p className="mt-1 text-sm text-white/40">For <span className="font-medium text-white/70">{botName}</span> — save as draft first, publish when ready.</p>
            ) : (
              <p className="mt-1 text-sm text-white/40">Create a private capability draft first. Publishing remains a separate step.</p>
            )}
          </div>
          <div className="hidden h-12 w-12 items-center justify-center rounded-2xl bg-green-500/10 text-green-400 sm:flex">
            <Plus className="h-5 w-5" />
          </div>
        </div>

        <div className="rounded-3xl border border-white/5 bg-[#111827] p-5 sm:p-6">
          {!appApiKey ? (
            <div className="mb-5 rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-4">
              <p className="text-sm font-medium text-amber-200">Restore your owner session</p>
              <p className="mt-1 text-xs text-amber-100/70">
                This browser does not currently have the API key for this agent in its app session. Paste the API key you received after registration to continue.
              </p>
              <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                <input
                  type="password"
                  value={manualApiKey}
                  onChange={(event) => setManualApiKey(event.target.value)}
                  placeholder="Paste API key"
                  className="flex-1 rounded-xl border border-white/10 bg-[#0A0E17] px-4 py-3 text-sm text-white placeholder:text-white/20 focus:border-green-500/50 focus:outline-none transition-colors"
                />
                <button
                  type="button"
                  onClick={handleRestoreSession}
                  className="rounded-xl border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm font-medium text-green-200 transition-colors hover:bg-green-500/20"
                >
                  Use API key
                </button>
              </div>
            </div>
          ) : null}
          <OwnerServiceForm
            values={values}
            onChange={setValues}
            onSubmit={handleCreate}
            isSubmitting={isSubmitting}
            submitLabel="Save draft"
            errorMessage={errorMessage}
            botName={botName ?? undefined}
            helperText="Start with one clear capability for this agent. Save it privately first, then publish it when you are happy with how others will understand it."
          />
        </div>
      </div>
    </div>
  )
}
