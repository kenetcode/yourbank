import type { ProductPublic } from "@/client"
import { OpenAPI } from "@/client/core/OpenAPI"
import { request } from "@/client/core/request"

export interface ProductUpdateBody {
  nombre_producto?: string
  banco?: string
  tipo_producto?: ProductPublic["tipo_producto"]
  anualidad?: number | null
  tasa_interes?: number | null
  requisitos?: string[]
  beneficios?: string[]
  promociones?: Record<string, unknown>[]
}

export function updateProduct(productId: string, body: ProductUpdateBody) {
  return request<ProductPublic>(OpenAPI, {
    method: "PUT",
    url: "/api/v1/products/{product_id}",
    path: { product_id: productId },
    body,
    mediaType: "application/json",
    errors: { 422: "Validation Error" },
  })
}

export function deleteProduct(productId: string) {
  return request<void>(OpenAPI, {
    method: "DELETE",
    url: "/api/v1/products/{product_id}",
    path: { product_id: productId },
    errors: { 422: "Validation Error" },
  })
}
