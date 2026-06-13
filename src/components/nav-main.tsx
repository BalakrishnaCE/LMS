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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { navigate } from "wouter/use-browser-location"
import { useUser } from "@/hooks/use-user"
import { getRelativePath, getFullPath, BASE_PATH, ROUTES } from "@/config/routes"
import { PenLine, Sparkles } from "lucide-react"

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
  const isAiAllowed = true;

  // Get the current path without the base path
  const currentPath = getRelativePath(location);
  
  // Special handling for admin dashboard - if we're on /admin-dashboard, highlight Dashboard
  const isAdminDashboard = currentPath === ROUTES.ADMIN_DASHBOARD || currentPath === ROUTES.HOME;
  
  // Check if we're on the edit page or AI wizard to highlight Quick Create
  const isEditPage =
    currentPath === ROUTES.EDIT ||
    currentPath.startsWith(ROUTES.EDIT + '/') ||
    currentPath === ROUTES.AI_MODULE_WIZARD;

  // Filter items based on AI access
  const filteredItems = items.filter(item => {
    // If the item points to AI chat and user is not allowed, hide it
    if (item.url === ROUTES.AI_CHAT && !isAiAllowed) {
      return false;
    }
    return true;
  });

  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu>
          {isLMSAdmin && (
          <SidebarMenuItem className="flex items-center gap-2">
            {/* Quick Create label button — opens dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  tooltip="Quick Create"
                  className={
                    isEditPage
                      ? "hover:text-white text-white bg-primary/90 min-w-8 duration-200 ease-linear"
                      : "active:bg-primary/90 active:text-primary-foreground min-w-8 duration-200 ease-linear hover:text-white"
                  }
                >
                  <IconCirclePlusFilled />
                  <span>Quick Create</span>
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                side="right"
                align="start"
                sideOffset={8}
                className="min-w-[200px] rounded-xl shadow-lg border border-border p-1"
              >
                <DropdownMenuItem
                  className="flex items-center gap-3 px-3 py-2.5 cursor-pointer rounded-lg text-sm font-medium"
                  onClick={() => navigate(BASE_PATH + '/edit')}
                >
                  <PenLine className="w-4 h-4 text-muted-foreground" />
                  <span>Create Module Manually</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="flex items-center gap-3 px-3 py-2.5 cursor-pointer rounded-lg text-sm font-medium"
                  onClick={() => navigate(BASE_PATH + ROUTES.AI_MODULE_WIZARD)}
                >
                  <Sparkles className="w-4 h-4 text-primary" />
                  <span>Create Module with AI</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Plus icon button — also opens dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="icon"
                  className="size-8 group-data-[collapsible=icon]:opacity-0 hover:text-white"
                  variant="outline"
                >
                  <IconPlus className="size-4" />
                  <span className="sr-only">Add New Module</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                side="right"
                align="start"
                sideOffset={8}
                className="min-w-[200px] rounded-xl shadow-lg border border-border p-1"
              >
                <DropdownMenuItem
                  className="flex items-center gap-3 px-3 py-2.5 cursor-pointer rounded-lg text-sm font-medium"
                  onClick={() => navigate(BASE_PATH + '/edit')}
                >
                  <PenLine className="w-4 h-4 text-muted-foreground" />
                  <span>Create Module Manually</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="flex items-center gap-3 px-3 py-2.5 cursor-pointer rounded-lg text-sm font-medium"
                  onClick={() => navigate(BASE_PATH + ROUTES.AI_MODULE_WIZARD)}
                >
                  <Sparkles className="w-4 h-4 text-primary" />
                  <span>Create Module with AI</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
          )}
        </SidebarMenu>

        <SidebarMenu>
          {filteredItems.map((item) => {
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
