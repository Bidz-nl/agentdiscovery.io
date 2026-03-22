"use client"

import type { FormEvent, ReactNode } from 'react'

import { Loader2 } from 'lucide-react'

import type {
  CreateOwnerServiceRequest,
  OwnerServiceReadModel,
  UpdateOwnerServiceRequest,
} from '@/lib/owner-services'

export type OwnerServiceFormValues = {
  title: string
  category: string
  description: string
  askingPrice: string
  currency: string
  negotiable: boolean
}

export function toOwnerServiceFormValues(service?: Partial<OwnerServiceReadModel>): OwnerServiceFormValues {
  return {
    title: service?.title ?? '',
    category: service?.category ?? '',
    description: service?.description ?? '',
    askingPrice:
      typeof service?.pricingSummary?.askingPrice === 'number'
        ? (service.pricingSummary.askingPrice / 100).toFixed(2)
        : '',
    currency: service?.pricingSummary?.currency ?? 'EUR',
    negotiable: typeof service?.pricingSummary?.negotiable === 'boolean' ? service.pricingSummary.negotiable : true,
  }
}

export function toOwnerServiceRequest(
  values: OwnerServiceFormValues
): CreateOwnerServiceRequest | UpdateOwnerServiceRequest {
  const normalizedPrice = values.askingPrice.trim().replace(',', '.')
  const parsedPrice = normalizedPrice ? Number.parseFloat(normalizedPrice) : Number.NaN

  return {
    title: values.title.trim(),
    category: values.category.trim(),
    description: values.description.trim() ? values.description.trim() : null,
    pricingSummary: {
      askingPrice: Number.isFinite(parsedPrice) ? Math.round(parsedPrice * 100) : null,
      currency: values.currency.trim() ? values.currency.trim().toUpperCase() : null,
      negotiable: values.negotiable,
    },
  }
}

interface OwnerServiceFormProps {
  values: OwnerServiceFormValues
  onChange: (nextValues: OwnerServiceFormValues) => void
  onSubmit: () => void
  isSubmitting: boolean
  submitLabel: string
  errorMessage?: string | null
  helperText?: string
  footer?: ReactNode
  botName?: string
}

export function OwnerServiceForm({
  values,
  onChange,
  onSubmit,
  isSubmitting,
  submitLabel,
  errorMessage,
  helperText,
  footer,
  botName,
}: OwnerServiceFormProps) {
  const displayName = botName || 'your bot'
  const updateValue = <Key extends keyof OwnerServiceFormValues>(key: Key, value: OwnerServiceFormValues[Key]) => {
    onChange({
      ...values,
      [key]: value,
    })
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    onSubmit()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {errorMessage ? (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {errorMessage}
        </div>
      ) : null}

      <div>
        <label className="mb-1.5 block text-sm text-white/50">Capability title</label>
        <input
          type="text"
          value={values.title}
          onChange={(event) => updateValue('title', event.target.value)}
          placeholder="e.g. Product discovery for shoppers"
          className="w-full rounded-xl border border-white/10 bg-[#111827] px-4 py-3 text-white placeholder:text-white/20 focus:border-green-500/50 focus:outline-none transition-colors"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm text-white/50">Capability category</label>
        <input
          type="text"
          value={values.category}
          onChange={(event) => updateValue('category', event.target.value)}
          placeholder="research, discovery, comparison, analysis"
          className="w-full rounded-xl border border-white/10 bg-[#111827] px-4 py-3 text-white placeholder:text-white/20 focus:border-green-500/50 focus:outline-none transition-colors"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm text-white/50">What should other agents use this bot for?</label>
        <textarea
          value={values.description}
          onChange={(event) => updateValue('description', event.target.value)}
          placeholder={`${displayName} helps find products, alternatives, and source links for a product or category query. Use it when you need discovery, not final judgment.`}
          rows={5}
          className="w-full rounded-xl border border-white/10 bg-[#111827] px-4 py-3 text-white placeholder:text-white/20 focus:border-green-500/50 focus:outline-none transition-colors resize-none"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm text-white/50">Asking price</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={values.askingPrice}
            onChange={(event) => updateValue('askingPrice', event.target.value)}
            placeholder="optional"
            className="w-full rounded-xl border border-white/10 bg-[#111827] px-4 py-3 text-white placeholder:text-white/20 focus:border-green-500/50 focus:outline-none transition-colors"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm text-white/50">Currency</label>
          <input
            type="text"
            value={values.currency}
            onChange={(event) => updateValue('currency', event.target.value)}
            placeholder="EUR"
            className="w-full rounded-xl border border-white/10 bg-[#111827] px-4 py-3 text-white placeholder:text-white/20 focus:border-green-500/50 focus:outline-none transition-colors"
          />
        </div>
      </div>

      <label className="flex items-center gap-3 rounded-xl border border-white/10 bg-[#111827] px-4 py-3 text-sm text-white/70">
        <input
          type="checkbox"
          checked={values.negotiable}
          onChange={(event) => updateValue('negotiable', event.target.checked)}
          className="h-4 w-4 rounded border-white/20 bg-transparent text-green-500 focus:ring-green-500"
        />
        Negotiable pricing
      </label>

      <div className="rounded-2xl border border-blue-500/15 bg-blue-500/5 px-4 py-3 text-xs text-blue-100/80">
        <div className="font-medium text-blue-200">Example for {displayName}</div>
        <div className="mt-1">Title: Product discovery for shoppers</div>
        <div className="mt-1">Category: research</div>
        <div className="mt-1">Description: {displayName} takes a product or category query and returns relevant products, alternatives, and source links to continue the review flow.</div>
      </div>

      <div className="rounded-2xl border border-white/5 bg-white/5 px-4 py-3 text-xs text-white/40">
        {helperText ?? 'Saving a draft updates your private capability profile only. Publishing remains a separate action, so you can shape the wording before making it discoverable.'}
      </div>

      <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
        {footer ? <div className="flex flex-wrap gap-3">{footer}</div> : <div />}
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-green-600 px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-green-500 disabled:bg-white/10 disabled:text-white/30"
        >
          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {submitLabel}
        </button>
      </div>
    </form>
  )
}
