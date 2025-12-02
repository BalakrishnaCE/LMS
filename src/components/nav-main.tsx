import * as React from "react"
import { IconCirclePlusFilled, IconPlus, type Icon } from "@tabler/icons-react"
import { useLocation } from "wouter"
import { Button } from "@/components/ui/button"
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { navigate } from "wouter/use-browser-location"
import { useUser } from "@/hooks/use-user"
import { getRelativePath, getFullPath, BASE_PATH, ROUTES } from "@/config/routes"

export type NavItemIcon = Icon | React.ComponentType<{ className?: string }>

export type NavMainItem = {
  title: string
  url: string
  icon?: NavItemIcon
  tooltip?: string
}

export function NavMain({
  items,
}: {
  items: NavMainItem[]
}) {
  const [location] = useLocation();
  const { isLMSAdmin } = useUser();

  // Get the current path without the base path
  const currentPath = getRelativePath(location);
  
  // Special handling for admin dashboard - if we're on /admin-dashboard, highlight Dashboard
  const isAdminDashboard = currentPath === ROUTES.ADMIN_DASHBOARD || currentPath === ROUTES.HOME;

  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu>
          {isLMSAdmin && (
          <SidebarMenuItem className="flex items-center gap-2">
            <SidebarMenuButton
              tooltip="Quick Create"
              className="bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground min-w-8 duration-200 ease-linear"
            >
              <IconCirclePlusFilled />
              <span >Quick Create</span>
            </SidebarMenuButton>
            <Button
              size="icon"
              className="size-8 group-data-[collapsible=icon]:opacity-0 hover:text-white"
              variant="outline"
              onClick={() => navigate(BASE_PATH + '/edit')}
            >
              <IconPlus className="size-4" />
              <span className="sr-only">Inbox</span>
            </Button>
          </SidebarMenuItem>
          )}
        </SidebarMenu>

        <SidebarMenu>
          {items.map((item) => {
            // Special case: if we're on admin dashboard and this is the Dashboard item, make it active
            const isActive = (isAdminDashboard && item.url === ROUTES.HOME) || currentPath === item.url;
            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  tooltip={item.tooltip}
                  className={
                    isActive
                      ? "hover:text-white text-white bg-primary/90"
                      : "active:bg-primary/90 active:text-primary-foreground hover:text-white"
                  }
                  onClick={() => {
                    if (item.url !== currentPath) {
                      navigate(getFullPath(item.url));
                    }
                  }}
                >
                  {item.icon && <item.icon />}
                  <span>{item.title}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
