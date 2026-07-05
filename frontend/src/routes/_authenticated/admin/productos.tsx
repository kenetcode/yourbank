import { useQuery } from "@tanstack/react-query"
import { createFileRoute, Link, redirect } from "@tanstack/react-router"
import { ArrowLeft, CreditCard } from "lucide-react"

import { ProductsService, UsersService } from "@/client"
import { DeleteProductButton } from "@/components/Admin/DeleteProductDialog"
import { EditProductButton } from "@/components/Admin/EditProductDialog"
import { PendingProductGrid } from "@/components/Dashboard/PendingProductGrid"
import { ProductTypeBadge } from "@/components/Dashboard/ProductTypeBadge"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatCurrency, getNormalized } from "@/lib/products"

export const Route = createFileRoute("/_authenticated/admin/productos")({
  component: AdminProducts,
  beforeLoad: async () => {
    const user = await UsersService.readUserMe()
    if (!user.is_superuser) {
      throw redirect({ to: "/" })
    }
  },
  head: () => ({
    meta: [{ title: "Administrar productos - YourBank" }],
  }),
})

function AdminProducts() {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["products", "admin"],
    queryFn: () => ProductsService.listProducts({ skip: 0, limit: 200 }),
  })
  const products = data?.data ?? []

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <CreditCard className="size-5 text-primary" />
            <h1 className="text-2xl font-bold tracking-tight">
              Administrar productos
            </h1>
          </div>
          <p className="text-muted-foreground">
            Edita o elimina las tarjetas y productos del catálogo
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link to="/admin">
            <ArrowLeft className="size-4" />
            Volver a usuarios
          </Link>
        </Button>
      </div>

      {isLoading ? (
        <PendingProductGrid />
      ) : (
        <div className="rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Producto</TableHead>
                <TableHead>Banco</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Anualidad</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => {
                const normalized = getNormalized(product)
                const anualidad = normalized.anualidad
                return (
                  <TableRow key={product.id}>
                    <TableCell className="max-w-[220px] font-medium">
                      {product.nombre_producto}
                    </TableCell>
                    <TableCell>{product.banco}</TableCell>
                    <TableCell>
                      <ProductTypeBadge tipo={product.tipo_producto} />
                    </TableCell>
                    <TableCell>
                      {anualidad === 0 ? (
                        <Badge className="border-transparent bg-emerald-500/15 text-emerald-600">
                          Gratis
                        </Badge>
                      ) : anualidad != null && anualidad > 0 ? (
                        formatCurrency(anualidad)
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <EditProductButton
                          product={product}
                          onSuccess={() => refetch()}
                        />
                        <DeleteProductButton
                          product={product}
                          onSuccess={() => refetch()}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
