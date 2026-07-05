import useAuth, { isLoggedIn } from "@/hooks/useAuth"

/** Solo true si hay sesión activa y el usuario es superuser. */
export function useIsAdmin() {
  const { user } = useAuth()
  return isLoggedIn() && user?.is_superuser === true
}
