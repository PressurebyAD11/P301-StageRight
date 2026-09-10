import { useEffect, useMemo, useState } from "react"
import type { FormEvent } from "react"
import { AlertOctagon, AlertTriangle, CheckCircle2, Clock3 } from "lucide-react"
import { Link, Navigate, useNavigate, useParams } from "react-router-dom"

import { Button, buttonVariants } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
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
                        to={`/category/${alert.categoryId}`}
                        className={cn(buttonVariants({ variant: "outline", size: "sm" }), "shrink-0")}
                      >
                        View
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
  const categories = useAppStore((state) => state.categories)

  const validCategoryId = useMemo(
    () => (categoryId && categoryIdSet.has(categoryId as CategoryId) ? (categoryId as CategoryId) : null),
    [categoryId],
  )

  const category = categories.find((item) => item.id === validCategoryId)

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

  return (
    <section className="space-y-4 rounded-lg border border-border bg-card/70 p-6">
      <h2 className="text-xl font-semibold">{category.name}</h2>
      <p className="text-sm text-muted-foreground">Category detail shell is ready. Full detail content arrives in Phase 4.</p>
      <Link to="/dashboard" className={cn(buttonVariants({ variant: "outline" }), "w-fit")}>
        Back to dashboard
      </Link>
    </section>
  )
}
