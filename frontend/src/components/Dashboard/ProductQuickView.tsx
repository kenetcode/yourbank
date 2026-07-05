import { Link } from "@tanstack/react-router"
import { ArrowRight } from "lucide-react"

import type { ProductPublic } from "@/client"
import { ProductDetailModalContent } from "@/components/Dashboard/ProductDetailModal"
import { Button } from "@/components/ui/button"
import { Dialog } from "@/components/ui/dialog"

interface ProductQuickViewProps {
  product: ProductPublic | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

/** Modal con detalle completo del producto (desde el chat del asesor). */
export function ProductQuickView({
  product,
  open,
  onOpenChange,
}: ProductQuickViewProps) {
  if (!product) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <ProductDetailModalContent
        product={product}
        footer={
          <div className="border-t pt-4">
            <Button asChild className="w-full sm:w-auto">
              <Link
                to="/"
                search={{ q: product.nombre_producto }}
                onClick={() => onOpenChange(false)}
              >
                Ver en el dashboard
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        }
      />
    </Dialog>
  )
}
