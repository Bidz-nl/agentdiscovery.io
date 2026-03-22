"use client"

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Archive, ArrowLeft, ExternalLink, Loader2, Pencil, Plus, RotateCcw, Tag, Trash2 } from 'lucide-react'

import ADPClient from '@/app/app/lib/adp-client'
import { useAgentStore } from '@/app/app/lib/agent-store'
import ProviderScopeCard from '@/app/app/provider/ProviderScopeCard'
import type { OwnerServiceReadModel } from '@/lib/owner-services'

function getDisplayStatus(service: OwnerServiceReadModel) {
  if (service.status === 'archived') {
    return {
      label: 'Archived',
      detail: 'Retained privately outside the active capabilities list',
      className: 'bg-white/5 text-white/55 border border-white/10',
    }
  }

  if (service.publishedCapabilityKey && service.hasUnpublishedChanges) {
    return {
      label: 'Live + unpublished draft changes',
      detail: 'Live in the manifest, but your private draft is ahead',
      className: 'bg-amber-500/10 text-amber-300 border border-amber-500/20',
    }
  }

  if (service.publishedCapabilityKey) {
    return {
      label: 'Live',
      detail: 'Published in the manifest',
      className: 'bg-green-500/10 text-green-400 border border-green-500/20',
    }
  }

  return {
    label: 'Draft only',
    detail: 'Private draft, not yet published',
    className: 'bg-white/5 text-white/55 border border-white/10',
  }
}

function confirmPermanentDelete(service: Pick<OwnerServiceReadModel, 'title'>) {
  const promptValue = window.prompt(
    `Type DELETE to permanently remove "${service.title.trim() || 'Untitled capability'}". This cannot be undone.`,
    ''
  )

  return promptValue === 'DELETE'
}

export default function ProviderServices() {
  const router = useRouter()
  const { appSession, name: botName } = useAgentStore()
  const appApiKey = appSession.apiKey
  const [services, setServices] = useState<OwnerServiceReadModel[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [activeActionKey, setActiveActionKey] = useState<string | null>(null)

  const loadServices = useCallback(async () => {
    if (!appApiKey) {
      setIsLoading(false)
      setServices([])
      return
    }

    try {
      setErrorMessage(null)
      const client = new ADPClient(appApiKey)
      const response = await client.getOwnerServices()
      setServices(response.services || [])
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to load owner services')
    } finally {
      setIsLoading(false)
    }
  }, [appApiKey])

  useEffect(() => {
    loadServices()
  }, [loadServices])

  const sortedServices = useMemo(
    () =>
      [...services].sort((left, right) => {
        if (left.status === 'published' && right.status !== 'published') return -1
        if (left.status !== 'published' && right.status === 'published') return 1
        return right.updatedAt.localeCompare(left.updatedAt)
      }),
    [services]
  )
  const activeServices = useMemo(() => sortedServices.filter((service) => service.status !== 'archived'), [sortedServices])
  const archivedServices = useMemo(() => sortedServices.filter((service) => service.status === 'archived'), [sortedServices])

  const handlePublish = async (serviceId: string) => {
    if (!appApiKey) {
      setErrorMessage('Owner app session is required to publish a capability')
      return
    }

    try {
      const currentService = services.find((service) => service.id === serviceId) ?? null
      setActiveActionKey(`publish:${serviceId}`)
      setErrorMessage(null)
      setStatusMessage(null)
      const client = new ADPClient(appApiKey)
      await client.publishOwnerService(serviceId)
      setStatusMessage(
        currentService?.publishedCapabilityKey
          ? 'Draft changes republished to the live manifest'
          : 'Draft published to the live manifest'
      )
      await loadServices()
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to publish capability')
    } finally {
      setActiveActionKey(null)
    }
  }

  const handleUnpublish = async (serviceId: string) => {
    if (!appApiKey) {
      setErrorMessage('Owner app session is required to unpublish a capability')
      return
    }

    try {
      setActiveActionKey(`unpublish:${serviceId}`)
      setErrorMessage(null)
      setStatusMessage(null)
      const client = new ADPClient(appApiKey)
      await client.unpublishOwnerService(serviceId)
      setStatusMessage('Capability removed from the live manifest. Your private draft is still intact')
      await loadServices()
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to unpublish capability')
    } finally {
      setActiveActionKey(null)
    }
  }

  const handleArchive = async (serviceId: string) => {
    if (!appApiKey) {
      setErrorMessage('Owner app session is required to archive a capability')
      return
    }

    try {
      setActiveActionKey(`archive:${serviceId}`)
      setErrorMessage(null)
      setStatusMessage(null)
      const client = new ADPClient(appApiKey)
      await client.archiveOwnerService(serviceId)
      setStatusMessage('Capability archived. Its private draft and publication history are still preserved')
      await loadServices()
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to archive capability')
    } finally {
      setActiveActionKey(null)
    }
  }

  const handleRestore = async (serviceId: string) => {
    if (!appApiKey) {
      setErrorMessage('Owner app session is required to restore a capability')
      return
    }

    try {
      setActiveActionKey(`restore:${serviceId}`)
      setErrorMessage(null)
      setStatusMessage(null)
      const client = new ADPClient(appApiKey)
      await client.restoreOwnerService(serviceId)
      setStatusMessage('Archived capability restored to the active private draft list')
      await loadServices()
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to restore capability')
    } finally {
      setActiveActionKey(null)
    }
  }

  const handleDelete = async (service: OwnerServiceReadModel) => {
    if (!appApiKey) {
      setErrorMessage('Owner app session is required to delete a capability')
      return
    }

    if (!confirmPermanentDelete(service)) {
      return
    }

    try {
      setActiveActionKey(`delete:${service.id}`)
      setErrorMessage(null)
      setStatusMessage(null)
      const client = new ADPClient(appApiKey)
      await client.deleteOwnerService(service.id)
      setStatusMessage('Capability permanently deleted')
      await loadServices()
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to delete capability')
    } finally {
      setActiveActionKey(null)
    }
  }

  const renderServiceCard = (service: OwnerServiceReadModel, index: number) => {
    const status = getDisplayStatus(service)
    const isPublishing = activeActionKey === `publish:${service.id}`
    const isUnpublishing = activeActionKey === `unpublish:${service.id}`
    const isArchiving = activeActionKey === `archive:${service.id}`
    const isRestoring = activeActionKey === `restore:${service.id}`
    const isDeleting = activeActionKey === `delete:${service.id}`
    const isArchived = service.status === 'archived'

    return (
      <motion.div
        key={service.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.04 }}
        className="h-full rounded-2xl border border-white/5 bg-[#111827] p-5"
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <h3 className="truncate text-base font-semibold">{service.title || 'Untitled capability draft'}</h3>
              <span className={`rounded-full px-2.5 py-1 text-[11px] ${status.className}`}>{status.label}</span>
            </div>
            <p className="mb-2 text-xs text-white/45">{status.detail}</p>
            <div className="flex flex-wrap items-center gap-2 text-[11px]">
              <span className="rounded-full bg-white/5 px-2.5 py-1 text-white/55">
                {isArchived ? 'Archived state' : 'Draft state'}
              </span>
              {service.publishedCapabilityKey ? (
                <span className="rounded-full bg-green-500/10 px-2.5 py-1 text-green-300">Publication active</span>
              ) : (
                <span className="rounded-full bg-white/5 px-2.5 py-1 text-white/45">Not published</span>
              )}
              {service.hasUnpublishedChanges ? (
                <span className="rounded-full bg-amber-500/10 px-2.5 py-1 text-amber-300">Publish updates available</span>
              ) : null}
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-white/35">
              <span className="flex items-center gap-1">
                <Tag className="h-3 w-3" />
                {service.category || 'No category yet'}
              </span>
              <span>Updated {new Date(service.updatedAt).toLocaleString()}</span>
              {service.archivedAt ? <span>Archived {new Date(service.archivedAt).toLocaleString()}</span> : null}
              {service.publishedAt ? <span>Published {new Date(service.publishedAt).toLocaleString()}</span> : null}
            </div>
          </div>
        </div>

        {service.description ? (
          <p className="mb-4 line-clamp-3 text-sm leading-6 text-white/45">{service.description}</p>
        ) : (
          <p className="mb-4 text-sm text-white/25">No description yet</p>
        )}

        <div className="mb-4 flex flex-wrap items-center gap-3 text-xs text-white/45">
          <span>
            Price:{' '}
            {typeof service.pricingSummary.askingPrice === 'number'
              ? `${service.pricingSummary.currency ?? 'EUR'} ${(service.pricingSummary.askingPrice / 100).toFixed(2)}`
              : 'Not set'}
          </span>
          <span>Negotiable: {service.pricingSummary.negotiable ? 'Yes' : 'No'}</span>
          <span>Unpublished changes: {service.hasUnpublishedChanges ? 'Yes' : 'No'}</span>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href={`/app/provider/services/${service.id}`}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-white/75 transition-colors hover:bg-white/10"
          >
            <Pencil className="h-4 w-4" />
            {isArchived ? 'View archived draft' : 'Edit draft'}
          </Link>

          {!isArchived ? (
            <>
              <button
                type="button"
                onClick={() => handlePublish(service.id)}
                disabled={isPublishing || isUnpublishing || isArchiving || isDeleting}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-green-500/30 bg-green-500/10 px-4 py-2.5 text-sm font-medium text-green-300 transition-colors hover:bg-green-500/20 disabled:border-white/10 disabled:bg-white/5 disabled:text-white/30"
              >
                {isPublishing ? <Loader2 className="h-4 w-4 animate-spin" /> : <ExternalLink className="h-4 w-4" />}
                {service.publishedCapabilityKey ? 'Republish draft changes' : 'Publish draft'}
              </button>

              {service.publishedCapabilityKey ? (
                <button
                  type="button"
                  onClick={() => handleUnpublish(service.id)}
                  disabled={isUnpublishing || isPublishing || isArchiving || isDeleting}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-white/70 transition-colors hover:bg-white/10 disabled:text-white/30"
                >
                  {isUnpublishing ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Unpublish live
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleArchive(service.id)}
                  disabled={isArchiving || isPublishing || isUnpublishing || isDeleting}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-white/70 transition-colors hover:bg-white/10 disabled:text-white/30"
                >
                  {isArchiving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Archive className="h-4 w-4" />}
                  Archive
                </button>
              )}

              {!service.publishedCapabilityKey ? (
                <button
                  type="button"
                  onClick={() => handleDelete(service)}
                  disabled={isDeleting || isPublishing || isUnpublishing || isArchiving}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2.5 text-sm font-medium text-red-300 transition-colors hover:bg-red-500/20 disabled:border-white/10 disabled:bg-white/5 disabled:text-white/30"
                >
                  {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                  Delete permanently
                </button>
              ) : null}
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => handleRestore(service.id)}
                disabled={isRestoring || isDeleting}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-blue-500/30 bg-blue-500/10 px-4 py-2.5 text-sm font-medium text-blue-300 transition-colors hover:bg-blue-500/20 disabled:border-white/10 disabled:bg-white/5 disabled:text-white/30"
              >
                {isRestoring ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
                Restore draft
              </button>
              <button
                type="button"
                onClick={() => handleDelete(service)}
                disabled={isDeleting || isRestoring}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2.5 text-sm font-medium text-red-300 transition-colors hover:bg-red-500/20 disabled:border-white/10 disabled:bg-white/5 disabled:text-white/30"
              >
                {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                Delete permanently
              </button>
            </>
          )}
        </div>
      </motion.div>
    )
  }

  return (
    <div className="min-h-screen px-4 pb-24 pt-12">
      <div className="mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between"
        >
          <div>
            <h1 className="text-2xl font-bold">My capabilities</h1>
            <p className="mt-1 text-sm text-white/40">
              {botName ? (
                <>
                  <span className="font-medium text-white/60">{botName}</span> — manage drafts, live publications and archived capabilities.
                </>
              ) : (
                'Manage your private drafts, live publications, and archived capability ideas.'
              )}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/app/provider"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-white/75 transition-colors hover:bg-white/10"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to your bot
            </Link>
            <button
              onClick={() => router.push('/app/provider/services/add')}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-2.5 text-sm font-medium transition-colors hover:bg-green-500"
            >
              <Plus className="h-4 w-4" />
              Add capability
            </button>
          </div>
        </motion.div>

        {errorMessage ? (
          <div className="mb-4 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {errorMessage}
          </div>
        ) : null}

        {statusMessage ? (
          <div className="mb-4 rounded-2xl border border-green-500/20 bg-green-500/10 px-4 py-3 text-sm text-green-200">
            {statusMessage}
          </div>
        ) : null}

        <div className="mb-6">
          <ProviderScopeCard appApiKey={appApiKey} redirectTo="/app/provider/services" />
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-white/20" />
          </div>
        ) : activeServices.length > 0 || archivedServices.length > 0 ? (
          <div className="space-y-10">
            {activeServices.length > 0 ? (
              <div>
                <div className="mb-4">
                  <h2 className="text-sm font-semibold text-white/80">Active capabilities</h2>
                  <p className="mt-1 text-xs text-white/40">Private drafts and live capabilities currently in your active workflow.</p>
                </div>
                <div className="grid gap-4 xl:grid-cols-2">
                  {activeServices.map((service, index) => renderServiceCard(service, index))}
                </div>
              </div>
            ) : null}

            {archivedServices.length > 0 ? (
              <div>
                <div className="mb-4">
                  <h2 className="text-sm font-semibold text-white/80">Archived capabilities</h2>
                  <p className="mt-1 text-xs text-white/40">Retained privately outside the default active list. Restore to continue editing or publishing.</p>
                </div>
                <div className="grid gap-4 xl:grid-cols-2">
                  {archivedServices.map((service, index) => renderServiceCard(service, index))}
                </div>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-white/5 bg-[#111827] px-6 py-16 text-center">
            <Tag className="mb-4 h-12 w-12 text-white/10" />
            <p className="text-sm text-white/30">No capabilities yet</p>
            <p className="mt-1 text-xs text-white/15">Create your first private draft to start describing what this bot can do.</p>
            <button
              onClick={() => router.push('/app/provider/services/add')}
              className="mt-6 rounded-xl bg-green-600 px-6 py-2.5 text-sm font-medium transition-colors hover:bg-green-500"
            >
              Add capability
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
