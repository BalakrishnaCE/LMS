import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Bell, MessageCircleQuestion } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { useLocation } from "wouter"
import { ROUTES } from "@/config/routes"
import { useUser } from "@/hooks/use-user"

export function SiteHeader() {
  const [, setLocation] = useLocation()
  const { isLMSAdmin } = useUser()

  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-8"
        />
        <div className="ml-auto flex items-center gap-3">
          {!isLMSAdmin && (
            <Button
              variant="ghost"
              size="icon"
              className="h-11 w-11 text-muted-foreground hover:text-foreground"
              onClick={() => setLocation(ROUTES.FAQ)}
              title="FAQs"
            >
              <MessageCircleQuestion className="size-7" strokeWidth={1.6} />
            </Button>
          )}
          <ThemeToggle />
          <Button variant="ghost" size="icon" className="h-11 w-11 text-muted-foreground hover:text-foreground">
            <Bell className="size-7" />
          </Button>
        </div>
      </div>
    </header>
  )
}
