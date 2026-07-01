import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Bell, MessageCircleQuestion, Sparkles } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { useLocation } from "wouter"
import { ROUTES } from "@/config/routes"
import { useUser } from "@/hooks/use-user"

function AiProgressHeaderWidget() {
  const [jobId, setJobId] = useState<string | null>(null)
  const [progress, setProgress] = useState<string>("Generating...")
  const [, setLocation] = useLocation()

  useEffect(() => {
    const checkStorage = () => {
      const id = localStorage.getItem("active_ai_job_id")
      const prog = localStorage.getItem("active_ai_job_progress")
      setJobId(id)
      setProgress(prog || "Generating...")
    }

    checkStorage()
    // Poll localStorage every 1 second
    const interval = setInterval(checkStorage, 1000)
    return () => clearInterval(interval)
  }, [])

  if (!jobId) return null

  return (
    <div
      onClick={() => setLocation("/ai-module-wizard")}
      className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 border border-primary/20 rounded-full text-xs font-semibold text-primary cursor-pointer transition-all duration-300 animate-pulse shadow-sm hover:scale-[1.03] select-none mr-2"
      title="Click to view AI generation wizard"
    >
      <span className="relative flex h-2.5 w-2.5">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary"></span>
      </span>
      <Sparkles className="size-3.5 text-primary shrink-0 animate-spin-slow" />
      <span className="truncate max-w-[150px] md:max-w-[250px]">AI Creating: {progress}</span>
    </div>
  )
}

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
          <AiProgressHeaderWidget />
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
