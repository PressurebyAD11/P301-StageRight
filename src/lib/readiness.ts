import type { Alert, AppState, Category, CategoryId, CategoryMetricValue, StaffMember, Status } from "@/types"

function getMetric(category: Category, key: string): CategoryMetricValue | undefined {
  return category.metrics[key]
}

function getNumberMetric(category: Category, key: string, fallback = 0): number {
  const value = getMetric(category, key)
  return typeof value === "number" ? value : fallback
}

function getBooleanMetric(category: Category, key: string, fallback = false): boolean {
  const value = getMetric(category, key)
  return typeof value === "boolean" ? value : fallback
}

function hasUnmetCriticalRequirement(category: Category): boolean {
  return category.requirements.some((requirement) => requirement.critical && !requirement.satisfied)
}

function summarizeCategory(category: Category): string {
  switch (category.id) {
    case "staffing": {
      const confirmed = getNumberMetric(category, "positionsConfirmed")
      const required = getNumberMetric(category, "positionsRequired")
      const vipConfirmed = getNumberMetric(category, "vipEntranceConfirmed")
      const vipRequired = getNumberMetric(category, "vipEntranceRequired")
      const criticalCovered = getBooleanMetric(category, "criticalRolesCovered")
      return criticalCovered
        ? `${confirmed} of ${required} positions confirmed; ${vipConfirmed} of ${vipRequired} VIP entrance posts filled`
        : `${confirmed} of ${required} positions confirmed; VIP Security Lead uncovered`
    }
    case "security":
      return "42 of 42 posts staffed; screenings complete"
    case "ticketing": {
      const online = getNumberMetric(category, "scannersOnline")
      const total = getNumberMetric(category, "scannersTotal")
      const backupDeployed = getBooleanMetric(category, "backupScannerDeployed")
      return backupDeployed
        ? `${online} of ${total} scanners online; Section 114 backup deployed`
        : `${online} of ${total} scanners online; Section 114 backup pending`
    }
    case "concessions":
      return "18 of 20 stands staffed; inventory received"
    case "parking":
      return "All required lots open; west approach running light delays"
    case "vip":
      return "Suite prep complete; credentials staged for arrival"
    case "merchandise": {
      const received = getBooleanMetric(category, "inventoryReceived")
      return received
        ? "Tour merchandise received; concourse stands ready"
        : "East Concourse setup waiting on delayed delivery"
    }
    case "facilities":
      return "Safety inspections complete; no critical work orders"
    default:
      return category.summary
  }
}

export function deriveCategoryStatus(category: Category): Status {
  if (hasUnmetCriticalRequirement(category)) {
    return "action"
  }

  switch (category.id) {
    case "staffing": {
      const positionsRequired = getNumberMetric(category, "positionsRequired")
      const positionsConfirmed = getNumberMetric(category, "positionsConfirmed")
      const openNonCriticalPosts = getNumberMetric(category, "openNonCriticalPosts")
      const criticalRolesCovered = getBooleanMetric(category, "criticalRolesCovered")
      const confirmedPct = positionsRequired === 0 ? 0 : (positionsConfirmed / positionsRequired) * 100

      if (!criticalRolesCovered || confirmedPct < 90) {
        return "action"
      }

      if (confirmedPct >= 98 && openNonCriticalPosts === 0) {
        return "ready"
      }

      return "watch"
    }
    case "security": {
      const criticalPostUncovered = getBooleanMetric(category, "criticalPostUncovered")
      const allRequiredPostsStaffed = getBooleanMetric(category, "allRequiredPostsStaffed")
      const checksComplete = getBooleanMetric(category, "checksComplete")

      if (criticalPostUncovered) {
        return "action"
      }

      if (allRequiredPostsStaffed && checksComplete) {
        return "ready"
      }

      return "watch"
    }
    case "ticketing": {
      const scannersOnlinePct = getNumberMetric(category, "scannersOnlinePct")
      const entrancesPrepped = getBooleanMetric(category, "entrancesPrepped")
      const entranceBlocked = getBooleanMetric(category, "entranceBlocked")

      if (entranceBlocked || scannersOnlinePct < 95) {
        return "action"
      }

      if (scannersOnlinePct >= 98 && entrancesPrepped) {
        return "ready"
      }

      return "watch"
    }
    case "concessions": {
      const standsStaffedPct = getNumberMetric(category, "standsStaffedPct")
      const inventoryReceived = getBooleanMetric(category, "inventoryReceived")
      const criticalInventoryGap = getBooleanMetric(category, "criticalInventoryGap")
      const majorStaffingShortage = getBooleanMetric(category, "majorStaffingShortage")

      if (criticalInventoryGap || majorStaffingShortage) {
        return "action"
      }

      if (standsStaffedPct >= 85 && inventoryReceived) {
        return "ready"
      }

      return "watch"
    }
    case "parking": {
      const requiredLotsOpen = getBooleanMetric(category, "requiredLotsOpen")
      const requiredLotsStaffed = getBooleanMetric(category, "requiredLotsStaffed")
      const reducedCapacity = getBooleanMetric(category, "reducedCapacity")

      if (!requiredLotsOpen || !requiredLotsStaffed) {
        return "action"
      }

      if (reducedCapacity) {
        return "watch"
      }

      return "ready"
    }
    case "vip": {
      const allSpacesPrepped = getBooleanMetric(category, "allSpacesPrepped")
      const credentialsReady = getBooleanMetric(category, "credentialsReady")
      const criticalFailure = getBooleanMetric(category, "criticalFailure")

      if (criticalFailure) {
        return "action"
      }

      if (allSpacesPrepped && credentialsReady) {
        return "ready"
      }

      return "watch"
    }
    case "merchandise": {
      const inventoryReceived = getBooleanMetric(category, "inventoryReceived")
      const standsSet = getBooleanMetric(category, "standsSet")
      const deliveryThreatensOpening = getBooleanMetric(category, "deliveryThreatensOpening")

      if (deliveryThreatensOpening) {
        return "action"
      }

      if (inventoryReceived && standsSet) {
        return "ready"
      }

      return "watch"
    }
    case "facilities": {
      const inspectionsComplete = getBooleanMetric(category, "inspectionsComplete")
      const safetyInspectionFailed = getBooleanMetric(category, "safetyInspectionFailed")
      const criticalFacilityIssue = getBooleanMetric(category, "criticalFacilityIssue")
      const nonCriticalMaintenanceIssue = getBooleanMetric(category, "nonCriticalMaintenanceIssue")

      if (safetyInspectionFailed || criticalFacilityIssue) {
        return "action"
      }

      if (inspectionsComplete && !nonCriticalMaintenanceIssue) {
        return "ready"
      }

      return "watch"
    }
    default:
      return category.status
  }
}

export function calculateOverallReadiness(categories: Category[]): number {
  const weightedTotal = categories.reduce((total, category) => total + category.weight * category.readiness, 0)
  return Math.round(weightedTotal)
}

export function recomputeAppState(state: AppState): AppState {
  const categories = state.categories.map((category) => {
    const status = deriveCategoryStatus(category)
    return {
      ...category,
      status,
      summary: summarizeCategory(category),
    }
  })

  const overallReadiness = calculateOverallReadiness(categories)
  const categoryStatusById = new Map(categories.map((category) => [category.id, category.status]))

  const alerts = state.alerts.map((alert) => {
    if (alert.resolved) {
      return alert
    }

    const categoryStatus = categoryStatusById.get(alert.categoryId)
    const severity: Alert["severity"] = categoryStatus === "action" ? "action" : "watch"

    return {
      ...alert,
      severity,
    }
  })

  return {
    ...state,
    categories,
    alerts,
    overallReadiness,
  }
}

function updateCategory(state: AppState, categoryId: CategoryId, updater: (category: Category) => Category): Category[] {
  return state.categories.map((category) => (category.id === categoryId ? updater(category) : category))
}

function resolveAlert(state: AppState, alertId: string): AppState["alerts"] {
  return state.alerts.map((alert) => (alert.id === alertId ? { ...alert, resolved: true } : alert))
}

function findAssignableVipLead(staff: StaffMember[], staffId: string): StaffMember {
  const match = staff.find((member) => member.id === staffId)

  if (!match) {
    throw new Error(`Staff member ${staffId} was not found`)
  }

  if (match.status !== "available" || !match.qualifications.includes("vip_security_lead")) {
    throw new Error(`Staff member ${staffId} is not available and qualified for VIP Security Lead`)
  }

  return match
}

export function assignVipSecurityLead(state: AppState, staffId: string, timestamp = new Date().toISOString()): AppState {
  const assignee = findAssignableVipLead(state.staff, staffId)

  const categories = updateCategory(state, "staffing", (category) => {
    const staffingPosts = category.details?.staffingPosts ?? []
    const updatedPosts = staffingPosts.map((post) =>
      post.role === "VIP Security Lead" && post.status === "open"
        ? { ...post, status: "confirmed" as const, assignedStaffId: assignee.id }
        : post,
    )

    const updatedRequirements = category.requirements.map((requirement) => {
      if (requirement.id === "staffing-vip-security-lead") {
        return {
          ...requirement,
          satisfied: true,
          current: assignee.name,
        }
      }

      if (requirement.id === "staffing-total-confirmed") {
        return {
          ...requirement,
          current: 119,
        }
      }

      if (requirement.id === "staffing-vip-entrance-coverage") {
        return {
          ...requirement,
          current: "7 of 9",
        }
      }

      return requirement
    })

    return {
      ...category,
      readiness: 85,
      lastUpdated: timestamp,
      metrics: {
        ...category.metrics,
        positionsConfirmed: 119,
        vipEntranceConfirmed: 7,
        criticalRolesCovered: true,
        openCriticalPosts: 0,
        openNonCriticalPosts: 2,
      },
      requirements: updatedRequirements,
      details: {
        ...category.details,
        staffingPosts: updatedPosts,
      },
    }
  })

  const staff = state.staff.map((member) =>
    member.id === assignee.id ? { ...member, status: "assigned" as const, zone: "VIP Entrance" } : member,
  )

  return recomputeAppState({
    ...state,
    categories,
    staff,
    alerts: resolveAlert(state, "alert-staffing-vip"),
  })
}

export function resolveMerchandiseDelivery(state: AppState, timestamp = new Date().toISOString()): AppState {
  const categories = updateCategory(state, "merchandise", (category) => ({
    ...category,
    readiness: 95,
    lastUpdated: timestamp,
    metrics: {
      ...category.metrics,
      inventoryReceived: true,
      standsSet: true,
      deliveryThreatensOpening: false,
    },
    requirements: category.requirements.map((requirement) => ({
      ...requirement,
      satisfied: true,
      current:
        requirement.id === "merchandise-delivery"
          ? "Received 4:12 PM"
          : requirement.id === "merchandise-east-concourse"
            ? "Setup confirmed"
            : requirement.current,
    })),
    details: {
      ...category.details,
      delayedDelivery: category.details?.delayedDelivery
        ? { ...category.details.delayedDelivery, status: "received" }
        : undefined,
    },
  }))

  return recomputeAppState({
    ...state,
    categories,
    alerts: resolveAlert(state, "alert-merch-delivery"),
  })
}

export function restoreSectionScanner(state: AppState, timestamp = new Date().toISOString()): AppState {
  const categories = updateCategory(state, "ticketing", (category) => ({
    ...category,
    readiness: 98,
    lastUpdated: timestamp,
    metrics: {
      ...category.metrics,
      scannersOnline: 24,
      scannersOnlinePct: 98,
      backupScannerDeployed: true,
      entranceBlocked: false,
    },
    requirements: category.requirements.map((requirement) => ({
      ...requirement,
      satisfied: true,
      current:
        requirement.id === "ticketing-scanners-online"
          ? "24 of 24"
          : requirement.id === "ticketing-section-114"
            ? "Backup scanner deployed"
            : requirement.current,
    })),
    details: {
      ...category.details,
      deviceIssue: category.details?.deviceIssue
        ? {
            ...category.details.deviceIssue,
            lastHeartbeatMinutes: 0,
            online: true,
          }
        : undefined,
    },
  }))

  return recomputeAppState({
    ...state,
    categories,
    alerts: resolveAlert(state, "alert-ticketing-scanner"),
  })
}