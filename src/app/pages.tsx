import { useMemo, useState } from "react"
import type { FormEvent } from "react"
import { Link, Navigate, useNavigate, useParams } from "react-router-dom"

import { Button, buttonVariants } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { cn } from "cn"
import { useAppStore } from "@/store/use-app-store"
import type { CategoryId } from "@/types"

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

export function DashboardPage() {
  return (
    <section className="rounded-lg border border-border bg-card/70 p-6">
      <h2 className="text-xl font-semibold">Dashboard</h2>
      <p className="mt-2 text-sm text-muted-foreground">Phase 2 shell is live. Dashboard content arrives in Phase 3.</p>
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
