import { useEffect, useMemo, useState } from "react"
import { Outlet, useNavigate } from "react-router-dom"

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
        <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center gap-4 px-4 py-3 sm:px-6">
          <div className="min-w-64 flex-1">
            <p className="text-sm font-medium text-muted-foreground">Live Event Command Center</p>
            <h1 className="text-xl font-semibold tracking-tight">{eventName}</h1>
            <p className="text-sm text-muted-foreground">{formatEventDate(eventDate)}</p>
          </div>

          <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm sm:grid-cols-3 lg:grid-cols-5">
            <div>
              <p className="text-muted-foreground">Doors</p>
              <p className="font-medium">{formatEventTime(doorsAt)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Show</p>
              <p className="font-medium">{formatEventTime(showAt)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Countdown</p>
              <p className="font-medium">{countdownText}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Attendance</p>
              <p className="font-medium">{expectedAttendance.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Last updated</p>
              <p className="font-medium">{lastUpdatedText}</p>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={() => {
              signOut()
              navigate("/login", { replace: true })
            }}
          >
            Sign out
          </Button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl p-4 sm:p-6">
        <Outlet />
      </main>
    </div>
  )
}
