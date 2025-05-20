import * as React from "react"
import {
  IconChartBar,
  IconDashboard,
  IconFolder,
  IconBook,
  IconListDetails,
  IconUsers,
  type Icon,
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
import { useUser } from "@/hooks/use-user"
import { ROUTES } from "@/config/routes"
import { Link } from 'wouter'

interface NavItem {
  title: string;
  url: string;
  icon: Icon;
  tooltip: string;
}

interface NavData {
  user: {
    name: string;
    email: string;
    avatar: string;
  };
  navMain: NavItem[];
}

const adminNavItems: NavItem[] = [
  {
    title: "Dashboard",
    url: ROUTES.HOME,
    icon: IconDashboard,
    tooltip: "Dashboard",
  },
  {
    title: "Modules",
    url: ROUTES.MODULES,
    icon: IconListDetails,
    tooltip: "Modules",
  },
  {
    title: "Analytics",
    url: ROUTES.ANALYTICS,
    icon: IconChartBar,
    tooltip: "Analytics",
  },
  {
    title: "Projects",
    url: ROUTES.PROJECTS,
    icon: IconFolder,
    tooltip: "Projects",
  },
  {
    title: "Learners",
    url: ROUTES.LEARNERS,
    icon: IconUsers,
    tooltip: "Learners",
  },
  {
    title: "Test Nav",
    url: "/test/edit",
    icon: IconDashboard,  
    tooltip: "Test Module Edit",
  },
];

const learnerNavItems: NavItem[] = [
  {
    title: "Dashboard",
    url: ROUTES.LEARNER_DASHBOARD,
    icon: IconDashboard,
    tooltip: "Dashboard",
  },
  {
    title: "My Modules",
    url: ROUTES.LEARNER_MODULES,
    icon: IconListDetails,
    tooltip: "My Modules",
  },
];

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user, isLMSAdmin } = useUser();
  const [navData, setNavData] = React.useState<NavData>({
    user: {
      name: "User",
      email: "",
      avatar: "/avatars/shadcn.jpg",
    },
    navMain: learnerNavItems
  });

  React.useEffect(() => {
    if (user) {
      setNavData(prev => ({
        ...prev,
        user: {
          name: user.full_name,
          email: user.email,
          avatar: user.image || "/avatars/shadcn.jpg",
        },
        navMain: isLMSAdmin ? adminNavItems : learnerNavItems
      }));
    }
  }, [user, isLMSAdmin]);

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
                <Link href={isLMSAdmin ? ROUTES.HOME : ROUTES.LEARNER_DASHBOARD} className="hover:text-white">
                  <IconBook className="!size-5" />
                  <span className="text-base font-semibold">Novel LMS</span>
                </Link>            
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
