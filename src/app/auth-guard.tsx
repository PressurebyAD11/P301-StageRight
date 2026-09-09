import { Navigate, Outlet, useLocation } from "react-router-dom"

import { useAppStore } from "@/store/use-app-store"

export function AuthGuard() {
  const isAuthenticated = useAppStore((state) => state.isAuthenticated)
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  return <Outlet />
}
