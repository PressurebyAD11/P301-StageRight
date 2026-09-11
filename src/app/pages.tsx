import { useEffect, useMemo, useState } from "react"
import type { FormEvent } from "react"
import { AlertOctagon, AlertTriangle, CheckCircle2, Clock3 } from "lucide-react"
import { Link, Navigate, useNavigate, useParams, useSearchParams } from "react-router-dom"
import { toast } from "sonner"

import { Button, buttonVariants } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { getStatusBreakdown, sortAlertsBySeverity } from "@/lib/dashboard"
import { cn } from "cn"
import { useAppStore } from "@/store/use-app-store"
import type { CategoryId, Status } from "@/types"

const categoryIdSet = new Set<CategoryId>([
  "staffing",
  "security",
  "ticketing",
  "concessions",
  "parking",
  "vip",
  "merchandise",
  "facilities",
])

export function RootRedirect() {
  const isAuthenticated = useAppStore((state) => state.isAuthenticated)

  return <Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />
}

export function LoginPage() {
  const navigate = useNavigate()
  const isAuthenticated = useAppStore((state) => state.isAuthenticated)
  const signIn = useAppStore((state) => state.signIn)

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!email.trim() || !password.trim()) {
      setError("Enter any non-empty email and password to continue.")
      return
    }

    signIn()
    navigate("/dashboard", { replace: true })
  }

  const signInAsManager = () => {
    signIn()
    navigate("/dashboard", { replace: true })
  }

  return (
    <div className="dark flex min-h-svh items-center justify-center bg-background px-4 py-8 text-foreground">
      <Card className="w-full max-w-md border-border/80 bg-card/95 p-6">
        <div className="mb-6 space-y-1">
          <p className="text-sm font-medium text-muted-foreground">StageRight</p>
          <h1 className="text-2xl font-semibold tracking-tight">Operations Login</h1>
          <p className="text-sm text-muted-foreground">Sign in to tonight&apos;s command center.</p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
              placeholder="morgan@venueops.com"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
              placeholder="Enter password"
            />
          </div>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          <Button type="submit" className="w-full">
            Sign in
          </Button>
          <Button type="button" variant="secondary" className="w-full" onClick={signInAsManager}>
            Sign in as Venue Operations Manager
          </Button>
        </form>
      </Card>
    </div>
  )
}

const statusDisplay: Record<Status, { label: string; icon: typeof CheckCircle2; className: string }> = {
  ready: {
    label: "Ready",
    icon: CheckCircle2,
    className: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  },
  watch: {
    label: "Watch",
    icon: AlertTriangle,
    className: "border-amber-500/40 bg-amber-500/10 text-amber-300",
  },
  action: {
    label: "Action Required",
    icon: AlertOctagon,
    className: "border-red-500/40 bg-red-500/10 text-red-300",
  },
}

function StatusBadge({ status, size = "md" }: { status: Status; size?: "sm" | "md" }) {
  const config = statusDisplay[status]
  const Icon = config.icon

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border font-medium whitespace-nowrap",
        config.className,
        size === "sm" ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-1 text-xs",
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {config.label}
    </span>
  )
}

function formatTimestamp(value: string): string {
  return new Date(value).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
}

function useAnimatedReadiness(target: number) {
  const [value, setValue] = useState(0)

  useEffect(() => {
    let frameId = 0
    let startValue = 0
    const durationMs = 450
    const startTime = performance.now()

    const tick = (time: number) => {
      const progress = Math.min((time - startTime) / durationMs, 1)
      const eased = 1 - (1 - progress) ** 3
      const nextValue = Math.round(startValue + (target - startValue) * eased)
      setValue(nextValue)

      if (progress < 1) {
        frameId = requestAnimationFrame(tick)
      }
    }

    startValue = value
    frameId = requestAnimationFrame(tick)

    return () => cancelAnimationFrame(frameId)
  }, [target])

  return value
}

function formatMetricValue(value: string | number | undefined): string {
  if (value === undefined || value === null) {
    return "-"
  }

  return String(value)
}

function getCategoryStatusReason(status: Status, unmetCriticalCount: number, unmetNonCriticalCount: number): string {
  if (status === "action") {
    if (unmetCriticalCount > 0) {
      return `${unmetCriticalCount} critical requirement${unmetCriticalCount > 1 ? "s" : ""} currently unmet.`
    }

    return "A category metric has crossed its Action Required threshold."
  }

  if (status === "watch") {
    if (unmetNonCriticalCount > 0) {
      return `${unmetNonCriticalCount} non-critical requirement${unmetNonCriticalCount > 1 ? "s are" : " is"} still in progress.`
    }

    return "All critical requirements are met, but one or more watch-band metrics remain."
  }

  return "All critical requirements are met and metrics are within Ready thresholds."
}

export function DashboardPage() {
  const categories = useAppStore((state) => state.categories)
  const alerts = useAppStore((state) => state.alerts)
  const overallReadiness = useAppStore((state) => state.overallReadiness)

  const breakdown = useMemo(() => getStatusBreakdown(categories), [categories])
  const activeAlerts = useMemo(() => sortAlertsBySeverity(alerts), [alerts])
  const animatedReadiness = useAnimatedReadiness(overallReadiness)

  return (
    <section className="space-y-6">
      <div className="rounded-2xl border border-border bg-card/80 p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">Event readiness</p>
            <h2 className="text-3xl font-semibold tracking-tight text-foreground">Are we ready for tonight?</h2>
          </div>

          <div className="flex items-center gap-4 rounded-xl border border-border bg-background/60 px-4 py-3">
            <div className="flex h-16 w-16 items-center justify-center rounded-full border border-emerald-500/35 bg-emerald-500/10 text-emerald-300">
              <span className="text-lg font-semibold">{animatedReadiness}%</span>
            </div>
            <div aria-live="polite">
              <p className="text-4xl font-semibold tracking-tight">{animatedReadiness}%</p>
              <p className="text-xs text-muted-foreground">Overall readiness</p>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          {(["ready", "watch", "action"] as const).map((status) => (
            <div key={status} className="rounded-xl border border-border bg-background/60 p-3">
              <div className="flex items-center justify-between gap-3">
                <StatusBadge status={status} size="sm" />
                <span className="text-2xl font-semibold">{breakdown[status]}</span>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                {status === "ready" ? "Ready" : status === "watch" ? "Watch" : "Action Required"}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_1.85fr]">
        <section className="rounded-2xl border border-border bg-card/80 p-4 shadow-sm sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-lg font-semibold">Issues Requiring Attention</h3>
            <span className="rounded-full border border-border bg-background/60 px-2 py-1 text-xs text-muted-foreground">
              {activeAlerts.length}
            </span>
          </div>

          {activeAlerts.length === 0 ? (
            <div className="mt-5 rounded-xl border border-dashed border-border bg-background/40 p-4 text-sm text-muted-foreground">
              All clear — no issues require attention
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              {activeAlerts.map((alert) => {
                const status = alert.severity === "action" ? "action" : "watch"

                return (
                  <div
                    key={alert.id}
                    className="rounded-xl border border-border bg-background/50 p-3 transition-colors hover:border-border/80"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <StatusBadge status={status} size="sm" />
                          <p className="font-medium text-foreground">{alert.title}</p>
                        </div>
                        <p className="text-sm text-muted-foreground">{alert.detail}</p>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Clock3 className="h-3.5 w-3.5" />
                          <span>{alert.timeContext}</span>
                        </div>
                      </div>

                      <Link
                        to={`/category/${alert.categoryId}?resolve=1`}
                        className={cn(buttonVariants({ variant: "outline", size: "sm" }), "shrink-0")}
                      >
                        Resolve
                      </Link>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-border bg-card/80 p-4 shadow-sm sm:p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h3 className="text-lg font-semibold">Operational Grid</h3>
            <span className="text-xs text-muted-foreground">{categories.length} categories</span>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {categories.map((category) => (
              <Link
                key={category.id}
                to={`/category/${category.id}`}
                className="block rounded-xl border border-border bg-background/50 p-3 transition-colors hover:border-ring/60 hover:bg-background/80"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-base font-medium text-foreground">{category.name}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{category.summary}</p>
                  </div>
                  <StatusBadge status={category.status} size="sm" />
                </div>

                <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                  <span>Last updated</span>
                  <span>{formatTimestamp(category.lastUpdated)}</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </section>
  )
}

export function CategoryPage() {
  const { categoryId } = useParams<{ categoryId: string }>()
  const [searchParams, setSearchParams] = useSearchParams()
  const categories = useAppStore((state) => state.categories)
  const alerts = useAppStore((state) => state.alerts)
  const staff = useAppStore((state) => state.staff)
  const assignVipSecurityLead = useAppStore((state) => state.assignVipSecurityLead)
  const resolveMerchandiseDelivery = useAppStore((state) => state.resolveMerchandiseDelivery)
  const restoreSectionScanner = useAppStore((state) => state.restoreSectionScanner)

  const [resolveDialogOpen, setResolveDialogOpen] = useState(false)
  const [selectedStaffId, setSelectedStaffId] = useState("")

  const validCategoryId = useMemo(
    () => (categoryId && categoryIdSet.has(categoryId as CategoryId) ? (categoryId as CategoryId) : null),
    [categoryId],
  )

  const category = categories.find((item) => item.id === validCategoryId)
  const activeAlert = validCategoryId
    ? alerts.find((alert) => alert.categoryId === validCategoryId && !alert.resolved)
    : undefined
  const shouldAutoOpenResolve = searchParams.get("resolve") === "1"

  const staffingPosts = category?.id === "staffing" ? category.details?.staffingPosts ?? [] : []
  const delayedDelivery = category?.id === "merchandise" ? category.details?.delayedDelivery : undefined
  const ticketingDeviceIssue = category?.id === "ticketing" ? category.details?.deviceIssue : undefined
  const qualifiedAvailableStaff =
    category?.id === "staffing"
      ? staff.filter(
          (member) => member.status === "available" && member.qualifications.includes("vip_security_lead"),
        )
      : []

  if (!validCategoryId || !category) {
    return (
      <section className="space-y-4 rounded-lg border border-border bg-card/70 p-6">
        <h2 className="text-xl font-semibold">Category not found</h2>
        <p className="text-sm text-muted-foreground">Use a valid category id from the dashboard links.</p>
        <Link to="/dashboard" className={cn(buttonVariants({ variant: "outline" }), "w-fit")}>
          Back to dashboard
        </Link>
      </section>
    )
  }

  const weightedContribution = category.readiness * category.weight
  const unmetCriticalCount = category.requirements.filter((requirement) => requirement.critical && !requirement.satisfied).length
  const unmetNonCriticalCount = category.requirements.filter(
    (requirement) => !requirement.critical && !requirement.satisfied,
  ).length
  const statusReason = getCategoryStatusReason(category.status, unmetCriticalCount, unmetNonCriticalCount)

  useEffect(() => {
    if (!resolveDialogOpen) {
      return
    }

    if (qualifiedAvailableStaff.length === 0) {
      setSelectedStaffId("")
      return
    }

    setSelectedStaffId((currentSelectedId) => {
      const isStillValid = qualifiedAvailableStaff.some((member) => member.id === currentSelectedId)
      return isStillValid ? currentSelectedId : qualifiedAvailableStaff[0].id
    })
  }, [resolveDialogOpen, qualifiedAvailableStaff])

  useEffect(() => {
    if (!shouldAutoOpenResolve || !activeAlert) {
      return
    }

    setResolveDialogOpen(true)
  }, [activeAlert, shouldAutoOpenResolve])

  const handleResolveDialogOpenChange = (open: boolean) => {
    setResolveDialogOpen(open)

    if (!open && searchParams.get("resolve") === "1") {
      const nextParams = new URLSearchParams(searchParams)
      nextParams.delete("resolve")
      setSearchParams(nextParams)
    }
  }

  const handleAssignVipSecurityLead = () => {
    if (!selectedStaffId) {
      return
    }

    const previousReadiness = useAppStore.getState().overallReadiness

    try {
      assignVipSecurityLead(selectedStaffId)
      const nextState = useAppStore.getState()
      const nextReadiness = nextState.overallReadiness
      const staffingStatus = nextState.categories.find((item) => item.id === "staffing")?.status

      toast.success(
        `VIP Security Lead assigned - Staffing updated (${previousReadiness}% -> ${nextReadiness}%, ${staffingStatus === "watch" ? "Watch" : "updated"}).`,
      )
      handleResolveDialogOpenChange(false)
    } catch (error) {
      const message = error instanceof Error ? error.message : "Assignment failed"
      toast.error(message)
    }
  }

  const handleResolveMerchandise = () => {
    const previousReadiness = useAppStore.getState().overallReadiness

    try {
      resolveMerchandiseDelivery()
      const nextState = useAppStore.getState()
      const nextReadiness = nextState.overallReadiness
      const merchandiseStatus = nextState.categories.find((item) => item.id === "merchandise")?.status

      toast.success(
        `Delivery confirmed - Merchandise updated (${previousReadiness}% -> ${nextReadiness}%, ${merchandiseStatus === "ready" ? "Ready" : "updated"}).`,
      )
      handleResolveDialogOpenChange(false)
    } catch (error) {
      const message = error instanceof Error ? error.message : "Merchandise resolution failed"
      toast.error(message)
    }
  }

  const handleRestoreScanner = () => {
    const previousReadiness = useAppStore.getState().overallReadiness

    try {
      restoreSectionScanner()
      const nextState = useAppStore.getState()
      const nextReadiness = nextState.overallReadiness
      const ticketingStatus = nextState.categories.find((item) => item.id === "ticketing")?.status

      toast.success(
        `Section 114 scanner restored - Ticketing updated (${previousReadiness}% -> ${nextReadiness}%, ${ticketingStatus === "ready" ? "Ready" : "updated"}).`,
      )
      handleResolveDialogOpenChange(false)
    } catch (error) {
      const message = error instanceof Error ? error.message : "Scanner restoration failed"
      toast.error(message)
    }
  }

  return (
    <section className="space-y-6">
      <Link to="/dashboard" className={cn(buttonVariants({ variant: "outline" }), "w-fit")}>
        Back to dashboard
      </Link>

      <div className="rounded-2xl border border-border bg-card/80 p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">Category detail</p>
            <h2 className="text-3xl font-semibold tracking-tight text-foreground">{category.name}</h2>
            <p className="text-sm text-muted-foreground">{category.summary}</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-border bg-background/60 p-3">
              <p className="text-xs text-muted-foreground">Current status</p>
              <div className="mt-2">
                <StatusBadge status={category.status} />
              </div>
            </div>

            <div className="rounded-xl border border-border bg-background/60 p-3">
              <p className="text-xs text-muted-foreground">Category readiness</p>
              <p className="mt-2 text-2xl font-semibold">{category.readiness}%</p>
            </div>

            <div className="rounded-xl border border-border bg-background/60 p-3">
              <p className="text-xs text-muted-foreground">Readiness contribution</p>
              <p className="mt-2 text-2xl font-semibold">{weightedContribution.toFixed(1)} pts</p>
              <p className="text-xs text-muted-foreground">{Math.round(category.weight * 100)}% category weight</p>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card/80 p-5 shadow-sm sm:p-6">
        <h3 className="text-lg font-semibold">Status Logic</h3>
        <p className="mt-2 text-sm text-muted-foreground">{category.statusRule}</p>
        <div className="mt-4 rounded-xl border border-border bg-background/50 p-3">
          <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">Why this status now</p>
          <p className="mt-1 text-sm text-foreground">{statusReason}</p>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card/80 p-5 shadow-sm sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-lg font-semibold">Requirements</h3>
          <span className="text-xs text-muted-foreground">{category.requirements.length} total</span>
        </div>

        <div className="mt-4 overflow-hidden rounded-xl border border-border">
          <table className="w-full border-collapse text-sm">
            <thead className="bg-background/70 text-muted-foreground">
              <tr>
                <th className="px-3 py-2 text-left font-medium">Requirement</th>
                <th className="px-3 py-2 text-left font-medium">Priority</th>
                <th className="px-3 py-2 text-left font-medium">Current</th>
                <th className="px-3 py-2 text-left font-medium">Target</th>
                <th className="px-3 py-2 text-left font-medium">State</th>
              </tr>
            </thead>
            <tbody>
              {category.requirements.map((requirement) => {
                const rowTone = requirement.critical
                  ? "bg-red-500/[0.06]"
                  : "bg-transparent"

                return (
                  <tr key={requirement.id} className={cn("border-t border-border/80", rowTone)}>
                    <td className="px-3 py-2 text-foreground">{requirement.label}</td>
                    <td className="px-3 py-2">
                      {requirement.critical ? (
                        <span className="inline-flex items-center rounded-full border border-red-500/40 bg-red-500/10 px-2 py-0.5 text-xs font-medium text-red-300">
                          Critical
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full border border-border bg-background/80 px-2 py-0.5 text-xs font-medium text-muted-foreground">
                          Standard
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">{formatMetricValue(requirement.current)}</td>
                    <td className="px-3 py-2 text-muted-foreground">{formatMetricValue(requirement.target)}</td>
                    <td className="px-3 py-2">
                      {requirement.satisfied ? (
                        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-300">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Satisfied
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/35 bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-300">
                          <AlertTriangle className="h-3.5 w-3.5" />
                          Unsatisfied
                        </span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card/80 p-5 shadow-sm sm:p-6">
        <h3 className="text-lg font-semibold">Active Alert</h3>

        {activeAlert ? (
          <div className="mt-4 rounded-xl border border-border bg-background/50 p-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <StatusBadge status={activeAlert.severity} size="sm" />
                  <p className="font-medium text-foreground">{activeAlert.title}</p>
                </div>
                <p className="text-sm text-muted-foreground">{activeAlert.detail}</p>
                {activeAlert.impact ? <p className="text-sm text-muted-foreground">Impact: {activeAlert.impact}</p> : null}
                {activeAlert.timeContext ? (
                  <p className="text-xs text-muted-foreground">Time context: {activeAlert.timeContext}</p>
                ) : null}
              </div>

              {category.id === "staffing" && activeAlert.resolutionType === "assignStaff" ? (
                <Dialog open={resolveDialogOpen} onOpenChange={handleResolveDialogOpenChange}>
                  <DialogTrigger
                    render={
                      <Button type="button" variant="secondary">
                        Resolve
                      </Button>
                    }
                  />

                  <DialogContent className="max-w-3xl bg-card text-card-foreground">
                    <DialogHeader>
                      <DialogTitle>Resolve VIP Staffing Alert</DialogTitle>
                      <DialogDescription>
                        Fill the critical VIP Security Lead post to clear the staffing blocker.
                      </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-5">
                      <div>
                        <h4 className="text-sm font-semibold text-foreground">VIP entrance posts</h4>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {staffingPosts.length} posts tracked for VIP entrance coverage.
                        </p>

                        <div className="mt-3 overflow-hidden rounded-xl border border-border">
                          <table className="w-full border-collapse text-sm">
                            <thead className="bg-background/70 text-muted-foreground">
                              <tr>
                                <th className="px-3 py-2 text-left font-medium">Post</th>
                                <th className="px-3 py-2 text-left font-medium">Role</th>
                                <th className="px-3 py-2 text-left font-medium">Priority</th>
                                <th className="px-3 py-2 text-left font-medium">State</th>
                              </tr>
                            </thead>
                            <tbody>
                              {staffingPosts.map((post) => (
                                <tr
                                  key={post.id}
                                  className={cn(
                                    "border-t border-border/80",
                                    post.critical ? "bg-red-500/[0.06]" : "bg-transparent",
                                  )}
                                >
                                  <td className="px-3 py-2 text-foreground">{post.label}</td>
                                  <td className="px-3 py-2 text-muted-foreground">{post.role}</td>
                                  <td className="px-3 py-2">
                                    {post.critical ? (
                                      <span className="inline-flex items-center rounded-full border border-red-500/40 bg-red-500/10 px-2 py-0.5 text-xs font-medium text-red-300">
                                        Critical
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center rounded-full border border-border bg-background/80 px-2 py-0.5 text-xs font-medium text-muted-foreground">
                                        Standard
                                      </span>
                                    )}
                                  </td>
                                  <td className="px-3 py-2">
                                    {post.status === "confirmed" ? (
                                      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-300">
                                        <CheckCircle2 className="h-3.5 w-3.5" />
                                        Confirmed
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/35 bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-300">
                                        <AlertTriangle className="h-3.5 w-3.5" />
                                        Unconfirmed
                                      </span>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      <div>
                        <h4 className="text-sm font-semibold text-foreground">Qualified available staff</h4>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Only available team members qualified for VIP Security Lead are shown.
                        </p>

                        {qualifiedAvailableStaff.length === 0 ? (
                          <div className="mt-3 rounded-lg border border-dashed border-border bg-background/40 p-3 text-sm text-muted-foreground">
                            No qualified staff are currently available. Assignment is disabled until an eligible member is available.
                          </div>
                        ) : (
                          <div className="mt-3 space-y-2">
                            {qualifiedAvailableStaff.map((member) => (
                              <label
                                key={member.id}
                                className={cn(
                                  "flex cursor-pointer items-start justify-between gap-3 rounded-lg border border-border bg-background/50 p-3 transition-colors",
                                  member.id === selectedStaffId ? "border-ring/70" : "hover:border-border/80",
                                )}
                              >
                                <div className="flex items-start gap-3">
                                  <input
                                    type="radio"
                                    name="vip-lead-assignee"
                                    value={member.id}
                                    checked={member.id === selectedStaffId}
                                    onChange={(event) => setSelectedStaffId(event.target.value)}
                                    className="mt-1 h-4 w-4 accent-emerald-500"
                                  />
                                  <div>
                                    <p className="text-sm font-medium text-foreground">{member.name}</p>
                                    <p className="text-xs text-muted-foreground">Status: {member.status}</p>
                                    <p className="text-xs text-muted-foreground">
                                      Qualifications: {member.qualifications.join(", ")}
                                    </p>
                                  </div>
                                </div>

                                <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-300">
                                  Eligible
                                </span>
                              </label>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <DialogFooter>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setResolveDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="button"
                        onClick={handleAssignVipSecurityLead}
                        disabled={!selectedStaffId || qualifiedAvailableStaff.length === 0}
                      >
                        Assign VIP Security Lead
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              ) : category.id === "merchandise" && activeAlert.resolutionType === "confirmDelivery" ? (
                <Dialog open={resolveDialogOpen} onOpenChange={handleResolveDialogOpenChange}>
                  <DialogTrigger
                    render={
                      <Button type="button" variant="secondary">
                        Resolve
                      </Button>
                    }
                  />

                  <DialogContent className="max-w-2xl bg-card text-card-foreground">
                    <DialogHeader>
                      <DialogTitle>Resolve Merchandise Delivery Delay</DialogTitle>
                      <DialogDescription>
                        Confirm the revised delivery plan to clear the merchandise watch alert.
                      </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="rounded-lg border border-border bg-background/60 p-3">
                          <p className="text-xs text-muted-foreground">Delayed item</p>
                          <p className="mt-1 text-sm font-medium text-foreground">
                            {delayedDelivery?.item ?? "Tour merchandise shipment"}
                          </p>
                        </div>
                        <div className="rounded-lg border border-border bg-background/60 p-3">
                          <p className="text-xs text-muted-foreground">Affected stands</p>
                          <p className="mt-1 text-sm font-medium text-foreground">
                            {delayedDelivery?.affectedStands.join(", ") ?? "East Concourse"}
                          </p>
                        </div>
                      </div>

                      <div className="overflow-hidden rounded-xl border border-border">
                        <table className="w-full border-collapse text-sm">
                          <thead className="bg-background/70 text-muted-foreground">
                            <tr>
                              <th className="px-3 py-2 text-left font-medium">Metric</th>
                              <th className="px-3 py-2 text-left font-medium">Current</th>
                              <th className="px-3 py-2 text-left font-medium">Target</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr className="border-t border-border/80">
                              <td className="px-3 py-2 text-foreground">Delivery ETA</td>
                              <td className="px-3 py-2 text-muted-foreground">
                                {delayedDelivery
                                  ? `${delayedDelivery.originalEta} -> ${delayedDelivery.revisedEta}`
                                  : "2:00 PM -> 4:15 PM"}
                              </td>
                              <td className="px-3 py-2 text-muted-foreground">Received before setup window closes</td>
                            </tr>
                            <tr className="border-t border-border/80">
                              <td className="px-3 py-2 text-foreground">Operational impact</td>
                              <td className="px-3 py-2 text-muted-foreground">
                                {delayedDelivery?.impact ?? "Crew loses 75 minutes of setup time before doors."}
                              </td>
                              <td className="px-3 py-2 text-muted-foreground">Stand setup confirmed before doors</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => handleResolveDialogOpenChange(false)}>
                        Cancel
                      </Button>
                      <Button type="button" onClick={handleResolveMerchandise}>
                        Confirm Revised Setup Plan
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              ) : category.id === "ticketing" && activeAlert.resolutionType === "restoreDevice" ? (
                <Dialog open={resolveDialogOpen} onOpenChange={handleResolveDialogOpenChange}>
                  <DialogTrigger
                    render={
                      <Button type="button" variant="secondary">
                        Resolve
                      </Button>
                    }
                  />

                  <DialogContent className="max-w-2xl bg-card text-card-foreground">
                    <DialogHeader>
                      <DialogTitle>Resolve Section 114 Scanner Alert</DialogTitle>
                      <DialogDescription>
                        Restore coverage at Section 114 to return Ticketing / Entry to Ready.
                      </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="rounded-lg border border-border bg-background/60 p-3">
                          <p className="text-xs text-muted-foreground">Offline device</p>
                          <p className="mt-1 text-sm font-medium text-foreground">
                            {ticketingDeviceIssue ? `${ticketingDeviceIssue.section} scanner` : "Section 114 scanner"}
                          </p>
                        </div>
                        <div className="rounded-lg border border-border bg-background/60 p-3">
                          <p className="text-xs text-muted-foreground">Backup options</p>
                          <p className="mt-1 text-sm font-medium text-foreground">
                            {ticketingDeviceIssue?.backupOptions.join(" | ") ?? "Deploy backup handheld | Dispatch entry tech"}
                          </p>
                        </div>
                      </div>

                      <div className="overflow-hidden rounded-xl border border-border">
                        <table className="w-full border-collapse text-sm">
                          <thead className="bg-background/70 text-muted-foreground">
                            <tr>
                              <th className="px-3 py-2 text-left font-medium">Metric</th>
                              <th className="px-3 py-2 text-left font-medium">Current</th>
                              <th className="px-3 py-2 text-left font-medium">Target</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr className="border-t border-border/80">
                              <td className="px-3 py-2 text-foreground">Last heartbeat</td>
                              <td className="px-3 py-2 text-muted-foreground">
                                {ticketingDeviceIssue ? `${ticketingDeviceIssue.lastHeartbeatMinutes}m ago` : "11m ago"}
                              </td>
                              <td className="px-3 py-2 text-muted-foreground">0m ago (online)</td>
                            </tr>
                            <tr className="border-t border-border/80">
                              <td className="px-3 py-2 text-foreground">Scanner uptime</td>
                              <td className="px-3 py-2 text-muted-foreground">
                                {ticketingDeviceIssue ? `${ticketingDeviceIssue.uptimePercent}%` : "98%"}
                              </td>
                              <td className="px-3 py-2 text-muted-foreground">98%+ with backup deployed</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => handleResolveDialogOpenChange(false)}>
                        Cancel
                      </Button>
                      <Button type="button" onClick={handleRestoreScanner}>
                        Deploy Backup Scanner
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              ) : (
                <Button type="button" variant="secondary" disabled>
                  Resolve
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="mt-4 rounded-xl border border-dashed border-border bg-background/40 p-4 text-sm text-muted-foreground">
            No active alerts for this category right now.
          </div>
        )}
      </div>
    </section>
  )
}
