import { existsSync, mkdirSync, readFileSync, readdirSync, renameSync, unlinkSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const projectRoot = path.resolve(__dirname, '..')
const dataDirectory = path.join(projectRoot, '.data')
const ownerServiceStoreFile = path.join(dataDirectory, 'owner-services.json')
const manifestDirectory = path.join(dataDirectory, 'agent-manifests')

const providerSeeds = [
  {
    serviceId: 'service-1',
    ownerAgentDid: 'did:adp:seed:webcraft-studio',
    providerName: 'WebCraft Studio',
    providerDescription: 'Boutique digital studio for website design and development.',
    title: 'Website ontwerp & ontwikkeling',
    category: 'services',
    description: 'Moderne websites voor mkb, inclusief UX, development, SEO basis en onderhoud.',
    pricingSummary: {
      askingPrice: 450000,
      currency: 'EUR',
      negotiable: true,
    },
  },
  {
    serviceId: 'service-2',
    ownerAgentDid: 'did:adp:seed:freshhome-cleaning',
    providerName: 'FreshHome Cleaning',
    providerDescription: 'Professional home cleaning provider for apartments and family homes.',
    title: 'Professionele schoonmaak aan huis',
    category: 'services',
    description: 'Betrouwbare home cleaning service voor appartementen en woningen, inclusief deep cleaning en periodieke schoonmaak.',
    pricingSummary: {
      askingPrice: 9500,
      currency: 'EUR',
      negotiable: false,
    },
  },
  {
    serviceId: 'service-3',
    ownerAgentDid: 'did:adp:seed:elektro-totaal-utrecht',
    providerName: 'Elektro Totaal Utrecht',
    providerDescription: 'Electrician for repairs, installations and smart-home upgrades.',
    title: 'Elektricien & domotica',
    category: 'services',
    description: 'Elektricien voor storingen, groepenkasten, verlichting en domotica-installaties in en rond Utrecht.',
    pricingSummary: {
      askingPrice: 17500,
      currency: 'EUR',
      negotiable: true,
    },
  },
  {
    serviceId: 'service-4',
    ownerAgentDid: 'did:adp:seed:pizza-roma-utrecht',
    providerName: 'Pizza Roma Utrecht',
    providerDescription: 'Local pizza kitchen offering delivery and event catering.',
    title: 'Pizza bezorging & catering',
    category: 'food',
    description: 'Verse pizza uit de steenoven, snelle bezorging en catering voor feesten, teams en events.',
    pricingSummary: {
      askingPrice: 1200,
      currency: 'EUR',
      negotiable: false,
    },
  },
  {
    serviceId: 'service-5',
    ownerAgentDid: 'did:adp:seed:loodgieter-direct',
    providerName: 'Loodgieter Direct',
    providerDescription: 'Fast-response plumber for leaks, drains and boiler work.',
    title: 'Loodgieter voor lekkage en afvoer',
    category: 'services',
    description: 'Plumber service voor lekkages, verstopte afvoer, sanitair en spoedreparaties in huis.',
    pricingSummary: {
      askingPrice: 12500,
      currency: 'EUR',
      negotiable: true,
    },
  },
  {
    serviceId: 'service-6',
    ownerAgentDid: 'did:adp:seed:warmtepomp-nl',
    providerName: 'WarmtePompNL',
    providerDescription: 'Installer specialized in residential heat pump projects.',
    title: 'Warmtepomp installatie (lucht-water)',
    category: 'services',
    description: 'Advies en installatie van lucht-water warmtepompen voor woningen, inclusief inspectie en oplevering.',
    pricingSummary: {
      askingPrice: 820000,
      currency: 'EUR',
      negotiable: true,
    },
  },
]

function ensureDirectory(directoryPath) {
  if (!existsSync(directoryPath)) {
    mkdirSync(directoryPath, { recursive: true })
  }
}

function readJson(filePath, fallback) {
  try {
    return JSON.parse(readFileSync(filePath, 'utf8'))
  } catch {
    return fallback
  }
}

function writeJson(filePath, value) {
  const temporaryFile = `${filePath}.tmp`
  writeFileSync(temporaryFile, JSON.stringify(value, null, 2), 'utf8')
  renameSync(temporaryFile, filePath)
}

function buildOwnerServiceCapabilityKey(service) {
  const base = `${service.ownerAgentDid}-${service.id}-${service.category}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

  return `service-${base || 'capability'}`
}

function buildPublishedCapabilityProjection(service, capabilityKey, publishedAt, projectionVersion) {
  return {
    serviceId: service.id,
    ownerAgentDid: service.ownerAgentDid,
    capabilityKey,
    description: `${service.title} — ${service.description}`,
    inputSchema: {
      category: service.category,
      pricing: {
        askingPrice: service.pricingSummary.askingPrice,
        currency: service.pricingSummary.currency,
        negotiable: service.pricingSummary.negotiable,
      },
    },
    outputSchema: {
      category: service.category,
    },
    publishedAt,
    version: projectionVersion,
  }
}

function createPublishedServiceRecord(seed, index) {
  const createdAt = new Date(Date.UTC(2026, 0, 10 + index, 9, 0, 0)).toISOString()
  const updatedAt = new Date(Date.UTC(2026, 0, 10 + index, 9, 15, 0)).toISOString()
  const publishedAt = new Date(Date.UTC(2026, 0, 10 + index, 9, 30, 0)).toISOString()
  const capabilityKey = buildOwnerServiceCapabilityKey({
    id: seed.serviceId,
    ownerAgentDid: seed.ownerAgentDid,
    category: seed.category,
  })
  const projectionVersion = 1
  const projection = buildPublishedCapabilityProjection(
    {
      id: seed.serviceId,
      ownerAgentDid: seed.ownerAgentDid,
      title: seed.title,
      category: seed.category,
      description: seed.description,
      pricingSummary: seed.pricingSummary,
    },
    capabilityKey,
    publishedAt,
    projectionVersion
  )

  return {
    id: seed.serviceId,
    ownerAgentDid: seed.ownerAgentDid,
    title: seed.title,
    category: seed.category,
    description: seed.description,
    publishedCapabilityKey: capabilityKey,
    projectionVersion,
    publishedAt,
    publishedSourceRevision: 1,
    sourceRevision: 1,
    hasUnpublishedChanges: false,
    createdAt,
    updatedAt,
    archivedAt: null,
    latestPublishedSnapshot: {
      serviceId: seed.serviceId,
      ownerAgentDid: seed.ownerAgentDid,
      capabilityKey,
      projectionVersion,
      publishedAt,
      sourceRevision: 1,
      category: seed.category,
      capability: {
        key: capabilityKey,
        description: projection.description,
        input_schema: projection.inputSchema,
        output_schema: projection.outputSchema,
      },
    },
    pricingSummary: seed.pricingSummary,
  }
}

function createManifest(seed, serviceRecord) {
  return {
    did: seed.ownerAgentDid,
    name: seed.providerName,
    role: 'provider',
    description: seed.providerDescription,
    categories: [seed.category],
    capabilities: [
      {
        key: serviceRecord.latestPublishedSnapshot.capability.key,
        description: serviceRecord.latestPublishedSnapshot.capability.description,
        input_schema: serviceRecord.latestPublishedSnapshot.capability.input_schema,
        output_schema: serviceRecord.latestPublishedSnapshot.capability.output_schema,
      },
    ],
    supported_protocol_versions: ['2.0'],
  }
}

ensureDirectory(dataDirectory)
ensureDirectory(manifestDirectory)

const existingStore = readJson(ownerServiceStoreFile, { services: [] })
const seedProviderDids = new Set(providerSeeds.map((seed) => seed.ownerAgentDid))
const seedServiceIds = new Set(providerSeeds.map((seed) => seed.serviceId))
const preservedServices = Array.isArray(existingStore.services)
  ? existingStore.services.filter(
      (service) => !seedProviderDids.has(service.ownerAgentDid) && !seedServiceIds.has(service.id)
    )
  : []
const seededServices = providerSeeds.map(createPublishedServiceRecord)
const nextStore = {
  services: [...preservedServices, ...seededServices],
}

writeJson(ownerServiceStoreFile, nextStore)

for (const fileName of readdirSync(manifestDirectory)) {
  const decodedDid = decodeURIComponent(fileName.replace(/\.json$/, ''))
  if (seedProviderDids.has(decodedDid)) {
    unlinkSync(path.join(manifestDirectory, fileName))
  }
}

for (const [index, seed] of providerSeeds.entries()) {
  const manifest = createManifest(seed, seededServices[index])
  const manifestFile = path.join(manifestDirectory, `${encodeURIComponent(seed.ownerAgentDid)}.json`)
  writeJson(manifestFile, manifest)
}

const publishedEligibleCount = nextStore.services.filter(
  (service) => !service.archivedAt && service.ownerAgentDid && service.publishedCapabilityKey && service.latestPublishedSnapshot
).length

console.log(JSON.stringify({
  totalServices: nextStore.services.length,
  publishedEligibleCount,
  seededProviderCount: providerSeeds.length,
  seededServiceIds: providerSeeds.map((seed) => seed.serviceId),
}, null, 2))
