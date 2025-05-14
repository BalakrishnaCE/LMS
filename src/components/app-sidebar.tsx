import * as React from "react"
import {
  IconChartBar,
  IconDashboard,
  IconFolder,
  IconBook,
  IconListDetails,
  IconUsers,
} from "@tabler/icons-react"
import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { Spinner } from '@/components/ui/spinner';
import { useUser } from "@/hooks/use-user"

const navData = {
  user: {
    name: "Bala",
    email: "bala@novel.com",
    avatar: "/avatars/shadcn.jpg",
  },
  navMain: [
    {
      title: "Dashboard",
      url: "/",
      icon: IconDashboard,
      tooltip: "Dashboard",
    },
    {
      title: "Modules",
      url: "/modules",
      icon: IconListDetails,
      tooltip: "Modules",
    },
    {
      title: "Analytics",
      url: "#",
      icon: IconChartBar,
      tooltip: "Analytics",
    },
    {
      title: "Projects",
      url: "#",
      icon: IconFolder,
      tooltip: "Projects",
    },
    {
      title: "Learners",
      url: "/learners",
      icon: IconUsers,
      tooltip: "Learners",
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useUser();
  React.useEffect(() => {
    if (user) {
      navData.user.name = user.full_name;
      navData.user.email = user.email;
      navData.user.avatar = user.image || "/avatars/shadcn.jpg";
    }
  }, [user]);

  return (
    <div>
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              {/* on hover of this i want the text color to be white */}
              <a href="/" className="hover:text-white">
                <IconBook className="!size-5" />
                <span className="text-base font-semibold">Novel LMS</span>
              </a>            
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navData.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={navData.user} />
      </SidebarFooter>
    </Sidebar>
  </div>
  )
}
