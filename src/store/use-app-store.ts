import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"

import { SCHEMA_VERSION, createSeedState } from "@/data/seed"
import {
  assignVipSecurityLead,
  recomputeAppState,
  resolveMerchandiseDelivery,
  restoreSectionScanner,
} from "@/lib/readiness"
import type { AppState } from "@/types"

interface AppStoreActions {
  signIn: () => void
  signOut: () => void
  resetScenario: () => void
  recompute: () => void
  assignVipSecurityLead: (staffId: string) => void
  resolveMerchandiseDelivery: () => void
  restoreSectionScanner: () => void
}

export type AppStore = AppState & AppStoreActions

const STORAGE_KEY = "stageright-app-state"

function isValidPersistedState(value: unknown): value is AppState {
  if (!value || typeof value !== "object") {
    return false
  }

  const candidate = value as Partial<AppState>
  return Array.isArray(candidate.categories) && Array.isArray(candidate.alerts) && Array.isArray(candidate.staff)
}

function getInitialState(): AppState {
  return createSeedState()
}

export const useAppStore = create<AppStore>()(
  persist(
    (set) => ({
      ...getInitialState(),
      signIn: () => set((state) => ({ ...state, isAuthenticated: true })),
      signOut: () => set((state) => ({ ...state, isAuthenticated: false })),
      resetScenario: () =>
        set((state) => {
          const nextState = getInitialState()
          return {
            ...nextState,
            isAuthenticated: state.isAuthenticated,
          }
        }),
      recompute: () => set((state) => recomputeAppState(state)),
      assignVipSecurityLead: (staffId: string) => set((state) => assignVipSecurityLead(state, staffId)),
      resolveMerchandiseDelivery: () => set((state) => resolveMerchandiseDelivery(state)),
      restoreSectionScanner: () => set((state) => restoreSectionScanner(state)),
    }),
    {
      name: STORAGE_KEY,
      version: SCHEMA_VERSION,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        schemaVersion: state.schemaVersion,
        isAuthenticated: state.isAuthenticated,
        event: state.event,
        categories: state.categories,
        alerts: state.alerts,
        staff: state.staff,
        overallReadiness: state.overallReadiness,
      }),
      migrate: (persistedState, version) => {
        if (version !== SCHEMA_VERSION || !isValidPersistedState(persistedState)) {
          return getInitialState()
        }

        return recomputeAppState({
          ...persistedState,
          schemaVersion: SCHEMA_VERSION,
        })
      },
      merge: (persistedState, currentState) => {
        if (!isValidPersistedState(persistedState)) {
          return currentState
        }

        return {
          ...currentState,
          ...recomputeAppState({
            ...persistedState,
            schemaVersion: SCHEMA_VERSION,
          }),
        }
      },
    },
  ),
)