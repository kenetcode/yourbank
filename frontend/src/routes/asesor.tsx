import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { useEffect } from "react"

import { useAdvisorWidget } from "@/contexts/AdvisorWidgetContext"

export const Route = createFileRoute("/asesor")({
  component: AdvisorRedirect,
  head: () => ({
    meta: [
      {
        title: "Asesor IA - YourBank",
      },
    ],
  }),
})

function AdvisorRedirect() {
  const { open } = useAdvisorWidget()
  const navigate = useNavigate()

  useEffect(() => {
    open()
    navigate({ to: "/", replace: true })
  }, [open, navigate])

  return null
}
