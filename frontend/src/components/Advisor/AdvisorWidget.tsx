import { MessageCircle, Sparkles, X } from "lucide-react"
import { useEffect, useRef, useState } from "react"

import { AdvisorChatPanel } from "@/components/Advisor/AdvisorChatPanel"
import { Button } from "@/components/ui/button"
import { useAdvisorWidget } from "@/contexts/AdvisorWidgetContext"
import { cn } from "@/lib/utils"

const TEASER_SHOWN_KEY = "yb-advisor-teaser-shown"
const TEASER_DELAY_MS = 2500
const TEASER_VISIBLE_MS = 7000

export function AdvisorWidget() {
  const { isOpen, open, close, toggle } = useAdvisorWidget()
  const [showTeaser, setShowTeaser] = useState(false)
  const [pulse, setPulse] = useState(true)
  const teaserTimersRef = useRef<ReturnType<typeof setTimeout>[]>([])

  useEffect(() => {
    if (isOpen) return
    const interval = setInterval(() => setPulse((p) => !p), 2000)
    return () => clearInterval(interval)
  }, [isOpen])

  useEffect(() => {
    if (sessionStorage.getItem(TEASER_SHOWN_KEY)) return

    const showTimer = setTimeout(() => {
      setShowTeaser(true)
      sessionStorage.setItem(TEASER_SHOWN_KEY, "1")
      const hideTimer = setTimeout(() => setShowTeaser(false), TEASER_VISIBLE_MS)
      teaserTimersRef.current.push(hideTimer)
    }, TEASER_DELAY_MS)
    teaserTimersRef.current.push(showTimer)

    return () => {
      for (const timer of teaserTimersRef.current) clearTimeout(timer)
    }
  }, [])

  const dismissTeaser = () => {
    setShowTeaser(false)
    sessionStorage.setItem(TEASER_SHOWN_KEY, "1")
  }

  return (
    <>
      {/* Backdrop móvil */}
      {isOpen && (
        <button
          type="button"
          aria-label="Cerrar asesor"
          className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm sm:hidden"
          onClick={close}
        />
      )}

      {/* Panel flotante derecho — deja espacio abajo para el FAB */}
      <div
        className={cn(
          "fixed top-3 right-3 z-[70] flex flex-col overflow-hidden rounded-2xl border bg-background shadow-2xl transition-all duration-300 ease-out sm:top-4 sm:right-4",
          "w-[calc(100%-1.5rem)] sm:w-[400px]",
          isOpen
            ? "bottom-3 translate-x-0 opacity-100 sm:bottom-4"
            : "bottom-[5.5rem] pointer-events-none translate-x-8 opacity-0",
        )}
        aria-hidden={!isOpen}
      >
        <AdvisorChatPanel onClose={close} />
      </div>

      {/* FAB + teaser — solo visible cuando el panel está cerrado */}
      {!isOpen && (
        <div className="fixed right-4 bottom-4 z-[80] flex flex-col items-end gap-2 sm:right-6 sm:bottom-6">
          {showTeaser && (
            <div className="relative max-w-[220px] animate-in fade-in slide-in-from-bottom-2 rounded-2xl rounded-br-sm border bg-background px-4 py-2.5 text-left shadow-lg duration-500">
              <button
                type="button"
                onClick={dismissTeaser}
                className="absolute -top-1.5 -right-1.5 flex size-5 items-center justify-center rounded-full bg-muted text-muted-foreground hover:bg-muted-foreground/20"
                aria-label="Ocultar mensaje"
              >
                <X className="size-3" />
              </button>
              <button
                type="button"
                onClick={() => {
                  dismissTeaser()
                  open()
                }}
                className="w-full text-left"
              >
                <p className="text-xs font-semibold text-primary">
                  ¿Buscas la tarjeta ideal?
                </p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  Pregúntame y te recomiendo opciones al instante ✨
                </p>
              </button>
              <span className="absolute -bottom-2 right-4 size-3 rotate-45 border-r border-b bg-background" />
            </div>
          )}

          <div className="relative">
            <span
              className={cn(
                "absolute inset-0 rounded-full bg-primary/30 transition-transform duration-700",
                pulse ? "scale-125 opacity-0" : "scale-100 opacity-60",
              )}
            />
            <span
              className={cn(
                "absolute inset-0 rounded-full bg-primary/20 transition-transform duration-1000",
                pulse ? "scale-150 opacity-0" : "scale-110 opacity-40",
              )}
            />

            <Button
              type="button"
              size="icon"
              onClick={toggle}
              aria-label="Abrir asesor IA"
              className={cn(
                "relative size-14 rounded-full bg-gradient-to-br from-primary via-primary to-primary/70 shadow-lg shadow-primary/40 transition-all hover:scale-110 hover:shadow-xl hover:shadow-primary/50 active:scale-95",
                pulse && "animate-[bounce_2s_ease-in-out_infinite]",
              )}
            >
              <Sparkles className="size-6" />
              <MessageCircle className="absolute -top-0.5 -right-0.5 size-4 fill-background text-primary" />
            </Button>
          </div>
        </div>
      )}
    </>
  )
}
