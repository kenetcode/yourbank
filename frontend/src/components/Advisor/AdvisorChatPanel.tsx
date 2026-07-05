import { useMutation, useQuery } from "@tanstack/react-query"
import { Link } from "@tanstack/react-router"
import { Lock, Send, Sparkles, UserRound, X } from "lucide-react"
import { useEffect, useMemo, useRef, useState } from "react"
import ReactMarkdown from "react-markdown"

import {
  AdvisorService,
  type ChatMessage,
  type ProductPublic,
  ProductsService,
} from "@/client"
import {
  ANON_COUNT_KEY,
  ANON_LIMIT,
  ANON_SESSION_KEY,
  countUserMessages,
  type DisplayMessage,
  readCount,
  readHistory,
  SUGGESTIONS,
  USER_LIMIT,
  userCountKey,
  userHistoryKey,
  writeHistory,
} from "@/components/Advisor/advisorStorage"
import {
  matchProductByName,
  RecommendedProductsStrip,
} from "@/components/Advisor/RecommendedProductsStrip"
import { ProductQuickView } from "@/components/Dashboard/ProductQuickView"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import useAuth, { isLoggedIn } from "@/hooks/useAuth"
import { cn } from "@/lib/utils"

function Markdown({ content }: { content: string }) {
  return (
    <ReactMarkdown
      components={{
        p: ({ children }) => (
          <p className="leading-relaxed [&:not(:first-child)]:mt-2">
            {children}
          </p>
        ),
        strong: ({ children }) => (
          <strong className="font-semibold">{children}</strong>
        ),
        ul: ({ children }) => (
          <ul className="mt-2 flex list-disc flex-col gap-1 pl-5">
            {children}
          </ul>
        ),
        ol: ({ children }) => (
          <ol className="mt-2 flex list-decimal flex-col gap-1 pl-5">
            {children}
          </ol>
        ),
        li: ({ children }) => <li className="leading-relaxed">{children}</li>,
        a: ({ children, href }) => (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2"
          >
            {children}
          </a>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  )
}

function TypingIndicator() {
  return (
    <div className="flex animate-in fade-in gap-2 duration-300">
      <AssistantAvatar />
      <div className="flex items-center gap-1 rounded-2xl rounded-tl-sm bg-muted px-3 py-2.5">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="size-1.5 animate-bounce rounded-full bg-muted-foreground/60"
            style={{ animationDelay: `${i * 150}ms` }}
          />
        ))}
      </div>
    </div>
  )
}

function AssistantAvatar() {
  return (
    <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/60 text-primary-foreground shadow-sm">
      <Sparkles className="size-3.5" />
    </div>
  )
}

function MessageBubble({
  message,
  onProductClick,
}: {
  message: DisplayMessage
  onProductClick: (name: string) => void
}) {
  const isUser = message.role === "user"

  return (
    <div
      className={cn(
        "flex animate-in fade-in slide-in-from-bottom-2 gap-2 duration-300",
        isUser && "flex-row-reverse",
      )}
    >
      {isUser ? (
        <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <UserRound className="size-3.5" />
        </div>
      ) : (
        <AssistantAvatar />
      )}
      <div
        className={cn(
          "flex max-w-[85%] flex-col gap-1.5",
          isUser && "items-end",
        )}
      >
        <div
          className={cn(
            "rounded-2xl px-3 py-2 text-sm shadow-sm",
            isUser
              ? "rounded-tr-sm bg-primary text-primary-foreground"
              : "rounded-tl-sm bg-muted text-foreground",
          )}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap leading-relaxed">
              {message.content}
            </p>
          ) : (
            <Markdown content={message.content} />
          )}
        </div>
        {!isUser && message.productsUsed && message.productsUsed.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {message.productsUsed.map((name) => (
              <button
                key={name}
                type="button"
                onClick={() => onProductClick(name)}
                className="inline-flex items-center gap-1 rounded-full border bg-background px-2 py-0.5 text-[11px] font-medium transition-colors hover:border-primary/40 hover:bg-primary/5 hover:text-primary"
              >
                {name}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function LimitReachedPanel({ loggedIn }: { loggedIn: boolean }) {
  return (
    <div className="flex animate-in fade-in slide-in-from-bottom-2 flex-col items-center gap-2 rounded-xl border border-dashed bg-muted/30 p-4 text-center duration-300">
      <div className="rounded-full bg-primary/10 p-2">
        <Lock className="size-4 text-primary" />
      </div>
      {loggedIn ? (
        <>
          <p className="text-sm font-semibold">Alcanzaste el límite de mensajes</p>
          <p className="text-xs text-muted-foreground">
            Usaste tus {USER_LIMIT} mensajes. Sigue comparando en el dashboard.
          </p>
        </>
      ) : (
        <>
          <p className="text-sm font-semibold">Regístrate para seguir conversando</p>
          <p className="text-xs text-muted-foreground">
            Usaste tus {ANON_LIMIT} mensajes gratuitos. Crea una cuenta para
            obtener hasta {USER_LIMIT}.
          </p>
          <div className="flex gap-2">
            <Button asChild size="sm">
              <Link to="/signup">Crear cuenta</Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link to="/login">Iniciar sesión</Link>
            </Button>
          </div>
        </>
      )}
    </div>
  )
}

interface AdvisorChatPanelProps {
  onClose: () => void
}

export function AdvisorChatPanel({ onClose }: AdvisorChatPanelProps) {
  const { user } = useAuth()
  const loggedIn = isLoggedIn()
  const userId = loggedIn ? (user?.id ?? null) : null
  const identityReady = !loggedIn || userId != null

  const [messages, setMessages] = useState<DisplayMessage[]>([])
  const [used, setUsed] = useState(0)
  const [hydrated, setHydrated] = useState(false)
  const [input, setInput] = useState("")
  const [quickViewProduct, setQuickViewProduct] =
    useState<ProductPublic | null>(null)
  const [quickViewOpen, setQuickViewOpen] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const userIdRef = useRef<string | null>(userId)
  const hydratedForRef = useRef<string | null>(null)

  userIdRef.current = userId

  const limit = loggedIn ? USER_LIMIT : ANON_LIMIT
  const limitReached = used >= limit

  const { data: productsData } = useQuery({
    queryKey: ["products", "public"],
    queryFn: () => ProductsService.listProducts({ skip: 0, limit: 100 }),
  })
  const products = productsData?.data ?? []

  const storageScope = userId ? `user:${userId}` : "anon"

  const persistHistory = (next: DisplayMessage[]) => {
    setMessages(next)
    const currentUserId = userIdRef.current
    if (currentUserId) {
      writeHistory(userHistoryKey(currentUserId), next)
    } else {
      writeHistory(ANON_SESSION_KEY, next, sessionStorage)
    }
  }

  useEffect(() => {
    if (!identityReady) return
    if (hydratedForRef.current === storageScope) return

    hydratedForRef.current = storageScope

    if (userId) {
      const storedHistory = readHistory(userHistoryKey(userId))
      const storedUsed = readCount(userCountKey(userId))
      const usedFromHistory = countUserMessages(storedHistory)
      setMessages(storedHistory)
      setUsed(Math.max(storedUsed, usedFromHistory))
    } else {
      const storedHistory = readHistory(ANON_SESSION_KEY, sessionStorage)
      const storedUsed = readCount(ANON_COUNT_KEY)
      const usedFromHistory = countUserMessages(storedHistory)
      setMessages(storedHistory)
      setUsed(Math.max(storedUsed, usedFromHistory))
    }

    setHydrated(true)
  }, [identityReady, storageScope, userId])

  const incrementUsed = () => {
    setUsed((prev) => {
      const next = prev + 1
      const key = userIdRef.current
        ? userCountKey(userIdRef.current)
        : ANON_COUNT_KEY
      localStorage.setItem(key, String(next))
      return next
    })
  }

  const chatMutation = useMutation({
    mutationFn: (args: { message: string; history: ChatMessage[] }) =>
      AdvisorService.advisorChat({
        requestBody: { message: args.message, history: args.history },
      }),
    onSuccess: (response) => {
      setMessages((prev) => {
        const next: DisplayMessage[] = [
          ...prev,
          {
            role: "assistant" as const,
            content: response.reply,
            productsUsed: response.products_used,
          },
        ]
        const currentUserId = userIdRef.current
        if (currentUserId) {
          writeHistory(userHistoryKey(currentUserId), next)
        } else {
          writeHistory(ANON_SESSION_KEY, next, sessionStorage)
        }
        return next
      })
    },
    onError: () => {
      setMessages((prev) => {
        const next: DisplayMessage[] = [
          ...prev,
          {
            role: "assistant" as const,
            content:
              "Lo siento, no pude procesar tu consulta en este momento. Intenta de nuevo en unos segundos.",
          },
        ]
        const currentUserId = userIdRef.current
        if (currentUserId) {
          writeHistory(userHistoryKey(currentUserId), next)
        } else {
          writeHistory(ANON_SESSION_KEY, next, sessionStorage)
        }
        return next
      })
    },
  })

  // biome-ignore lint/correctness/useExhaustiveDependencies: scroll al llegar mensajes
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages.length, chatMutation.isPending])

  const sendMessage = (text: string) => {
    const trimmed = text.trim()
    if (
      !trimmed ||
      chatMutation.isPending ||
      limitReached ||
      !identityReady ||
      !hydrated
    )
      return

    const history: ChatMessage[] = messages.map(({ role, content }) => ({
      role,
      content,
    }))
    persistHistory([...messages, { role: "user", content: trimmed }])
    setInput("")
    incrementUsed()
    chatMutation.mutate({ message: trimmed, history })
  }

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    sendMessage(input)
  }

  const openProductByName = (name: string) => {
    const found = matchProductByName(products, name)
    if (found) {
      setQuickViewProduct(found)
      setQuickViewOpen(true)
    }
  }

  const openProduct = (product: ProductPublic) => {
    setQuickViewProduct(product)
    setQuickViewOpen(true)
  }

  const latestRecommended = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      const msg = messages[i]
      if (
        msg.role === "assistant" &&
        msg.productsUsed &&
        msg.productsUsed.length > 0
      ) {
        return msg.productsUsed
      }
    }
    return []
  }, [messages])

  const counterVariant = useMemo(() => {
    if (limitReached) return "destructive" as const
    if (used >= limit - 2) return "default" as const
    return "secondary" as const
  }, [used, limit, limitReached])

  return (
    <>
      <div className="flex h-full flex-col bg-background">
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between gap-2 border-b px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex size-9 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/60 text-primary-foreground shadow-md">
              <Sparkles className="size-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold leading-tight">Asesor IA</h2>
              <p className="text-[11px] text-muted-foreground">
                Tu guía bancario inteligente
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={counterVariant} className="tabular-nums text-[11px]">
              {Math.min(used, limit)}/{limit}
            </Badge>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="size-8"
              onClick={onClose}
              aria-label="Cerrar asesor"
            >
              <X className="size-4" />
            </Button>
          </div>
        </div>

        {/* Messages */}
        <div className="min-h-0 flex-1 overflow-y-auto p-3">
          {!hydrated ? (
            <div className="flex h-full items-center justify-center">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="size-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                Cargando…
              </div>
            </div>
          ) : messages.length === 0 && !limitReached ? (
            <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
              <div className="rounded-full bg-gradient-to-br from-primary/20 to-primary/5 p-4">
                <Sparkles className="size-7 text-primary" />
              </div>
              <div>
                <h3 className="text-base font-semibold">
                  ¿En qué puedo ayudarte?
                </h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  Pregúntame sobre tarjetas y productos bancarios.
                </p>
              </div>
              <div className="flex w-full flex-col gap-1.5">
                {SUGGESTIONS.slice(0, 4).map((suggestion) => (
                  <Button
                    key={suggestion}
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-auto whitespace-normal py-1.5 text-left text-xs"
                    onClick={() => sendMessage(suggestion)}
                  >
                    {suggestion}
                  </Button>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {messages.map((message, index) => (
                <MessageBubble
                  key={`${message.role}-${index}`}
                  message={message}
                  onProductClick={openProductByName}
                />
              ))}
              {chatMutation.isPending && <TypingIndicator />}
              {limitReached && !chatMutation.isPending && (
                <LimitReachedPanel loggedIn={loggedIn} />
              )}
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        {/* Productos recomendados */}
        {latestRecommended.length > 0 && products.length > 0 && (
          <RecommendedProductsStrip
            recommendedNames={latestRecommended}
            allProducts={products}
            onProductClick={openProduct}
          />
        )}

        {/* Input */}
        <form
          onSubmit={handleSubmit}
          className="flex shrink-0 items-center gap-2 border-t bg-muted/30 p-3"
        >
          <Input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder={
              limitReached
                ? loggedIn
                  ? "Límite alcanzado"
                  : "Regístrate para continuar"
                : "Escribe tu pregunta…"
            }
            disabled={chatMutation.isPending || limitReached || !hydrated}
            className="h-9 bg-background text-sm"
          />
          <Button
            type="submit"
            size="icon"
            className="size-9 shrink-0"
            disabled={
              !input.trim() ||
              chatMutation.isPending ||
              limitReached ||
              !hydrated
            }
            aria-label="Enviar mensaje"
          >
            <Send className="size-4" />
          </Button>
        </form>

        <p className="shrink-0 px-3 pb-2 text-center text-[10px] text-muted-foreground">
          Información referencial. Confirma con el banco.
        </p>
      </div>

      <ProductQuickView
        product={quickViewProduct}
        open={quickViewOpen}
        onOpenChange={setQuickViewOpen}
      />
    </>
  )
}
