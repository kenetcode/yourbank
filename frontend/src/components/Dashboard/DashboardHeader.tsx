import { Link } from "@tanstack/react-router"

import { Appearance } from "@/components/Common/Appearance"
import { Logo } from "@/components/Common/Logo"
import { Button } from "@/components/ui/button"
import useAuth, { isLoggedIn } from "@/hooks/useAuth"

export function DashboardHeader() {
  const { user, logout } = useAuth()
  const loggedIn = isLoggedIn()

  return (
    <header className="sticky top-0 z-20 border-b bg-background/80 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 md:px-8">
        <Logo variant="responsive" />
        <div className="flex items-center gap-2">
          <Appearance />
          {loggedIn ? (
            <>
              <span className="hidden truncate text-sm text-muted-foreground sm:inline">
                Hola, {user?.full_name || user?.email}
              </span>
              <Button asChild size="sm" variant="outline">
                <Link to="/panel">Mi panel</Link>
              </Button>
              <Button size="sm" variant="ghost" onClick={logout}>
                Cerrar sesión
              </Button>
            </>
          ) : (
            <>
              <Button asChild size="sm" variant="outline">
                <Link to="/login">Iniciar sesión</Link>
              </Button>
              <Button asChild size="sm">
                <Link to="/signup">Registrarme</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
