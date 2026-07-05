import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react"

interface AdvisorWidgetContextValue {
  isOpen: boolean
  open: () => void
  close: () => void
  toggle: () => void
}

const AdvisorWidgetContext = createContext<AdvisorWidgetContextValue | null>(
  null,
)

export function AdvisorWidgetProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [isOpen, setIsOpen] = useState(false)

  const open = useCallback(() => setIsOpen(true), [])
  const close = useCallback(() => setIsOpen(false), [])
  const toggle = useCallback(() => setIsOpen((prev) => !prev), [])

  const value = useMemo(
    () => ({ isOpen, open, close, toggle }),
    [isOpen, open, close, toggle],
  )

  return (
    <AdvisorWidgetContext.Provider value={value}>
      {children}
    </AdvisorWidgetContext.Provider>
  )
}

export function useAdvisorWidget() {
  const ctx = useContext(AdvisorWidgetContext)
  if (!ctx) {
    throw new Error("useAdvisorWidget debe usarse dentro de AdvisorWidgetProvider")
  }
  return ctx
}
