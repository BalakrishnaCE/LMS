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
import { useFrappeGetDoc, useFrappeAuth } from "frappe-react-sdk"
import { useState, useEffect } from "react"

export function NavMain({
  items,
}: {
  items: {
    title: string
    url: string
    icon?: Icon
    tooltip?: string
  }[]
}) {
  const [location] = useLocation();
  const { currentUser } = useFrappeAuth();
  const { data: userData } = useFrappeGetDoc("User", currentUser || "", { fields: ["roles"] });
  const isLMSAdmin = userData?.roles?.some((role: { role: string }) => role.role === "LMS Admin");
  // console.log(isLMSStudent);

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
              <span>Quick Create</span>
            </SidebarMenuButton>
            <Button
              size="icon"
              className="size-8 group-data-[collapsible=icon]:opacity-0 hover:text-white"
              variant="outline"
              onClick={() => console.log("create")}
            >
              <IconPlus className="size-4" />
              <span className="sr-only">Inbox</span>
            </Button>
          </SidebarMenuItem>
          )}
        </SidebarMenu>

        <SidebarMenu>
          {items.map((item) => {
            const isActive = location === item.url;
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
                    if (item.url !== location) {
                      navigate(item.url);
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
