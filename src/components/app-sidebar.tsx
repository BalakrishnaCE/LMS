import * as React from "react"
import {
  IconChartBar,
  IconDashboard,
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
import { useLMSUserPermissions } from "@/hooks/use-lms-user-permissions"
import { ROUTES } from "@/config/routes"
import { Link } from 'wouter'
import { useFrappeAuth } from "frappe-react-sdk"

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
    title: "Learners",
    url: ROUTES.LEARNERS,
    icon: IconUsers,
    tooltip: "Learners",
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

const tlNavItems: NavItem[] = [
  {
    title: "Team Dashboard",
    url: ROUTES.TL_DASHBOARD,
    icon: IconDashboard,
    tooltip: "Team Dashboard",
  },
  {
    title: "Team Modules",
    url: ROUTES.LEARNER_MODULES,
    icon: IconListDetails,
    tooltip: "Team Modules",
  },
  {
    title: "Analytics",
    url: ROUTES.ANALYTICS,
    icon: IconChartBar,
    tooltip: "Analytics",
  },
];

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { isLMSAdmin, isLMSContentEditor, isLMSTL } = useLMSUserPermissions();
  const { currentUser } = useFrappeAuth();
  const [navData, setNavData] = React.useState<NavData>({
    user: {
      name: currentUser || "User",
      email: "",
      avatar: "/avatars/shadcn.jpg",
    },
    navMain: learnerNavItems
  });

  React.useEffect(() => {
    // Determine navigation based on user type
    let navItems = learnerNavItems; // Default to learner nav
    
    if (isLMSAdmin) {
      navItems = adminNavItems;
    } else if (isLMSContentEditor) {
      navItems = adminNavItems; // Content editors get admin nav
    } else if (isLMSTL) {
      navItems = tlNavItems; // TL gets TL-specific nav
    }
    
    setNavData(prev => ({
      ...prev,
      user: {
        name: currentUser || "User",
        email: "",
        avatar: "/avatars/shadcn.jpg",
      },
      navMain: navItems
    }));
  }, [isLMSAdmin, isLMSContentEditor, isLMSTL, currentUser]);

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
                <Link href={
                  isLMSAdmin || isLMSContentEditor 
                    ? ROUTES.HOME 
                    : isLMSTL 
                      ? ROUTES.TL_DASHBOARD 
                      : ROUTES.LEARNER_DASHBOARD
                } className="hover:text-white">
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
