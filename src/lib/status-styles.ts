import type { Status } from "@/types"

export const statusBadgeClass: Record<Status, string> = {
  ready: "border-emerald-500/40 bg-emerald-500/15 text-emerald-400",
  watch: "border-amber-500/50 bg-amber-500/15 text-amber-400",
  action: "border-red-500/50 bg-red-500/15 text-red-400",
}

export const statusTextClass: Record<Status, string> = {
  ready: "text-emerald-400",
  watch: "text-amber-400",
  action: "text-red-400",
}

export const gaugeTrackClass = "text-emerald-500/25"
export const criticalRowClass = "bg-red-500/[0.08]"

export const satisfiedBadgeClass = "border-emerald-500/40 bg-emerald-500/15 text-emerald-400"
export const unsatisfiedBadgeClass = "border-amber-500/50 bg-amber-500/15 text-amber-400"
export const criticalBadgeClass = "border-red-500/50 bg-red-500/15 text-red-400"
export const standardBadgeClass = "border-border bg-background/80 text-muted-foreground"
export const eligibleBadgeClass = "border-emerald-500/40 bg-emerald-500/15 text-emerald-400"
export const emptyStateReadyClass = "border-dashed border-emerald-500/40 bg-emerald-500/[0.06]"
export const emptyStateReadyIconClass = "border-emerald-500/40 bg-emerald-500/15 text-emerald-400"
