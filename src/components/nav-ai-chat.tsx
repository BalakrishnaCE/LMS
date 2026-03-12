import * as React from "react"
import { MessageSquarePlus, History, Search, Bot, ChevronRight } from "lucide-react"
import { useLocation } from "wouter"
import { navigate } from "wouter/use-browser-location"
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
import { getFullPath, ROUTES } from "@/config/routes"
import { useUser } from "@/hooks/use-user"

interface ChatSession {
    id: string;
    title: string;
    timestamp: Date;
}

export function NavAiChat() {
    const [location] = useLocation();
    const { user } = useUser();
    const { state } = useSidebar();
    const [chatSessions, setChatSessions] = React.useState<ChatSession[]>([]);
    const [isSearchOpen, setIsSearchOpen] = React.useState(false);
    const [searchQuery, setSearchQuery] = React.useState("");
    const isCollapsed = state === "collapsed";

    const fetchChats = React.useCallback(async () => {
        if (!user) return;
        try {
            const response = await fetch('/api/method/novel_lms.novel_lms.api.Chat.get_user_chats');
            const data = await response.json();
            if (data.message) {
                const sessions = data.message.map((c: any) => {
                    // Priority: (1) DB title, (2) localStorage cache,
                    // (3) human-readable dept/module/lesson names, (4) generic label
                    const localTitle = localStorage.getItem(`novel_lms_chat_title_${c.name}`);
                    const fallbackTitle =
                        [c.department_name || c.department, c.module_name || c.module, c.lesson_name || c.lesson]
                            .filter(Boolean).join(' - ') ||
                        'New Conversation';
                    return {
                        id: c.name,
                        title: c.title || localTitle || fallbackTitle,
                        timestamp: new Date(c.modified)
                    };
                });
                setChatSessions(sessions);
            }
        } catch (error) {
            console.error("Failed to fetch chats", error);
        }
    }, [user]);

    React.useEffect(() => {
        fetchChats();
        const interval = setInterval(fetchChats, 60000);
        return () => clearInterval(interval);
    }, [fetchChats]);
    const [isOpen, setIsOpen] = React.useState(location.includes(ROUTES.AI_CHAT));

    React.useEffect(() => {
        if (location.includes(ROUTES.AI_CHAT)) {
            setIsOpen(true);
        }
    }, [location]);

    const handleNewChat = () => {
        localStorage.setItem('novel_lms_return_path', location);
        localStorage.removeItem('novel_lms_ai_chat_state');
        navigate(`${getFullPath(ROUTES.AI_CHAT)}?new=${Date.now()}`);
    };

    const handleSelectChat = (id: string) => {
        localStorage.setItem('novel_lms_return_path', location);
        navigate(getFullPath(`${ROUTES.AI_CHAT}/${id}`));
    };

    const filteredSessions = chatSessions.filter(session =>
        session.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const currentChatId = location.split('/').pop();
    const isAiPage = location.includes(ROUTES.AI_CHAT);

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
                                tooltip="AI Chat"
                                className="hover:text-white data-[active=true]:text-white data-[active=true]:bg-primary/90"
                                onClick={() => {
                                    if (!isOpen) {
                                        handleNewChat();
                                    }
                                }}
                                isActive={isAiPage && (!currentChatId || currentChatId === 'ai')}
                            >
                                <Bot className="w-4 h-4" />
                                <span>AI Chat</span>
                                <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90 group-data-[collapsible=icon]:hidden" />
                            </SidebarMenuButton>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                            <SidebarMenuSub className="mr-0 pr-1 border-l-0 pl-1">
                                <SidebarMenu className="gap-1.5 mt-2">
                                    <SidebarMenuItem>
                                        <SidebarMenuButton
                                            tooltip="New Chat"
                                            onClick={handleNewChat}
                                            className="w-full hover:text-white data-[active=true]:text-white data-[active=true]:bg-primary/90"
                                            isActive={isAiPage && (!currentChatId || currentChatId === 'ai')}
                                        >
                                            <MessageSquarePlus className="w-4 h-4" />
                                            <span>New Chat</span>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>

                                    <SidebarMenuItem>
                                        <SidebarMenuButton
                                            tooltip="Search"
                                            className="w-full hover:text-white data-[active=true]:text-white data-[active=true]:bg-primary/90"
                                            onClick={() => {
                                                setIsSearchOpen(!isSearchOpen);
                                                if (!isSearchOpen) setTimeout(() => document.getElementById('ai-chat-search')?.focus(), 100);
                                            }}
                                            isActive={isSearchOpen}
                                        >
                                            <Search className="w-4 h-4" />
                                            <span>Search</span>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>

                                    {isSearchOpen && (
                                        <SidebarMenuItem>
                                            <input
                                                id="ai-chat-search"
                                                type="text"
                                                placeholder="Search history..."
                                                className="w-full h-8 px-2 text-xs bg-background border rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                            />
                                        </SidebarMenuItem>
                                    )}
                                </SidebarMenu>

                                {!isCollapsed && (
                                    <div className="mt-6">
                                        <div className="flex items-center justify-between px-1 mb-3">
                                            <h3 className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-widest">
                                                {searchQuery ? 'Search Results' : 'Recent'}
                                            </h3>
                                        </div>
                                        {filteredSessions.length > 0 ? (
                                            <SidebarMenu className="gap-0.5">
                                                {filteredSessions.slice(0, searchQuery ? 20 : 10).map((session) => (
                                                    <SidebarMenuItem key={session.id}>
                                                        <SidebarMenuButton
                                                            onClick={() => handleSelectChat(session.id)}
                                                            className="w-full hover:text-white data-[active=true]:text-white data-[active=true]:bg-primary/90"
                                                            isActive={currentChatId === session.id}
                                                            tooltip={session.title}
                                                        >
                                                            <History className="w-3.5 h-3.5 shrink-0" />
                                                            <span className={`truncate ${currentChatId === session.id ? 'font-semibold' : ''}`}>{session.title}</span>
                                                        </SidebarMenuButton>
                                                    </SidebarMenuItem>
                                                ))}
                                            </SidebarMenu>
                                        ) : (
                                            <div className="px-1 py-3 border border-dashed border-muted-foreground/10 rounded-lg bg-muted/5">
                                                <p className="text-[10px] text-muted-foreground/50 text-center italic font-medium tracking-wide">No recent conversations</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </SidebarMenuSub>
                        </CollapsibleContent>
                    </SidebarMenuItem>
                </Collapsible>
            </SidebarMenu>
        </SidebarGroup>
    )
}
