import { useEffect, useMemo, useState } from "react"
import { Outlet, ScrollRestoration, useNavigate } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { useAppStore } from "@/store/use-app-store"

function formatCountdown(targetIso: string, nowMs: number): string {
  const targetMs = new Date(targetIso).getTime()
  const remainingMs = targetMs - nowMs

  if (remainingMs <= 0) {
    return "Doors are open"
  }

  const totalSeconds = Math.floor(remainingMs / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  return `${hours}h ${minutes}m ${seconds}s`
}

function formatEventDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

function formatEventTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  })
}

function getMostRecentUpdate(isoTimestamps: string[]): string {
  if (isoTimestamps.length === 0) {
    return "Unknown"
  }

  const latest = isoTimestamps.reduce((currentLatest, candidate) =>
    new Date(candidate).getTime() > new Date(currentLatest).getTime() ? candidate : currentLatest,
  )

  return new Date(latest).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
}

export function AppShell() {
  const navigate = useNavigate()
  const eventName = useAppStore((state) => state.event.name)
  const eventDate = useAppStore((state) => state.event.date)
  const doorsAt = useAppStore((state) => state.event.doorsAt)
  const showAt = useAppStore((state) => state.event.showAt)
  const expectedAttendance = useAppStore((state) => state.event.expectedAttendance)
  const categories = useAppStore((state) => state.categories)
  const signOut = useAppStore((state) => state.signOut)
  const resetScenario = useAppStore((state) => state.resetScenario)

  const [nowMs, setNowMs] = useState(() => Date.now())

  useEffect(() => {
    const timerId = window.setInterval(() => {
      setNowMs(Date.now())
    }, 1000)

    return () => {
      window.clearInterval(timerId)
    }
  }, [])

  const countdownText = useMemo(() => formatCountdown(doorsAt, nowMs), [doorsAt, nowMs])
  const lastUpdatedText = useMemo(
    () => getMostRecentUpdate(categories.map((category) => category.lastUpdated)),
    [categories],
  )

  return (
    <div className="dark min-h-svh bg-background text-foreground">
      <header className="sticky top-0 z-20 border-b border-border bg-card/95 backdrop-blur">
        {/* Row 1: brand identity + controls */}
        <div className="mx-auto flex w-full max-w-7xl items-center gap-3 px-4 pt-3 pb-2 sm:px-6">
          <div className="flex shrink-0 items-center gap-2" aria-label="StageRight">
            <svg
              viewBox="0 0 44 44"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="h-7 w-7 shrink-0"
              aria-hidden="true"
            >
              <rect width="44" height="44" rx="8" fill="currentColor" className="text-primary" />
              <path d="M16 13l18 9-18 9V13z" fill="white" />
            </svg>
            <span className="text-sm font-black tracking-tight">
              Stage<span className="text-primary">Right</span>
            </span>
          </div>

          <div className="h-5 w-px shrink-0 bg-border/60" aria-hidden="true" />

          <div className="min-w-0 flex-1">
            <h1 className="truncate text-base font-bold tracking-tight">{eventName}</h1>
            <p className="truncate text-xs text-muted-foreground">{formatEventDate(eventDate)}</p>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => {
                const shouldReset = window.confirm(
                  "Reset the scenario back to the original 87% seed state? This will restore the three alerts and staff roster.",
                )

                if (!shouldReset) {
                  return
                }

                resetScenario()
              }}
              aria-label="Reset scenario data to the seed state"
            >
              Reset scenario
            </Button>

            <Button
              type="button"
              size="sm"
              variant="default"
              onClick={() => {
                signOut()
                navigate("/login", { replace: true })
              }}
            >
              Sign out
            </Button>
          </div>
        </div>

        {/* Row 2: 5 operational fields — always visible, never compete with branding */}
        <div className="border-t border-border/40 bg-background/20">
          <div className="mx-auto grid max-w-7xl grid-cols-5 px-4 py-2 sm:px-6">
            <div className="border-r border-border/30 pr-4">
              <p className="text-xs text-muted-foreground">Doors</p>
              <p className="text-sm font-semibold">{formatEventTime(doorsAt)}</p>
            </div>
            <div className="border-r border-border/30 px-4">
              <p className="text-xs text-muted-foreground">Show</p>
              <p className="text-sm font-semibold">{formatEventTime(showAt)}</p>
            </div>
            <div className="border-r border-border/30 px-4">
              <p className="text-xs text-muted-foreground">Countdown</p>
              <p className="text-sm font-semibold tabular-nums">{countdownText}</p>
            </div>
            <div className="border-r border-border/30 px-4">
              <p className="text-xs text-muted-foreground">Attendance</p>
              <p className="text-sm font-semibold">{expectedAttendance.toLocaleString()}</p>
            </div>
            <div className="pl-4">
              <p className="text-xs text-muted-foreground">Last updated</p>
              <p className="text-sm font-semibold">{lastUpdatedText}</p>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl p-4 sm:p-6">
        <Outlet />
      </main>

      <ScrollRestoration />
    </div>
  )
}
