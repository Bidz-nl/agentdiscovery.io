"use client"

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { MatchResult, Negotiation, InboxItem } from './adp-client'

export type UserRole = 'consumer' | 'provider' | null

interface AgentState {
  // Identity
  did: string | null
  apiKey: string | null
  agentId: number | null
  name: string
  role: UserRole
  trustLevel: number
  reputationScore: number
  postcode: string

  // Consumer state
  lastSearch: string
  searchResults: MatchResult[]
  activeNegotiations: Negotiation[]
  preferences: string[]

  // Provider state
  capabilities: Array<{
    id: number
    category: string
    title: string
    description: string | null
    pricing: Record<string, unknown>
    status: string
  }>
  inbox: InboxItem[]
  isOnline: boolean

  // Onboarding
  onboardingComplete: boolean

  // Actions
  setCredentials: (did: string, apiKey: string, agentId: number) => void
  setRole: (role: UserRole) => void
  setName: (name: string) => void
  setPostcode: (postcode: string) => void
  setPreferences: (prefs: string[]) => void
  setOnboardingComplete: (complete: boolean) => void
  setSearchResults: (results: MatchResult[]) => void
  setLastSearch: (query: string) => void
  setActiveNegotiations: (negotiations: Negotiation[]) => void
  setCapabilities: (caps: AgentState['capabilities']) => void
  setInbox: (items: InboxItem[]) => void
  setIsOnline: (online: boolean) => void
  clearAgent: () => void
}

const initialState = {
  did: null,
  apiKey: null,
  agentId: null,
  name: '',
  role: null as UserRole,
  trustLevel: 1,
  reputationScore: 0,
  postcode: '',
  lastSearch: '',
  searchResults: [],
  activeNegotiations: [],
  preferences: [],
  capabilities: [],
  inbox: [],
  isOnline: true,
  onboardingComplete: false,
}

export const useAgentStore = create<AgentState>()(
  persist(
    (set) => ({
      ...initialState,

      setCredentials: (did, apiKey, agentId) => set({ did, apiKey, agentId }),
      setRole: (role) => set({ role }),
      setName: (name) => set({ name }),
      setPostcode: (postcode) => set({ postcode }),
      setPreferences: (preferences) => set({ preferences }),
      setOnboardingComplete: (onboardingComplete) => set({ onboardingComplete }),
      setSearchResults: (searchResults) => set({ searchResults }),
      setLastSearch: (lastSearch) => set({ lastSearch }),
      setActiveNegotiations: (activeNegotiations) => set({ activeNegotiations }),
      setCapabilities: (capabilities) => set({ capabilities }),
      setInbox: (inbox) => set({ inbox }),
      setIsOnline: (isOnline) => set({ isOnline }),
      clearAgent: () => set(initialState),
    }),
    {
      name: 'adp-agent-store',
    }
  )
)
