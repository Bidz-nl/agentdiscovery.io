export type LocalFoodVertical = 'local-food'

export type LocalFoodProviderStatus = 'draft' | 'active' | 'paused'

export type LocalFoodFulfilmentMode = 'delivery' | 'pickup'

export type LocalFoodCurrency = 'EUR'

export type LocalFoodOrderStatus =
  | 'received'
  | 'preparing'
  | 'ready_for_pickup'
  | 'out_for_delivery'
  | 'completed'
  | 'cancelled'

export type LocalFoodOrderPaymentStatus = 'not_started' | 'pending' | 'paid' | 'failed' | 'refunded'

export interface LocalFoodOrderStatusTimeline {
  receivedAt: string | null
  preparingAt: string | null
  readyForPickupAt: string | null
  outForDeliveryAt: string | null
  completedAt: string | null
  cancelledAt: string | null
}

export type LocalFoodPressureLevel = 'normal' | 'busy' | 'very_busy' | 'paused'

export interface LocalFoodOperationalPauseReason {
  code: 'busy_kitchen' | 'courier_shortage' | 'temporary_break' | 'manual_pause'
  label: string
}

export interface LocalFoodProviderOperationalControls {
  providerDid: string
  paused: boolean
  pausedReason: LocalFoodOperationalPauseReason | null
  disabledFulfilmentModes: LocalFoodFulfilmentMode[]
  forcedFulfilmentMode: LocalFoodFulfilmentMode | null
  leadTimeOffsetMinutes: number
  disabledCategoryIds: string[]
  disabledMenuItemIds: string[]
  pressureMessage: string | null
  updatedAt: string | null
}

export interface LocalFoodProviderControlsPatch {
  paused?: boolean
  pausedReason?: LocalFoodOperationalPauseReason | null
  disabledFulfilmentModes?: LocalFoodFulfilmentMode[]
  forcedFulfilmentMode?: LocalFoodFulfilmentMode | null
  leadTimeOffsetMinutes?: number
  disabledCategoryIds?: string[]
  disabledMenuItemIds?: string[]
  pressureMessage?: string | null
}

export type LocalFoodProviderPressureSignalId =
  | 'received_backlog'
  | 'received_waiting_too_long'
  | 'preparing_backlog'
  | 'preparing_running_long'
  | 'open_orders_backlog'

export interface LocalFoodProviderPressureSignal {
  id: LocalFoodProviderPressureSignalId
  label: string
  detail: string
  level: Extract<LocalFoodPressureLevel, 'busy' | 'very_busy'>
}

export interface LocalFoodProviderSuggestedAction {
  id: string
  label: string
  description: string
  tone: 'primary' | 'secondary' | 'danger'
  patch: LocalFoodProviderControlsPatch
}

export type LocalFoodProviderOperationalPresetId = 'normal' | 'busy' | 'very_busy' | 'paused'

export interface LocalFoodProviderOperationalPreset {
  id: LocalFoodProviderOperationalPresetId
  label: string
  description: string
  active: boolean
  patch: LocalFoodProviderControlsPatch
}

export interface LocalFoodProviderOperationalStand {
  pressureLevel: LocalFoodPressureLevel
  pressureTitle: string
  pressureMessage: string
  leadTimeLabel: string
  leadTimeOffsetMinutes: number
  acceptsOrders: boolean
  openStateLabel: string
  fulfilmentLabel: string
  openOrdersCount: number
  receivedCount: number
  preparingCount: number
  readyCount: number
  activeRestrictions: string[]
}

export interface LocalFoodPublicPressureFeedback {
  level: LocalFoodPressureLevel
  title: string
  message: string
}

export interface LocalFoodPublicAvailability {
  acceptsOrders: boolean
  availableFulfilmentModes: LocalFoodFulfilmentMode[]
  unavailableReason: string | null
  leadTimeLabel: string
  pressure: LocalFoodPublicPressureFeedback
}

export interface LocalFoodCategory {
  id: string
  slug: string
  name: string
  position: number
  visible: boolean
}

export interface LocalFoodImageAsset {
  imageUrl: string | null
  imageAlt: string | null
  imageFallback: string | null
}

export interface LocalFoodRestaurantBranding extends LocalFoodImageAsset {
  logoUrl: string | null
  logoAlt: string | null
}

export interface LocalFoodPublicMenuItem extends LocalFoodImageAsset {
  id: string
  categoryId: string
  name: string
  description: string
  priceCents: number
  currency: LocalFoodCurrency
  available: boolean
  unavailableReason?: string | null
  tags: string[]
}

export interface LocalFoodPublicRestaurant {
  providerDid: string
  slug: string
  businessName: string
  summary: string
  vertical: LocalFoodVertical
  locationLabel: string
  coverageLabel: string
  postcodePrefixes: string[]
  fulfilmentModes: LocalFoodFulfilmentMode[]
  startingPriceCents: number | null
  cuisineTypes: string[]
  tags: string[]
  branding: LocalFoodRestaurantBranding
  availability: LocalFoodPublicAvailability
}

export interface LocalFoodPublicRestaurantDetail {
  restaurant: LocalFoodPublicRestaurant
  categories: LocalFoodCategory[]
  menuItems: LocalFoodPublicMenuItem[]
  controls: LocalFoodProviderOperationalControls
}

export interface LocalFoodProviderMenuRecord {
  providerDid: string
  categories: LocalFoodCategory[]
  menuItems: LocalFoodPublicMenuItem[]
  updatedAt: string | null
}

export interface LocalFoodProviderMenuUpdateInput {
  categories: LocalFoodCategory[]
  menuItems: LocalFoodPublicMenuItem[]
}

export interface LocalFoodPublicSearchInput {
  postcode?: string
  location?: string
  query?: string
}

export interface LocalFoodPublicOrderCustomerInput {
  name: string
  phone: string
  postcode: string
  address: string
}

export interface LocalFoodPublicOrderItemInput {
  menuItemId: string
  quantity: number
  note?: string
  modifiers?: LocalFoodPublicOrderItemModifierInput[]
}

export interface LocalFoodPublicOrderItemModifierInput {
  id: string
  label: string
  quantity?: number
  priceDeltaCents?: number
}

export interface LocalFoodOrderLineModifier {
  id: string
  label: string
  quantity: number
  priceDeltaCents: number
}

export type LocalFoodPublicOrderIntent = 'draft' | 'confirm'

export interface LocalFoodPublicOrderInput {
  intent?: LocalFoodPublicOrderIntent
  providerDid: string
  fulfilmentMode: LocalFoodFulfilmentMode
  customer: LocalFoodPublicOrderCustomerInput
  items: LocalFoodPublicOrderItemInput[]
}

export interface LocalFoodPublicOrderLine {
  menuItemId: string
  name: string
  quantity: number
  unitPriceCents: number
  lineTotalCents: number
  note: string | null
  modifiers: LocalFoodOrderLineModifier[]
}

export interface LocalFoodPublicOrderDraft {
  providerDid: string
  restaurantName: string
  fulfilmentMode: LocalFoodFulfilmentMode
  customer: LocalFoodPublicOrderCustomerInput
  items: LocalFoodPublicOrderLine[]
  itemCount: number
  subtotalCents: number
  currency: LocalFoodCurrency
}

export interface LocalFoodPublicOrderConfirmation extends LocalFoodPublicOrderDraft {
  orderId: string
  orderReference: string
  status: LocalFoodOrderStatus
  paymentStatus: LocalFoodOrderPaymentStatus
  createdAt: string
  statusLabel: string
  nextStepLabel: string
  expectationLabel: string
}

export interface LocalFoodPublicOrderFieldErrors {
  providerDid?: string
  fulfilment?: string
  name?: string
  phone?: string
  postcode?: string
  address?: string
  items?: string
}

export type LocalFoodPublicOrderValidationResult =
  | {
      ok: true
      input: LocalFoodPublicOrderInput
    }
  | {
      ok: false
      message: string
      fieldErrors: LocalFoodPublicOrderFieldErrors
    }

export interface LocalFoodOrderRecord extends LocalFoodPublicOrderDraft {
  id: string
  orderReference: string
  status: LocalFoodOrderStatus
  paymentStatus: LocalFoodOrderPaymentStatus
  source: 'public_web'
  createdAt: string
  updatedAt: string
  confirmedAt: string
  statusTimeline?: LocalFoodOrderStatusTimeline
}

export interface LocalFoodProviderOrderSummary {
  id: string
  orderReference: string
  providerDid: string
  restaurantName: string
  fulfilmentMode: LocalFoodFulfilmentMode
  status: LocalFoodOrderStatus
  paymentStatus: LocalFoodOrderPaymentStatus
  itemCount: number
  subtotalCents: number
  customerName: string
  createdAt: string
  updatedAt: string
  confirmedAt: string
  statusTimeline?: LocalFoodOrderStatusTimeline
}

export interface LocalFoodProviderOrderStatusAction {
  status: LocalFoodOrderStatus
  label: string
  tone: 'primary' | 'neutral' | 'danger'
}

export interface LocalFoodProviderPaymentPreparation {
  status: LocalFoodOrderPaymentStatus
  statusLabel: string
  actionLabel: string
  helperText: string
  canStart: boolean
}

export interface LocalFoodProviderOrderQueueItem extends LocalFoodProviderOrderSummary {
  statusLabel: string
  paymentStatusLabel: string
  fulfilmentLabel: string
  nextActionLabel: string | null
  urgency: 'high' | 'medium' | 'low'
  urgencyLabel: string
  sortKey: number
  createdAgeMinutes: number
  createdAgeLabel: string
  currentStatusStartedAt: string | null
  currentStatusAgeMinutes: number
  currentStatusAgeLabel: string
  operationalHint: string
}

export interface LocalFoodProviderOrderLifecycleEntry {
  status: LocalFoodOrderStatus
  label: string
  at: string | null
}

export interface LocalFoodProviderOrderDetail extends LocalFoodOrderRecord {
  statusLabel: string
  paymentStatusLabel: string
  fulfilmentLabel: string
  availableStatusActions: LocalFoodProviderOrderStatusAction[]
  paymentPreparation: LocalFoodProviderPaymentPreparation
  currentStatusStartedAt: string | null
  currentStatusAgeMinutes: number
  currentStatusAgeLabel: string
  lifecycleEntries: LocalFoodProviderOrderLifecycleEntry[]
}

export interface LocalFoodProviderCategoryControl {
  id: string
  name: string
  disabled: boolean
}

export interface LocalFoodProviderMenuItemControl {
  id: string
  categoryId: string
  name: string
  disabled: boolean
}

export interface LocalFoodProviderMenuEditorCategory extends LocalFoodCategory {
  itemCount: number
  availableItemCount: number
}

export interface LocalFoodProviderMenuEditorItem extends LocalFoodPublicMenuItem {
  categoryName: string
}

export interface LocalFoodProviderMenuEditorView {
  providerDid: string
  restaurantName: string
  updatedAt: string | null
  categories: LocalFoodProviderMenuEditorCategory[]
  menuItems: LocalFoodProviderMenuEditorItem[]
}

export interface LocalFoodProviderOperationalControlsView {
  controls: LocalFoodProviderOperationalControls
  supportedFulfilmentModes: LocalFoodFulfilmentMode[]
  operationalStand: LocalFoodProviderOperationalStand
  pressureSignals: LocalFoodProviderPressureSignal[]
  suggestedActions: LocalFoodProviderSuggestedAction[]
  presets: LocalFoodProviderOperationalPreset[]
  categories: LocalFoodProviderCategoryControl[]
  menuItems: LocalFoodProviderMenuItemControl[]
}

export type LocalFoodProviderQueueFilter = 'all' | 'attention' | 'new' | 'preparing' | 'ready' | 'completed'

export interface LocalFoodProviderQueueFilterOption {
  value: LocalFoodProviderQueueFilter
  label: string
  count: number
}

export interface LocalFoodProviderQueueSummary {
  total: number
  newCount: number
  preparingCount: number
  readyCount: number
  completedCount: number
  attentionCount: number
}

export interface LocalFoodProviderOrderBoard {
  providerDid: string
  summary: LocalFoodProviderQueueSummary
  activeFilter: LocalFoodProviderQueueFilter
  filters: LocalFoodProviderQueueFilterOption[]
  orders: LocalFoodProviderOrderQueueItem[]
}
