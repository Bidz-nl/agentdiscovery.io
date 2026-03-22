import { resolvePublicSlug, toPublicRestaurantSlug } from '@/lib/public-routing/slug-resolver'
import {
  createConfirmedLocalFoodOrderFromDraft,
  getLocalFoodOrderRecordById,
  listProviderLocalFoodOrderSummaries,
  updateLocalFoodOrderPaymentStatus,
  updateLocalFoodOrderStatus,
} from '@/lib/local-food/local-food-order-repository'
import {
  getLocalFoodProviderMenu,
  saveLocalFoodProviderMenu,
} from '@/lib/local-food/local-food-menu-repository'
import {
  getLocalFoodOperationalControls,
  saveLocalFoodOperationalControls,
} from '@/lib/local-food/local-food-operational-controls-repository'
import type {
  LocalFoodCategory,
  LocalFoodFulfilmentMode,
  LocalFoodOperationalPauseReason,
  LocalFoodOrderPaymentStatus,
  LocalFoodOrderRecord,
  LocalFoodOrderStatus,
  LocalFoodPressureLevel,
  LocalFoodProviderControlsPatch,
  LocalFoodProviderMenuEditorView,
  LocalFoodProviderOperationalControls,
  LocalFoodProviderOperationalControlsView,
  LocalFoodProviderOrderBoard,
  LocalFoodProviderOrderDetail,
  LocalFoodProviderOrderLifecycleEntry,
  LocalFoodProviderOperationalPreset,
  LocalFoodProviderOperationalStand,
  LocalFoodProviderQueueFilter,
  LocalFoodProviderQueueFilterOption,
  LocalFoodProviderQueueSummary,
  LocalFoodProviderMenuUpdateInput,
  LocalFoodProviderOrderQueueItem,
  LocalFoodProviderOrderStatusAction,
  LocalFoodProviderPaymentPreparation,
  LocalFoodProviderMenuRecord,
  LocalFoodProviderPressureSignal,
  LocalFoodProviderOrderSummary,
  LocalFoodProviderSuggestedAction,
  LocalFoodPublicAvailability,
  LocalFoodPublicOrderFieldErrors,
  LocalFoodPublicOrderConfirmation,
  LocalFoodPublicOrderDraft,
  LocalFoodPublicOrderInput,
  LocalFoodPublicMenuItem,
  LocalFoodPublicPressureFeedback,
  LocalFoodPublicRestaurant,
  LocalFoodPublicOrderValidationResult,
  LocalFoodPublicRestaurantDetail,
  LocalFoodPublicSearchInput,
} from '@/lib/local-food/local-food-types'

type DemoPublicRestaurantRecord = {
  status: 'active' | 'draft'
  restaurant: Omit<LocalFoodPublicRestaurant, 'availability'>
  categories: LocalFoodCategory[]
  menuItems: LocalFoodPublicMenuItem[]
}

const OPERATIONAL_PAUSE_REASONS: Record<LocalFoodOperationalPauseReason['code'], LocalFoodOperationalPauseReason> = {
  busy_kitchen: {
    code: 'busy_kitchen',
    label: 'Keuken draait vol en neemt even geen nieuwe bestellingen aan.',
  },
  courier_shortage: {
    code: 'courier_shortage',
    label: 'Bezorgcapaciteit is tijdelijk beperkt.',
  },
  temporary_break: {
    code: 'temporary_break',
    label: 'De zaak neemt even een korte pauze voor nieuwe orders.',
  },
  manual_pause: {
    code: 'manual_pause',
    label: 'Bestellen staat tijdelijk handmatig gepauzeerd.',
  },
}

const DEMO_PUBLIC_RESTAURANTS: DemoPublicRestaurantRecord[] = [
  {
    status: 'active',
    restaurant: {
      providerDid: 'did:bezorgd:pizza-west',
      slug: toPublicRestaurantSlug('Pizzeria Roma West'),
      businessName: 'Pizzeria Roma West',
      summary: 'Verse steenovenpizza voor Amsterdam West, warm bezorgd en zonder gedoe.',
      vertical: 'local-food',
      locationLabel: 'Amsterdam West',
      coverageLabel: 'Bezorgt in Amsterdam West en omliggende straten',
      postcodePrefixes: ['1055', '1056', '1013'],
      fulfilmentModes: ['delivery', 'pickup'],
      startingPriceCents: 550,
      cuisineTypes: ['Pizza', 'Italiaans'],
      tags: ['steenoven', 'buurtfavoriet', 'afhalen'],
      branding: {
        imageUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=1200&q=80',
        imageAlt: 'Warme steenovenpizza op houten tafel',
        imageFallback: 'Warm overzichtsbeeld van vers bereide pizza',
        logoUrl: null,
        logoAlt: null,
      },
    },
    categories: [
      {
        id: 'roma-west-pizzas',
        slug: 'pizzas',
        name: "Pizza's",
        position: 1,
        visible: true,
      },
      {
        id: 'roma-west-bijgerechten',
        slug: 'bijgerechten',
        name: 'Bijgerechten',
        position: 2,
        visible: true,
      },
      {
        id: 'roma-west-dranken',
        slug: 'dranken',
        name: 'Dranken',
        position: 3,
        visible: true,
      },
    ],
    menuItems: [
      {
        id: 'roma-west-margherita',
        categoryId: 'roma-west-pizzas',
        name: 'Margherita',
        description: 'Tomaat, mozzarella en basilicum.',
        priceCents: 1150,
        currency: 'EUR',
        available: true,
        tags: ['classic', 'vegetarian'],
        imageUrl: 'https://images.unsplash.com/photo-1604382355076-af4b0eb60143?auto=format&fit=crop&w=900&q=80',
        imageAlt: 'Margherita pizza met basilicum',
        imageFallback: 'Klassieke margherita pizza',
      },
      {
        id: 'roma-west-pepperoni',
        categoryId: 'roma-west-pizzas',
        name: 'Pepperoni',
        description: 'Tomaat, mozzarella en pepperoni.',
        priceCents: 1350,
        currency: 'EUR',
        available: true,
        tags: ['popular'],
        imageUrl: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?auto=format&fit=crop&w=900&q=80',
        imageAlt: 'Pepperoni pizza vers uit de oven',
        imageFallback: 'Pittige pizza met pepperoni',
      },
      {
        id: 'roma-west-garlic-bread',
        categoryId: 'roma-west-bijgerechten',
        name: 'Garlic bread',
        description: 'Warm knoflookbrood met kruidenboter.',
        priceCents: 550,
        currency: 'EUR',
        available: true,
        tags: ['shareable'],
        imageUrl: null,
        imageAlt: null,
        imageFallback: 'Warm knoflookbrood',
      },
    ],
  },
  {
    status: 'active',
    restaurant: {
      providerDid: 'did:bezorgd:noord-mix',
      slug: toPublicRestaurantSlug('Noord Eethuis'),
      businessName: 'Noord Eethuis',
      summary: 'Lokale avondzaak met pizza, kapsalon en snelle bezorging voor Amsterdam Noord.',
      vertical: 'local-food',
      locationLabel: 'Amsterdam Noord',
      coverageLabel: 'Bezorgt in Amsterdam Noord',
      postcodePrefixes: ['1021', '1022', '1031'],
      fulfilmentModes: ['delivery'],
      startingPriceCents: 695,
      cuisineTypes: ['Pizza', 'Döner', 'Fast casual'],
      tags: ['kapsalon', 'late-night', 'snel'],
      branding: {
        imageUrl: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&w=1200&q=80',
        imageAlt: 'Assortiment van lokale fast casual gerechten',
        imageFallback: 'Hero beeld met verschillende gerechten',
        logoUrl: null,
        logoAlt: null,
      },
    },
    categories: [
      {
        id: 'noord-eethuis-pizzas',
        slug: 'pizzas',
        name: "Pizza's",
        position: 1,
        visible: true,
      },
      {
        id: 'noord-eethuis-doner',
        slug: 'doner',
        name: 'Döner',
        position: 2,
        visible: true,
      },
      {
        id: 'noord-eethuis-kapsalon',
        slug: 'kapsalon',
        name: 'Kapsalon',
        position: 3,
        visible: true,
      },
      {
        id: 'noord-eethuis-sauzen',
        slug: 'sauzen',
        name: 'Sauzen',
        position: 4,
        visible: true,
      },
    ],
    menuItems: [
      {
        id: 'noord-funghi',
        categoryId: 'noord-eethuis-pizzas',
        name: 'Funghi',
        description: 'Tomaat, mozzarella en champignons.',
        priceCents: 1095,
        currency: 'EUR',
        available: true,
        tags: ['vegetarian'],
        imageUrl: 'https://images.unsplash.com/photo-1594007654729-407eedc4be65?auto=format&fit=crop&w=900&q=80',
        imageAlt: 'Pizza funghi met champignons',
        imageFallback: 'Pizza funghi',
      },
      {
        id: 'noord-doner-wrap',
        categoryId: 'noord-eethuis-doner',
        name: 'Döner wrap',
        description: 'Döner, sla, tomaat en knoflooksaus in een warme wrap.',
        priceCents: 895,
        currency: 'EUR',
        available: true,
        tags: ['street-food'],
        imageUrl: 'https://images.unsplash.com/photo-1529006557810-274b9b2fc783?auto=format&fit=crop&w=900&q=80',
        imageAlt: 'Döner wrap met verse groenten',
        imageFallback: 'Goed gevulde döner wrap',
      },
      {
        id: 'noord-kapsalon-classic',
        categoryId: 'noord-eethuis-kapsalon',
        name: 'Kapsalon classic',
        description: 'Friet, döner, gesmolten kaas, sla en saus.',
        priceCents: 1295,
        currency: 'EUR',
        available: true,
        tags: ['popular', 'loaded'],
        imageUrl: 'https://images.unsplash.com/photo-1562967916-eb82221dfb92?auto=format&fit=crop&w=900&q=80',
        imageAlt: 'Kapsalon met kaas en salade',
        imageFallback: 'Klassieke kapsalon',
      },
      {
        id: 'noord-knoflooksaus',
        categoryId: 'noord-eethuis-sauzen',
        name: 'Knoflooksaus',
        description: 'Frisse huisgemaakte knoflooksaus.',
        priceCents: 95,
        currency: 'EUR',
        available: true,
        tags: ['dip'],
        imageUrl: null,
        imageAlt: null,
        imageFallback: 'Bakje knoflooksaus',
      },
    ],
  },
  {
    status: 'active',
    restaurant: {
      providerDid: 'did:bezorgd:piazza-rotterdam',
      slug: toPublicRestaurantSlug('Piazza Rotterdam'),
      businessName: 'Piazza Rotterdam',
      summary: 'Buurtkeuken met pizza, pasta en desserts voor Rotterdam Centrum en Kralingen.',
      vertical: 'local-food',
      locationLabel: 'Rotterdam Centrum',
      coverageLabel: 'Bezorgt in Rotterdam Centrum en Kralingen',
      postcodePrefixes: ['3011', '3012', '3061'],
      fulfilmentModes: ['delivery', 'pickup'],
      startingPriceCents: 650,
      cuisineTypes: ['Pizza', 'Pasta', 'Italiaans'],
      tags: ['desserts', 'familie', 'pickup'],
      branding: {
        imageUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=80',
        imageAlt: 'Gezellig restaurantinterieur met Italiaanse gerechten',
        imageFallback: 'Sfeervol restaurantbeeld',
        logoUrl: null,
        logoAlt: null,
      },
    },
    categories: [
      {
        id: 'piazza-rotterdam-pizzas',
        slug: 'pizzas',
        name: "Pizza's",
        position: 1,
        visible: true,
      },
      {
        id: 'piazza-rotterdam-pasta',
        slug: 'pasta',
        name: 'Pasta',
        position: 2,
        visible: true,
      },
      {
        id: 'piazza-rotterdam-desserts',
        slug: 'desserts',
        name: 'Desserts',
        position: 3,
        visible: true,
      },
      {
        id: 'piazza-rotterdam-dranken',
        slug: 'dranken',
        name: 'Dranken',
        position: 4,
        visible: false,
      },
    ],
    menuItems: [
      {
        id: 'piazza-rotterdam-quattro-formaggi',
        categoryId: 'piazza-rotterdam-pizzas',
        name: 'Quattro Formaggi',
        description: 'Vier kazen en een krokante steenovenbodem.',
        priceCents: 1250,
        currency: 'EUR',
        available: true,
        tags: ['cheese'],
        imageUrl: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=900&q=80',
        imageAlt: 'Quattro formaggi pizza op houten plank',
        imageFallback: 'Pizza met vier kazen',
      },
      {
        id: 'piazza-rotterdam-penne-arrabbiata',
        categoryId: 'piazza-rotterdam-pasta',
        name: 'Penne arrabbiata',
        description: 'Penne in pittige tomatensaus met peterselie.',
        priceCents: 1195,
        currency: 'EUR',
        available: true,
        tags: ['spicy', 'vegetarian'],
        imageUrl: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?auto=format&fit=crop&w=900&q=80',
        imageAlt: 'Penne arrabbiata in diepe kom',
        imageFallback: 'Pasta arrabbiata',
      },
      {
        id: 'piazza-rotterdam-tiramisu',
        categoryId: 'piazza-rotterdam-desserts',
        name: 'Tiramisu',
        description: 'Luchtige huisgemaakte tiramisu.',
        priceCents: 650,
        currency: 'EUR',
        available: true,
        tags: ['dessert'],
        imageUrl: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?auto=format&fit=crop&w=900&q=80',
        imageAlt: 'Portie tiramisu met cacao',
        imageFallback: 'Huisgemaakte tiramisu',
      },
    ],
  },
]

function normalizeText(value: string | undefined) {
  return (value ?? '').trim().toLowerCase()
}

function trimText(value: string | undefined) {
  return (value ?? '').trim()
}

function normalizePostcode(value: string | undefined) {
  return normalizeText(value).replace(/\s+/g, '')
}

function normalizePhone(value: string | undefined) {
  return trimText(value).replace(/[^\d+]/g, '')
}

function getVisibleCategories(categories: LocalFoodCategory[]) {
  return categories
    .filter((category) => category.visible)
    .sort((left, right) => left.position - right.position)
}

function getOrderedCategories(categories: LocalFoodCategory[]) {
  return [...categories].sort((left, right) => left.position - right.position)
}

function toOptionalText(value: string | null | undefined) {
  const trimmedValue = trimText(value ?? undefined)
  return trimmedValue.length > 0 ? trimmedValue : null
}

function toUniqueValues(values: string[]) {
  return Array.from(new Set(values.filter((value) => value.length > 0)))
}

function createProviderScopedId(providerDid: string, value: string, fallback: string) {
  const providerPrefix = toPublicRestaurantSlug(providerDid.replace(/[:_]+/g, ' ')) || 'provider'
  const valueSlug = toPublicRestaurantSlug(value) || fallback
  return `${providerPrefix}-${valueSlug}`
}

function getUniqueValue(candidate: string, seenValues: Set<string>) {
  let nextValue = candidate
  let suffix = 2

  while (seenValues.has(nextValue)) {
    nextValue = `${candidate}-${suffix}`
    suffix += 1
  }

  seenValues.add(nextValue)
  return nextValue
}

function sanitizeProviderMenuCategories(providerDid: string, categories: LocalFoodCategory[]) {
  const seenIds = new Set<string>()
  const seenSlugs = new Set<string>()

  return categories.map((category, index) => {
    const name = trimText(category?.name) || `Categorie ${index + 1}`
    const slugBase = toPublicRestaurantSlug(trimText(category?.slug) || name) || `categorie-${index + 1}`
    const slug = getUniqueValue(slugBase, seenSlugs)
    const idBase = trimText(category?.id) || createProviderScopedId(providerDid, slug, `categorie-${index + 1}`)
    const id = getUniqueValue(idBase, seenIds)

    return {
      id,
      slug,
      name,
      position: index + 1,
      visible: category?.visible !== false,
    }
  })
}

function sanitizeProviderMenuItems(
  providerDid: string,
  menuItems: LocalFoodPublicMenuItem[],
  categories: LocalFoodCategory[]
) {
  const seenIds = new Set<string>()
  const categoryIds = new Set(categories.map((category) => category.id))
  const fallbackCategoryId = categories[0]?.id ?? null
  const nextItems: LocalFoodPublicMenuItem[] = []

  menuItems.forEach((item, index) => {
    const categoryId = categoryIds.has(item.categoryId) ? item.categoryId : fallbackCategoryId

    if (!categoryId) {
      return
    }

    const name = trimText(item.name) || `Gerecht ${index + 1}`
    const idBase = trimText(item.id) || createProviderScopedId(providerDid, name, `gerecht-${index + 1}`)
    const id = getUniqueValue(idBase, seenIds)

    nextItems.push({
      id,
      categoryId,
      name,
      description: trimText(item.description),
      priceCents: Math.max(0, Math.floor(Number(item.priceCents ?? 0))),
      currency: 'EUR',
      available: item.available !== false,
      unavailableReason: toOptionalText(item.unavailableReason),
      tags: toUniqueValues(item.tags.map((tag) => trimText(tag))),
      imageUrl: toOptionalText(item.imageUrl),
      imageAlt: toOptionalText(item.imageAlt),
      imageFallback: toOptionalText(item.imageFallback),
    })
  })

  return nextItems
}

function sanitizeProviderMenuInput(providerDid: string, input: LocalFoodProviderMenuUpdateInput): LocalFoodProviderMenuRecord {
  const categories = sanitizeProviderMenuCategories(providerDid, input.categories)
  const menuItems = sanitizeProviderMenuItems(providerDid, input.menuItems, categories)

  return {
    providerDid,
    categories,
    menuItems,
    updatedAt: new Date().toISOString(),
  }
}

function getDemoProviderRecord(providerDid: string) {
  return DEMO_PUBLIC_RESTAURANTS.find((entry) => entry.restaurant.providerDid === providerDid) ?? null
}

async function getProviderMenuRecord(record: DemoPublicRestaurantRecord) {
  const storedMenu = await getLocalFoodProviderMenu(record.restaurant.providerDid)

  if (!storedMenu) {
    return record
  }

  return {
    ...record,
    categories: storedMenu.categories,
    menuItems: storedMenu.menuItems,
  }
}

function isPublicRestaurant(record: DemoPublicRestaurantRecord) {
  return record.status === 'active'
}

function getAvailableFulfilmentModes(
  supportedModes: LocalFoodFulfilmentMode[],
  controls: LocalFoodProviderOperationalControls
) {
  const enabledModes = supportedModes.filter((mode) => !controls.disabledFulfilmentModes.includes(mode))

  if (controls.forcedFulfilmentMode && enabledModes.includes(controls.forcedFulfilmentMode)) {
    return [controls.forcedFulfilmentMode]
  }

  return enabledModes
}

function getLeadTimeLabel(
  availableFulfilmentModes: LocalFoodFulfilmentMode[],
  leadTimeOffsetMinutes: number,
  acceptsOrders: boolean
) {
  if (!acceptsOrders) {
    return 'Nieuwe bestellingen staan tijdelijk uit.'
  }

  const pickupBaseMin = 15 + leadTimeOffsetMinutes
  const pickupBaseMax = 20 + leadTimeOffsetMinutes
  const deliveryBaseMin = 30 + leadTimeOffsetMinutes
  const deliveryBaseMax = 45 + leadTimeOffsetMinutes

  if (availableFulfilmentModes.length === 1 && availableFulfilmentModes[0] === 'pickup') {
    return `Afhalen duurt nu ongeveer ${pickupBaseMin}-${pickupBaseMax} min`
  }

  if (availableFulfilmentModes.length === 1 && availableFulfilmentModes[0] === 'delivery') {
    return `Bezorgen duurt nu ongeveer ${deliveryBaseMin}-${deliveryBaseMax} min`
  }

  return `Bezorgen ${deliveryBaseMin}-${deliveryBaseMax} min · afhalen ${pickupBaseMin}-${pickupBaseMax} min`
}

function getPressureFeedback(
  controls: LocalFoodProviderOperationalControls,
  acceptsOrders: boolean,
  availableFulfilmentModes: LocalFoodFulfilmentMode[]
): LocalFoodPublicPressureFeedback {
  if (controls.paused || !acceptsOrders) {
    return {
      level: 'paused',
      title: 'Tijdelijk geen nieuwe bestellingen',
      message:
        controls.pressureMessage ??
        controls.pausedReason?.label ??
        'De zaak haalt eerst de huidige drukte weg voordat nieuwe bestellingen weer open gaan.',
    }
  }

  if (controls.leadTimeOffsetMinutes >= 20 || controls.forcedFulfilmentMode !== null) {
    return {
      level: 'very_busy',
      title: 'Het is nu extra druk',
      message:
        controls.pressureMessage ??
        (controls.forcedFulfilmentMode === 'pickup'
          ? 'De zaak schakelt tijdelijk terug naar afhalen om de keuken rustig te houden.'
          : 'Houd rekening met extra doorlooptijd en minder flexibiliteit tijdens deze piek.'),
    }
  }

  if (controls.leadTimeOffsetMinutes > 0 || controls.disabledFulfilmentModes.length > 0 || availableFulfilmentModes.length === 1) {
    return {
      level: 'busy',
      title: 'Het is nu wat drukker',
      message:
        controls.pressureMessage ??
        'Sommige opties zijn tijdelijk beperkter zodat de zaak de lopende stroom rustig kan wegwerken.',
    }
  }

  return {
    level: 'normal',
    title: 'Bestellen loopt normaal',
    message: controls.pressureMessage ?? 'Restaurant en menu zijn normaal beschikbaar.',
  }
}

function getUnavailableReason(
  controls: LocalFoodProviderOperationalControls,
  acceptsOrders: boolean,
  availableFulfilmentModes: LocalFoodFulfilmentMode[],
  availableMenuItems: LocalFoodPublicMenuItem[]
) {
  if (controls.paused || !acceptsOrders) {
    return controls.pressureMessage ?? controls.pausedReason?.label ?? 'Deze zaak neemt tijdelijk geen nieuwe bestellingen aan.'
  }

  if (availableFulfilmentModes.length === 0) {
    return 'Bezorgen en afhalen staan tijdelijk uit.'
  }

  if (availableMenuItems.length === 0) {
    return 'Het menu is tijdelijk niet bestelbaar.'
  }

  return null
}

function createNormalPresetPatch(): LocalFoodProviderControlsPatch {
  return {
    paused: false,
    pausedReason: null,
    disabledFulfilmentModes: [],
    forcedFulfilmentMode: null,
    leadTimeOffsetMinutes: 0,
    pressureMessage: null,
  }
}

function createBusyPresetPatch(): LocalFoodProviderControlsPatch {
  return {
    paused: false,
    pausedReason: null,
    disabledFulfilmentModes: [],
    forcedFulfilmentMode: null,
    leadTimeOffsetMinutes: 10,
    pressureMessage: null,
  }
}

function createVeryBusyPresetPatch(supportedModes: LocalFoodFulfilmentMode[]): LocalFoodProviderControlsPatch {
  return {
    paused: false,
    pausedReason: null,
    disabledFulfilmentModes: [],
    forcedFulfilmentMode: supportedModes.includes('pickup') ? 'pickup' : null,
    leadTimeOffsetMinutes: 20,
    pressureMessage: null,
  }
}

function createPausedPresetPatch(): LocalFoodProviderControlsPatch {
  return {
    paused: true,
    pausedReason: OPERATIONAL_PAUSE_REASONS.busy_kitchen,
    pressureMessage: null,
  }
}

function shapeMenuItems(record: DemoPublicRestaurantRecord, controls: LocalFoodProviderOperationalControls) {
  return record.menuItems.map((item) => {
    const categoryDisabled = controls.disabledCategoryIds.includes(item.categoryId)
    const itemDisabled = controls.disabledMenuItemIds.includes(item.id)
    const available = item.available && !categoryDisabled && !itemDisabled

    return {
      ...item,
      available,
      unavailableReason: !available
        ? categoryDisabled
          ? 'Deze categorie staat tijdelijk uit tijdens de drukte.'
          : itemDisabled
            ? 'Dit gerecht staat tijdelijk uit tijdens de drukte.'
            : item.unavailableReason ?? 'Tijdelijk niet beschikbaar.'
        : null,
    }
  })
}

function shapeVisibleCategories(categories: LocalFoodCategory[], menuItems: LocalFoodPublicMenuItem[]) {
  const visibleCategories = getVisibleCategories(categories)
  const categoryIdsWithItems = new Set(menuItems.map((item) => item.categoryId))

  return visibleCategories.filter((category) => categoryIdsWithItems.has(category.id))
}

function buildAvailabilityState(record: DemoPublicRestaurantRecord, controls: LocalFoodProviderOperationalControls) {
  const shapedMenuItems = shapeMenuItems(record, controls)
  const visibleCategories = shapeVisibleCategories(record.categories, shapedMenuItems)
  const visibleCategoryIds = new Set(visibleCategories.map((category) => category.id))
  const visibleMenuItems = shapedMenuItems.filter((item) => visibleCategoryIds.has(item.categoryId))
  const availableFulfilmentModes = getAvailableFulfilmentModes(record.restaurant.fulfilmentModes, controls)
  const availableMenuItems = visibleMenuItems.filter((item) => item.available)
  const acceptsOrders = !controls.paused && availableFulfilmentModes.length > 0 && availableMenuItems.length > 0
  const availability: LocalFoodPublicAvailability = {
    acceptsOrders,
    availableFulfilmentModes,
    unavailableReason: getUnavailableReason(controls, acceptsOrders, availableFulfilmentModes, availableMenuItems),
    leadTimeLabel: getLeadTimeLabel(availableFulfilmentModes, controls.leadTimeOffsetMinutes, acceptsOrders),
    pressure: getPressureFeedback(controls, acceptsOrders, availableFulfilmentModes),
  }

  return {
    visibleCategories,
    visibleMenuItems,
    availableFulfilmentModes,
    acceptsOrders,
    availability,
  }
}

function getOpenOrders(orders: LocalFoodProviderOrderQueueItem[]) {
  return orders.filter((order) => order.status !== 'completed' && order.status !== 'cancelled')
}

function createProviderPressureSignals(orders: LocalFoodProviderOrderQueueItem[]): LocalFoodProviderPressureSignal[] {
  const openOrders = getOpenOrders(orders)
  const receivedOrders = openOrders.filter((order) => order.status === 'received')
  const preparingOrders = openOrders.filter((order) => order.status === 'preparing')
  const longestReceivedMinutes = receivedOrders.reduce((max, order) => Math.max(max, order.currentStatusAgeMinutes), 0)
  const longestPreparingMinutes = preparingOrders.reduce((max, order) => Math.max(max, order.currentStatusAgeMinutes), 0)
  const signals: LocalFoodProviderPressureSignal[] = []

  if (receivedOrders.length >= 3) {
    signals.push({
      id: 'received_backlog',
      label: 'Veel received orders tegelijk',
      detail: `${receivedOrders.length} orders wachten nog op de eerste intake of bevestiging.`,
      level: receivedOrders.length >= 5 ? 'very_busy' : 'busy',
    })
  }

  if (longestReceivedMinutes >= 8) {
    signals.push({
      id: 'received_waiting_too_long',
      label: 'Received blijft te lang open',
      detail: `De oudste nieuwe order staat al ${formatElapsedLabel(longestReceivedMinutes)} in received.`,
      level: longestReceivedMinutes >= 12 ? 'very_busy' : 'busy',
    })
  }

  if (preparingOrders.length >= 4) {
    signals.push({
      id: 'preparing_backlog',
      label: 'Veel orders tegelijk in bereiding',
      detail: `${preparingOrders.length} orders zitten nu tegelijk in de keukenflow.`,
      level: preparingOrders.length >= 6 ? 'very_busy' : 'busy',
    })
  }

  if (longestPreparingMinutes >= 20) {
    signals.push({
      id: 'preparing_running_long',
      label: 'Bereiding loopt uit',
      detail: `De langste bereiding loopt nu ${formatElapsedLabel(longestPreparingMinutes)}.`,
      level: longestPreparingMinutes >= 30 ? 'very_busy' : 'busy',
    })
  }

  if (openOrders.length >= 8) {
    signals.push({
      id: 'open_orders_backlog',
      label: 'Open orders lopen op',
      detail: `${openOrders.length} orders staan nog open over balie, keuken of uitgifte.`,
      level: openOrders.length >= 12 ? 'very_busy' : 'busy',
    })
  }

  return signals
}

function getProviderStandPressure(
  controls: LocalFoodProviderOperationalControls,
  acceptsOrders: boolean,
  availableFulfilmentModes: LocalFoodFulfilmentMode[],
  signals: LocalFoodProviderPressureSignal[]
) {
  const strongestSignal = signals.find((signal) => signal.level === 'very_busy') ?? signals[0] ?? null

  if (controls.paused || !acceptsOrders) {
    return {
      level: 'paused' as LocalFoodPressureLevel,
      title: 'Even dicht voor nieuwe instroom',
      message:
        controls.pressureMessage ??
        controls.pausedReason?.label ??
        'Nieuwe bestellingen staan kort dicht zodat de huidige werkstroom eerst kan zakken.',
    }
  }

  if (controls.leadTimeOffsetMinutes >= 20 || controls.forcedFulfilmentMode !== null || strongestSignal?.level === 'very_busy') {
    return {
      level: 'very_busy' as LocalFoodPressureLevel,
      title: 'Heel druk op de vloer',
      message:
        controls.pressureMessage ??
        strongestSignal?.detail ??
        'De zaak draait op piekstand en heeft nu baat bij minder instroom of minder variatie.',
    }
  }

  if (
    controls.leadTimeOffsetMinutes > 0 ||
    controls.disabledFulfilmentModes.length > 0 ||
    availableFulfilmentModes.length === 1 ||
    strongestSignal
  ) {
    return {
      level: 'busy' as LocalFoodPressureLevel,
      title: 'Drukte loopt op',
      message:
        controls.pressureMessage ??
        strongestSignal?.detail ??
        'De operatie loopt nog, maar kan nu extra lucht gebruiken met een kleine ingreep.',
    }
  }

  return {
    level: 'normal' as LocalFoodPressureLevel,
    title: 'Werkstroom onder controle',
    message: controls.pressureMessage ?? 'Nieuwe orders, bereiding en uitgifte lopen nu normaal.',
  }
}

function getOpenStateLabel(acceptsOrders: boolean) {
  return acceptsOrders ? 'Nieuwe bestellingen staan open' : 'Nieuwe bestellingen staan tijdelijk uit'
}

function getFulfilmentStandLabel(availableFulfilmentModes: LocalFoodFulfilmentMode[]) {
  if (availableFulfilmentModes.length === 0) {
    return 'Geen fulfilment open'
  }

  if (availableFulfilmentModes.length === 1) {
    return availableFulfilmentModes[0] === 'delivery' ? 'Alleen bezorgen open' : 'Alleen afhalen open'
  }

  return 'Bezorgen en afhalen open'
}

function createActiveRestrictions(
  controls: LocalFoodProviderOperationalControls,
  availableFulfilmentModes: LocalFoodFulfilmentMode[]
) {
  const restrictions: string[] = []

  if (controls.paused) {
    restrictions.push('Nieuwe bestellingen gepauzeerd')
  }

  if (controls.forcedFulfilmentMode === 'pickup') {
    restrictions.push('Alleen afhalen actief')
  }

  if (controls.forcedFulfilmentMode === 'delivery') {
    restrictions.push('Alleen bezorgen actief')
  }

  if (controls.disabledFulfilmentModes.includes('delivery') && controls.forcedFulfilmentMode !== 'delivery') {
    restrictions.push('Bezorgen tijdelijk uit')
  }

  if (controls.disabledFulfilmentModes.includes('pickup') && controls.forcedFulfilmentMode !== 'pickup') {
    restrictions.push('Afhalen tijdelijk uit')
  }

  if (controls.leadTimeOffsetMinutes > 0) {
    restrictions.push(`Lead time +${controls.leadTimeOffsetMinutes} min`)
  }

  if (controls.disabledCategoryIds.length > 0) {
    restrictions.push(`${controls.disabledCategoryIds.length} categorie${controls.disabledCategoryIds.length === 1 ? '' : 'ën'} tijdelijk uit`)
  }

  if (controls.disabledMenuItemIds.length > 0) {
    restrictions.push(`${controls.disabledMenuItemIds.length} gerecht${controls.disabledMenuItemIds.length === 1 ? '' : 'en'} tijdelijk uit`)
  }

  if (restrictions.length === 0 && availableFulfilmentModes.length > 0) {
    restrictions.push('Geen extra beperkingen actief')
  }

  return restrictions
}

function createOperationalStand(
  controls: LocalFoodProviderOperationalControls,
  availableFulfilmentModes: LocalFoodFulfilmentMode[],
  availability: LocalFoodPublicAvailability,
  summary: LocalFoodProviderQueueSummary,
  signals: LocalFoodProviderPressureSignal[]
): LocalFoodProviderOperationalStand {
  const pressure = getProviderStandPressure(controls, availability.acceptsOrders, availableFulfilmentModes, signals)

  return {
    pressureLevel: pressure.level,
    pressureTitle: pressure.title,
    pressureMessage: pressure.message,
    leadTimeLabel: availability.leadTimeLabel,
    leadTimeOffsetMinutes: controls.leadTimeOffsetMinutes,
    acceptsOrders: availability.acceptsOrders,
    openStateLabel: getOpenStateLabel(availability.acceptsOrders),
    fulfilmentLabel: getFulfilmentStandLabel(availableFulfilmentModes),
    openOrdersCount: summary.attentionCount + summary.readyCount,
    receivedCount: summary.newCount,
    preparingCount: summary.preparingCount,
    readyCount: summary.readyCount,
    activeRestrictions: createActiveRestrictions(controls, availableFulfilmentModes),
  }
}

function createOperationalPresets(
  controls: LocalFoodProviderOperationalControls,
  supportedModes: LocalFoodFulfilmentMode[]
): LocalFoodProviderOperationalPreset[] {
  return [
    {
      id: 'normal',
      label: 'Normaal',
      description: 'Alles weer open met normale doorlooptijd.',
      active:
        !controls.paused &&
        controls.leadTimeOffsetMinutes === 0 &&
        controls.forcedFulfilmentMode === null &&
        controls.disabledFulfilmentModes.length === 0,
      patch: createNormalPresetPatch(),
    },
    {
      id: 'busy',
      label: 'Druk',
      description: 'Pak wat lucht met +10 minuten zonder de zaak dicht te zetten.',
      active:
        !controls.paused &&
        controls.leadTimeOffsetMinutes === 10 &&
        controls.forcedFulfilmentMode === null &&
        controls.disabledFulfilmentModes.length === 0,
      patch: createBusyPresetPatch(),
    },
    {
      id: 'very_busy',
      label: 'Heel druk',
      description: 'Meer rust met hogere lead time en waar mogelijk alleen afhalen.',
      active:
        !controls.paused &&
        (controls.leadTimeOffsetMinutes >= 20 || controls.forcedFulfilmentMode !== null || controls.disabledFulfilmentModes.length > 0),
      patch: createVeryBusyPresetPatch(supportedModes),
    },
    {
      id: 'paused',
      label: 'Even dicht',
      description: 'Nieuwe instroom stopt kort zodat de vloer eerst kan herstellen.',
      active: controls.paused,
      patch: createPausedPresetPatch(),
    },
  ]
}

function findDeprioritizedCategory(record: DemoPublicRestaurantRecord, controls: LocalFoodProviderOperationalControls) {
  const keywords = ['drank', 'sauz', 'bijgerecht', 'dessert', 'extra']

  return getVisibleCategories(record.categories).find(
    (category) =>
      !controls.disabledCategoryIds.includes(category.id) &&
      keywords.some((keyword) => category.name.toLowerCase().includes(keyword))
  )
}

function findDeprioritizedMenuItem(record: DemoPublicRestaurantRecord, controls: LocalFoodProviderOperationalControls) {
  const keywords = ['saus', 'cola', 'sprite', 'fanta', 'garlic', 'bread', 'dessert', 'extra']

  return record.menuItems.find(
    (item) =>
      item.available &&
      !controls.disabledMenuItemIds.includes(item.id) &&
      !controls.disabledCategoryIds.includes(item.categoryId) &&
      keywords.some((keyword) => item.name.toLowerCase().includes(keyword) || item.tags.some((tag) => tag.toLowerCase().includes(keyword)))
  )
}

function createProviderSuggestedActions(
  record: DemoPublicRestaurantRecord,
  controls: LocalFoodProviderOperationalControls,
  signals: LocalFoodProviderPressureSignal[],
  openOrdersCount: number
): LocalFoodProviderSuggestedAction[] {
  const signalIds = new Set(signals.map((signal) => signal.id))
  const actions: LocalFoodProviderSuggestedAction[] = []
  const supportsPickup = record.restaurant.fulfilmentModes.includes('pickup')
  const supportsDelivery = record.restaurant.fulfilmentModes.includes('delivery')

  if (controls.paused) {
    actions.push({
      id: 'resume-normal',
      label: 'Open weer normaal',
      description: 'Haal de bestelstop weg en ga terug naar een normale basisstand.',
      tone: 'secondary',
      patch: createNormalPresetPatch(),
    })

    return actions
  }

  if ((signalIds.has('received_backlog') || signalIds.has('received_waiting_too_long')) && controls.leadTimeOffsetMinutes < 10) {
    actions.push({
      id: 'suggest-lead-time-plus-10',
      label: 'Verhoog levertijd met 10 min',
      description: 'Geeft de balie direct wat lucht zonder klanten volledig af te remmen.',
      tone: 'primary',
      patch: createBusyPresetPatch(),
    })
  }

  if (
    supportsPickup &&
    (signalIds.has('preparing_running_long') || signalIds.has('open_orders_backlog')) &&
    controls.forcedFulfilmentMode !== 'pickup'
  ) {
    actions.push({
      id: 'suggest-pickup-only',
      label: 'Schakel naar alleen afhalen',
      description: 'Snijdt bezorgdruk weg en houdt de keukenproductie compacter.',
      tone: 'primary',
      patch: {
        paused: false,
        pausedReason: null,
        disabledFulfilmentModes: [],
        forcedFulfilmentMode: 'pickup',
        leadTimeOffsetMinutes: Math.max(controls.leadTimeOffsetMinutes, 20),
        pressureMessage: null,
      },
    })
  }

  if (
    supportsPickup &&
    supportsDelivery &&
    (signalIds.has('open_orders_backlog') || signalIds.has('preparing_backlog')) &&
    !controls.disabledFulfilmentModes.includes('delivery')
  ) {
    actions.push({
      id: 'suggest-disable-delivery',
      label: 'Zet bezorgen tijdelijk uit',
      description: 'Handig als de druk vooral uit logistiek en timing komt.',
      tone: 'secondary',
      patch: {
        disabledFulfilmentModes: Array.from(new Set([...controls.disabledFulfilmentModes, 'delivery'])),
        forcedFulfilmentMode: controls.forcedFulfilmentMode === 'delivery' ? null : controls.forcedFulfilmentMode,
      },
    })
  }

  const deprioritizedCategory = findDeprioritizedCategory(record, controls)
  if ((signalIds.has('preparing_backlog') || signalIds.has('open_orders_backlog')) && deprioritizedCategory) {
    actions.push({
      id: `suggest-disable-category-${deprioritizedCategory.id}`,
      label: `Pauzeer ${deprioritizedCategory.name}`,
      description: 'Een bijcategorie tijdelijk uitzetten maakt de flow vaak meteen rustiger.',
      tone: 'secondary',
      patch: {
        disabledCategoryIds: Array.from(new Set([...controls.disabledCategoryIds, deprioritizedCategory.id])),
      },
    })
  }

  const deprioritizedMenuItem = findDeprioritizedMenuItem(record, controls)
  if (actions.length < 4 && (signalIds.has('received_backlog') || signalIds.has('open_orders_backlog')) && deprioritizedMenuItem) {
    actions.push({
      id: `suggest-disable-item-${deprioritizedMenuItem.id}`,
      label: `Zet ${deprioritizedMenuItem.name} tijdelijk uit`,
      description: 'Een klein extra item uitzetten haalt direct variatie en losse handelingen weg.',
      tone: 'secondary',
      patch: {
        disabledMenuItemIds: Array.from(new Set([...controls.disabledMenuItemIds, deprioritizedMenuItem.id])),
      },
    })
  }

  if (actions.length < 4 && openOrdersCount >= 10) {
    actions.push({
      id: 'suggest-pause-orders',
      label: 'Pauzeer nieuwe bestellingen',
      description: 'Gebruik dit als noodrem wanneer de open werkstroom eerst omlaag moet.',
      tone: 'danger',
      patch: createPausedPresetPatch(),
    })
  }

  return actions.slice(0, 4)
}

async function buildPublicRestaurantDetailFromRecord(record: DemoPublicRestaurantRecord): Promise<LocalFoodPublicRestaurantDetail> {
  const resolvedRecord = await getProviderMenuRecord(record)
  const controls = await getLocalFoodOperationalControls(resolvedRecord.restaurant.providerDid)
  const { visibleCategories, visibleMenuItems, availability } = buildAvailabilityState(resolvedRecord, controls)

  return {
    restaurant: {
      ...resolvedRecord.restaurant,
      availability,
    },
    categories: visibleCategories,
    menuItems: visibleMenuItems,
    controls,
  }
}

function matchesSearch(record: DemoPublicRestaurantRecord, input: LocalFoodPublicSearchInput) {
  const postcode = normalizePostcode(input.postcode)
  const location = normalizeText(input.location)
  const query = normalizeText(input.query)

  const visibleCategories = getVisibleCategories(record.categories)

  const haystack = [
    record.restaurant.businessName,
    record.restaurant.summary,
    record.restaurant.locationLabel,
    record.restaurant.coverageLabel,
    ...record.restaurant.cuisineTypes,
    ...record.restaurant.tags,
    ...visibleCategories.map((category) => category.name),
    ...record.menuItems.map((item) => item.name),
    ...record.menuItems.flatMap((item) => item.tags),
  ]
    .join(' ')
    .toLowerCase()

  if (postcode.length > 0) {
    const matchesPostcode = record.restaurant.postcodePrefixes.some((prefix) =>
      postcode.startsWith(prefix.toLowerCase())
    )
    if (!matchesPostcode) {
      return false
    }
  }

  if (location.length > 0 && !haystack.includes(location)) {
    return false
  }

  if (query.length > 0 && !haystack.includes(query)) {
    return false
  }

  return true
}

export async function listPublicRestaurants(input: LocalFoodPublicSearchInput = {}) {
  const records = DEMO_PUBLIC_RESTAURANTS.filter(isPublicRestaurant).filter((record) => matchesSearch(record, input))
  const details = await Promise.all(records.map((record) => buildPublicRestaurantDetailFromRecord(record)))

  return details.map((detail) => detail.restaurant).sort((left, right) => left.businessName.localeCompare(right.businessName))
}

export async function findPublicRestaurantBySlug(slug: string) {
  const resolvedSlug = resolvePublicSlug(slug)

  const record =
    DEMO_PUBLIC_RESTAURANTS.find(
      (entry) => isPublicRestaurant(entry) && resolvePublicSlug(entry.restaurant.slug) === resolvedSlug
    ) ?? null

  if (!record) {
    return null
  }

  return buildPublicRestaurantDetailFromRecord(record)
}

export async function findPublicRestaurantByProviderDid(providerDid: string) {
  const record = DEMO_PUBLIC_RESTAURANTS.find((entry) => isPublicRestaurant(entry) && entry.restaurant.providerDid === providerDid)

  if (!record) {
    return null
  }

  return buildPublicRestaurantDetailFromRecord(record)
}

export async function createPublicOrderDraft(input: LocalFoodPublicOrderInput): Promise<LocalFoodPublicOrderDraft | null> {
  const restaurantDetail = await findPublicRestaurantByProviderDid(input.providerDid)

  if (!restaurantDetail) {
    return null
  }

  if (!restaurantDetail.restaurant.availability.acceptsOrders) {
    return null
  }

  if (!restaurantDetail.restaurant.availability.availableFulfilmentModes.includes(input.fulfilmentMode)) {
    return null
  }

  const menuById = new Map(restaurantDetail.menuItems.filter((item) => item.available).map((item) => [item.id, item]))
  const items = input.items
    .map((entry) => {
      const menuItem = menuById.get(entry.menuItemId)
      if (!menuItem) {
        return null
      }

      const quantity = Math.max(0, Math.floor(entry.quantity))
      if (quantity <= 0) {
        return null
      }

      return {
        menuItemId: menuItem.id,
        name: menuItem.name,
        quantity,
        unitPriceCents: menuItem.priceCents,
        lineTotalCents: menuItem.priceCents * quantity,
        note: trimText(entry.note) || null,
        modifiers: Array.isArray(entry.modifiers)
          ? entry.modifiers
              .map((modifier) => ({
                id: trimText(modifier?.id),
                label: trimText(modifier?.label),
                quantity: Math.max(1, Math.floor(Number(modifier?.quantity ?? 1))),
                priceDeltaCents: Math.max(0, Math.floor(Number(modifier?.priceDeltaCents ?? 0))),
              }))
              .filter((modifier) => modifier.id.length > 0 && modifier.label.length > 0)
          : [],
      }
    })
    .filter((item): item is NonNullable<typeof item> => item !== null)

  if (items.length === 0) {
    return null
  }

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0)
  const subtotalCents = items.reduce((sum, item) => sum + item.lineTotalCents, 0)

  return {
    providerDid: restaurantDetail.restaurant.providerDid,
    restaurantName: restaurantDetail.restaurant.businessName,
    fulfilmentMode: input.fulfilmentMode,
    customer: input.customer,
    items,
    itemCount,
    subtotalCents,
    currency: 'EUR',
  }
}

function getConfirmationExpectationLabel(
  fulfilmentMode: LocalFoodPublicOrderDraft['fulfilmentMode'],
  status: LocalFoodOrderStatus
) {
  if (status === 'preparing') {
    return fulfilmentMode === 'delivery' ? 'De keuken is bezig. Verwachte bezorgtijd: 25-40 minuten' : 'De keuken is bezig. Verwachte afhaaltijd: 15-20 minuten'
  }

  return fulfilmentMode === 'delivery' ? 'Verwachte bezorgtijd: 30-45 minuten' : 'Verwachte afhaaltijd: 15-20 minuten'
}

function getOrderStatusLabel(status: LocalFoodOrderStatus) {
  switch (status) {
    case 'received':
      return 'Ontvangen'
    case 'preparing':
      return 'In bereiding'
    case 'ready_for_pickup':
      return 'Klaar om af te halen'
    case 'out_for_delivery':
      return 'Onderweg'
    case 'completed':
      return 'Afgerond'
    case 'cancelled':
      return 'Geannuleerd'
  }
}

function getPaymentStatusLabel(status: LocalFoodOrderPaymentStatus) {
  switch (status) {
    case 'not_started':
      return 'Nog niet gestart'
    case 'pending':
      return 'Betaalvoorbereiding gestart'
    case 'paid':
      return 'Betaald'
    case 'failed':
      return 'Betaling mislukt'
    case 'refunded':
      return 'Terugbetaald'
  }
}

function getFulfilmentLabel(fulfilmentMode: LocalFoodPublicOrderDraft['fulfilmentMode']) {
  return fulfilmentMode === 'delivery' ? 'Bezorgen' : 'Afhalen'
}

function getAllowedNextStatuses(
  status: LocalFoodOrderStatus,
  fulfilmentMode: LocalFoodPublicOrderDraft['fulfilmentMode']
): LocalFoodOrderStatus[] {
  switch (status) {
    case 'received':
      return ['preparing', 'cancelled']
    case 'preparing':
      return fulfilmentMode === 'delivery' ? ['out_for_delivery', 'cancelled'] : ['ready_for_pickup', 'cancelled']
    case 'ready_for_pickup':
      return ['completed']
    case 'out_for_delivery':
      return ['completed']
    case 'completed':
    case 'cancelled':
      return []
  }
}

function getNextStatusActionLabel(status: LocalFoodOrderStatus, fulfilmentMode: LocalFoodPublicOrderDraft['fulfilmentMode']) {
  const [nextStatus] = getAllowedNextStatuses(status, fulfilmentMode)

  if (!nextStatus) {
    return null
  }

  return getOrderStatusLabel(nextStatus)
}

function getProviderStatusActions(record: LocalFoodOrderRecord): LocalFoodProviderOrderStatusAction[] {
  return getAllowedNextStatuses(record.status, record.fulfilmentMode).map((status) => ({
    status,
    label: getOrderStatusLabel(status),
    tone: status === 'cancelled' ? 'danger' : status === 'completed' ? 'neutral' : 'primary',
  }))
}

function getPaymentPreparation(record: LocalFoodOrderRecord): LocalFoodProviderPaymentPreparation {
  const canStart =
    record.paymentStatus === 'not_started' && record.status !== 'cancelled' && record.status !== 'completed'

  return {
    status: record.paymentStatus,
    statusLabel: getPaymentStatusLabel(record.paymentStatus),
    actionLabel: canStart ? 'Start betaalvoorbereiding' : 'Betaalvoorbereiding staat klaar',
    helperText:
      record.paymentStatus === 'pending'
        ? 'Payment koppelen we later aan dit startpunt.'
        : 'Dit is nu een licht startpunt voor de latere payment-flow.',
    canStart,
  }
}

function getStatusTimelineValue(
  order: Pick<LocalFoodOrderRecord, 'status' | 'createdAt' | 'updatedAt' | 'statusTimeline'>,
  status: LocalFoodOrderStatus
) {
  switch (status) {
    case 'received':
      return order.statusTimeline?.receivedAt ?? order.createdAt
    case 'preparing':
      return order.statusTimeline?.preparingAt ?? (order.status === 'preparing' ? order.updatedAt : null)
    case 'ready_for_pickup':
      return order.statusTimeline?.readyForPickupAt ?? (order.status === 'ready_for_pickup' ? order.updatedAt : null)
    case 'out_for_delivery':
      return order.statusTimeline?.outForDeliveryAt ?? (order.status === 'out_for_delivery' ? order.updatedAt : null)
    case 'completed':
      return order.statusTimeline?.completedAt ?? (order.status === 'completed' ? order.updatedAt : null)
    case 'cancelled':
      return order.statusTimeline?.cancelledAt ?? (order.status === 'cancelled' ? order.updatedAt : null)
  }
}

function getMinutesSince(value: string | null) {
  if (!value) {
    return 0
  }

  return Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 60000))
}

function formatElapsedLabel(minutes: number) {
  if (minutes < 1) {
    return 'zojuist'
  }

  if (minutes < 60) {
    return `${minutes} min`
  }

  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60

  if (remainingMinutes === 0) {
    return `${hours} u`
  }

  return `${hours} u ${remainingMinutes} min`
}

function createLifecycleEntries(record: LocalFoodOrderRecord): LocalFoodProviderOrderLifecycleEntry[] {
  const statuses: LocalFoodOrderStatus[] = [
    'received',
    'preparing',
    record.fulfilmentMode === 'delivery' ? 'out_for_delivery' : 'ready_for_pickup',
    'completed',
    'cancelled',
  ]

  return statuses.map((status) => ({
    status,
    label: getOrderStatusLabel(status),
    at: getStatusTimelineValue(record, status),
  }))
}

function getQueueUrgency(order: Pick<LocalFoodOrderRecord, 'status' | 'createdAt' | 'updatedAt' | 'statusTimeline'>) {
  const currentStatusStartedAt = getStatusTimelineValue(order, order.status)
  const currentStatusAgeMinutes = getMinutesSince(currentStatusStartedAt)

  switch (order.status) {
    case 'received':
      if (currentStatusAgeMinutes >= 10) {
        return {
          urgency: 'high' as const,
          urgencyLabel: 'Nieuw wacht te lang',
          sortKey: 0,
          operationalHint: `Nieuw en al ${formatElapsedLabel(currentStatusAgeMinutes)} onbeantwoord.`,
          currentStatusStartedAt,
          currentStatusAgeMinutes,
        }
      }

      if (currentStatusAgeMinutes >= 3) {
        return {
          urgency: 'high' as const,
          urgencyLabel: 'Nieuw oppakken',
          sortKey: 1,
          operationalHint: `Nieuwe order staat al ${formatElapsedLabel(currentStatusAgeMinutes)} open.`,
          currentStatusStartedAt,
          currentStatusAgeMinutes,
        }
      }

      return {
        urgency: 'high' as const,
        urgencyLabel: 'Direct aandacht',
        sortKey: 2,
        operationalHint: 'Nieuwe order voor balie of keuken. Direct zien en oppakken.',
        currentStatusStartedAt,
        currentStatusAgeMinutes,
      }
    case 'preparing':
      if (currentStatusAgeMinutes >= 20) {
        return {
          urgency: 'high' as const,
          urgencyLabel: 'Bereiding loopt lang',
          sortKey: 10,
          operationalHint: `Bereiding loopt al ${formatElapsedLabel(currentStatusAgeMinutes)} en verdient extra aandacht.`,
          currentStatusStartedAt,
          currentStatusAgeMinutes,
        }
      }

      return {
        urgency: 'medium' as const,
        urgencyLabel: 'In bereiding',
        sortKey: 11,
        operationalHint: `Deze order is ${formatElapsedLabel(currentStatusAgeMinutes)} in bereiding.`,
        currentStatusStartedAt,
        currentStatusAgeMinutes,
      }
    case 'ready_for_pickup':
    case 'out_for_delivery':
      if (currentStatusAgeMinutes >= 10) {
        return {
          urgency: 'medium' as const,
          urgencyLabel: 'Klaar blijft liggen',
          sortKey: 20,
          operationalHint: `Deze order staat al ${formatElapsedLabel(currentStatusAgeMinutes)} klaar voor afronding.`,
          currentStatusStartedAt,
          currentStatusAgeMinutes,
        }
      }

      return {
        urgency: 'medium' as const,
        urgencyLabel: 'Klaar voor afronding',
        sortKey: 21,
        operationalHint: 'Deze order is inhoudelijk klaar en wacht op overdracht of afronding.',
        currentStatusStartedAt,
        currentStatusAgeMinutes,
      }
    case 'completed':
      return {
        urgency: 'low' as const,
        urgencyLabel: 'Afgerond',
        sortKey: 40,
        operationalHint: 'Afgeronde order. Hoeft nu geen werkvloeraandacht meer.',
        currentStatusStartedAt,
        currentStatusAgeMinutes,
      }
    case 'cancelled':
      return {
        urgency: 'low' as const,
        urgencyLabel: 'Geen aandacht nodig',
        sortKey: 50,
        operationalHint: 'Geannuleerde order. Alleen nog administratief relevant.',
        currentStatusStartedAt,
        currentStatusAgeMinutes,
      }
  }
}

function matchesQueueFilter(order: LocalFoodProviderOrderQueueItem, filter: LocalFoodProviderQueueFilter) {
  switch (filter) {
    case 'all':
      return true
    case 'attention':
      return order.status === 'received' || order.status === 'preparing'
    case 'new':
      return order.status === 'received'
    case 'preparing':
      return order.status === 'preparing'
    case 'ready':
      return order.status === 'ready_for_pickup' || order.status === 'out_for_delivery'
    case 'completed':
      return order.status === 'completed' || order.status === 'cancelled'
  }
}

function createQueueSummary(orders: LocalFoodProviderOrderQueueItem[]): LocalFoodProviderQueueSummary {
  return {
    total: orders.length,
    newCount: orders.filter((order) => order.status === 'received').length,
    preparingCount: orders.filter((order) => order.status === 'preparing').length,
    readyCount: orders.filter((order) => order.status === 'ready_for_pickup' || order.status === 'out_for_delivery').length,
    completedCount: orders.filter((order) => order.status === 'completed' || order.status === 'cancelled').length,
    attentionCount: orders.filter((order) => order.status === 'received' || order.status === 'preparing').length,
  }
}

function createQueueFilters(
  orders: LocalFoodProviderOrderQueueItem[]
): LocalFoodProviderQueueFilterOption[] {
  const options: Array<{ value: LocalFoodProviderQueueFilter; label: string }> = [
    { value: 'attention', label: 'Aandacht nu' },
    { value: 'new', label: 'Nieuw' },
    { value: 'preparing', label: 'In bereiding' },
    { value: 'ready', label: 'Klaar / onderweg' },
    { value: 'completed', label: 'Afgerond' },
    { value: 'all', label: 'Alles' },
  ]

  return options.map((option) => ({
    ...option,
    count: orders.filter((order) => matchesQueueFilter(order, option.value)).length,
  }))
}

function toProviderOrderQueueItem(summary: LocalFoodProviderOrderSummary): LocalFoodProviderOrderQueueItem {
  const urgency = getQueueUrgency(summary)
  const createdAgeMinutes = getMinutesSince(summary.createdAt)

  return {
    ...summary,
    statusLabel: getOrderStatusLabel(summary.status),
    paymentStatusLabel: getPaymentStatusLabel(summary.paymentStatus),
    fulfilmentLabel: getFulfilmentLabel(summary.fulfilmentMode),
    nextActionLabel: getNextStatusActionLabel(summary.status, summary.fulfilmentMode),
    urgency: urgency.urgency,
    urgencyLabel: urgency.urgencyLabel,
    sortKey: urgency.sortKey,
    createdAgeMinutes,
    createdAgeLabel: formatElapsedLabel(createdAgeMinutes),
    currentStatusStartedAt: urgency.currentStatusStartedAt,
    currentStatusAgeMinutes: urgency.currentStatusAgeMinutes,
    currentStatusAgeLabel: formatElapsedLabel(urgency.currentStatusAgeMinutes),
    operationalHint: urgency.operationalHint,
  }
}

function toProviderOrderDetail(record: LocalFoodOrderRecord): LocalFoodProviderOrderDetail {
  const currentStatusStartedAt = getStatusTimelineValue(record, record.status)
  const currentStatusAgeMinutes = getMinutesSince(currentStatusStartedAt)

  return {
    ...record,
    statusLabel: getOrderStatusLabel(record.status),
    paymentStatusLabel: getPaymentStatusLabel(record.paymentStatus),
    fulfilmentLabel: getFulfilmentLabel(record.fulfilmentMode),
    availableStatusActions: getProviderStatusActions(record),
    paymentPreparation: getPaymentPreparation(record),
    currentStatusStartedAt,
    currentStatusAgeMinutes,
    currentStatusAgeLabel: formatElapsedLabel(currentStatusAgeMinutes),
    lifecycleEntries: createLifecycleEntries(record),
  }
}

export async function validatePublicOrderInput(input: LocalFoodPublicOrderInput | null): Promise<LocalFoodPublicOrderValidationResult> {
  const fieldErrors: LocalFoodPublicOrderFieldErrors = {}
  const customer = input?.customer

  if (!input) {
    return {
      ok: false,
      message: 'De bestelling kon niet worden gelezen.',
      fieldErrors: {
        items: 'Stuur de bestelling opnieuw in vanaf de pagina.',
      },
    }
  }

  const providerDid = trimText(input.providerDid)
  if (providerDid.length === 0) {
    fieldErrors.providerDid = 'Restaurant ontbreekt.'
  }

  const restaurantDetail = providerDid.length > 0 ? await findPublicRestaurantByProviderDid(providerDid) : null

  if (!restaurantDetail) {
    fieldErrors.providerDid = fieldErrors.providerDid ?? 'Restaurant is niet beschikbaar.'
  }

  if (restaurantDetail && !restaurantDetail.restaurant.availability.acceptsOrders) {
    fieldErrors.providerDid = restaurantDetail.restaurant.availability.unavailableReason ?? 'Deze zaak neemt tijdelijk geen nieuwe bestellingen aan.'
  }

  const fulfilmentMode = input.fulfilmentMode
  if (!restaurantDetail || !restaurantDetail.restaurant.availability.availableFulfilmentModes.includes(fulfilmentMode)) {
    fieldErrors.fulfilment = 'Kies een geldige manier om deze bestelling te ontvangen.'
  }

  const name = trimText(customer?.name)
  if (name.length < 2) {
    fieldErrors.name = 'Vul een naam in zodat de bestelling duidelijk klaarstaat.'
  }

  const phone = normalizePhone(customer?.phone)
  if (phone.length < 8) {
    fieldErrors.phone = 'Vul een telefoonnummer in waarop de zaak je kan bereiken.'
  }

  const postcode = normalizePostcode(customer?.postcode)
  if (postcode.length < 4) {
    fieldErrors.postcode = 'Vul een postcode in voor bezorging of contact.'
  }

  const address = trimText(customer?.address)
  if (address.length < 5) {
    fieldErrors.address = 'Vul een volledig adres of afhaaladres in.'
  }

  const items = Array.isArray(input.items)
    ? input.items
        .map((entry) => ({
          menuItemId: trimText(entry?.menuItemId),
          quantity: Math.max(0, Math.floor(Number(entry?.quantity ?? 0))),
        }))
        .filter((entry) => entry.menuItemId.length > 0 && entry.quantity > 0)
    : []

  if (items.length === 0) {
    fieldErrors.items = 'Kies minstens één geldig menu-item.'
  }

  if (Object.keys(fieldErrors).length > 0) {
    return {
      ok: false,
      message: 'Controleer je bestelling en vul de ontbrekende gegevens aan.',
      fieldErrors,
    }
  }

  return {
    ok: true,
    input: {
      intent: input.intent ?? 'draft',
      providerDid,
      fulfilmentMode,
      customer: {
        name,
        phone: trimText(customer?.phone),
        postcode: trimText(customer?.postcode).toUpperCase(),
        address,
      },
      items,
    },
  }
}

export function createPublicOrderConfirmationFromRecord(record: {
  id: string
  orderReference: string
  status: LocalFoodOrderStatus
  paymentStatus: 'not_started' | 'pending' | 'paid' | 'failed' | 'refunded'
  createdAt: string
} & LocalFoodPublicOrderDraft): LocalFoodPublicOrderConfirmation {
  return {
    ...record,
    orderId: record.id,
    statusLabel: record.status === 'received' ? 'Bestelling ontvangen' : 'Bestelling in behandeling',
    nextStepLabel:
      record.fulfilmentMode === 'delivery'
        ? 'De zaak gaat je bestelling nu rustig klaarmaken voor bezorging.'
        : 'De zaak gaat je bestelling nu rustig klaarmaken om af te halen.',
    expectationLabel: getConfirmationExpectationLabel(record.fulfilmentMode, record.status),
  }
}

export async function confirmPublicOrder(input: LocalFoodPublicOrderInput): Promise<LocalFoodPublicOrderConfirmation | null> {
  const draft = await createPublicOrderDraft(input)

  if (!draft) {
    return null
  }

  const storedOrder = await createConfirmedLocalFoodOrderFromDraft(draft)
  return createPublicOrderConfirmationFromRecord(storedOrder)
}

export async function listProviderOrders(providerDid: string): Promise<LocalFoodProviderOrderSummary[]> {
  return listProviderLocalFoodOrderSummaries(providerDid)
}

export async function listProviderOrderQueue(providerDid: string): Promise<LocalFoodProviderOrderQueueItem[]> {
  const orders = await listProviderLocalFoodOrderSummaries(providerDid)
  return orders
    .map(toProviderOrderQueueItem)
    .sort((left, right) => {
      if (left.sortKey !== right.sortKey) {
        return left.sortKey - right.sortKey
      }

      return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
    })
}

export async function getProviderOrderBoard(
  providerDid: string,
  activeFilter: LocalFoodProviderQueueFilter = 'attention'
): Promise<LocalFoodProviderOrderBoard> {
  const orders = await listProviderOrderQueue(providerDid)
  const summary = createQueueSummary(orders)
  const filters = createQueueFilters(orders)
  const filteredOrders = orders.filter((order) => matchesQueueFilter(order, activeFilter))

  return {
    providerDid,
    summary,
    activeFilter,
    filters,
    orders: filteredOrders,
  }
}

export async function getProviderOrder(providerDid: string, orderId: string): Promise<LocalFoodProviderOrderDetail | null> {
  const order = await getLocalFoodOrderRecordById(orderId)

  if (!order || order.providerDid !== providerDid) {
    return null
  }

  return toProviderOrderDetail(order)
}

export async function updateProviderOrder(providerDid: string, orderId: string, status: LocalFoodOrderStatus) {
  const order = await getLocalFoodOrderRecordById(orderId)

  if (!order || order.providerDid !== providerDid) {
    return null
  }

  const allowedStatuses = getAllowedNextStatuses(order.status, order.fulfilmentMode)

  if (!allowedStatuses.includes(status)) {
    return null
  }

  const updated = await updateLocalFoodOrderStatus(orderId, status)
  return updated ? toProviderOrderDetail(updated) : null
}

export async function prepareProviderOrderPayment(providerDid: string, orderId: string) {
  const order = await getLocalFoodOrderRecordById(orderId)

  if (!order || order.providerDid !== providerDid) {
    return null
  }

  if (order.paymentStatus !== 'not_started' || order.status === 'cancelled' || order.status === 'completed') {
    return toProviderOrderDetail(order)
  }

  const updated = await updateLocalFoodOrderPaymentStatus(orderId, 'pending')
  return updated ? toProviderOrderDetail(updated) : null
}

export async function getProviderOperationalControlsView(
  providerDid: string
): Promise<LocalFoodProviderOperationalControlsView | null> {
  const record = getDemoProviderRecord(providerDid)

  if (!record) {
    return null
  }

  const resolvedRecord = await getProviderMenuRecord(record)
  const controls = await getLocalFoodOperationalControls(providerDid)
  const orders = await listProviderOrderQueue(providerDid)
  const summary = createQueueSummary(orders)
  const signals = createProviderPressureSignals(orders)
  const { visibleMenuItems, availableFulfilmentModes, availability } = buildAvailabilityState(resolvedRecord, controls)
  const openOrdersCount = summary.attentionCount + summary.readyCount

  return {
    controls,
    supportedFulfilmentModes: resolvedRecord.restaurant.fulfilmentModes,
    operationalStand: createOperationalStand(controls, availableFulfilmentModes, availability, summary, signals),
    pressureSignals: signals,
    suggestedActions: createProviderSuggestedActions(resolvedRecord, controls, signals, openOrdersCount),
    presets: createOperationalPresets(controls, resolvedRecord.restaurant.fulfilmentModes),
    categories: getOrderedCategories(resolvedRecord.categories).map((category) => ({
      id: category.id,
      name: category.name,
      disabled: controls.disabledCategoryIds.includes(category.id),
    })),
    menuItems: visibleMenuItems.map((item) => ({
      id: item.id,
      categoryId: item.categoryId,
      name: item.name,
      disabled: controls.disabledMenuItemIds.includes(item.id),
    })),
  }
}

export async function updateProviderOperationalControls(
  providerDid: string,
  nextInput: LocalFoodProviderControlsPatch
) {
  const record = getDemoProviderRecord(providerDid)

  if (!record) {
    return null
  }

  const resolvedRecord = await getProviderMenuRecord(record)
  const current = await getLocalFoodOperationalControls(providerDid)
  const supportedModes = resolvedRecord.restaurant.fulfilmentModes
  const visibleCategoryIds = new Set(getVisibleCategories(resolvedRecord.categories).map((category) => category.id))
  const knownMenuItemIds = new Set(resolvedRecord.menuItems.map((item) => item.id))
  const nextControls: LocalFoodProviderOperationalControls = {
    providerDid,
    paused: Boolean(nextInput.paused ?? current.paused),
    pausedReason:
      nextInput.pausedReason === null
        ? null
        : nextInput.pausedReason
          ? OPERATIONAL_PAUSE_REASONS[nextInput.pausedReason.code]
          : current.pausedReason,
    disabledFulfilmentModes: Array.isArray(nextInput.disabledFulfilmentModes)
      ? nextInput.disabledFulfilmentModes.filter((mode): mode is LocalFoodFulfilmentMode => supportedModes.includes(mode))
      : current.disabledFulfilmentModes,
    forcedFulfilmentMode:
      nextInput.forcedFulfilmentMode === null
        ? null
        : nextInput.forcedFulfilmentMode && supportedModes.includes(nextInput.forcedFulfilmentMode)
          ? nextInput.forcedFulfilmentMode
          : current.forcedFulfilmentMode,
    leadTimeOffsetMinutes:
      typeof nextInput.leadTimeOffsetMinutes === 'number'
        ? Math.max(0, Math.min(45, Math.floor(nextInput.leadTimeOffsetMinutes)))
        : current.leadTimeOffsetMinutes,
    disabledCategoryIds: Array.isArray(nextInput.disabledCategoryIds)
      ? nextInput.disabledCategoryIds.filter((categoryId) => visibleCategoryIds.has(categoryId))
      : current.disabledCategoryIds,
    disabledMenuItemIds: Array.isArray(nextInput.disabledMenuItemIds)
      ? nextInput.disabledMenuItemIds.filter((itemId) => knownMenuItemIds.has(itemId))
      : current.disabledMenuItemIds,
    pressureMessage:
      typeof nextInput.pressureMessage === 'string'
        ? nextInput.pressureMessage.trim() || null
        : nextInput.pressureMessage === null
          ? null
          : current.pressureMessage,
    updatedAt: new Date().toISOString(),
  }

  if (nextControls.forcedFulfilmentMode && nextControls.disabledFulfilmentModes.includes(nextControls.forcedFulfilmentMode)) {
    nextControls.forcedFulfilmentMode = null
  }

  if (!nextControls.paused) {
    nextControls.pausedReason = null
  }

  await saveLocalFoodOperationalControls(nextControls)
  return getProviderOperationalControlsView(providerDid)
}

export async function getProviderMenuEditorView(providerDid: string): Promise<LocalFoodProviderMenuEditorView | null> {
  const record = getDemoProviderRecord(providerDid)

  if (!record) {
    return null
  }

  const resolvedRecord = await getProviderMenuRecord(record)
  const categories = getOrderedCategories(resolvedRecord.categories)
  const categoryNameById = new Map(categories.map((category) => [category.id, category.name]))

  return {
    providerDid,
    restaurantName: resolvedRecord.restaurant.businessName,
    updatedAt: (await getLocalFoodProviderMenu(providerDid))?.updatedAt ?? null,
    categories: categories.map((category) => {
      const items = resolvedRecord.menuItems.filter((item) => item.categoryId === category.id)

      return {
        ...category,
        itemCount: items.length,
        availableItemCount: items.filter((item) => item.available).length,
      }
    }),
    menuItems: resolvedRecord.menuItems
      .slice()
      .sort((left, right) => left.name.localeCompare(right.name))
      .map((item) => ({
        ...item,
        categoryName: categoryNameById.get(item.categoryId) ?? 'Onbekende categorie',
      })),
  }
}

export async function updateProviderMenu(providerDid: string, input: LocalFoodProviderMenuUpdateInput) {
  const record = getDemoProviderRecord(providerDid)

  if (!record) {
    return null
  }

  const nextRecord = sanitizeProviderMenuInput(providerDid, input)
  await saveLocalFoodProviderMenu(nextRecord)
  return getProviderMenuEditorView(providerDid)
}
