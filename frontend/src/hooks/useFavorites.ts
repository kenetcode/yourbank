import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useMemo } from "react"

import {
  type ApiError,
  FavoritesService,
  type ProductPublic,
  type ProductsPublic,
} from "@/client"
import { isLoggedIn } from "@/hooks/useAuth"

export const FAVORITES_QUERY_KEY = ["favorites"] as const

const EMPTY_FAVORITES: ProductsPublic = { data: [], count: 0, disclaimer: "" }

function addToCache(
  cache: ProductsPublic | undefined,
  product: ProductPublic,
): ProductsPublic {
  const base = cache ?? EMPTY_FAVORITES
  if (base.data.some((item) => item.id === product.id)) {
    return base
  }
  const data = [product, ...base.data]
  return { ...base, data, count: data.length }
}

function removeFromCache(
  cache: ProductsPublic | undefined,
  productId: string,
): ProductsPublic {
  const base = cache ?? EMPTY_FAVORITES
  const data = base.data.filter((item) => item.id !== productId)
  return { ...base, data, count: data.length }
}

/**
 * Maneja el estado de favoritos del usuario actual, con actualizaciones
 * optimistas para que el corazón responda al instante en la UI.
 */
export function useFavorites() {
  const loggedIn = isLoggedIn()
  const queryClient = useQueryClient()

  const favoritesQuery = useQuery({
    queryKey: FAVORITES_QUERY_KEY,
    queryFn: () => FavoritesService.listMyFavorites(),
    enabled: loggedIn,
    staleTime: 30_000,
  })

  const favoriteIds = useMemo(
    () =>
      new Set((favoritesQuery.data?.data ?? []).map((product) => product.id)),
    [favoritesQuery.data],
  )

  const addFavorite = useMutation<
    ProductPublic,
    ApiError,
    ProductPublic,
    { previous: ProductsPublic | undefined }
  >({
    mutationFn: (product) =>
      FavoritesService.addFavorite({ productId: product.id }),
    onMutate: async (product) => {
      await queryClient.cancelQueries({ queryKey: FAVORITES_QUERY_KEY })
      const previous =
        queryClient.getQueryData<ProductsPublic>(FAVORITES_QUERY_KEY)
      queryClient.setQueryData<ProductsPublic>(FAVORITES_QUERY_KEY, (old) =>
        addToCache(old, product),
      )
      return { previous }
    },
    onError: (_error, _product, context) => {
      if (context?.previous) {
        queryClient.setQueryData(FAVORITES_QUERY_KEY, context.previous)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: FAVORITES_QUERY_KEY })
    },
  })

  const removeFavorite = useMutation<
    void,
    ApiError,
    string,
    { previous: ProductsPublic | undefined }
  >({
    mutationFn: (productId) => FavoritesService.removeFavorite({ productId }),
    onMutate: async (productId) => {
      await queryClient.cancelQueries({ queryKey: FAVORITES_QUERY_KEY })
      const previous =
        queryClient.getQueryData<ProductsPublic>(FAVORITES_QUERY_KEY)
      queryClient.setQueryData<ProductsPublic>(FAVORITES_QUERY_KEY, (old) =>
        removeFromCache(old, productId),
      )
      return { previous }
    },
    onError: (_error, _productId, context) => {
      if (context?.previous) {
        queryClient.setQueryData(FAVORITES_QUERY_KEY, context.previous)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: FAVORITES_QUERY_KEY })
    },
  })

  return { loggedIn, favoritesQuery, favoriteIds, addFavorite, removeFavorite }
}
