import { randomUUID } from 'node:crypto'

import { getPublicAgentProfileProjection } from '@/lib/adp-v2/agent-profile-service'
import { getAgentRecordByDid } from '@/lib/adp-v2/agent-record-repository'
import { createManyLocalFoodMenuItems, createLocalFoodMenuItem, getLocalFoodMenuItem, listLocalFoodMenuItemsByProvider, updateLocalFoodMenuItem } from '@/lib/local-food/local-food-menu-repository'
import { parseLocalFoodMenuCsv } from '@/lib/local-food/local-food-menu-import'
import { createLocalFoodOrderRecord, getLocalFoodOrder, listLocalFoodOrdersByProvider, updateLocalFoodOrderRecord } from '@/lib/local-food/local-food-order-repository'
import { createLocalFoodPaymentPlaceholder } from '@/lib/local-food/local-food-payment'
import { postcodeMatchesPrefixes } from '@/lib/local-food/local-food-postcode'
import { createLocalFoodProviderRecord, getLocalFoodProviderRecord, listLocalFoodProviderRecords, updateLocalFoodProviderRecord } from '@/lib/local-food/local-food-provider-repository'
import type {
  CreateLocalFoodMenuItemInput,
  CreateLocalFoodOrderInput,
  LocalFoodMenuItemRecord,
  LocalFoodOrderRecord,
  LocalFoodOrderStatus,
  LocalFoodOrderStatusPatch,
  LocalFoodProviderPatch,
  LocalFoodProviderRecord,
  UpdateLocalFoodMenuItemInput,
} from '@/lib/local-food/local-food-types'

const ORDER_STATUS_TRANSITIONS: Record<LocalFoodOrderStatus, LocalFoodOrderStatus[]> = {
  submitted: ['confirmed', 'cancelled'],
  confirmed: ['preparing', 'cancelled'],
  preparing: ['ready', 'cancelled'],
  ready: ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
}

const DEMO_MENU_ITEMS: CreateLocalFoodMenuItemInput[] = [
  {
    category: 'pizza',
    name: 'Margherita',
    description: 'Tomato, mozzarella, basil.',
    priceCents: 1150,
    available: true,
    tags: ['classic', 'vegetarian'],
  },
  {
    category: 'pizza',
    name: 'Pepperoni',
    description: 'Tomato, mozzarella, pepperoni.',
    priceCents: 1350,
    available: true,
    tags: ['classic'],
  },
  {
    category: 'sides',
    name: 'Garlic bread',
    description: 'Warm garlic bread with herbs.',
    priceCents: 550,
    available: true,
    tags: ['shareable'],
  },
  {
    category: 'drinks',
    name: 'Cola',
    description: '330ml chilled can.',
    priceCents: 275,
    available: true,
    tags: ['cold'],
  },
]

export class LocalFoodServiceError extends Error {
  code: string

  status: number

  constructor(code: string, message: string, status = 400) {
    super(message)
    this.code = code
    this.status = status
  }
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function getProviderDefaults(providerDid: string): Omit<LocalFoodProviderRecord, 'id' | 'createdAt' | 'updatedAt'> {
  const agent = getAgentRecordByDid(providerDid)
  const profile = getPublicAgentProfileProjection(providerDid)
  const businessName = profile?.displayName || agent?.name || 'Local pizza partner'

  return {
    providerDid,
    vertical: 'pizza',
    status: 'draft',
    businessName,
    slug: slugify(businessName) || `pizza-${randomUUID().slice(0, 8)}`,
    summary: profile?.purpose || agent?.description || 'Ambachtelijke pizza’s voor snelle bezorging of afhalen in de buurt.',
    cuisineLabel: 'Pizza',
    phone: '',
    locationLabel: '',
    fulfilmentModes: ['delivery'],
    serviceArea: {
      postcodePrefixes: [],
      coverageLabel: '',
      deliveryNotes: '',
    },
    payment: {
      mode: 'placeholder',
      providerLabel: 'Demo betaalreferentie',
      readiness: 'payment_ready_shape',
    },
  }
}

function ensureProviderExists(providerDid: string) {
  return getLocalFoodProviderRecord(providerDid) ?? createLocalFoodProviderRecord(getProviderDefaults(providerDid))
}

function isMeaningfulText(value: string) {
  return value.trim().length > 0
}

function buildProviderSnapshot(current: LocalFoodProviderRecord, patch: LocalFoodProviderPatch) {
  return {
    ...current,
    status: patch.status ?? current.status,
    businessName: typeof patch.businessName === 'string' ? patch.businessName.trim() : current.businessName,
    summary: typeof patch.summary === 'string' ? patch.summary.trim() : current.summary,
    phone: typeof patch.phone === 'string' ? patch.phone.trim() : current.phone,
    locationLabel: typeof patch.locationLabel === 'string' ? patch.locationLabel.trim() : current.locationLabel,
    fulfilmentModes: Array.isArray(patch.fulfilmentModes)
      ? patch.fulfilmentModes.filter((mode): mode is LocalFoodProviderRecord['fulfilmentModes'][number] => mode === 'delivery' || mode === 'pickup')
      : current.fulfilmentModes,
    serviceArea: patch.serviceArea
      ? {
          postcodePrefixes: Array.isArray(patch.serviceArea.postcodePrefixes)
            ? patch.serviceArea.postcodePrefixes.map((entry) => entry.trim()).filter(Boolean)
            : current.serviceArea.postcodePrefixes,
          coverageLabel:
            typeof patch.serviceArea.coverageLabel === 'string'
              ? patch.serviceArea.coverageLabel.trim()
              : current.serviceArea.coverageLabel,
          deliveryNotes:
            typeof patch.serviceArea.deliveryNotes === 'string'
              ? patch.serviceArea.deliveryNotes.trim()
              : current.serviceArea.deliveryNotes,
        }
      : current.serviceArea,
  }
}

export function getProviderLaunchChecklist(providerDid: string) {
  const provider = ensureProviderExists(providerDid)
  const menuItems = listLocalFoodMenuItemsByProvider(providerDid)
  const hasBusinessBasics =
    isMeaningfulText(provider.businessName) &&
    isMeaningfulText(provider.summary) &&
    isMeaningfulText(provider.locationLabel)
  const hasServiceArea =
    provider.serviceArea.postcodePrefixes.length > 0 && isMeaningfulText(provider.serviceArea.coverageLabel)
  const hasMenu = menuItems.some((item) => item.available)
  const canGoLive = hasBusinessBasics && hasServiceArea && hasMenu

  return {
    hasBusinessBasics,
    hasServiceArea,
    hasMenu,
    canGoLive,
    nextRecommendedAction: !hasBusinessBasics
      ? 'Add supplier basics before going live.'
      : !hasServiceArea
        ? 'Add postcode coverage so customers can discover this supplier.'
        : !hasMenu
          ? 'Add at least one available menu item.'
          : provider.status !== 'active'
            ? 'Switch supplier status to active to accept customer orders.'
            : 'Supplier is ready for demo orders.',
  }
}

function validateProviderActivation(nextProvider: LocalFoodProviderRecord, providerDid: string) {
  const checklist = getProviderLaunchChecklist(providerDid)
  const hasBusinessBasics =
    isMeaningfulText(nextProvider.businessName) &&
    isMeaningfulText(nextProvider.summary) &&
    isMeaningfulText(nextProvider.locationLabel)
  const hasServiceArea =
    nextProvider.serviceArea.postcodePrefixes.length > 0 && isMeaningfulText(nextProvider.serviceArea.coverageLabel)
  const hasMenu = checklist.hasMenu

  if (!hasBusinessBasics || !hasServiceArea || !hasMenu) {
    throw new LocalFoodServiceError(
      'LOCAL_FOOD_PROVIDER_NOT_READY',
      'To go live, add supplier basics, postcode coverage, and at least one available menu item.',
      400
    )
  }
}

function validateMenuItemInput(input: CreateLocalFoodMenuItemInput | UpdateLocalFoodMenuItemInput) {
  if ('name' in input && typeof input.name === 'string' && !input.name.trim()) {
    throw new LocalFoodServiceError('LOCAL_FOOD_MENU_INVALID', 'Menu item name is required.', 400)
  }

  if (
    'priceCents' in input &&
    typeof input.priceCents === 'number' &&
    (!Number.isFinite(input.priceCents) || input.priceCents <= 0)
  ) {
    throw new LocalFoodServiceError('LOCAL_FOOD_MENU_INVALID', 'Menu item price must be greater than zero.', 400)
  }
}

function toAdminMenuItem(item: LocalFoodMenuItemRecord) {
  return {
    id: item.id,
    category: item.category,
    name: item.name,
    description: item.description,
    priceCents: item.priceCents,
    currency: item.currency,
    available: item.available,
    tags: item.tags,
    position: item.position,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  }
}

function toPublicMenuItem(item: LocalFoodMenuItemRecord) {
  return {
    id: item.id,
    category: item.category,
    name: item.name,
    description: item.description,
    priceCents: item.priceCents,
    currency: item.currency,
    available: item.available,
    tags: item.tags,
  }
}

function toOrderReadModel(order: LocalFoodOrderRecord) {
  return {
    id: order.id,
    providerDid: order.providerDid,
    customerDid: order.customerDid,
    customerName: order.customerName,
    customerPhone: order.customerPhone,
    customerPostcode: order.customerPostcode,
    customerAddressLine: order.customerAddressLine,
    customerNotes: order.customerNotes,
    fulfilmentMode: order.fulfilmentMode,
    items: order.items,
    subtotalCents: order.subtotalCents,
    totalCents: order.totalCents,
    currency: order.currency,
    payment: order.payment,
    status: order.status,
    statusTimeline: order.statusTimeline,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  }
}

function ensureProviderIsPublic(provider: LocalFoodProviderRecord) {
  if (provider.status !== 'active') {
    return false
  }

  return listLocalFoodMenuItemsByProvider(provider.providerDid).some((item) => item.available)
}

export function getLocalFoodProviderAdminReadModel(providerDid: string) {
  const provider = ensureProviderExists(providerDid)
  const menuItems = listLocalFoodMenuItemsByProvider(providerDid)
  const orders = listLocalFoodOrdersByProvider(providerDid)
  const launchChecklist = getProviderLaunchChecklist(providerDid)

  return {
    provider,
    menuItems: menuItems.map(toAdminMenuItem),
    dashboard: {
      availableMenuItems: menuItems.filter((item) => item.available).length,
      totalMenuItems: menuItems.length,
      incomingOrders: orders.length,
      awaitingAction: orders.filter((order) => order.status === 'submitted').length,
    },
    launchChecklist,
  }
}

export function updateLocalFoodProviderByDid(providerDid: string, patch: LocalFoodProviderPatch) {
  const current = ensureProviderExists(providerDid)
  const nextProvider = buildProviderSnapshot(current, patch)

  if (nextProvider.status === 'active') {
    validateProviderActivation(nextProvider, providerDid)
  }

  return updateLocalFoodProviderRecord(providerDid, patch)
}

export function createLocalFoodManualMenuItem(providerDid: string, input: CreateLocalFoodMenuItemInput) {
  ensureProviderExists(providerDid)
  validateMenuItemInput(input)
  return createLocalFoodMenuItem(providerDid, input)
}

export function importLocalFoodMenuCsv(providerDid: string, csvText: string) {
  ensureProviderExists(providerDid)
  const parsedItems = parseLocalFoodMenuCsv(csvText)

  if (parsedItems.length === 0) {
    throw new LocalFoodServiceError(
      'LOCAL_FOOD_MENU_IMPORT_EMPTY',
      'Add at least one CSV row below the header before importing.',
      400
    )
  }

  parsedItems.forEach(validateMenuItemInput)
  return createManyLocalFoodMenuItems(providerDid, parsedItems)
}

export function updateLocalFoodMenuItemForProvider(providerDid: string, itemId: string, patch: UpdateLocalFoodMenuItemInput) {
  ensureProviderExists(providerDid)
  const item = getLocalFoodMenuItem(itemId)
  if (!item || item.providerDid !== providerDid) {
    return null
  }

  validateMenuItemInput(patch)
  return updateLocalFoodMenuItem(itemId, patch)
}

export function seedLocalFoodDemoForProvider(providerDid: string) {
  const provider = ensureProviderExists(providerDid)
  const existingMenu = listLocalFoodMenuItemsByProvider(providerDid)

  if (existingMenu.length === 0) {
    createManyLocalFoodMenuItems(providerDid, DEMO_MENU_ITEMS)
  }

  return updateLocalFoodProviderByDid(providerDid, {
    status: 'active',
    businessName: provider.businessName || 'Demo Pizza West',
    summary: provider.summary || 'Verse pizza’s uit de buurt, klaar voor snelle demo-bestellingen.',
    phone: provider.phone || '+31 20 555 0101',
    locationLabel: provider.locationLabel || 'Amsterdam West',
    fulfilmentModes: provider.fulfilmentModes.length > 0 ? provider.fulfilmentModes : ['delivery', 'pickup'],
    serviceArea: {
      postcodePrefixes:
        provider.serviceArea.postcodePrefixes.length > 0 ? provider.serviceArea.postcodePrefixes : ['1055', '1056', '1013'],
      coverageLabel: provider.serviceArea.coverageLabel || 'Serving Amsterdam West and nearby streets',
      deliveryNotes:
        provider.serviceArea.deliveryNotes || 'Demo orders are accepted instantly. No real payment is charged in-app.',
    },
  })
}

export function listIncomingLocalFoodOrders(providerDid: string) {
  ensureProviderExists(providerDid)
  return listLocalFoodOrdersByProvider(providerDid).map(toOrderReadModel)
}

export function updateLocalFoodOrderStatusForProvider(providerDid: string, orderId: string, patch: LocalFoodOrderStatusPatch) {
  ensureProviderExists(providerDid)
  const order = getLocalFoodOrder(orderId)
  if (!order || order.providerDid !== providerDid) {
    return null
  }

  const allowedTransitions = ORDER_STATUS_TRANSITIONS[order.status]
  if (!allowedTransitions.includes(patch.status)) {
    throw new LocalFoodServiceError(
      'LOCAL_FOOD_ORDER_STATUS_INVALID',
      `This order is already ${order.status}. Follow the next kitchen step in sequence.`,
      409
    )
  }

  return updateLocalFoodOrderRecord(orderId, (current) => ({
    ...current,
    status: patch.status,
    statusTimeline: [
      ...current.statusTimeline,
      {
        status: patch.status,
        at: new Date().toISOString(),
        note: typeof patch.note === 'string' && patch.note.trim() ? patch.note.trim() : null,
      },
    ],
  }))
}

export function listLocalFoodDiscoverableProviders(postcode: string) {
  return listLocalFoodProviderRecords()
    .filter((provider) => ensureProviderIsPublic(provider))
    .filter((provider) => postcodeMatchesPrefixes(postcode, provider.serviceArea.postcodePrefixes))
    .map((provider) => {
      const agentProfile = getPublicAgentProfileProjection(provider.providerDid)
      const menuItems = listLocalFoodMenuItemsByProvider(provider.providerDid).filter((item) => item.available)
      const startingPriceCents = menuItems.reduce<number | null>((minPrice, item) => {
        if (minPrice === null) {
          return item.priceCents
        }
        return Math.min(minPrice, item.priceCents)
      }, null)

      return {
        providerDid: provider.providerDid,
        businessName: provider.businessName,
        summary: provider.summary,
        cuisineLabel: provider.cuisineLabel,
        locationLabel: provider.locationLabel,
        coverageLabel: provider.serviceArea.coverageLabel,
        fulfilmentModes: provider.fulfilmentModes,
        startingPriceCents,
        availableMenuItemCount: menuItems.length,
        specialties: agentProfile?.specialties ?? [],
      }
    })
    .sort((left, right) => {
      if ((right.availableMenuItemCount ?? 0) !== (left.availableMenuItemCount ?? 0)) {
        return right.availableMenuItemCount - left.availableMenuItemCount
      }

      return left.businessName.localeCompare(right.businessName)
    })
}

export function getLocalFoodPublicProvider(providerDid: string) {
  const provider = getLocalFoodProviderRecord(providerDid)
  if (!provider || !ensureProviderIsPublic(provider)) {
    return null
  }

  const agentProfile = getPublicAgentProfileProjection(providerDid)
  const menuItems = listLocalFoodMenuItemsByProvider(providerDid)
    .filter((item) => item.available)
    .map(toPublicMenuItem)

  return {
    provider: {
      providerDid: provider.providerDid,
      businessName: provider.businessName,
      summary: provider.summary,
      cuisineLabel: provider.cuisineLabel,
      locationLabel: provider.locationLabel,
      coverageLabel: provider.serviceArea.coverageLabel,
      deliveryNotes: provider.serviceArea.deliveryNotes,
      fulfilmentModes: provider.fulfilmentModes,
      payment: provider.payment,
      specialties: agentProfile?.specialties ?? [],
    },
    menuItems,
  }
}

export function createLocalFoodOrder(input: CreateLocalFoodOrderInput) {
  const provider = getLocalFoodProviderRecord(input.providerDid)
  if (!provider || !ensureProviderIsPublic(provider)) {
    throw new LocalFoodServiceError(
      'LOCAL_FOOD_PROVIDER_UNAVAILABLE',
      'This pizza provider is not live for ordering right now.',
      409
    )
  }

  if (!provider.fulfilmentModes.includes(input.fulfilmentMode)) {
    throw new LocalFoodServiceError(
      'LOCAL_FOOD_FULFILMENT_UNAVAILABLE',
      `This supplier currently offers ${provider.fulfilmentModes.join(' or ')} only.`,
      400
    )
  }

  if (!isMeaningfulText(input.customerName)) {
    throw new LocalFoodServiceError('LOCAL_FOOD_ORDER_INVALID', 'Enter the customer name for this order.', 400)
  }

  if (!isMeaningfulText(input.customerPhone)) {
    throw new LocalFoodServiceError(
      'LOCAL_FOOD_ORDER_INVALID',
      'Enter a phone number so the supplier can reach the customer.',
      400
    )
  }

  if (!isMeaningfulText(input.customerPostcode)) {
    throw new LocalFoodServiceError('LOCAL_FOOD_ORDER_INVALID', 'Enter the delivery postcode.', 400)
  }

  if (!isMeaningfulText(input.customerAddressLine)) {
    throw new LocalFoodServiceError('LOCAL_FOOD_ORDER_INVALID', 'Enter the delivery address.', 400)
  }

  if (!postcodeMatchesPrefixes(input.customerPostcode, provider.serviceArea.postcodePrefixes)) {
    throw new LocalFoodServiceError(
      'LOCAL_FOOD_POSTCODE_UNSERVED',
      'This supplier does not serve that postcode yet. Try the demo postcode 1055 AB or choose another supplier.',
      409
    )
  }

  const menuById = new Map(
    listLocalFoodMenuItemsByProvider(provider.providerDid)
      .filter((item) => item.available)
      .map((item) => [item.id, item])
  )

  const orderItems = input.items.map((entry) => {
    const menuItem = menuById.get(entry.menuItemId)
    if (!menuItem) {
      throw new LocalFoodServiceError(
        'LOCAL_FOOD_MENU_ITEM_UNAVAILABLE',
        'One or more selected items are no longer available. Refresh the menu and try again.',
        409
      )
    }

    const quantity = Math.max(1, Math.floor(entry.quantity))

    return {
      menuItemId: menuItem.id,
      category: menuItem.category,
      name: menuItem.name,
      unitPriceCents: menuItem.priceCents,
      quantity,
      lineTotalCents: menuItem.priceCents * quantity,
    }
  })

  if (orderItems.length === 0) {
    throw new LocalFoodServiceError('LOCAL_FOOD_ORDER_INVALID', 'Add at least one item before placing the order.', 400)
  }

  const subtotalCents = orderItems.reduce((sum, item) => sum + item.lineTotalCents, 0)
  const payment = createLocalFoodPaymentPlaceholder(`${provider.providerDid}-${Date.now()}`, subtotalCents)

  const order = createLocalFoodOrderRecord({
    providerDid: provider.providerDid,
    customerDid: input.customerDid ?? null,
    customerName: input.customerName.trim(),
    customerPhone: input.customerPhone.trim(),
    customerPostcode: input.customerPostcode.trim(),
    customerAddressLine: input.customerAddressLine.trim(),
    customerNotes: input.customerNotes?.trim() ?? '',
    fulfilmentMode: input.fulfilmentMode,
    items: orderItems,
    subtotalCents,
    totalCents: subtotalCents,
    currency: 'EUR',
    payment,
    status: 'submitted',
    statusTimeline: [
      {
        status: 'submitted',
        at: new Date().toISOString(),
        note: 'Order placed by customer',
      },
    ],
  })

  return toOrderReadModel(order)
}
