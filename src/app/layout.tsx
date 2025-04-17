import { SidebarProvider,SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { Toaster } from "@/components/ui/sonner"

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
        <AppSidebar />

        <SidebarInset>
      <SiteHeader />
      <main >
        {children}
      </main>
      <Toaster />
      </SidebarInset>
    </SidebarProvider>
  )
}
