import { createFileRoute } from "@tanstack/react-router"

import useAuth from "@/hooks/useAuth"

export const Route = createFileRoute("/_authenticated/panel")({
  component: Dashboard,
  head: () => ({
    meta: [
      {
        title: "Panel - YourBank",
      },
    ],
  }),
})

function Dashboard() {
  const { user: currentUser } = useAuth()

  return (
    <div>
      <div>
        <h1 className="text-2xl truncate max-w-sm">
          Hola, {currentUser?.full_name || currentUser?.email} 👋
        </h1>
        <p className="text-muted-foreground">
          Bienvenido de nuevo, ¡qué gusto verte otra vez!
        </p>
      </div>
    </div>
  )
}
