import { CheckCircle2, ChevronDown, Landmark, Percent, Tag } from "lucide-react"
import { useState } from "react"

import type { ProductPublic } from "@/client"
import { FavoriteButton } from "@/components/Dashboard/FavoriteButton"
import { ProductTypeBadge } from "@/components/Dashboard/ProductTypeBadge"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { formatCurrency, formatPercent, getNormalized } from "@/lib/products"
import { cn } from "@/lib/utils"

const MAX_VISIBLE_ITEMS = 3

interface ProductCardProps {
  product: ProductPublic
  style?: React.CSSProperties
}

function ExpandableList({
  title,
  items,
  icon: Icon,
}: {
  title: string
  items: string[]
  icon: React.FC<React.SVGProps<SVGSVGElement>>
}) {
  const [expanded, setExpanded] = useState(false)

  if (items.length === 0) return null

  const visible = expanded ? items : items.slice(0, MAX_VISIBLE_ITEMS)
  const remaining = items.length - MAX_VISIBLE_ITEMS

  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
        {title}
      </p>
      <ul className="flex flex-col gap-1.5">
        {visible.map((item) => (
          <li key={item} className="flex items-start gap-2 text-sm">
            <Icon className="mt-0.5 size-3.5 shrink-0 text-primary" />
            <span className="text-foreground/90">{item}</span>
          </li>
        ))}
      </ul>
      {remaining > 0 && (
        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          className="flex w-fit items-center gap-1 text-xs font-medium text-primary hover:underline"
        >
          {expanded ? "Ver menos" : `+${remaining} más`}
          <ChevronDown
            className={cn(
              "size-3 transition-transform duration-200",
              expanded && "rotate-180",
            )}
          />
        </button>
      )}
    </div>
  )
}

export function ProductCard({ product, style }: ProductCardProps) {
  const normalized = getNormalized(product)
  const {
    anualidad,
    tasa_interes,
    beneficios = [],
    requisitos = [],
    promociones = [],
  } = normalized

  return (
    <Card
      style={style}
      className="group animate-in fade-in slide-in-from-bottom-4 fill-mode-backwards flex flex-col justify-between duration-500 transition-all hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/5"
    >
      <CardHeader>
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge variant="secondary" className="gap-1">
              <Landmark className="size-3" />
              {product.banco}
            </Badge>
            <ProductTypeBadge tipo={product.tipo_producto} />
          </div>
          <CardTitle className="text-balance text-lg leading-snug">
            {product.nombre_producto}
          </CardTitle>
        </div>
        <CardAction>
          <FavoriteButton product={product} />
        </CardAction>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
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
              {anualidad != null
                ? formatCurrency(anualidad)
                : "No especificado"}
            </Badge>
          )}
          {tasa_interes != null && (
            <Badge variant="outline" className="gap-1">
              <Percent className="size-3" />
              Tasa: {formatPercent(tasa_interes)}
            </Badge>
          )}
        </div>

        <ExpandableList
          title="Beneficios"
          items={beneficios}
          icon={CheckCircle2}
        />
        <ExpandableList
          title="Requisitos"
          items={requisitos}
          icon={CheckCircle2}
        />

        {promociones.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              Promociones
            </p>
            <div className="flex flex-wrap gap-1.5">
              {promociones.map((promo, index) => (
                <Badge
                  key={`${promo.comercio ?? "promo"}-${index}`}
                  className="gap-1 border-transparent bg-primary/10 text-primary"
                >
                  {promo.comercio ?? "Promoción"}
                  {promo.descuento_pct != null &&
                    ` -${formatPercent(promo.descuento_pct)}`}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>

      <CardFooter>
        {product.source_url && (
          <a
            href={product.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-muted-foreground hover:text-primary hover:underline"
          >
            Ver información oficial del banco →
          </a>
        )}
      </CardFooter>
    </Card>
  )
}
