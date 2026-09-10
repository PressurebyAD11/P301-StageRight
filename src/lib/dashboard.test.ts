import { describe, expect, it } from "vitest"

import { createSeedState } from "@/data/seed"
import { getStatusBreakdown, sortAlertsBySeverity } from "@/lib/dashboard"

describe("dashboard calculations", () => {
  it("counts categories by operational status and sorts alerts by urgency", () => {
    const state = createSeedState()

    expect(getStatusBreakdown(state.categories)).toEqual({ ready: 5, watch: 2, action: 1 })

    const sortedAlerts = sortAlertsBySeverity(state.alerts)
    expect(sortedAlerts.map((alert) => alert.id)).toEqual([
      "alert-staffing-vip",
      "alert-ticketing-scanner",
      "alert-merch-delivery",
    ])
  })
})
