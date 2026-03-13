import { getAgentRecordByDid } from '@/lib/adp-v2/agent-record-repository'
import { listOwnerServiceRecords } from '@/lib/owner-service-repository'

import type { NativeServiceMatchCandidate } from '@/lib/service-match/service-match-output'
import type { NormalizedServiceMatchQuery } from '@/lib/service-match/service-match-schema'

const MIN_BUDGET_KEYWORD_MATCH_SCORE = 0.6

function includesKeyword(haystack: string, keyword: string) {
  return haystack.toLowerCase().includes(keyword)
}

function countKeywordHits(text: string, keywords: string[]) {
  if (!text || keywords.length === 0) {
    return 0
  }

  return keywords.reduce((count, keyword) => count + (includesKeyword(text, keyword) ? 1 : 0), 0)
}

function hasKeywordMatch(candidate: NativeServiceMatchCandidate, keywords: string[]) {
  const { service, agent } = candidate
  const snapshot = service.latestPublishedSnapshot

  return (
    countKeywordHits(service.title, keywords) > 0 ||
    countKeywordHits(service.description || '', keywords) > 0 ||
    countKeywordHits(snapshot?.capability.description || '', keywords) > 0 ||
    countKeywordHits(agent?.name || '', keywords) > 0
  )
}

function computeMatchScore(candidate: NativeServiceMatchCandidate, query: NormalizedServiceMatchQuery) {
  const { service, agent } = candidate
  const snapshot = service.latestPublishedSnapshot
  const keywords = query.requirements.keywords
  const hasSpecificCategory = Boolean(query.category) && query.category.toLowerCase() !== 'all'
  const isPureBrowseQuery =
    !hasSpecificCategory &&
    keywords.length === 0 &&
    typeof query.budget?.maxAmount !== 'number' &&
    !query.postcode

  let rawScore = 0
  let maxScore = 0

  if (isPureBrowseQuery) {
    return 1
  }

  if (hasSpecificCategory) {
    maxScore += 40
    const serviceCategory = (snapshot?.category || service.category || '').toLowerCase()
    if (serviceCategory === query.category.toLowerCase()) {
      rawScore += 40
    }
  }

  maxScore += keywords.length * (25 + 15 + 15 + 5)
  rawScore += countKeywordHits(service.title, keywords) * 25
  rawScore += countKeywordHits(service.description || '', keywords) * 15
  rawScore += countKeywordHits(snapshot?.capability.description || '', keywords) * 15
  rawScore += countKeywordHits(agent?.name || '', keywords) * 5

  if (
    typeof query.budget?.maxAmount === 'number' &&
    typeof service.pricingSummary.askingPrice === 'number' &&
    service.pricingSummary.askingPrice <= query.budget.maxAmount
  ) {
    rawScore += 10
  }
  if (typeof query.budget?.maxAmount === 'number') {
    maxScore += 10
  }

  if (maxScore <= 0) {
    return 0
  }

  return Math.min(rawScore / maxScore, 1)
}

function compareCandidates(left: NativeServiceMatchCandidate, right: NativeServiceMatchCandidate) {
  if (right.matchScore !== left.matchScore) {
    return right.matchScore - left.matchScore
  }

  const leftPublishedAt = left.service.publishedAt || ''
  const rightPublishedAt = right.service.publishedAt || ''
  if (rightPublishedAt !== leftPublishedAt) {
    return rightPublishedAt.localeCompare(leftPublishedAt)
  }

  return right.service.updatedAt.localeCompare(left.service.updatedAt)
}

export function findNativeServiceMatches(query: NormalizedServiceMatchQuery): NativeServiceMatchCandidate[] {
  const allServices = listOwnerServiceRecords()
  const publishedEligibleServices = allServices
    .filter((service) => !service.archivedAt)
    .filter((service) => Boolean(service.ownerAgentDid))
    .filter((service) => Boolean(service.publishedCapabilityKey && service.latestPublishedSnapshot))
  const categoryFilteredServices = publishedEligibleServices.filter((service) => {
    if (!query.category || query.category.toLowerCase() === 'all') {
      return true
    }

    const category = service.latestPublishedSnapshot?.category || service.category
    return category.toLowerCase() === query.category.toLowerCase()
  })
  const budgetFilteredServices = categoryFilteredServices.filter((service) => {
    if (typeof query.budget?.maxAmount !== 'number') {
      return true
    }

    return (
      typeof service.pricingSummary.askingPrice === 'number' &&
      service.pricingSummary.askingPrice <= query.budget.maxAmount
    )
  })

  const candidates = budgetFilteredServices.map((service) => {
    const agent = getAgentRecordByDid(service.ownerAgentDid)
    const candidate: NativeServiceMatchCandidate = {
      service,
      agent,
      matchScore: 0,
    }

    return {
      ...candidate,
      matchScore: computeMatchScore(candidate, query),
    }
  })

  const keywordFilteredCandidates =
    query.requirements.keywords.length > 0
      ? candidates.filter((candidate) => hasKeywordMatch(candidate, query.requirements.keywords))
      : candidates
  const acceptedCandidates =
    query.requirements.keywords.length > 0 && typeof query.budget?.maxAmount === 'number'
      ? keywordFilteredCandidates.filter((candidate) => candidate.matchScore >= MIN_BUDGET_KEYWORD_MATCH_SCORE)
      : keywordFilteredCandidates

  return acceptedCandidates.sort(compareCandidates).slice(0, query.limit)
}
