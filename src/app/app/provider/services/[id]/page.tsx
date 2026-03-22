"use client"

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { AlertCircle, ArrowLeft, Loader2, RotateCcw, Trash2 } from 'lucide-react'

import ADPClient from '@/app/app/lib/adp-client'
import { useAgentStore } from '@/app/app/lib/agent-store'
import ProviderScopeCard from '@/app/app/provider/ProviderScopeCard'
import {
  OwnerServiceForm,
  toOwnerServiceFormValues,
  toOwnerServiceRequest,
  type OwnerServiceFormValues,
} from '@/app/app/provider/services/OwnerServiceForm'
import type { OwnerServiceReadModel } from '@/lib/owner-services'

type LoadState = 'loading' | 'ready' | 'auth_required' | 'not_found' | 'error'

function getDisplayStatus(service: OwnerServiceReadModel | null) {
  if (!service) {
    return {
      label: 'Draft only',
      detail: 'This capability exists only as a private draft',
      className: 'bg-white/5 text-white/60 border border-white/10',
    }
  }

  if (service.status === 'archived') {
    return {
      label: 'Archived',
      detail: 'This capability is retained privately and must be restored before further edits or publication',
      className: 'bg-white/5 text-white/60 border border-white/10',
    }
  }

  if (service.publishedCapabilityKey && service.hasUnpublishedChanges) {
    return {
      label: 'Live + unpublished draft changes',
      detail: 'The manifest is live, but your private draft contains newer edits',
      className: 'bg-amber-500/10 text-amber-300 border border-amber-500/20',
    }
  }

  if (service.publishedCapabilityKey) {
    return {
      label: 'Live',
      detail: 'The current draft matches the live manifest projection',
      className: 'bg-green-500/10 text-green-300 border border-green-500/20',
    }
  }

  return {
    label: 'Draft only',
    detail: 'This capability is private and not yet published',
    className: 'bg-white/5 text-white/60 border border-white/10',
  }
}

function getPublishabilityChecks(values: OwnerServiceFormValues) {
  return [
    {
      label: 'Title',
      complete: Boolean(values.title.trim()),
    },
    {
      label: 'Category',
      complete: Boolean(values.category.trim()),
    },
    {
      label: 'Description',
      complete: Boolean(values.description.trim()),
    },
  ]
}

function getPublishedDescriptor(service: OwnerServiceReadModel | null) {
  if (!service?.publishedCapabilityKey) {
    return 'No live publication yet'
  }

  const title = service.title.trim() || 'Untitled capability'
  const category = service.category.trim() || 'uncategorized'
  return `${title} in ${category}`
}

function getNextStepContent(service: OwnerServiceReadModel | null, missingPublishFields: string[]) {
  if (service?.publishedCapabilityKey && service.hasUnpublishedChanges) {
    return {
      title: 'Your draft is saved. Decide if the live version should be updated too.',
      description:
        'Right now your newest edits are private. Republish when you want other agents to see this updated capability.',
      accentClassName: 'border-amber-500/20 bg-amber-500/10',
    }
  }

  if (service?.publishedCapabilityKey) {
    return {
      title: 'Your capability is already live.',
      description:
        'You can keep refining the private draft here, or go back to your capability overview to manage the rest of your profile.',
      accentClassName: 'border-green-500/20 bg-green-500/10',
    }
  }

  if (missingPublishFields.length === 0) {
    return {
      title: 'Your draft is saved and ready for the next step.',
      description:
        'If this wording feels right, publish the draft to make this capability visible to other agents. If not, you can leave it private and continue later.',
      accentClassName: 'border-green-500/20 bg-green-500/10',
    }
  }

  return {
    title: 'Your draft is saved, but it is not ready to publish yet.',
    description: `Before publishing, complete: ${missingPublishFields.join(', ')}.`,
    accentClassName: 'border-white/10 bg-white/5',
  }
}

function confirmPermanentDelete(service: Pick<OwnerServiceReadModel, 'title'>) {
  const promptValue = window.prompt(
    `Type DELETE to permanently remove "${service.title.trim() || 'Untitled service'}". This cannot be undone.`,
    ''
  )

  return promptValue === 'DELETE'
}

function LoadStateView({
  title,
  description,
  showBackLink = true,
}: {
  title: string
  description: string
  showBackLink?: boolean
}) {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md rounded-3xl border border-white/5 bg-[#111827] p-6 text-center">
        <div className="mb-4 flex justify-center text-amber-300">
          <AlertCircle className="h-8 w-8" />
        </div>
        <h1 className="text-xl font-semibold">{title}</h1>
        <p className="mt-2 text-sm text-white/45">{description}</p>
        {showBackLink ? (
          <div className="mt-6">
            <Link
              href="/app/provider/services"
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white/75 transition-colors hover:bg-white/10"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to capabilities
            </Link>
          </div>
        ) : null}
      </div>
    </div>
  )
}

export default function EditOwnerServicePage() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const { appSession, name: botName } = useAgentStore()
  const appApiKey = appSession.apiKey
  const [service, setService] = useState<OwnerServiceReadModel | null>(null)
  const [values, setValues] = useState<OwnerServiceFormValues>(() => toOwnerServiceFormValues())
  const [loadState, setLoadState] = useState<LoadState>('loading')
  const [isSaving, setIsSaving] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)
  const [isUnpublishing, setIsUnpublishing] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const serviceId = typeof params?.id === 'string' ? params.id : null

  const loadService = useCallback(async () => {
    if (!serviceId) {
      setLoadState('not_found')
      return
    }

    if (!appApiKey) {
      setLoadState('auth_required')
      return
    }

    setLoadState('loading')
    setErrorMessage(null)

    try {
      const client = new ADPClient(appApiKey)
      const response = await client.getOwnerService(serviceId)
      setService(response.service)
      setValues(toOwnerServiceFormValues(response.service))
      setLoadState('ready')
    } catch (error) {
      const nextError = error as Error & { status?: number; code?: string }

      if (nextError.status === 401 || nextError.code === 'OWNER_AUTH_REQUIRED') {
        setLoadState('auth_required')
        return
      }

      if (nextError.status === 404 || nextError.code === 'OWNER_SERVICE_NOT_FOUND') {
        setLoadState('not_found')
        return
      }

      setErrorMessage(nextError.message || 'Unable to load owner service')
      setLoadState('error')
    }
  }, [appApiKey, serviceId])

  useEffect(() => {
    loadService()
  }, [loadService])

  const displayStatus = useMemo(() => getDisplayStatus(service), [service])
  const publishabilityChecks = useMemo(() => getPublishabilityChecks(values), [values])
  const missingPublishFields = useMemo(
    () => publishabilityChecks.filter((check) => !check.complete).map((check) => check.label),
    [publishabilityChecks]
  )
  const nextStepContent = useMemo(() => getNextStepContent(service, missingPublishFields), [service, missingPublishFields])

  const withClient = () => {
    if (!appApiKey || !serviceId) {
      throw new Error('Owner app session is required')
    }

    return new ADPClient(appApiKey)
  }

  const handleSave = async () => {
    try {
      setIsSaving(true)
      setErrorMessage(null)
      setStatusMessage(null)
      const client = withClient()
      const response = await client.updateOwnerService(serviceId as string, toOwnerServiceRequest(values))
      setService(response.service)
      setValues(toOwnerServiceFormValues(response.service))
      setStatusMessage('Private capability draft saved. Nothing was published')
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to save draft')
    } finally {
      setIsSaving(false)
    }
  }

  const handlePublish = async () => {
    if (!serviceId) return

    try {
      setIsPublishing(true)
      setErrorMessage(null)
      setStatusMessage(null)
      const client = withClient()
      const response = await client.publishOwnerService(serviceId)
      setService(response.service)
      setValues(toOwnerServiceFormValues(response.service))
      setStatusMessage(
        response.service.hasUnpublishedChanges
          ? 'Live capability republished from your draft'
          : 'Capability draft published to the live manifest'
      )
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to publish capability')
    } finally {
      setIsPublishing(false)
    }
  }

  const handleUnpublish = async () => {
    if (!serviceId) return

    try {
      setIsUnpublishing(true)
      setErrorMessage(null)
      setStatusMessage(null)
      const client = withClient()
      const response = await client.unpublishOwnerService(serviceId)
      setService(response.service)
      setValues(toOwnerServiceFormValues(response.service))
      setStatusMessage('Live publication removed. Your private capability draft is still intact')
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to unpublish capability')
    } finally {
      setIsUnpublishing(false)
    }
  }

  const handleRestore = async () => {
    if (!serviceId) return

    try {
      setErrorMessage(null)
      setStatusMessage(null)
      const client = withClient()
      const response = await client.restoreOwnerService(serviceId)
      setService(response.service)
      setValues(toOwnerServiceFormValues(response.service))
      setStatusMessage('Archived capability restored to an active private draft')
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to restore archived capability')
    }
  }

  const handleDelete = async () => {
    if (!serviceId || !service) return

    if (!confirmPermanentDelete(service)) {
      return
    }

    try {
      setIsDeleting(true)
      setErrorMessage(null)
      setStatusMessage(null)
      const client = withClient()
      await client.deleteOwnerService(serviceId)
      router.replace('/app/provider/services')
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to delete capability')
    } finally {
      setIsDeleting(false)
    }
  }

  if (loadState === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <Loader2 className="h-6 w-6 animate-spin text-white/30" />
      </div>
    )
  }

  if (loadState === 'auth_required') {
    return (
      <LoadStateView
        title="Owner session required"
        description="You need an active owner app session to open this private capability draft."
      />
    )
  }

  if (loadState === 'not_found') {
    return (
      <LoadStateView
        title="Capability not found"
        description="This private capability draft could not be found in the active owner scope."
      />
    )
  }

  if (loadState === 'error') {
    return (
      <LoadStateView
        title="Unable to load capability"
        description={errorMessage ?? 'Something went wrong while loading this private capability draft.'}
      />
    )
  }

  const isArchived = service?.status === 'archived'

  return (
    <div className="min-h-screen px-4 pb-24 pt-12">
      <div className="mx-auto max-w-6xl space-y-6">
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
          <h1 className="text-2xl font-bold">Edit capability</h1>
          <p className="mt-1 text-sm text-white/40">
            Shape how other agents should understand and use this capability. Saving updates the private draft only.
          </p>
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_360px]">
          <div className="space-y-4">
            <div className={`rounded-2xl px-4 py-3 text-sm ${displayStatus.className}`}>
              <div className="font-medium">{displayStatus.label}</div>
              <div className="mt-1 text-xs text-inherit/80">{displayStatus.detail}</div>
            </div>

            {service?.publishedCapabilityKey && service.hasUnpublishedChanges ? (
              <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
                Your live capability is still published, but this draft contains newer private edits. Use <span className="font-medium">Republish live version</span> when you want the public version to catch up.
              </div>
            ) : null}

            {statusMessage ? (
              <div className="rounded-2xl border border-green-500/20 bg-green-500/10 px-4 py-3 text-sm text-green-200">
                {statusMessage}
              </div>
            ) : null}

            {isArchived ? (
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/70">
                This capability is archived. Restore it before editing, publishing, or unpublishing.
              </div>
            ) : null}

            <div className="rounded-3xl border border-white/5 bg-[#111827] p-5 sm:p-6">
              {isArchived ? (
                <div className="space-y-5">
                  <div className="rounded-2xl border border-white/5 bg-white/5 px-4 py-3 text-xs text-white/40">
                    Archived capabilities remain private and keep their draft content and publication history, but they are read-only until restored.
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-2xl border border-white/10 bg-[#111827] px-4 py-3">
                      <div className="text-xs text-white/40">Capability title</div>
                      <div className="mt-1 text-sm text-white/80">{values.title || 'Untitled capability'}</div>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-[#111827] px-4 py-3">
                      <div className="text-xs text-white/40">Capability category</div>
                      <div className="mt-1 text-sm text-white/80">{values.category || 'No category yet'}</div>
                    </div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-[#111827] px-4 py-3">
                    <div className="text-xs text-white/40">What should other agents use this bot for?</div>
                    <div className="mt-1 text-sm text-white/80">{values.description || 'No description yet'}</div>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={handleRestore}
                      disabled={isDeleting}
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-blue-500/30 bg-blue-500/10 px-4 py-3 text-sm font-medium text-blue-300 transition-colors hover:bg-blue-500/20 disabled:border-white/10 disabled:bg-white/5 disabled:text-white/30"
                    >
                      <RotateCcw className="h-4 w-4" />
                      Restore draft
                    </button>
                    <button
                      type="button"
                      onClick={handleDelete}
                      disabled={isDeleting}
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm font-medium text-red-300 transition-colors hover:bg-red-500/20 disabled:border-white/10 disabled:bg-white/5 disabled:text-white/30"
                    >
                      {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                      Delete permanently
                    </button>
                  </div>
                </div>
              ) : (
                <OwnerServiceForm
                  values={values}
                  onChange={setValues}
                  onSubmit={handleSave}
                  botName={botName ?? undefined}
                  isSubmitting={isSaving}
                  submitLabel="Save draft"
                  errorMessage={errorMessage}
                  helperText="Saving updates only the private capability draft. Publish and unpublish remain separate actions, so you can keep refining the wording first."
                  footer={
                    <>
                      <button
                        type="button"
                        onClick={handlePublish}
                        disabled={isPublishing || isSaving || isUnpublishing || isDeleting}
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm font-medium text-green-300 transition-colors hover:bg-green-500/20 disabled:border-white/10 disabled:bg-white/5 disabled:text-white/30"
                      >
                        {isPublishing ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                        {service?.hasUnpublishedChanges || service?.publishedCapabilityKey ? 'Republish live version' : 'Publish draft'}
                      </button>
                      {service?.publishedCapabilityKey ? (
                        <button
                          type="button"
                          onClick={handleUnpublish}
                          disabled={isUnpublishing || isSaving || isPublishing || isDeleting}
                          className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white/70 transition-colors hover:bg-white/10 disabled:text-white/30"
                        >
                          {isUnpublishing ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                          Unpublish live version
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={handleDelete}
                          disabled={isDeleting || isSaving || isPublishing || isUnpublishing}
                          className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm font-medium text-red-300 transition-colors hover:bg-red-500/20 disabled:border-white/10 disabled:bg-white/5 disabled:text-white/30"
                        >
                          {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                          Delete permanently
                        </button>
                      )}
                    </>
                  }
                />
              )}
            </div>
          </div>

          <div className="space-y-4 xl:sticky xl:top-8 xl:self-start">
            <ProviderScopeCard appApiKey={appApiKey} redirectTo="/app/provider/services" />

            {!isArchived ? (
              <div className={`rounded-3xl border p-5 ${nextStepContent.accentClassName}`}>
                <div className="space-y-4">
                  <div>
                    <div className="text-sm font-semibold text-white">What next?</div>
                    <div className="mt-2 text-sm text-white/90">{nextStepContent.title}</div>
                    <div className="mt-2 text-sm leading-6 text-white/65">{nextStepContent.description}</div>
                  </div>

                  <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
                    <div className="rounded-2xl border border-white/10 bg-[#111827]/40 px-3 py-3 text-sm text-white/65">
                      <div className="font-medium text-white/85">Save draft</div>
                      <div className="mt-1">Keeps this capability private while you keep shaping the wording.</div>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-[#111827]/40 px-3 py-3 text-sm text-white/65">
                      <div className="font-medium text-white/85">Publish draft</div>
                      <div className="mt-1">Makes this capability visible in your live manifest for other agents to discover.</div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3">
                    {missingPublishFields.length === 0 ? (
                      <button
                        type="button"
                        onClick={handlePublish}
                        disabled={isPublishing || isSaving || isUnpublishing || isDeleting}
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm font-medium text-green-300 transition-colors hover:bg-green-500/20 disabled:border-white/10 disabled:bg-white/5 disabled:text-white/30"
                      >
                        {isPublishing ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                        {service?.publishedCapabilityKey ? 'Republish live version' : 'Publish draft now'}
                      </button>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => router.push('/app/provider/services')}
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white/75 transition-colors hover:bg-white/10"
                    >
                      Back to capabilities
                    </button>
                  </div>
                </div>
              </div>
            ) : null}

            <div className="rounded-3xl border border-white/5 bg-[#111827] p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-sm font-semibold text-white/80">Publish readiness</h2>
                  <p className="mt-1 text-xs text-white/40">
                    These checks only determine whether the current private capability draft is ready to publish.
                  </p>
                </div>
                <span className={`rounded-full px-2.5 py-1 text-[11px] ${missingPublishFields.length > 0 ? 'bg-amber-500/10 text-amber-300' : 'bg-green-500/10 text-green-300'}`}>
                  {missingPublishFields.length > 0 ? `${missingPublishFields.length} missing` : 'Ready to publish'}
                </span>
              </div>
              <div className="mt-4 space-y-3">
                {publishabilityChecks.map((check) => (
                  <div
                    key={check.label}
                    className={`flex items-center justify-between gap-4 rounded-2xl border px-3 py-3 text-sm ${
                      check.complete ? 'border-green-500/15 bg-green-500/5' : 'border-amber-500/15 bg-amber-500/5'
                    }`}
                  >
                    <div>
                      <span className="block text-white/80">{check.label}</span>
                      <span className="mt-1 block text-xs text-white/40">
                        {check.complete ? 'Ready for publish' : `${check.label} is still missing from the draft`}
                      </span>
                    </div>
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs ${
                        check.complete ? 'bg-green-500/10 text-green-300' : 'bg-amber-500/10 text-amber-300'
                      }`}
                    >
                      {check.complete ? 'Ready' : 'Missing'}
                    </span>
                  </div>
                ))}
              </div>
              {missingPublishFields.length > 0 ? (
                <div className="mt-4 rounded-2xl border border-amber-500/15 bg-amber-500/5 px-4 py-3 text-xs text-amber-200">
                  Missing required publish fields: <span className="font-medium">{missingPublishFields.join(', ')}</span>
                </div>
              ) : (
                <div className="mt-4 rounded-2xl border border-green-500/15 bg-green-500/5 px-4 py-3 text-xs text-green-200">
                  This capability draft has the minimum required fields for publish.
                </div>
              )}
            </div>

            <div className="rounded-3xl border border-white/5 bg-[#111827] p-5">
              <div>
                <h2 className="text-sm font-semibold text-white/80">Live publication</h2>
                <p className="mt-1 text-xs text-white/40">
                  This shows what is currently live in the protocol-visible manifest.
                </p>
              </div>
              <div className="mt-4 space-y-3 text-sm">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-white/40">Current status</span>
                  <span className={`rounded-full px-2.5 py-1 text-xs ${displayStatus.className}`}>{displayStatus.label}</span>
                </div>
                <div className="flex items-start justify-between gap-4">
                  <span className="text-white/40">Published descriptor</span>
                  <span className="max-w-[220px] text-right text-white/70">{getPublishedDescriptor(service)}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-white/40">Published at</span>
                  <span className="text-right text-white/70">{service?.publishedAt ? new Date(service.publishedAt).toLocaleString() : 'Not published'}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-white/40">Unpublished changes</span>
                  <span className="text-white/70">{service?.hasUnpublishedChanges ? 'Yes' : 'No'}</span>
                </div>
                <div className="flex items-start justify-between gap-4">
                  <span className="text-white/40">Capability key</span>
                  <span className="max-w-[220px] break-all text-right text-white/70">{service?.publishedCapabilityKey ?? 'Not published'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
