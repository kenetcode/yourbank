import { useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { AlertTriangle, X } from "lucide-react"
import { useMemo, useState } from "react"

import { ProductsService } from "@/client"
import { Footer } from "@/components/Common/Footer"
import { DashboardHeader } from "@/components/Dashboard/DashboardHeader"
import { DisclaimerBanner } from "@/components/Dashboard/DisclaimerBanner"
import { EmptyProducts } from "@/components/Dashboard/EmptyProducts"
import { PendingProductGrid } from "@/components/Dashboard/PendingProductGrid"
import { ProductCard } from "@/components/Dashboard/ProductCard"
import { ProductFilters } from "@/components/Dashboard/ProductFilters"
import { bancoKey } from "@/lib/products"

function getProductsQueryOptions() {
  return {
    queryKey: ["products", "public"],
    queryFn: () => ProductsService.listProducts({ skip: 0, limit: 100 }),
  }
}

interface DashboardSearch {
  q?: string
}

export const Route = createFileRoute("/")({
  component: PublicDashboard,
  validateSearch: (search: Record<string, unknown>): DashboardSearch => ({
    q: typeof search.q === "string" && search.q ? search.q : undefined,
  }),
  head: () => ({
    meta: [
      {
        title: "YourBank - Compara productos bancarios",
      },
    ],
  }),
})

function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
}

function PublicDashboard() {
  const { data, isLoading, isError } = useQuery(getProductsQueryOptions())
  const { q } = Route.useSearch()
  const navigate = Route.useNavigate()
  const [selectedBanco, setSelectedBanco] = useState<string | null>(null)
  const [selectedTipo, setSelectedTipo] = useState<string | null>(null)

  const clearSearch = () => {
    navigate({ search: {}, replace: true })
  }

  const products = useMemo(() => data?.data ?? [], [data])

  const bancos = useMemo(() => {
    const byKey = new Map<string, string>()
    for (const product of products) {
      const key = bancoKey(product.banco)
      if (!byKey.has(key)) {
        byKey.set(key, product.banco)
      }
    }
    return Array.from(byKey.values()).sort()
  }, [products])

  const filteredProducts = useMemo(
    () =>
      products.filter((product) => {
        if (
          selectedBanco &&
          bancoKey(product.banco) !== bancoKey(selectedBanco)
        )
          return false
        if (selectedTipo && product.tipo_producto !== selectedTipo) return false
        if (q) {
          const query = normalizeText(q)
          const haystack = normalizeText(
            `${product.nombre_producto} ${product.banco}`,
          )
          if (!haystack.includes(query)) return false
        }
        return true
      }),
    [products, selectedBanco, selectedTipo, q],
  )

  return (
    <div className="flex min-h-svh flex-col">
      <DashboardHeader />
      <DisclaimerBanner />

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
          {q && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                Mostrando resultados para:
              </span>
              <button
                type="button"
                onClick={clearSearch}
                className="inline-flex items-center gap-1.5 rounded-full border bg-muted/50 px-3 py-1 text-sm font-medium transition-colors hover:bg-muted"
              >
                {q}
                <X className="size-3.5 text-muted-foreground" />
              </button>
            </div>
          )}

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
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
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
