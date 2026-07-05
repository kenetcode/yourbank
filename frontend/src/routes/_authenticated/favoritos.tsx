import { createFileRoute, Link } from "@tanstack/react-router"
import { Heart } from "lucide-react"

import { PendingProductGrid } from "@/components/Dashboard/PendingProductGrid"
import { ProductCard } from "@/components/Dashboard/ProductCard"
import { Button } from "@/components/ui/button"
import { useFavorites } from "@/hooks/useFavorites"

export const Route = createFileRoute("/_authenticated/favoritos")({
  component: Favorites,
  head: () => ({
    meta: [
      {
        title: "Favoritos - YourBank",
      },
    ],
  }),
})

function EmptyFavorites() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed py-16 text-center">
      <div className="rounded-full bg-muted p-4">
        <Heart className="size-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold">Aún no tienes favoritos</h3>
      <p className="max-w-sm text-sm text-muted-foreground">
        Guarda los productos que más te interesen desde el dashboard para
        compararlos y encontrarlos aquí fácilmente.
      </p>
      <Button asChild size="sm">
        <Link to="/">Explorar productos</Link>
      </Button>
    </div>
  )
}

function Favorites() {
  const { favoritesQuery } = useFavorites()
  const products = favoritesQuery.data?.data ?? []

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Mis favoritos</h1>
        <p className="text-muted-foreground">
          Los productos bancarios que has guardado para revisar después
        </p>
      </div>

      {favoritesQuery.isLoading ? (
        <PendingProductGrid />
      ) : favoritesQuery.isError ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed py-16 text-center">
          <h3 className="text-lg font-semibold">
            No pudimos cargar tus favoritos
          </h3>
          <p className="max-w-sm text-sm text-muted-foreground">
            Ocurrió un error al conectar con el servidor. Intenta recargar la
            página en unos momentos.
          </p>
        </div>
      ) : products.length === 0 ? (
        <EmptyFavorites />
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((product, index) => (
            <ProductCard
              key={product.id}
              product={product}
              style={{ animationDelay: `${Math.min(index, 12) * 60}ms` }}
            />
          ))}
        </div>
      )}
    </div>
  )
}
