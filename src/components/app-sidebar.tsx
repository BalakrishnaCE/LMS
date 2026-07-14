import * as React from "react"
import {
  IconChartBar,
  IconDashboard,
  IconBook,
  IconListDetails,
  IconUsers,
} from "@tabler/icons-react"
import { Building2 } from "lucide-react"
import { NavMain, type NavMainItem } from "@/components/nav-main"
import { NavAiChat } from "@/components/nav-ai-chat"
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
import logoImage from '@/assets/new-LMS-Logo.png'
interface NavData {
  user: {
    name: string;
    email: string;
    avatar: string;
  };
  navMain: NavMainItem[];
}

const adminNavItems: NavMainItem[] = [
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
  {
    title: "Department",
    url: ROUTES.DEPARTMENT,
    icon: Building2,
    tooltip: "Department",
  },
];

const learnerNavItems: NavMainItem[] = [
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
                size="lg"
                className="hover:bg-transparent active:bg-transparent data-[active=true]:bg-transparent data-[state=open]:bg-transparent group-data-[collapsible=icon]:!p-0"
              >
                <Link href={isLMSAdmin ? ROUTES.HOME : ROUTES.LEARNER_DASHBOARD} className="flex items-center overflow-hidden w-full group-data-[collapsible=icon]:justify-center">
                  <img 
                    src={logoImage} 
                    alt="Novel LMS Logo" 
                    className="shrink-0 object-contain h-12 w-auto -mr-3 group-data-[collapsible=icon]:mr-0 group-data-[collapsible=icon]:h-8 group-data-[collapsible=icon]:w-8" 
                  />
                  <span className="text-base font-semibold truncate group-data-[collapsible=icon]:hidden">Novel LMS</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent>
          <NavMain items={navData.navMain} />
          <NavAiChat />
        </SidebarContent>
        <SidebarFooter>
          <NavUser user={navData.user} />
        </SidebarFooter>
      </Sidebar>
    </div>
  )
}
