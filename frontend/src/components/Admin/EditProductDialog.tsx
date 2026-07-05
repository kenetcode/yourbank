import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Pencil } from "lucide-react"
import { useEffect, useState } from "react"

import type { ProductPublic } from "@/client"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { LoadingButton } from "@/components/ui/loading-button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import useCustomToast from "@/hooks/useCustomToast"
import { useIsAdmin } from "@/hooks/useIsAdmin"
import { type ProductUpdateBody, updateProduct } from "@/lib/adminProductsApi"
import { getNormalized, TIPO_PRODUCTO_OPTIONS } from "@/lib/products"
import { handleError } from "@/utils"

interface EditProductDialogProps {
  product: ProductPublic
  trigger?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
  onSuccess?: () => void
}

function linesToList(value: string): string[] {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
}

export function EditProductDialog({
  product,
  trigger,
  open: controlledOpen,
  onOpenChange,
  onSuccess,
}: EditProductDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const open = controlledOpen ?? internalOpen
  const setOpen = onOpenChange ?? setInternalOpen
  const queryClient = useQueryClient()
  const { showSuccessToast, showErrorToast } = useCustomToast()
  const normalized = getNormalized(product)

  const [nombre, setNombre] = useState(product.nombre_producto)
  const [banco, setBanco] = useState(product.banco)
  const [tipo, setTipo] = useState(product.tipo_producto)
  const [anualidad, setAnualidad] = useState(
    normalized.anualidad != null ? String(normalized.anualidad) : "",
  )
  const [tasa, setTasa] = useState(
    normalized.tasa_interes != null ? String(normalized.tasa_interes) : "",
  )
  const [requisitos, setRequisitos] = useState(
    (normalized.requisitos ?? []).join("\n"),
  )
  const [beneficios, setBeneficios] = useState(
    (normalized.beneficios ?? []).join("\n"),
  )

  useEffect(() => {
    if (!open) return
    const data = getNormalized(product)
    setNombre(product.nombre_producto)
    setBanco(product.banco)
    setTipo(product.tipo_producto)
    setAnualidad(data.anualidad != null ? String(data.anualidad) : "")
    setTasa(data.tasa_interes != null ? String(data.tasa_interes) : "")
    setRequisitos((data.requisitos ?? []).join("\n"))
    setBeneficios((data.beneficios ?? []).join("\n"))
  }, [open, product])

  const mutation = useMutation({
    mutationFn: (body: ProductUpdateBody) => updateProduct(product.id, body),
    onSuccess: () => {
      showSuccessToast("Producto actualizado")
      setOpen(false)
      queryClient.invalidateQueries({ queryKey: ["products"] })
      queryClient.invalidateQueries({ queryKey: ["favorites"] })
      onSuccess?.()
    },
    onError: handleError.bind(showErrorToast),
  })

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    const body: ProductUpdateBody = {
      nombre_producto: nombre.trim(),
      banco: banco.trim(),
      tipo_producto: tipo,
      requisitos: linesToList(requisitos),
      beneficios: linesToList(beneficios),
    }
    if (anualidad.trim()) {
      body.anualidad = Number.parseFloat(anualidad)
    }
    if (tasa.trim()) {
      body.tasa_interes = Number.parseFloat(tasa)
    }
    mutation.mutate(body)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-lg">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Editar producto</DialogTitle>
            <DialogDescription>
              Modifica los datos del producto. Una línea por requisito o
              beneficio.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="nombre">Nombre</Label>
              <Input
                id="nombre"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="banco">Banco</Label>
              <Input
                id="banco"
                value={banco}
                onChange={(e) => setBanco(e.target.value)}
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Tipo de producto</Label>
              <Select
                value={tipo}
                onValueChange={(v) => setTipo(v as typeof tipo)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIPO_PRODUCTO_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="anualidad">Anualidad (USD)</Label>
                <Input
                  id="anualidad"
                  type="number"
                  step="0.01"
                  value={anualidad}
                  onChange={(e) => setAnualidad(e.target.value)}
                  placeholder="0 = gratis"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="tasa">Tasa interés (%)</Label>
                <Input
                  id="tasa"
                  type="number"
                  step="0.01"
                  value={tasa}
                  onChange={(e) => setTasa(e.target.value)}
                />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="requisitos">Requisitos</Label>
              <Textarea
                id="requisitos"
                rows={4}
                value={requisitos}
                onChange={(e) => setRequisitos(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="beneficios">Beneficios</Label>
              <Textarea
                id="beneficios"
                rows={5}
                value={beneficios}
                onChange={(e) => setBeneficios(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter className="mt-6">
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancelar
              </Button>
            </DialogClose>
            <LoadingButton type="submit" loading={mutation.isPending}>
              Guardar cambios
            </LoadingButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function EditProductButton({
  product,
  onSuccess,
}: {
  product: ProductPublic
  onSuccess?: () => void
}) {
  const isAdmin = useIsAdmin()
  if (!isAdmin) return null

  return (
    <EditProductDialog
      product={product}
      onSuccess={onSuccess}
      trigger={
        <Button type="button" size="sm" variant="outline">
          <Pencil className="size-3.5" />
          Editar
        </Button>
      }
    />
  )
}
