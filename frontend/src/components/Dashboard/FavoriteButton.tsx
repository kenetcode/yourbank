import { useNavigate } from "@tanstack/react-router"
import { Heart } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

import type { ProductPublic } from "@/client"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useFavorites } from "@/hooks/useFavorites"
import { cn } from "@/lib/utils"

interface FavoriteButtonProps {
  product: ProductPublic
  className?: string
}

export function FavoriteButton({ product, className }: FavoriteButtonProps) {
  const { loggedIn, favoriteIds, addFavorite, removeFavorite } = useFavorites()
  const navigate = useNavigate()
  const [isPulsing, setIsPulsing] = useState(false)
  const isFavorite = favoriteIds.has(product.id)

  const handleClick = (event: React.MouseEvent) => {
    event.preventDefault()
    event.stopPropagation()

    setIsPulsing(true)
    window.setTimeout(() => setIsPulsing(false), 300)

    if (!loggedIn) {
      toast.info("Inicia sesión para guardar tus favoritos", {
        description: "Crea una cuenta o inicia sesión para guardar productos.",
        action: {
          label: "Iniciar sesión",
          onClick: () => navigate({ to: "/login" }),
        },
      })
      return
    }

    if (isFavorite) {
      removeFavorite.mutate(product.id)
    } else {
      addFavorite.mutate(product)
    }
  }

  const label = isFavorite ? "Quitar de favoritos" : "Agregar a favoritos"

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="secondary"
          size="icon"
          aria-label={label}
          onClick={handleClick}
          className={cn(
            "rounded-full shadow-sm backdrop-blur transition-transform duration-200 hover:scale-110",
            isPulsing && "scale-125",
            className,
          )}
        >
          <Heart
            className={cn(
              "transition-colors duration-200",
              isFavorite
                ? "fill-primary text-primary"
                : "text-muted-foreground",
            )}
          />
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        {loggedIn ? label : "Inicia sesión para guardar favoritos"}
      </TooltipContent>
    </Tooltip>
  )
}
