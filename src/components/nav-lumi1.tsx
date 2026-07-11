import * as React from "react"
import { BookOpen, MessageSquare, CheckSquare, Settings, Bot, ChevronRight } from "lucide-react"
import { useLocation } from "wouter"
import {
    SidebarGroup,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    useSidebar,
} from "@/components/ui/sidebar"
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { ROUTES } from "@/config/routes"

export function NavLumi1() {
    const [location, setLocation] = useLocation();
    const { state } = useSidebar();
    const isCollapsed = state === "collapsed";

    const isLumi1Page = location.includes('/lumi_1');
    const [isOpen, setIsOpen] = React.useState(isLumi1Page);

    React.useEffect(() => {
        if (isLumi1Page) {
            setIsOpen(true);
        }
    }, [location, isLumi1Page]);

    const handleNavigate = (path: string) => {
        setLocation(path);
    };

    const menuItems = [
        {
            title: "Knowledge",
            url: ROUTES.LUMI_1_KNOWLEDGE,
            icon: BookOpen,
        },
        {
            title: "Chat",
            url: ROUTES.LUMI_1_CHAT,
            icon: MessageSquare,
        },
        {
            title: "Approvals",
            url: ROUTES.LUMI_1_APPROVALS,
            icon: CheckSquare,
        },
        {
            title: "Settings",
            url: ROUTES.LUMI_1_SETTINGS,
            icon: Settings,
        },
    ];

    return (
        <SidebarGroup>
            <SidebarMenu>
                <Collapsible
                    asChild
                    open={isOpen && !isCollapsed}
                    onOpenChange={setIsOpen}
                    className="group/collapsible"
                >
                    <SidebarMenuItem>
                        <CollapsibleTrigger asChild>
                            <SidebarMenuButton
                                tooltip="Lumi 1 (AI)"
                                className="hover:text-white data-[active=true]:text-white data-[active=true]:bg-primary/90"
                                isActive={isLumi1Page}
                            >
                                <Bot className="w-4 h-4" />
                                <span>Lumi 1 (AI)</span>
                                <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90 group-data-[collapsible=icon]:hidden" />
                            </SidebarMenuButton>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                            <SidebarMenuSub className="mr-0 pr-1 border-l-0 pl-1">
                                <SidebarMenu className="gap-1.5 mt-2">
                                    {menuItems.map((item) => {
                                        const Icon = item.icon;
                                        const isActive = location === item.url;
                                        return (
                                            <SidebarMenuItem key={item.title}>
                                                <SidebarMenuButton
                                                    tooltip={item.title}
                                                    onClick={() => handleNavigate(item.url)}
                                                    className="w-full hover:text-white data-[active=true]:text-white data-[active=true]:bg-primary/90"
                                                    isActive={isActive}
                                                >
                                                    <Icon className="w-4 h-4" />
                                                    <span>{item.title}</span>
                                                </SidebarMenuButton>
                                            </SidebarMenuItem>
                                        );
                                    })}
                                </SidebarMenu>
                            </SidebarMenuSub>
                        </CollapsibleContent>
                    </SidebarMenuItem>
                </Collapsible>
            </SidebarMenu>
        </SidebarGroup>
    )
}
