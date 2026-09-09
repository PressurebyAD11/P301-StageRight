import { describe, expect, it } from "vitest"

import { createSeedState } from "@/data/seed"
import { assignVipSecurityLead, calculateOverallReadiness } from "@/lib/readiness"

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
})