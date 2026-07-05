import {
  CheckCircle2,
  ClipboardList,
  ExternalLink,
  Landmark,
  Percent,
  Tag,
} from "lucide-react"

import type { ProductPublic } from "@/client"
import { ProductTypeBadge } from "@/components/Dashboard/ProductTypeBadge"
import { Badge } from "@/components/ui/badge"
import {
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  formatCurrency,
  formatPercent,
  getNormalized,
  type Promocion,
} from "@/lib/products"

export function PricingBadges({
  anualidad,
  tasaInteres,
}: {
  anualidad?: number | null
  tasaInteres?: number | null
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {anualidad === 0 ? (
        <Badge className="gap-1 border-transparent bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
          <Tag className="size-3" />
          Sin anualidad
        </Badge>
      ) : (
        <Badge variant="outline" className="gap-1">
          <Tag className="size-3" />
          Anualidad:{" "}
          {anualidad != null ? formatCurrency(anualidad) : "No especificado"}
        </Badge>
      )}
      {tasaInteres != null && tasaInteres >= 0 && (
        <Badge variant="outline" className="gap-1">
          <Percent className="size-3" />
          Tasa: {formatPercent(tasaInteres)}
        </Badge>
      )}
    </div>
  )
}

function DetailSection({
  title,
  items,
  icon: Icon,
}: {
  title: string
  items: string[]
  icon: React.FC<React.SVGProps<SVGSVGElement>>
}) {
  if (items.length === 0) return null

  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
        {title}
      </p>
      <ul className="flex flex-col gap-1.5">
        {items.map((item) => (
          <li key={item} className="flex items-start gap-2 text-sm">
            <Icon className="mt-0.5 size-3.5 shrink-0 text-primary" />
            <span className="text-foreground/90">{item}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function PromocionesSection({ promociones }: { promociones: Promocion[] }) {
  if (promociones.length === 0) return null

  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
        Promociones
      </p>
      <ul className="flex flex-col gap-2">
        {promociones.map((promo, index) => (
          <li
            key={`${promo.comercio ?? "promo"}-${index}`}
            className="rounded-lg border bg-muted/30 p-3 text-sm"
          >
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="font-medium">
                {promo.comercio ?? "Promoción"}
              </span>
              {promo.descuento_pct != null && (
                <Badge className="border-transparent bg-primary/10 text-primary">
                  -{formatPercent(promo.descuento_pct)}
                </Badge>
              )}
            </div>
            {promo.descripcion && (
              <p className="mt-1 text-muted-foreground">{promo.descripcion}</p>
            )}
            {promo.vigencia && (
              <p className="mt-1 text-xs text-muted-foreground">
                Vigencia: {promo.vigencia}
              </p>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}

interface ProductDetailModalContentProps {
  product: ProductPublic
  footer?: React.ReactNode
}

/** Contenido completo del producto para usar dentro de un Dialog. */
export function ProductDetailModalContent({
  product,
  footer,
}: ProductDetailModalContentProps) {
  const normalized = getNormalized(product)
  const {
    anualidad,
    tasa_interes,
    requisitos = [],
    beneficios = [],
    promociones = [],
  } = normalized

  return (
    <DialogContent className="max-h-[85svh] overflow-y-auto sm:max-w-xl">
      <DialogHeader>
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge variant="secondary" className="gap-1">
            <Landmark className="size-3" />
            {product.banco}
          </Badge>
          <ProductTypeBadge tipo={product.tipo_producto} />
        </div>
        <DialogTitle className="text-balance pr-6">
          {product.nombre_producto}
        </DialogTitle>
        <DialogDescription className="sr-only">
          Detalle completo del producto bancario
        </DialogDescription>
      </DialogHeader>

      <div className="flex flex-col gap-5">
        <PricingBadges anualidad={anualidad} tasaInteres={tasa_interes} />
        <DetailSection
          title="Requisitos"
          items={requisitos}
          icon={ClipboardList}
        />
        <DetailSection
          title="Beneficios"
          items={beneficios}
          icon={CheckCircle2}
        />
        <PromocionesSection promociones={promociones} />

        {product.source_url && (
          <a
            href={product.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary hover:underline"
          >
            Ver información oficial del banco
            <ExternalLink className="size-3" />
          </a>
        )}

        {footer}
      </div>
    </DialogContent>
  )
}

export function productSummaryLine(product: ProductPublic): string {
  const normalized = getNormalized(product)
  const parts: string[] = []
  const req = normalized.requisitos?.length ?? 0
  const ben = normalized.beneficios?.length ?? 0
  const pro = normalized.promociones?.length ?? 0
  if (req > 0) parts.push(`${req} requisito${req === 1 ? "" : "s"}`)
  if (ben > 0) parts.push(`${ben} beneficio${ben === 1 ? "" : "s"}`)
  if (pro > 0) parts.push(`${pro} promoción${pro === 1 ? "" : "es"}`)
  return parts.join(" · ") || "Sin detalles adicionales"
}
