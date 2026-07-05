import { ReactQueryDevtools } from "@tanstack/react-query-devtools"
import { createRootRoute, HeadContent, Outlet } from "@tanstack/react-router"
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools"
import { AdvisorWidget } from "@/components/Advisor/AdvisorWidget"
import ErrorComponent from "@/components/Common/ErrorComponent"
import NotFound from "@/components/Common/NotFound"
import { AdvisorWidgetProvider } from "@/contexts/AdvisorWidgetContext"

export const Route = createRootRoute({
  component: () => (
    <AdvisorWidgetProvider>
      <HeadContent />
      <Outlet />
      <AdvisorWidget />
      <TanStackRouterDevtools position="bottom-right" />
      <ReactQueryDevtools initialIsOpen={false} />
    </AdvisorWidgetProvider>
  ),
  notFoundComponent: () => <NotFound />,
  errorComponent: () => <ErrorComponent />,
})
