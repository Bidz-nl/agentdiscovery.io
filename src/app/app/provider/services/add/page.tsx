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
  const { appSession } = useAgentStore()
  const appApiKey = appSession.apiKey
  const [values, setValues] = useState<OwnerServiceFormValues>(() => toOwnerServiceFormValues())
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

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
            <h1 className="text-2xl font-bold">Add service</h1>
            <p className="mt-1 text-sm text-white/40">Create a private draft first. Publishing remains a separate step.</p>
          </div>
          <div className="hidden h-12 w-12 items-center justify-center rounded-2xl bg-green-500/10 text-green-400 sm:flex">
            <Plus className="h-5 w-5" />
          </div>
        </div>

        <div className="rounded-3xl border border-white/5 bg-[#111827] p-5 sm:p-6">
          <OwnerServiceForm
            values={values}
            onChange={setValues}
            onSubmit={handleCreate}
            isSubmitting={isSubmitting}
            submitLabel="Save draft"
            errorMessage={errorMessage}
          />
        </div>
      </div>
    </div>
  )
}
