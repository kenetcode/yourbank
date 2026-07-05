import { Landmark, Tag } from "lucide-react"

import { Button } from "@/components/ui/button"
import { FILTERABLE_TIPO_PRODUCTO_OPTIONS } from "@/lib/products"

interface ProductFiltersProps {
  bancos: string[]
  selectedBanco: string | null
  onSelectBanco: (banco: string | null) => void
  selectedTipo: string | null
  onSelectTipo: (tipo: string | null) => void
}

function PillButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <Button
      type="button"
      size="sm"
      variant={active ? "default" : "outline"}
      onClick={onClick}
      className="shrink-0 rounded-full transition-all duration-200"
    >
      {children}
    </Button>
  )
}

export function ProductFilters({
  bancos,
  selectedBanco,
  onSelectBanco,
  selectedTipo,
  onSelectTipo,
}: ProductFiltersProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2">
        <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          <Landmark className="size-3.5" />
          Banco
        </p>
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 sm:flex-wrap sm:overflow-visible">
          <PillButton
            active={selectedBanco === null}
            onClick={() => onSelectBanco(null)}
          >
            Todos
          </PillButton>
          {bancos.map((banco) => (
            <PillButton
              key={banco}
              active={selectedBanco === banco}
              onClick={() => onSelectBanco(banco)}
            >
              {banco}
            </PillButton>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          <Tag className="size-3.5" />
          Tipo de producto
        </p>
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 sm:flex-wrap sm:overflow-visible">
          <PillButton
            active={selectedTipo === null}
            onClick={() => onSelectTipo(null)}
          >
            Todos
          </PillButton>
          {FILTERABLE_TIPO_PRODUCTO_OPTIONS.map((option) => (
            <PillButton
              key={option.value}
              active={selectedTipo === option.value}
              onClick={() => onSelectTipo(option.value)}
            >
              {option.label}
            </PillButton>
          ))}
        </div>
      </div>
    </div>
  )
}
