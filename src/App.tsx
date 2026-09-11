import { RouterProvider } from "react-router-dom"

import { appRouter } from "@/app/router"
import { Toaster } from "@/components/ui/sonner"

function App() {
  return (
    <>
      <RouterProvider router={appRouter} />
      <Toaster position="top-right" richColors />
    </>
  )
}

export default App