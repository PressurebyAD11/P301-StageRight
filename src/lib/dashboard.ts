import type { Alert, Category, Status } from "@/types"

export type StatusBreakdown = Record<Status, number>

const statusPriority: Record<Status, number> = {
  ready: 2,
  watch: 1,
  action: 0,
}

export function getStatusBreakdown(categories: Category[]): StatusBreakdown {
  return categories.reduce<StatusBreakdown>(
    (breakdown, category) => {
      breakdown[category.status] += 1
      return breakdown
    },
    { ready: 0, watch: 0, action: 0 },
  )
}

export function getOverallEventStatus(categories: Category[]): Status {
  const breakdown = getStatusBreakdown(categories)

  if (breakdown.action > 0) {
    return "action"
  }

  if (breakdown.watch > 0) {
    return "watch"
  }

  return "ready"
}

export function sortAlertsBySeverity(alerts: Alert[]): Alert[] {
  return [...alerts]
    .filter((alert) => !alert.resolved)
    .sort((left, right) => {
      const severityDelta = statusPriority[left.severity] - statusPriority[right.severity]
      if (severityDelta !== 0) {
        return severityDelta
      }

      return getAlertUrgencyMinutes(left) - getAlertUrgencyMinutes(right)
    })
}

function getAlertUrgencyMinutes(alert: Alert): number {
  const text = alert.timeContext ?? ""

  const doorsMatch = text.match(/Doors in\s+(\d+)h\s*(\d+)m/i)
  if (doorsMatch) {
    return Number(doorsMatch[1]) * 60 + Number(doorsMatch[2])
  }

  const heartbeatMatch = text.match(/Last heartbeat\s+(\d+)m ago/i)
  if (heartbeatMatch) {
    return Number(heartbeatMatch[1])
  }

  const etaMatch = text.match(/(\d+):(\d+)\s*(AM|PM)/i)
  if (etaMatch) {
    const hour = Number(etaMatch[1])
    const minute = Number(etaMatch[2])
    const period = etaMatch[3].toUpperCase()
    const normalizedHour = period === "PM" && hour !== 12 ? hour + 12 : hour === 12 && period === "AM" ? 0 : hour
    return normalizedHour * 60 + minute
  }

  const minutesMatch = text.match(/(\d+)m/i)
  if (minutesMatch) {
    return Number(minutesMatch[1])
  }

  return Number.MAX_SAFE_INTEGER
}
