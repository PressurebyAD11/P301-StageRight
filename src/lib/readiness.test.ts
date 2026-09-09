import { describe, expect, it } from "vitest"

import { createSeedState } from "@/data/seed"
import {
  assignVipSecurityLead,
  calculateOverallReadiness,
  resolveMerchandiseDelivery,
  restoreSectionScanner,
} from "@/lib/readiness"
import { SCHEMA_VERSION } from "@/data/seed"
import { hydratePersistedAppState } from "@/store/use-app-store"

describe("readiness engine", () => {
  it("computes the seed scenario to 87%", () => {
    const seedState = createSeedState()

    expect(calculateOverallReadiness(seedState.categories)).toBe(87)
    expect(seedState.overallReadiness).toBe(87)
  })

  it("computes the VIP staffing golden path to 91%", () => {
    const seedState = createSeedState()
    const qualifiedAssignee = seedState.staff.find(
      (staffMember) =>
        staffMember.status === "available" && staffMember.qualifications.includes("vip_security_lead"),
    )

    expect(qualifiedAssignee).toBeDefined()

    const updatedState = assignVipSecurityLead(seedState, qualifiedAssignee!.id, "2026-09-09T14:15:00-04:00")
    const staffing = updatedState.categories.find((category) => category.id === "staffing")
    const staffingAlert = updatedState.alerts.find((alert) => alert.id === "alert-staffing-vip")

    expect(updatedState.overallReadiness).toBe(91)
    expect(staffing?.readiness).toBe(85)
    expect(staffing?.status).toBe("watch")
    expect(staffingAlert?.resolved).toBe(true)
  })

  it("promotes merchandise from watch to ready and raises readiness by 3", () => {
    const seedState = createSeedState()
    const updatedState = resolveMerchandiseDelivery(seedState, "2026-09-09T14:18:00-04:00")
    const merchandise = updatedState.categories.find((category) => category.id === "merchandise")
    const merchandiseAlert = updatedState.alerts.find((alert) => alert.id === "alert-merch-delivery")

    expect(seedState.overallReadiness).toBe(87)
    expect(updatedState.overallReadiness).toBe(90)
    expect(updatedState.overallReadiness - seedState.overallReadiness).toBe(3)
    expect(merchandise?.readiness).toBe(95)
    expect(merchandise?.status).toBe("ready")
    expect(merchandiseAlert?.resolved).toBe(true)
  })

  it("promotes ticketing from watch to ready and raises readiness by 1", () => {
    const seedState = createSeedState()
    const updatedState = restoreSectionScanner(seedState, "2026-09-09T14:20:00-04:00")
    const ticketing = updatedState.categories.find((category) => category.id === "ticketing")
    const ticketingAlert = updatedState.alerts.find((alert) => alert.id === "alert-ticketing-scanner")

    expect(seedState.overallReadiness).toBe(87)
    expect(updatedState.overallReadiness).toBe(88)
    expect(updatedState.overallReadiness - seedState.overallReadiness).toBe(1)
    expect(ticketing?.readiness).toBe(98)
    expect(ticketing?.status).toBe("ready")
    expect(ticketingAlert?.resolved).toBe(true)
  })
})

describe("persisted state hydration", () => {
  it("falls back to seed when the persisted schema version is stale", () => {
    const seedState = createSeedState()
    const staleState = {
      ...seedState,
      overallReadiness: 42,
      schemaVersion: SCHEMA_VERSION - 1,
    }

    const hydratedState = hydratePersistedAppState(staleState, SCHEMA_VERSION - 1)

    expect(hydratedState).toEqual(seedState)
  })

  it("falls back to seed when the persisted payload is invalid", () => {
    const seedState = createSeedState()
    const hydratedState = hydratePersistedAppState(
      {
        schemaVersion: SCHEMA_VERSION,
        isAuthenticated: true,
        categories: "broken",
      },
      SCHEMA_VERSION,
    )

    expect(hydratedState).toEqual(seedState)
  })
})