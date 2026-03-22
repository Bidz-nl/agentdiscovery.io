'use client'

import Image from 'next/image'
import { useEffect, useMemo, useRef, useState, useTransition } from 'react'

import type {
  LocalFoodCategory,
  LocalFoodProviderMenuEditorView,
  LocalFoodProviderMenuUpdateInput,
  LocalFoodPublicMenuItem,
} from '@/lib/local-food/local-food-types'

type EditableCategory = LocalFoodCategory

type EditableMenuItem = LocalFoodPublicMenuItem

type ProviderMenuApiResponse = {
  ok: boolean
  message?: string
  view?: LocalFoodProviderMenuEditorView
}

type ProviderMenuImageUploadResponse = {
  ok: boolean
  imageUrl?: string
  message?: string
}

function formatPrice(priceCents: number) {
  return `€${(priceCents / 100).toFixed(2)}`
}

function formatPriceInputValue(priceCents: number) {
  return (priceCents / 100).toFixed(2).replace('.', ',')
}

function isValidPriceInput(value: string) {
  return /^\d*([.,]\d{0,2})?$/.test(value)
}

function parsePriceInputToCents(value: string) {
  const normalizedValue = value.replace(',', '.').trim()

  if (normalizedValue.length === 0 || normalizedValue === '.') {
    return null
  }

  const numericValue = Number(normalizedValue)

  if (!Number.isFinite(numericValue)) {
    return null
  }

  return Math.max(0, Math.round(numericValue * 100))
}

function formatUpdatedAt(value: string | null) {
  if (!value) {
    return 'Nog niet apart opgeslagen'
  }

  return new Intl.DateTimeFormat('nl-NL', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function normalizeCategories(categories: EditableCategory[]) {
  return categories.map((category, index) => ({
    ...category,
    position: index + 1,
    slug: slugify(category.slug || category.name) || `categorie-${index + 1}`,
  }))
}

function toEditableCategories(view: LocalFoodProviderMenuEditorView): EditableCategory[] {
  return view.categories.map((category) => ({
    id: category.id,
    slug: category.slug,
    name: category.name,
    position: category.position,
    visible: category.visible,
  }))
}

function toEditableItems(view: LocalFoodProviderMenuEditorView): EditableMenuItem[] {
  return view.menuItems.map((item) => ({
    id: item.id,
    categoryId: item.categoryId,
    name: item.name,
    description: item.description,
    priceCents: item.priceCents,
    currency: item.currency,
    available: item.available,
    unavailableReason: item.unavailableReason ?? null,
    tags: item.tags,
    imageUrl: item.imageUrl,
    imageAlt: item.imageAlt,
    imageFallback: item.imageFallback,
  }))
}

function createPriceInputs(items: EditableMenuItem[]) {
  return items.reduce<Record<string, string>>((result, item) => {
    result[item.id] = formatPriceInputValue(item.priceCents)
    return result
  }, {})
}

function createEmptyCategory(index: number): EditableCategory {
  return {
    id: `new-category-${index}`,
    slug: `categorie-${index}`,
    name: `Nieuwe categorie ${index}`,
    position: index,
    visible: true,
  }
}

function createEmptyMenuItem(index: number, categoryId: string): EditableMenuItem {
  return {
    id: `new-item-${index}`,
    categoryId,
    name: `Nieuw gerecht ${index}`,
    description: '',
    priceCents: 0,
    currency: 'EUR',
    available: true,
    unavailableReason: null,
    tags: [],
    imageUrl: null,
    imageAlt: null,
    imageFallback: null,
  }
}

export function ProviderMenuEditor({
  providerDid,
  initialView,
}: {
  providerDid: string
  initialView: LocalFoodProviderMenuEditorView
}) {
  const initialMenuItems = toEditableItems(initialView)
  const [categories, setCategories] = useState<EditableCategory[]>(() => normalizeCategories(toEditableCategories(initialView)))
  const [menuItems, setMenuItems] = useState<EditableMenuItem[]>(() => initialMenuItems)
  const [priceInputs, setPriceInputs] = useState<Record<string, string>>(() => createPriceInputs(initialMenuItems))
  const [updatedAt, setUpdatedAt] = useState<string | null>(initialView.updatedAt)
  const [message, setMessage] = useState<string | null>(null)
  const [dragOverItemId, setDragOverItemId] = useState<string | null>(null)
  const [uploadingImageItemId, setUploadingImageItemId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [newItemId, setNewItemId] = useState<string | null>(null)
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({})
  const itemCardRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const categorySectionRefs = useRef<Record<string, HTMLElement | null>>({})

  useEffect(() => {
    if (newItemId && itemCardRefs.current[newItemId]) {
      itemCardRefs.current[newItemId]?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      })
    }
  }, [newItemId])

  const itemCountByCategoryId = useMemo(() => {
    return menuItems.reduce<Record<string, { total: number; available: number }>>((result, item) => {
      const entry = result[item.categoryId] ?? { total: 0, available: 0 }
      entry.total += 1
      if (item.available) {
        entry.available += 1
      }
      result[item.categoryId] = entry
      return result
    }, {})
  }, [menuItems])

  const itemsByCategory = useMemo(() => {
    const grouped = menuItems.reduce<Record<string, EditableMenuItem[]>>((result, item) => {
      if (!result[item.categoryId]) {
        result[item.categoryId] = []
      }
      result[item.categoryId].push(item)
      return result
    }, {})

    Object.keys(grouped).forEach((categoryId) => {
      grouped[categoryId].sort((left, right) => {
        if (left.id === newItemId) return -1
        if (right.id === newItemId) return 1
        return left.name.localeCompare(right.name)
      })
    })

    return grouped
  }, [menuItems, newItemId])

  function syncFromView(view: LocalFoodProviderMenuEditorView) {
    const nextItems = toEditableItems(view)
    setCategories(normalizeCategories(toEditableCategories(view)))
    setMenuItems(nextItems)
    setPriceInputs(createPriceInputs(nextItems))
    setUpdatedAt(view.updatedAt)
    setNewItemId(null)
  }

  function scrollToCategory(categoryId: string) {
    categorySectionRefs.current[categoryId]?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    })
  }

  function updateCategory(categoryId: string, field: keyof EditableCategory, value: string | boolean) {
    setCategories((current) =>
      normalizeCategories(
        current.map((category) => {
          if (category.id !== categoryId) {
            return category
          }

          if (field === 'visible') {
            return {
              ...category,
              visible: Boolean(value),
            }
          }

          if (field === 'name') {
            return {
              ...category,
              name: String(value),
              slug: slugify(String(value)) || category.slug,
            }
          }

          return {
            ...category,
            [field]: value,
          }
        })
      )
    )
  }

  function moveCategory(categoryId: string, direction: 'up' | 'down') {
    setCategories((current) => {
      const index = current.findIndex((category) => category.id === categoryId)
      if (index < 0) {
        return current
      }

      const targetIndex = direction === 'up' ? index - 1 : index + 1
      if (targetIndex < 0 || targetIndex >= current.length) {
        return current
      }

      const next = [...current]
      const [item] = next.splice(index, 1)
      next.splice(targetIndex, 0, item)
      return normalizeCategories(next)
    })
  }

  function addCategory() {
    setCategories((current) => normalizeCategories([...current, createEmptyCategory(current.length + 1)]))
  }

  function removeCategory(categoryId: string) {
    setCategories((currentCategories) => {
      const remainingCategories = normalizeCategories(currentCategories.filter((category) => category.id !== categoryId))
      const fallbackCategoryId = remainingCategories[0]?.id ?? null

      setMenuItems((currentItems) => {
        if (!fallbackCategoryId) {
          return []
        }

        return currentItems.map((item) =>
          item.categoryId === categoryId
            ? {
                ...item,
                categoryId: fallbackCategoryId,
              }
            : item
        )
      })

      return remainingCategories
    })
  }

  function updateItem(itemId: string, field: keyof EditableMenuItem, value: string | boolean) {
    setMenuItems((current) =>
      current.map((item) => {
        if (item.id !== itemId) {
          return item
        }

        if (field === 'available') {
          return {
            ...item,
            available: Boolean(value),
          }
        }

        if (field === 'priceCents') {
          const numericValue = Math.max(0, Math.round(Number(value) * 100))
          return {
            ...item,
            priceCents: Number.isFinite(numericValue) ? numericValue : 0,
          }
        }

        if (field === 'tags') {
          return {
            ...item,
            tags: String(value)
              .split(',')
              .map((entry) => entry.trim())
              .filter(Boolean),
          }
        }

        if (field === 'unavailableReason' || field === 'imageUrl' || field === 'imageAlt' || field === 'imageFallback') {
          const nextValue = String(value).trim()
          return {
            ...item,
            [field]: nextValue.length > 0 ? nextValue : null,
          }
        }

        return {
          ...item,
          [field]: value,
        }
      })
    )
  }

  function addItem(targetCategoryId?: string) {
    const categoryId = targetCategoryId ?? categories[0]?.id
    if (!categoryId) {
      setMessage('Maak eerst minstens één categorie aan voordat je gerechten toevoegt.')
      return
    }

    setMenuItems((current) => {
      const nextItem = createEmptyMenuItem(current.length + 1, categoryId)
      setPriceInputs((currentInputs) => ({
        ...currentInputs,
        [nextItem.id]: formatPriceInputValue(nextItem.priceCents),
      }))
      setNewItemId(nextItem.id)
      return [...current, nextItem]
    })
  }

  function removeItem(itemId: string) {
    setMenuItems((current) => current.filter((item) => item.id !== itemId))
    setPriceInputs((current) => {
      const next = { ...current }
      delete next[itemId]
      return next
    })
    if (newItemId === itemId) {
      setNewItemId(null)
    }
  }

  function updateItemPriceInput(itemId: string, nextValue: string) {
    if (!isValidPriceInput(nextValue)) {
      return
    }

    setPriceInputs((current) => ({
      ...current,
      [itemId]: nextValue,
    }))

    const nextPriceCents = parsePriceInputToCents(nextValue)

    if (nextPriceCents === null) {
      return
    }

    setMenuItems((current) =>
      current.map((item) =>
        item.id === itemId
          ? {
              ...item,
              priceCents: nextPriceCents,
            }
          : item
      )
    )
  }

  function normalizeItemPriceInput(itemId: string) {
    const item = menuItems.find((entry) => entry.id === itemId)

    if (!item) {
      return
    }

    setPriceInputs((current) => ({
      ...current,
      [itemId]: formatPriceInputValue(item.priceCents),
    }))
  }

  async function applyImageFile(itemId: string, file: File) {
    if (!file.type.startsWith('image/')) {
      setMessage('Kies een afbeeldingsbestand zoals jpg, png of webp.')
      return
    }

    if (file.size > 4_500_000) {
      setMessage('De afbeelding is te groot. Houd het bestand onder ongeveer 4,5 MB.')
      return
    }

    try {
      setUploadingImageItemId(itemId)
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch(`/api/provider/providers/${encodeURIComponent(providerDid)}/menu-image`, {
        method: 'POST',
        body: formData,
      })

      const result = (await response.json().catch(() => null)) as ProviderMenuImageUploadResponse | null
      const uploadedImageUrl = result?.imageUrl ?? null

      if (!response.ok || !result?.ok || !uploadedImageUrl) {
        setMessage(result?.message ?? 'De afbeelding kon niet worden geüpload.')
        return
      }

      setMenuItems((current) =>
        current.map((item) => {
          if (item.id !== itemId) {
            return item
          }

          return {
            ...item,
            imageUrl: uploadedImageUrl,
            imageAlt: item.imageAlt ?? `Foto van ${item.name}`,
            imageFallback: item.imageFallback ?? item.name,
          }
        })
      )
      setMessage(`Afbeelding toegevoegd voor ${menuItems.find((item) => item.id === itemId)?.name ?? 'dit gerecht'}.`)
    } catch {
      setMessage('De afbeelding kon niet worden ingelezen.')
    } finally {
      setUploadingImageItemId((current) => (current === itemId ? null : current))
    }
  }

  function handleImageInput(itemId: string, event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (file) {
      void applyImageFile(itemId, file)
    }

    event.target.value = ''
  }

  function clearImage(itemId: string) {
    setMenuItems((current) =>
      current.map((item) =>
        item.id === itemId
          ? {
              ...item,
              imageUrl: null,
            }
          : item
      )
    )
  }

  function openImagePicker(itemId: string) {
    fileInputRefs.current[itemId]?.click()
  }

  function buildPayload(): LocalFoodProviderMenuUpdateInput {
    return {
      categories: normalizeCategories(categories).map((category) => ({
        id: category.id,
        slug: slugify(category.slug || category.name) || slugify(category.name) || 'categorie',
        name: category.name.trim(),
        position: category.position,
        visible: category.visible,
      })),
      menuItems: menuItems.map((item) => ({
        ...item,
        name: item.name.trim(),
        description: item.description.trim(),
        unavailableReason: item.unavailableReason?.trim() ? item.unavailableReason.trim() : null,
        imageUrl: item.imageUrl?.trim() ? item.imageUrl.trim() : null,
        imageAlt: item.imageAlt?.trim() ? item.imageAlt.trim() : null,
        imageFallback: item.imageFallback?.trim() ? item.imageFallback.trim() : null,
        tags: item.tags.map((tag) => tag.trim()).filter(Boolean),
      })),
    }
  }

  function handleSave() {
    if (categories.length === 0) {
      setMessage('Voeg eerst minstens één categorie toe.')
      return
    }

    startTransition(async () => {
      setMessage(null)

      try {
        const response = await fetch(`/api/provider/providers/${encodeURIComponent(providerDid)}/menu`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(buildPayload()),
        })

        const result = (await response.json().catch(() => null)) as ProviderMenuApiResponse | null

        if (!response.ok || !result?.ok || !result.view) {
          setMessage(result?.message ?? 'Het menu kon niet worden opgeslagen.')
          return
        }

        syncFromView(result.view)
        setMessage(result.message ?? 'Menu opgeslagen.')
      } catch {
        setMessage('Er ging iets mis tijdens het opslaan van het menu.')
      }
    })
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-3xl border border-orange-200 bg-[#fffaf4] p-5">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#9a4a1b]">Overzicht</p>
          <div className="mt-4 space-y-4">
            <div className="rounded-3xl border border-orange-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#9a4a1b]">Categorieën</p>
              <p className="mt-2 text-3xl font-semibold text-[#2f160c]">{categories.length}</p>
            </div>
            <div className="rounded-3xl border border-orange-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#9a4a1b]">Gerechten</p>
              <p className="mt-2 text-3xl font-semibold text-[#2f160c]">{menuItems.length}</p>
            </div>
            <div className="rounded-3xl border border-orange-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#9a4a1b]">Laatst bewaard</p>
              <p className="mt-2 text-sm font-semibold leading-6 text-[#2f160c]">{formatUpdatedAt(updatedAt)}</p>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-orange-200 bg-[#fff7ee] p-5">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#9a4a1b]">Werkstroom</p>
          <div className="mt-4 space-y-3 text-sm leading-6 text-[#6a3c24]">
            <p>Voeg eerst categorieën toe of orden ze opnieuw. Daarna hang je gerechten aan de juiste categorie en werk je prijs, tekst en foto bij.</p>
            <p>Opslaan schrijft dit menu weg als restaurant-eigen data. De publieke kaart gebruikt daarna deze versie in plaats van alleen de demo-structuur.</p>
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={addCategory}
              className="rounded-full border border-orange-200 bg-white px-4 py-2 text-sm font-semibold text-[#7a3413] transition hover:bg-[#fff3ea]"
            >
              Categorie toevoegen
            </button>
            <button
              type="button"
              onClick={() => addItem()}
              className="rounded-full border border-orange-200 bg-white px-4 py-2 text-sm font-semibold text-[#7a3413] transition hover:bg-[#fff3ea]"
            >
              Gerecht toevoegen
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isPending}
              className="rounded-full bg-[#c85b24] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#ab4715] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isPending ? 'Menu opslaan...' : 'Menu opslaan'}
            </button>
          </div>
          {message ? <p className="mt-4 text-sm text-[#6a3c24]">{message}</p> : null}
        </div>
      </div>

      <section className="space-y-4 rounded-3xl border border-orange-200 bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#9a4a1b]">Categorieën</p>
            <h4 className="mt-2 text-2xl font-semibold text-[#2f160c]">Structuur van het menu</h4>
          </div>
          <button
            type="button"
            onClick={addCategory}
            className="rounded-full border border-orange-200 px-4 py-2 text-sm font-semibold text-[#7a3413] transition hover:bg-[#fffaf4]"
          >
            Nieuwe categorie
          </button>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {categories.map((category, index) => {
            const stats = itemCountByCategoryId[category.id] ?? { total: 0, available: 0 }

            return (
              <div key={category.id} className="rounded-3xl border border-orange-200 bg-[#fffaf4] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-[#2f160c]">Positie {index + 1}</p>
                    <p className="mt-1 text-sm text-[#6a3c24]">{stats.total} gerechten · {stats.available} beschikbaar</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => moveCategory(category.id, 'up')}
                      className="rounded-full border border-orange-200 px-3 py-2 text-sm font-semibold text-[#7a3413] transition hover:bg-white"
                    >
                      Omhoog
                    </button>
                    <button
                      type="button"
                      onClick={() => moveCategory(category.id, 'down')}
                      className="rounded-full border border-orange-200 px-3 py-2 text-sm font-semibold text-[#7a3413] transition hover:bg-white"
                    >
                      Omlaag
                    </button>
                    <button
                      type="button"
                      onClick={() => removeCategory(category.id)}
                      className="rounded-full border border-orange-200 px-3 py-2 text-sm font-semibold text-[#7a3413] transition hover:bg-white"
                    >
                      Verwijder
                    </button>
                  </div>
                </div>

                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <label className="grid gap-2 text-sm font-medium text-[#5f3420]">
                    <span>Naam</span>
                    <input
                      value={category.name}
                      onChange={(event) => updateCategory(category.id, 'name', event.target.value)}
                      className="rounded-2xl border border-orange-200 bg-white px-4 py-3 text-base text-[#2f160c]"
                    />
                  </label>
                  <label className="grid gap-2 text-sm font-medium text-[#5f3420]">
                    <span>Slug</span>
                    <input
                      value={category.slug}
                      onChange={(event) => updateCategory(category.id, 'slug', event.target.value)}
                      className="rounded-2xl border border-orange-200 bg-white px-4 py-3 text-base text-[#2f160c]"
                    />
                  </label>
                </div>

                <label className="mt-4 flex items-center gap-3 text-sm font-medium text-[#5f3420]">
                  <input
                    type="checkbox"
                    checked={category.visible}
                    onChange={(event) => updateCategory(category.id, 'visible', event.target.checked)}
                    className="h-4 w-4 rounded border-orange-300 text-[#c85b24]"
                  />
                  Categorie zichtbaar op de publieke kaart
                </label>
              </div>
            )
          })}
        </div>
      </section>

      <div className="sticky top-0 z-10 rounded-3xl border border-orange-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => {
            const categoryItems = itemsByCategory[category.id] ?? []
            return (
              <button
                key={category.id}
                type="button"
                onClick={() => scrollToCategory(category.id)}
                className="rounded-full border border-orange-200 bg-[#fffaf4] px-4 py-2 text-sm font-semibold text-[#7a3413] transition hover:bg-[#fff3ea]"
              >
                {category.name} ({categoryItems.length})
              </button>
            )
          })}
        </div>
      </div>

      {categories.map((category) => {
        const categoryItems = itemsByCategory[category.id] ?? []

        return (
          <section
            key={category.id}
            ref={(element) => {
              categorySectionRefs.current[category.id] = element
            }}
            className="space-y-4 rounded-3xl border border-orange-200 bg-white p-5"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#9a4a1b]">{category.name}</p>
                <h4 className="mt-2 text-2xl font-semibold text-[#2f160c]">
                  {categoryItems.length} {categoryItems.length === 1 ? 'gerecht' : 'gerechten'}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => addItem(category.id)}
                className="rounded-full border border-orange-200 px-4 py-2 text-sm font-semibold text-[#7a3413] transition hover:bg-[#fffaf4]"
              >
                Nieuw gerecht
              </button>
            </div>

            <div className="space-y-4">
              {categoryItems.map((item) => (
            <div
              key={item.id}
              ref={(element) => {
                itemCardRefs.current[item.id] = element
              }}
              className="rounded-3xl border border-orange-200 bg-[#fffaf4] p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-[#2f160c]">{item.name || 'Nieuw gerecht'}</p>
                  <p className="mt-1 text-sm text-[#6a3c24]">{formatPrice(item.priceCents)} · {categories.find((category) => category.id === item.categoryId)?.name ?? 'Geen categorie'}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={isPending}
                    className="rounded-full bg-[#c85b24] px-3 py-2 text-sm font-semibold text-white transition hover:bg-[#ab4715] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isPending ? 'Opslaan...' : 'Opslaan'}
                  </button>
                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    className="rounded-full border border-orange-200 px-3 py-2 text-sm font-semibold text-[#7a3413] transition hover:bg-white"
                  >
                    Verwijder
                  </button>
                </div>
              </div>

              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                <label className="grid gap-2 text-sm font-medium text-[#5f3420]">
                  <span>Naam</span>
                  <input
                    value={item.name}
                    onChange={(event) => updateItem(item.id, 'name', event.target.value)}
                    className="rounded-2xl border border-orange-200 bg-white px-4 py-3 text-base text-[#2f160c]"
                  />
                </label>
                <label className="grid gap-2 text-sm font-medium text-[#5f3420]">
                  <span>Categorie</span>
                  <select
                    value={item.categoryId}
                    onChange={(event) => updateItem(item.id, 'categoryId', event.target.value)}
                    className="rounded-2xl border border-orange-200 bg-white px-4 py-3 text-base text-[#2f160c]"
                  >
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="grid gap-2 text-sm font-medium text-[#5f3420] lg:col-span-2">
                  <span>Beschrijving</span>
                  <textarea
                    value={item.description}
                    onChange={(event) => updateItem(item.id, 'description', event.target.value)}
                    rows={3}
                    className="rounded-2xl border border-orange-200 bg-white px-4 py-3 text-base text-[#2f160c]"
                  />
                </label>
                <label className="grid gap-2 text-sm font-medium text-[#5f3420]">
                  <span>Prijs in euro</span>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={priceInputs[item.id] ?? formatPriceInputValue(item.priceCents)}
                    onChange={(event) => updateItemPriceInput(item.id, event.target.value)}
                    onBlur={() => normalizeItemPriceInput(item.id)}
                    className="rounded-2xl border border-orange-200 bg-white px-4 py-3 text-base text-[#2f160c]"
                  />
                </label>
                <label className="grid gap-2 text-sm font-medium text-[#5f3420]">
                  <span>Tags</span>
                  <input
                    value={item.tags.join(', ')}
                    onChange={(event) => updateItem(item.id, 'tags', event.target.value)}
                    className="rounded-2xl border border-orange-200 bg-white px-4 py-3 text-base text-[#2f160c]"
                  />
                </label>
                <div className="grid gap-2 text-sm font-medium text-[#5f3420] lg:col-span-2">
                  <span>Afbeelding</span>
                  <input
                    ref={(element) => {
                      fileInputRefs.current[item.id] = element
                    }}
                    type="file"
                    accept="image/*"
                    onChange={(event) => handleImageInput(item.id, event)}
                    className="hidden"
                  />
                  <div
                    onDragOver={(event) => {
                      event.preventDefault()
                      setDragOverItemId(item.id)
                    }}
                    onDragLeave={() => {
                      setDragOverItemId((current) => (current === item.id ? null : current))
                    }}
                    onDrop={(event) => {
                      event.preventDefault()
                      setDragOverItemId(null)
                      const file = event.dataTransfer.files?.[0]
                      if (file) {
                        void applyImageFile(item.id, file)
                      }
                    }}
                    className={`rounded-3xl border-2 border-dashed p-4 transition ${
                      dragOverItemId === item.id
                        ? 'border-[#c85b24] bg-[#fff1e8]'
                        : 'border-orange-200 bg-white'
                    }`}
                  >
                    <div className="grid gap-4 lg:grid-cols-[220px_1fr] lg:items-center">
                      <div className="overflow-hidden rounded-2xl bg-[#fff7ee]">
                        {item.imageUrl ? (
                          <Image
                            src={item.imageUrl}
                            alt={item.imageAlt ?? item.name}
                            width={440}
                            height={320}
                            unoptimized
                            className="h-40 w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-40 items-center justify-center px-4 text-center text-sm text-[#8d5637]">
                            Nog geen afbeelding toegevoegd
                          </div>
                        )}
                      </div>
                      <div className="space-y-3">
                        <p className="text-sm leading-6 text-[#6a3c24]">
                          Sleep een afbeelding hierheen of kies een bestand vanaf je computer. Deze afbeelding wordt samen met het menu opgeslagen.
                        </p>
                        <div className="flex flex-wrap gap-3">
                          <button
                            type="button"
                            onClick={() => openImagePicker(item.id)}
                            disabled={uploadingImageItemId === item.id}
                            className="rounded-full border border-orange-200 px-4 py-2 text-sm font-semibold text-[#7a3413] transition hover:bg-[#fff7ee]"
                          >
                            {uploadingImageItemId === item.id ? 'Afbeelding uploaden...' : 'Kies afbeelding'}
                          </button>
                          {item.imageUrl ? (
                            <button
                              type="button"
                              onClick={() => clearImage(item.id)}
                              disabled={uploadingImageItemId === item.id}
                              className="rounded-full border border-orange-200 px-4 py-2 text-sm font-semibold text-[#7a3413] transition hover:bg-[#fff7ee]"
                            >
                              Verwijder afbeelding
                            </button>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <label className="grid gap-2 text-sm font-medium text-[#5f3420]">
                  <span>Afbeelding alt</span>
                  <input
                    value={item.imageAlt ?? ''}
                    onChange={(event) => updateItem(item.id, 'imageAlt', event.target.value)}
                    className="rounded-2xl border border-orange-200 bg-white px-4 py-3 text-base text-[#2f160c]"
                  />
                </label>
                <label className="grid gap-2 text-sm font-medium text-[#5f3420]">
                  <span>Fallback tekst</span>
                  <input
                    value={item.imageFallback ?? ''}
                    onChange={(event) => updateItem(item.id, 'imageFallback', event.target.value)}
                    className="rounded-2xl border border-orange-200 bg-white px-4 py-3 text-base text-[#2f160c]"
                  />
                </label>
              </div>

              <div className="mt-4 flex flex-wrap gap-4">
                <label className="flex items-center gap-3 text-sm font-medium text-[#5f3420]">
                  <input
                    type="checkbox"
                    checked={item.available}
                    onChange={(event) => updateItem(item.id, 'available', event.target.checked)}
                    className="h-4 w-4 rounded border-orange-300 text-[#c85b24]"
                  />
                  Gerecht beschikbaar
                </label>
                {!item.available ? (
                  <label className="grid min-w-[280px] flex-1 gap-2 text-sm font-medium text-[#5f3420]">
                    <span>Onbeschikbaar reden</span>
                    <input
                      value={item.unavailableReason ?? ''}
                      onChange={(event) => updateItem(item.id, 'unavailableReason', event.target.value)}
                      className="rounded-2xl border border-orange-200 bg-white px-4 py-3 text-base text-[#2f160c]"
                    />
                  </label>
                ) : null}
              </div>
            </div>
          ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}
