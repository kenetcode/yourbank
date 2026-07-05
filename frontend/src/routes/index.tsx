import { useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { AlertTriangle } from "lucide-react"
import { useMemo, useState } from "react"

import { ProductsService } from "@/client"
import { Footer } from "@/components/Common/Footer"
import { DashboardHeader } from "@/components/Dashboard/DashboardHeader"
import { EmptyProducts } from "@/components/Dashboard/EmptyProducts"
import { PendingProductGrid } from "@/components/Dashboard/PendingProductGrid"
import { ProductCard } from "@/components/Dashboard/ProductCard"
import { ProductFilters } from "@/components/Dashboard/ProductFilters"

function getProductsQueryOptions() {
  return {
    queryKey: ["products", "public"],
    queryFn: () => ProductsService.listProducts({ skip: 0, limit: 100 }),
  }
}

export const Route = createFileRoute("/")({
  component: PublicDashboard,
  head: () => ({
    meta: [
      {
        title: "YourBank - Compara productos bancarios",
      },
    ],
  }),
})

function PublicDashboard() {
  const { data, isLoading, isError } = useQuery(getProductsQueryOptions())
  const [selectedBanco, setSelectedBanco] = useState<string | null>(null)
  const [selectedTipo, setSelectedTipo] = useState<string | null>(null)

  const products = useMemo(() => data?.data ?? [], [data])

  const bancos = useMemo(
    () => Array.from(new Set(products.map((product) => product.banco))).sort(),
    [products],
  )

  const filteredProducts = useMemo(
    () =>
      products.filter((product) => {
        if (selectedBanco && product.banco !== selectedBanco) return false
        if (selectedTipo && product.tipo_producto !== selectedTipo) return false
        return true
      }),
    [products, selectedBanco, selectedTipo],
  )

  return (
    <div className="flex min-h-svh flex-col">
      <DashboardHeader />

      <main className="flex-1">
        <section className="border-b bg-muted/30">
          <div className="mx-auto max-w-7xl px-4 py-12 md:px-8 md:py-16">
            <h1 className="text-3xl font-bold tracking-tight text-balance md:text-4xl">
              Encuentra el producto bancario ideal para ti
            </h1>
            <p className="mt-3 max-w-2xl text-muted-foreground">
              Compara tarjetas de crédito y débito, préstamos, cuentas de ahorro
              y seguros de distintos bancos en un solo lugar. Guarda tus
              favoritos para revisarlos después.
            </p>
          </div>
        </section>

        <section className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8 md:px-8">
          {!isLoading && !isError && bancos.length > 0 && (
            <ProductFilters
              bancos={bancos}
              selectedBanco={selectedBanco}
              onSelectBanco={setSelectedBanco}
              selectedTipo={selectedTipo}
              onSelectTipo={setSelectedTipo}
            />
          )}

          {isLoading ? (
            <PendingProductGrid />
          ) : isError ? (
            <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed py-16 text-center">
              <div className="rounded-full bg-destructive/10 p-4">
                <AlertTriangle className="size-8 text-destructive" />
              </div>
              <h3 className="text-lg font-semibold">
                No pudimos cargar los productos
              </h3>
              <p className="max-w-sm text-sm text-muted-foreground">
                Ocurrió un error al conectar con el servidor. Intenta recargar
                la página en unos momentos.
              </p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <EmptyProducts />
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredProducts.map((product, index) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  style={{ animationDelay: `${Math.min(index, 12) * 60}ms` }}
                />
              ))}
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  )
}
