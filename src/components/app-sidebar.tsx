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
import { useFrappeAuth, useFrappeGetDoc } from "frappe-react-sdk"

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
      title: "Team",
      url: "#",
      icon: IconUsers,
      tooltip: "Team",
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {

  const [userName, setUserName] = React.useState("")
  const [isLoading, setIsLoading] = React.useState(true)
  
    const { currentUser} = useFrappeAuth()
  
    const { data, error: docError, isValidating } = useFrappeGetDoc(
      "User",
      currentUser ?? undefined,
      {
        fields: ["name", "full_name", "email", "image", "role"],
      }
    )
     // async function to get user detials
     async function getUserDetails() {
      if (isValidating) {
        setIsLoading(true)
      }
      if (data) {
        const roles = data.roles
        const isLMSAdmin = roles.some((role: { role: string }) => role.role === "LMS Student");        
        // console.log(isLMSAdmin)
        setUserName(data?.first_name)
        setIsLoading(false)
      }
      if (docError) {
        console.log(docError)
      }
      
     }  
    React.useEffect(() => {
      getUserDetails()
    }, [data, isValidating])
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
              <a href="#" className="hover:text-white">
                <IconBook className="!size-5" />
                <span className="text-base font-semibold">Novel LMS</span>
              </a>            
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      {isLoading ? (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    ) : (
      <SidebarContent>
        <NavMain items={navData.navMain} />
      </SidebarContent>
    )}
    {!isLoading ? (
          <SidebarFooter>
          <NavUser user={navData.user} />
        </SidebarFooter>
    ) : (
       <div></div>
    )}
    </Sidebar>
  </div>
  )
}
