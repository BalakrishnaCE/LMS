import { useRoute, useLocation, useSearch } from "wouter";
import AiChat from "./AiChat";
import { useUser } from "@/hooks/use-user";

const AiChatPage = () => {
    const [location, setLocation] = useLocation();
    const search = useSearch();
    const { user, isLMSAdmin } = useUser();
    // chatId is optional in the route
    const [, params] = useRoute("/ai/:chatId?");
    const chatId = params?.chatId;

    return (
        <div className="h-full overflow-hidden bg-background flex flex-col">
            <div className="flex-1 overflow-hidden relative">
                <AiChat
                    key={location + search}
                    initialChatId={chatId}
                    onMinimize={() => {
                        localStorage.setItem('novel_lms_open_chat', 'true');

                        // Try to go back to the saved return path
                        const returnPath = localStorage.getItem('novel_lms_return_path');
                        if (returnPath && returnPath !== location && !returnPath.includes('/ai')) {
                            setLocation(returnPath);
                        } else {
                            // Fallback based on role if no valid return path
                            if (isLMSAdmin) {
                                setLocation("/");
                            } else {
                                setLocation("/learner-dashboard");
                            }
                        }
                    }}
                />
            </div>
        </div>
    );
};

export default AiChatPage;
