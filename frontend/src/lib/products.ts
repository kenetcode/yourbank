import {
  Banknote,
  CreditCard,
  HandCoins,
  type LucideIcon,
  PiggyBank,
  ShieldCheck,
  Tag,
} from "lucide-react"

import type { ProductPublic } from "@/client"

export interface Promocion {
  comercio?: string | null
  descuento_pct?: number | null
  tipo_tarjeta?: string | null
  vigencia?: string | null
  descripcion?: string | null
}

export interface ProductNormalized {
  anualidad?: number | null
  tasa_interes?: number | null
  requisitos?: string[]
  beneficios?: string[]
  promociones?: Promocion[]
}

export function getNormalized(product: ProductPublic): ProductNormalized {
  return (product.normalized ?? {}) as ProductNormalized
}

export const TIPO_PRODUCTO_LABELS: Record<string, string> = {
  credit_card: "Tarjeta de crédito",
  debit_card: "Tarjeta de débito",
  loan: "Préstamo",
  savings: "Cuenta de ahorro",
  insurance: "Seguro",
}

export function tipoProductoLabel(tipo: string): string {
  return TIPO_PRODUCTO_LABELS[tipo] ?? tipo
}

export const TIPO_PRODUCTO_ICONS: Record<string, LucideIcon> = {
  credit_card: CreditCard,
  debit_card: Banknote,
  loan: HandCoins,
  savings: PiggyBank,
  insurance: ShieldCheck,
}

export function tipoProductoIcon(tipo: string): LucideIcon {
  return TIPO_PRODUCTO_ICONS[tipo] ?? Tag
}

export interface TipoProductoStyle {
  /** Fondo + texto del "chip" completo (halo suave). */
  chip: string
  /** Fondo + texto del círculo que envuelve al ícono (más saturado). */
  iconWrap: string
}

export const TIPO_PRODUCTO_STYLES: Record<string, TipoProductoStyle> = {
  credit_card: {
    chip: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
    iconWrap: "bg-blue-500/20 text-blue-600 dark:text-blue-400",
  },
  debit_card: {
    chip: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
    iconWrap: "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400",
  },
  loan: {
    chip: "bg-amber-500/10 text-amber-700 dark:text-amber-500",
    iconWrap: "bg-amber-500/20 text-amber-600 dark:text-amber-500",
  },
  savings: {
    chip: "bg-violet-500/10 text-violet-700 dark:text-violet-400",
    iconWrap: "bg-violet-500/20 text-violet-600 dark:text-violet-400",
  },
  insurance: {
    chip: "bg-cyan-500/10 text-cyan-700 dark:text-cyan-400",
    iconWrap: "bg-cyan-500/20 text-cyan-600 dark:text-cyan-400",
  },
}

export const DEFAULT_TIPO_PRODUCTO_STYLE: TipoProductoStyle = {
  chip: "bg-muted text-muted-foreground",
  iconWrap: "bg-muted-foreground/20 text-muted-foreground",
}

export function tipoProductoStyle(tipo: string): TipoProductoStyle {
  return TIPO_PRODUCTO_STYLES[tipo] ?? DEFAULT_TIPO_PRODUCTO_STYLE
}

export const TIPO_PRODUCTO_OPTIONS = Object.entries(TIPO_PRODUCTO_LABELS).map(
  ([value, label]) => ({ value, label }),
)

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("es-SV", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value)
}

export function formatPercent(value: number): string {
  const formatted = Number.isInteger(value)
    ? value.toString()
    : value.toFixed(2)
  return `${formatted}%`
}
