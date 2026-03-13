import { listOwnerServiceRecords } from '@/lib/owner-service-repository'

function toStablePositiveInt(value: string): number {
  let hash = 0

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) | 0
  }

  return Math.abs(hash) || 1
}

export function toPublishedServiceCapabilityId(serviceId: string) {
  return toStablePositiveInt(`capability:${serviceId}`)
}

export function toPublishedAgentNumericId(agentDid: string) {
  return toStablePositiveInt(`agent:${agentDid}`)
}

export function findPublishedServiceByCapabilityId(capabilityId: number) {
  return listOwnerServiceRecords().find(
    (service) =>
      !service.archivedAt &&
      Boolean(service.publishedCapabilityKey && service.latestPublishedSnapshot) &&
      toPublishedServiceCapabilityId(service.id) === capabilityId
  ) ?? null
}
