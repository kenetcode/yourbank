import {
  tipoProductoIcon,
  tipoProductoLabel,
  tipoProductoStyle,
} from "@/lib/products"
import { cn } from "@/lib/utils"

interface ProductTypeBadgeProps {
  tipo: string
  className?: string
}

/**
 * Chip visual del tipo de producto: círculo de color + ícono a la izquierda,
 * etiqueta a la derecha. El color e ícono cambian por `tipo` para que
 * crédito/débito/préstamo/ahorro/seguro se distingan de un vistazo, sin
 * necesidad de leer el texto.
 */
export function ProductTypeBadge({ tipo, className }: ProductTypeBadgeProps) {
  const Icon = tipoProductoIcon(tipo)
  const { chip, iconWrap } = tipoProductoStyle(tipo)

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full py-0.5 pr-2.5 pl-0.5 text-xs font-medium",
        chip,
        className,
      )}
    >
      <span
        className={cn(
          "flex size-5 shrink-0 items-center justify-center rounded-full animate-in zoom-in-50 fade-in duration-300",
          iconWrap,
        )}
      >
        <Icon className="size-3.5 transition-transform duration-300 group-hover:scale-110" />
      </span>
      {tipoProductoLabel(tipo)}
    </span>
  )
}
