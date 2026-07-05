import { Link } from "@tanstack/react-router"
import { Heart, Settings, Shield, Sparkles } from "lucide-react"

import { Appearance } from "@/components/Common/Appearance"
import { Logo } from "@/components/Common/Logo"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useAdvisorWidget } from "@/contexts/AdvisorWidgetContext"
import useAuth, { isLoggedIn } from "@/hooks/useAuth"

export function DashboardHeader() {
  const { user, logout } = useAuth()
  const loggedIn = isLoggedIn()
  const { open: openAdvisor } = useAdvisorWidget()

  return (
    <header className="sticky top-0 z-20 border-b bg-background/80 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 md:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <Logo variant="responsive" />
          {loggedIn && (
            <span className="hidden truncate text-sm text-muted-foreground sm:inline">
              Hola, {user?.full_name || user?.email}
            </span>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Appearance />
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                size="icon"
                variant="outline"
                aria-label="Asesor IA"
                onClick={openAdvisor}
              >
                <Sparkles />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Asesor IA</TooltipContent>
          </Tooltip>
          {loggedIn ? (
            <>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button asChild size="icon" variant="outline">
                    <Link to="/favoritos" aria-label="Mis favoritos">
                      <Heart />
                    </Link>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Mis favoritos</TooltipContent>
              </Tooltip>
              {user?.is_superuser && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button asChild size="icon" variant="outline">
                      <Link to="/admin" aria-label="Administración">
                        <Shield />
                      </Link>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Administración</TooltipContent>
                </Tooltip>
              )}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button asChild size="icon" variant="outline">
                    <Link to="/settings" aria-label="Ajustes de cuenta">
                      <Settings />
                    </Link>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Ajustes de cuenta</TooltipContent>
              </Tooltip>
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
