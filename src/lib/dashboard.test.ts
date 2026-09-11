import { describe, expect, it } from "vitest"

import { createSeedState } from "@/data/seed"
import { getOverallEventStatus, getStatusBreakdown, sortAlertsBySeverity } from "@/lib/dashboard"

describe("dashboard calculations", () => {
  it("counts categories by operational status and sorts alerts by urgency", () => {
    const state = createSeedState()

    expect(getStatusBreakdown(state.categories)).toEqual({ ready: 5, watch: 2, action: 1 })
    expect(getOverallEventStatus(state.categories)).toBe("action")

    const sortedAlerts = sortAlertsBySeverity(state.alerts)
    expect(sortedAlerts.map((alert) => alert.id)).toEqual([
      "alert-staffing-vip",
      "alert-ticketing-scanner",
      "alert-merch-delivery",
    ])
  })

  it("returns watch when no action categories remain", () => {
    const state = createSeedState()
    const categories = state.categories.map((category) =>
      category.status === "action" ? { ...category, status: "watch" as const } : category,
    )

    expect(getOverallEventStatus(categories)).toBe("watch")
  })

  it("returns ready only when all categories are ready", () => {
    const state = createSeedState()
    const categories = state.categories.map((category) => ({ ...category, status: "ready" as const }))

    expect(getOverallEventStatus(categories)).toBe("ready")
  })
})
