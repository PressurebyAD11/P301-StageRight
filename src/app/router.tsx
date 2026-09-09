import { createBrowserRouter } from "react-router-dom"

import { AppShell } from "@/app/app-shell"
import { AuthGuard } from "@/app/auth-guard"
import { CategoryPage, DashboardPage, LoginPage, RootRedirect } from "@/app/pages"

export const appRouter = createBrowserRouter([
  {
    path: "/",
    element: <RootRedirect />,
  },
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    element: <AuthGuard />,
    children: [
      {
        element: <AppShell />,
        children: [
          {
            path: "/dashboard",
            element: <DashboardPage />,
          },
          {
            path: "/category/:categoryId",
            element: <CategoryPage />,
          },
        ],
      },
    ],
  },
])
