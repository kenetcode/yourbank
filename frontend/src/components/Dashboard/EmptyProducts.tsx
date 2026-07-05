import { SearchX } from "lucide-react"

export function EmptyProducts() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed py-16 text-center">
      <div className="rounded-full bg-muted p-4">
        <SearchX className="size-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold">No encontramos productos</h3>
      <p className="max-w-sm text-sm text-muted-foreground">
        No hay productos que coincidan con los filtros seleccionados. Intenta
        con otro banco o tipo de producto.
      </p>
    </div>
  )
}
