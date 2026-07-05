import { ChevronDown, Sparkles } from "lucide-react"
import { useMemo, useState } from "react"

import type { ProductPublic } from "@/client"
import { normalizeText } from "@/components/Advisor/advisorStorage"
import { cn } from "@/lib/utils"

function matchProductByName(
  products: ProductPublic[],
  name: string,
): ProductPublic | undefined {
  const target = normalizeText(name)
  return (
    products.find((p) => normalizeText(p.nombre_producto) === target) ??
    products.find(
      (p) =>
        normalizeText(p.nombre_producto).includes(target) ||
        target.includes(normalizeText(p.nombre_producto)),
    )
  )
}

interface RecommendedProductsStripProps {
  recommendedNames: string[]
  allProducts: ProductPublic[]
  onProductClick: (product: ProductPublic) => void
}

function MiniProductChip({
  product,
  highlighted,
  onClick,
}: {
  product: ProductPublic
  highlighted: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={product.nombre_producto}
      className={cn(
        "shrink-0 rounded-full border px-3 py-1.5 text-left text-xs font-medium transition-all whitespace-nowrap",
        highlighted
          ? "border-primary/40 bg-primary/10 text-primary shadow-sm hover:bg-primary/15"
          : "border-border bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
    >
      {product.nombre_producto}
    </button>
  )
}

export function RecommendedProductsStrip({
  recommendedNames,
  allProducts,
  onProductClick,
}: RecommendedProductsStripProps) {
  const [showOthers, setShowOthers] = useState(false)

  const { recommended, others } = useMemo(() => {
    const rec: ProductPublic[] = []
    const recIds = new Set<string>()
    for (const name of recommendedNames) {
      const found = matchProductByName(allProducts, name)
      if (found && !recIds.has(found.id)) {
        rec.push(found)
        recIds.add(found.id)
      }
    }
    const rest = allProducts.filter((p) => !recIds.has(p.id))
    return { recommended: rec, others: rest }
  }, [recommendedNames, allProducts])

  if (recommended.length === 0) return null

  return (
    <div className="border-t bg-muted/20">
      <div className="flex items-center justify-between gap-2 px-3 pt-2">
        <p className="flex items-center gap-1 text-[11px] font-semibold text-primary">
          <Sparkles className="size-3" />
          Recomendados
        </p>
        {others.length > 0 && (
          <button
            type="button"
            onClick={() => setShowOthers((v) => !v)}
            className="flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            {showOthers ? "Ocultar" : `+${others.length} más`}
            <ChevronDown
              className={cn(
                "size-3 transition-transform duration-200",
                showOthers && "rotate-180",
              )}
            />
          </button>
        )}
      </div>

      <div className="flex gap-1.5 overflow-x-auto px-3 py-2 scrollbar-thin">
        {recommended.map((product) => (
          <MiniProductChip
            key={product.id}
            product={product}
            highlighted
            onClick={() => onProductClick(product)}
          />
        ))}
      </div>

      <div
        className={cn(
          "grid transition-all duration-200 ease-out",
          showOthers ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
        )}
      >
        <div className="overflow-hidden">
          <div className="flex max-h-20 flex-wrap gap-1.5 overflow-y-auto px-3 pb-2">
            {others.map((product) => (
              <MiniProductChip
                key={product.id}
                product={product}
                highlighted={false}
                onClick={() => onProductClick(product)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export { matchProductByName }
