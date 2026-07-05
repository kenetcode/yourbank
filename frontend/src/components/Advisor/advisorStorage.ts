import type { ChatMessage } from "@/client"

export const ANON_LIMIT = 5
export const USER_LIMIT = 20
export const ANON_COUNT_KEY = "yb-advisor-anon-used"
export const ANON_SESSION_KEY = "yb-advisor-anon-session"

export const SUGGESTIONS = [
  "¿Qué tarjetas sin anualidad hay?",
  "Compara las tarjetas disponibles",
  "¿Cuál me conviene si gano $500 al mes?",
  "¿Qué promociones hay en cines?",
  "Requisitos de la tarjeta Platinum",
]

export interface DisplayMessage extends ChatMessage {
  productsUsed?: string[]
}

export function userCountKey(userId: string) {
  return `yb-advisor-used-${userId}`
}

export function userHistoryKey(userId: string) {
  return `yb-advisor-history-${userId}`
}

export function readCount(key: string): number {
  const raw = localStorage.getItem(key)
  const value = raw ? Number.parseInt(raw, 10) : 0
  return Number.isNaN(value) ? 0 : value
}

export function readHistory(
  key: string,
  storage: Storage = localStorage,
): DisplayMessage[] {
  try {
    const raw = storage.getItem(key)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function writeHistory(
  key: string,
  messages: DisplayMessage[],
  storage: Storage = localStorage,
) {
  storage.setItem(key, JSON.stringify(messages))
}

export function countUserMessages(messages: DisplayMessage[]): number {
  return messages.filter((message) => message.role === "user").length
}

export function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
}
