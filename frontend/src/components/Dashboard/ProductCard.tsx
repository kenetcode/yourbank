import { Landmark } from "lucide-react"
import { useState } from "react"

import type { ProductPublic } from "@/client"
import { DeleteProductButton } from "@/components/Admin/DeleteProductDialog"
import { EditProductButton } from "@/components/Admin/EditProductDialog"
import { FavoriteButton } from "@/components/Dashboard/FavoriteButton"
import {
  PricingBadges,
  ProductDetailModalContent,
  productSummaryLine,
} from "@/components/Dashboard/ProductDetailModal"
import { ProductTypeBadge } from "@/components/Dashboard/ProductTypeBadge"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Dialog, DialogTrigger } from "@/components/ui/dialog"
import { useIsAdmin } from "@/hooks/useIsAdmin"
import { getNormalized } from "@/lib/products"

interface ProductCardProps {
  product: ProductPublic
  style?: React.CSSProperties
  onProductDeleted?: () => void
}

export function ProductCard({
  product,
  style,
  onProductDeleted,
}: ProductCardProps) {
  const isAdmin = useIsAdmin()
  const [detailsOpen, setDetailsOpen] = useState(false)
  const normalized = getNormalized(product)
  const { anualidad, tasa_interes } = normalized
  const summary = productSummaryLine(product)

  const adminFooter = isAdmin ? (
    <div className="flex flex-wrap gap-2 border-t pt-4">
      <EditProductButton
        product={product}
        onSuccess={() => setDetailsOpen(false)}
      />
      <DeleteProductButton
        product={product}
        onSuccess={() => {
          setDetailsOpen(false)
          onProductDeleted?.()
        }}
      />
    </div>
  ) : null

  return (
    <>
      <Card
        style={style}
        className="group animate-in fade-in slide-in-from-bottom-4 fill-mode-backwards flex h-full flex-col duration-500 transition-all hover:-translate-y-0.5 hover:shadow-md"
      >
        <CardHeader className="gap-2 pb-2">
          <div className="flex flex-wrap items-center gap-1">
            <Badge variant="secondary" className="gap-1 text-xs">
              <Landmark className="size-3" />
              {product.banco}
            </Badge>
            <ProductTypeBadge tipo={product.tipo_producto} />
          </div>
          <CardTitle className="line-clamp-2 text-sm font-semibold leading-snug">
            {product.nombre_producto}
          </CardTitle>
          <CardAction>
            <FavoriteButton product={product} />
          </CardAction>
        </CardHeader>

        <CardContent className="flex flex-1 flex-col gap-2 pb-2">
          <PricingBadges anualidad={anualidad} tasaInteres={tasa_interes} />
          <p className="line-clamp-2 text-xs text-muted-foreground">
            {summary}
          </p>
        </CardContent>

        <CardFooter className="mt-auto gap-2 pt-0">
          <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-full text-xs"
              >
                Ver detalles
              </Button>
            </DialogTrigger>
            <ProductDetailModalContent product={product} footer={adminFooter} />
          </Dialog>
        </CardFooter>
      </Card>
    </>
  )
}
