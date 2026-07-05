import { ShieldAlert, X } from "lucide-react"
import { useEffect, useState } from "react"

const DISMISSED_KEY = "yb-legal-disclaimer-dismissed"

export function DisclaimerBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!localStorage.getItem(DISMISSED_KEY)) {
      setVisible(true)
    }
  }, [])

  const dismiss = () => {
    setVisible(false)
    localStorage.setItem(DISMISSED_KEY, "1")
  }

  if (!visible) return null

  return (
    <div className="animate-in fade-in slide-in-from-top-2 border-b bg-amber-500/10 duration-300">
      <div className="mx-auto flex max-w-7xl items-start gap-3 px-4 py-3 md:px-8">
        <ShieldAlert className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400" />
        <p className="flex-1 text-xs leading-relaxed text-amber-900 dark:text-amber-200/90 md:text-sm">
          <strong>Aviso:</strong> YourBank no es un banco ni una entidad
          financiera, y no vendemos productos. Solo mostramos información
          referencial recopilada de fuentes públicas, que puede no ser exacta
          o estar desactualizada: verifica siempre las condiciones
          directamente con cada banco. No nos responsabilizamos por
          decisiones tomadas con base en este contenido ni por el uso
          indebido de la plataforma.
        </p>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Cerrar aviso"
          className="shrink-0 rounded-full p-1 text-amber-700 transition-colors hover:bg-amber-500/20 dark:text-amber-300"
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  )
}
