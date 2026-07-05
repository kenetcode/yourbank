import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Trash2 } from "lucide-react"
import { useState } from "react"

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
import { LoadingButton } from "@/components/ui/loading-button"
import useCustomToast from "@/hooks/useCustomToast"
import { useIsAdmin } from "@/hooks/useIsAdmin"
import { deleteProduct } from "@/lib/adminProductsApi"
import { handleError } from "@/utils"

interface DeleteProductDialogProps {
  product: ProductPublic
  trigger?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
  onSuccess?: () => void
}

export function DeleteProductDialog({
  product,
  trigger,
  open: controlledOpen,
  onOpenChange,
  onSuccess,
}: DeleteProductDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const open = controlledOpen ?? internalOpen
  const setOpen = onOpenChange ?? setInternalOpen
  const queryClient = useQueryClient()
  const { showSuccessToast, showErrorToast } = useCustomToast()

  const mutation = useMutation({
    mutationFn: () => deleteProduct(product.id),
    onSuccess: () => {
      showSuccessToast("Producto eliminado")
      setOpen(false)
      queryClient.invalidateQueries({ queryKey: ["products"] })
      queryClient.invalidateQueries({ queryKey: ["favorites"] })
      onSuccess?.()
    },
    onError: handleError.bind(showErrorToast),
  })

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Eliminar producto</DialogTitle>
          <DialogDescription>
            ¿Seguro que quieres eliminar{" "}
            <strong>{product.nombre_producto}</strong>? También se quitará de
            los favoritos de los usuarios. Esta acción no se puede deshacer.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline" disabled={mutation.isPending}>
              Cancelar
            </Button>
          </DialogClose>
          <LoadingButton
            variant="destructive"
            loading={mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            Eliminar
          </LoadingButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function DeleteProductButton({
  product,
  onSuccess,
}: {
  product: ProductPublic
  onSuccess?: () => void
}) {
  const isAdmin = useIsAdmin()
  if (!isAdmin) return null

  return (
    <DeleteProductDialog
      product={product}
      onSuccess={onSuccess}
      trigger={
        <Button type="button" size="sm" variant="destructive">
          <Trash2 className="size-3.5" />
          Eliminar
        </Button>
      }
    />
  )
}
