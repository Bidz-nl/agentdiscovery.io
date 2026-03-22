"use client"

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { MatchResult, Negotiation, InboxItem } from './adp-client'

export type UserRole = 'consumer' | 'provider' | null
export type ProtocolTrustLevel = 'provisional' | 'verified' | 'restricted' | null

export interface SavedBot {
  did: string
  name: string
  role: UserRole
  apiKey: string
}

interface AgentIdentityState {
  did: string | null
  legacyAgentId: number | null
  name: string
  role: UserRole
}

interface ProtocolSessionState {
  sessionId: string | null
  trustLevel: ProtocolTrustLevel
  expiresAt: string | null
}

interface AppSessionState {
  apiKey: string | null
}

interface AgentState {
  // Identity
  did: string | null
  apiKey: string | null
  agentId: number | null
  agentIdentity: AgentIdentityState
  protocolSession: ProtocolSessionState
  appSession: AppSessionState
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

  // Saved bots (multi-bot switcher)
  savedBots: SavedBot[]
  skipAutoRedirect: boolean

  // Actions
  setAgentIdentity: (identity: Partial<AgentIdentityState>) => void
  setProtocolSession: (session: Partial<ProtocolSessionState>) => void
  setAppSession: (session: Partial<AppSessionState>) => void
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
  saveCurrentBot: () => void
  switchBot: (did: string) => void
  removeSavedBot: (did: string) => void
  clearSkipAutoRedirect: () => void
}

const initialState = {
  did: null,
  apiKey: null,
  agentId: null,
  agentIdentity: {
    did: null,
    legacyAgentId: null,
    name: '',
    role: null as UserRole,
  },
  protocolSession: {
    sessionId: null,
    trustLevel: null as ProtocolTrustLevel,
    expiresAt: null,
  },
  appSession: {
    apiKey: null,
  },
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
  savedBots: [],
  skipAutoRedirect: false,
}

export const useAgentStore = create<AgentState>()(
  persist(
    (set) => ({
      ...initialState,

      setAgentIdentity: (identity) =>
        set((state) => ({
          did: identity.did ?? state.did,
          agentId: identity.legacyAgentId ?? state.agentId,
          name: identity.name ?? state.name,
          role: identity.role ?? state.role,
          agentIdentity: {
            ...state.agentIdentity,
            ...identity,
          },
        })),
      setProtocolSession: (session) =>
        set((state) => ({
          protocolSession: {
            ...state.protocolSession,
            ...session,
          },
        })),
      setAppSession: (session) =>
        set((state) => ({
          apiKey: session.apiKey ?? state.apiKey,
          appSession: {
            ...state.appSession,
            ...session,
          },
        })),
      setCredentials: (did, apiKey, agentId) =>
        set((state) => ({
          did,
          apiKey,
          agentId,
          agentIdentity: {
            ...state.agentIdentity,
            did,
            legacyAgentId: agentId,
          },
          appSession: {
            ...state.appSession,
            apiKey,
          },
        })),
      setRole: (role) =>
        set((state) => ({
          role,
          agentIdentity: {
            ...state.agentIdentity,
            role,
          },
        })),
      setName: (name) =>
        set((state) => ({
          name,
          agentIdentity: {
            ...state.agentIdentity,
            name,
          },
        })),
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
      saveCurrentBot: () =>
        set((state) => {
          if (!state.did || !state.appSession.apiKey || !state.name) return {}
          const bot: SavedBot = {
            did: state.did,
            name: state.name,
            role: state.role,
            apiKey: state.appSession.apiKey,
          }
          const existing = state.savedBots.filter((b) => b.did !== bot.did)
          return { savedBots: [...existing, bot] }
        }),
      switchBot: (did) =>
        set((state) => {
          const bot = state.savedBots.find((b) => b.did === did)
          if (!bot) return {}
          return {
            did: bot.did,
            name: bot.name,
            role: bot.role,
            apiKey: bot.apiKey,
            agentIdentity: {
              did: bot.did,
              legacyAgentId: state.agentIdentity.legacyAgentId,
              name: bot.name,
              role: bot.role,
            },
            appSession: { apiKey: bot.apiKey },
            onboardingComplete: true,
            skipAutoRedirect: true,
            // reset transient state
            lastSearch: '',
            searchResults: [],
            activeNegotiations: [],
            inbox: [],
          }
        }),
      removeSavedBot: (did) =>
        set((state) => ({
          savedBots: state.savedBots.filter((b) => b.did !== did),
        })),
      clearSkipAutoRedirect: () => set({ skipAutoRedirect: false }),
    }),
    {
      name: 'adp-agent-store',
    }
  )
)
