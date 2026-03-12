import { useState, useEffect, useRef, useCallback } from "react";
import { X, ExternalLink } from "lucide-react";
import AiChat from "@/pages/AiChat/AiChat";
import { useTheme } from "@/components/theme-provider";
import { useUser } from "@/hooks/use-user";
import { useLocation } from "wouter";
import { BASE_PATH } from "@/config/routes";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const DEFAULT_WIDTH = 360;
const DEFAULT_HEIGHT = 550;
const MIN_WIDTH = 320;
const MIN_HEIGHT = 400;

const FloatingChatButton = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [isMaximized, setIsMaximized] = useState(false);
    const [size, setSize] = useState({ width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT });
    const { theme } = useTheme();
    const { user, isLMSAdmin } = useUser();
    const [location, setLocation] = useLocation();
    const isDragging = useRef(false);
    const startPos = useRef({ x: 0, y: 0 });
    const startSize = useRef({ width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT });

    // Extract module name from URL if on learner module page
    // Route format: /modules/learner/:moduleName
    const getModuleNameFromUrl = () => {
        const match = location.match(/^\/modules\/learner\/([^/]+)/);
        return match ? match[1] : undefined;
    };

    const moduleName = getModuleNameFromUrl();

    // State to track if we should restore the session from a minimize action
    const [shouldRestoreSession, setShouldRestoreSession] = useState(false);

    const currentSize = useRef({ width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT });
    const dragDirection = useRef<'top' | 'left' | 'corner' | 'bottom' | 'right' | 'bottom-left'>('corner');

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!isDragging.current) return;
        e.preventDefault();

        const deltaX = startPos.current.x - e.clientX;
        const deltaY = startPos.current.y - e.clientY;

        const maxWidth = window.innerWidth - 30;
        const maxHeight = window.innerHeight - 100;

        const dir = dragDirection.current;
        let newWidth = startSize.current.width;
        let newHeight = startSize.current.height;

        // Top-left anchored directions (grow toward top-left)
        if (dir === 'top' || dir === 'corner') {
            newHeight = Math.max(MIN_HEIGHT, Math.min(maxHeight, startSize.current.height + deltaY));
        }
        if (dir === 'left' || dir === 'corner') {
            newWidth = Math.max(MIN_WIDTH, Math.min(maxWidth, startSize.current.width + deltaX));
        }

        // Bottom-left: width grows leftward (same as top-left), height grows downward (inverted)
        if (dir === 'bottom' || dir === 'bottom-left') {
            newHeight = Math.max(MIN_HEIGHT, Math.min(maxHeight, startSize.current.height - deltaY));
        }
        if (dir === 'bottom-left') {
            newWidth = Math.max(MIN_WIDTH, Math.min(maxWidth, startSize.current.width + deltaX));
        }

        currentSize.current = { width: newWidth, height: newHeight };
        setSize({ width: newWidth, height: newHeight });
    }, []);

    const handleMouseUp = useCallback(() => {
        if (isDragging.current) {
            // Check if width is more than half the screen, open in new window
            if (currentSize.current.width > window.innerWidth / 2) {
                setIsOpen(false);
                setShouldRestoreSession(false);
                // Reset size to default so it doesn't open huge next time
                setSize({ width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT });
                startSize.current = { width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT };
                setLocation(`${BASE_PATH}/ai`);
            }
        }
        isDragging.current = false;
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
    }, [handleMouseMove, setLocation]);

    const handleResizeStart = useCallback((e: React.MouseEvent, direction: 'top' | 'left' | 'corner' | 'bottom' | 'right' | 'bottom-left') => {
        e.preventDefault();
        e.stopPropagation();
        isDragging.current = true;
        dragDirection.current = direction;
        startPos.current = { x: e.clientX, y: e.clientY };
        startSize.current = { ...size };
        const cursorMap = { top: 'ns-resize', left: 'ew-resize', corner: 'nwse-resize', bottom: 'ns-resize', right: 'ew-resize', 'bottom-left': 'nesw-resize' };
        document.body.style.cursor = cursorMap[direction];
        document.body.style.userSelect = 'none';
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    }, [size, handleMouseMove, handleMouseUp]);

    const toggleMaximize = useCallback(() => {
        localStorage.setItem('novel_lms_return_path', location);
        setIsOpen(false);
        setShouldRestoreSession(false);
        setLocation(`${BASE_PATH}/ai`);
    }, [setLocation, location]);

    // Lock body scroll when chat is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }

        // Cleanup on unmount
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    // Cleanup drag listeners on unmount
    useEffect(() => {
        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [handleMouseMove, handleMouseUp]);

    // Listen for minimize event from full-screen window
    useEffect(() => {
        const channel = new BroadcastChannel('ai_chat_control');
        const handleMessage = (event: MessageEvent) => {
            if (event.data === 'restore_chat') {
                setIsOpen(true);
                setShouldRestoreSession(true);
            }
        };

        channel.addEventListener('message', handleMessage);

        // Also check localStorage for restore flag (from same-tab navigation)
        // We need to check this on location change because the component might not unmount/remount
        // when navigating to/from /ai route (it just returns null)
        if (localStorage.getItem('novel_lms_open_chat') === 'true') {
            setIsOpen(true);
            setShouldRestoreSession(true);
            localStorage.removeItem('novel_lms_open_chat');
        }

        return () => {
            channel.removeEventListener('message', handleMessage);
            channel.close();
        }
    }, [location]);

    // Only show for logged-in learners, not for admins or on login page
    // Also hide when on the /ai page (new window)
    if (!user || isLMSAdmin || location.startsWith('/ai')) {
        return null;
    }

    return (
        <>
            {/* Scoped Styles for the Robot - Using 'cb-' prefix to avoid conflicts */}
            <style>{`
                .cb-container {
                    cursor: pointer;
                    transition: transform 0.3s ease;
                    position: relative;
                }
                .cb-container:hover {
                    transform: scale(1.1);
                }

                .cb-robot {
                    position: relative;
                    animation: cb-float 3s ease-in-out infinite;
                }

                .cb-head {
                    width: 70px;
                    height: 48px;
                    background: #f0f0f0; /* White/Light Grey */
                    border-radius: 50% / 60% 60% 40% 40%; /* Oblong shape */
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    position: relative;
                    z-index: 10;
                    box-shadow: inset -2px -2px 6px rgba(0,0,0,0.1);
                }

                /* Visor (Black face area) */
                .cb-visor {
                    width: 58px;
                    height: 28px;
                    background: #222;
                    border-radius: 20px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 0 12px;
                    position: relative;
                    overflow: hidden;
                    box-shadow: 0 1px 2px rgba(255,255,255,0.2);
                }
                
                /* Glass Reflection on Visor */
                .cb-visor::after {
                    content: '';
                    position: absolute;
                    top: 0;
                    right: 10px;
                    width: 20px;
                    height: 100%;
                    background: linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 60%);
                    transform: skewX(-20deg);
                }

                /* Eyes */
                .cb-eye {
                    width: 6px;
                    height: 14px;
                    background: #00bcd4; /* Cyan/Teal */
                    border-radius: 3px;
                    animation: cb-blink 4s infinite;
                    box-shadow: 0 0 4px #00bcd4;
                }

                /* Body */
                .cb-body {
                    width: 44px;
                    height: 38px;
                    background: #f0f0f0;
                    border-radius: 10px 10px 22px 22px; /* Cup/Bowl shape */
                    margin: -5px auto 0; /* Tuck under head */
                    position: relative;
                    z-index: 5;
                    box-shadow: inset -2px -2px 5px rgba(0,0,0,0.05);
                }

                /* Arms */
                .cb-arm-left {
                    width: 14px;
                    height: 30px;
                    background: #f0f0f0;
                    border-radius: 50% 50% 40% 40% / 60% 60% 40% 40%; /* Slightly organic, tapered */
                    position: absolute;
                    top: 55px; 
                    left: -4px; 
                    transform: rotate(15deg) skewX(2deg); /* Skew helps create a slight visual bend */
                    box-shadow: inset -1px -1px 4px rgba(0,0,0,0.1); 
                    z-index: 4;
                }

                .cb-arm-right {
                    width: 14px;
                    height: 30px;
                    background: #f0f0f0;
                    border-radius: 40% 60% 60% 40% / 40% 60% 60% 40%; /* Organic curved shape */
                    position: absolute;
                    top: 35px; /* Raised higher for proper wave */
                    right: -8px;
                    transform-origin: bottom left;
                    box-shadow: inset -1px -1px 4px rgba(0,0,0,0.1);
                    z-index: 4;
                    animation: cb-wave 1.5s ease-in-out infinite;
                }

                /* Shadow */
                .cb-shadow {
                    width: 40px;
                    height: 8px;
                    background: rgba(0, 0, 0, 0.4);
                    border-radius: 50%;
                    margin: 8px auto 0;
                    animation: cb-shadow 3s ease-in-out infinite;
                }

                /* Animations - Renamed to avoid conflicts */
                @keyframes cb-float {
                    0% { transform: translateY(0); }
                    50% { transform: translateY(-7px); }
                    100% { transform: translateY(0); }
                }

                @keyframes cb-wave {
                    0%, 100% { transform: rotate(-15deg) skewX(-3deg); }
                    25% { transform: rotate(-35deg) skewX(-5deg); }
                    50% { transform: rotate(-15deg) skewX(-3deg); }
                    75% { transform: rotate(-35deg) skewX(-5deg); }
                }

                @keyframes cb-blink {
                    0%, 90%, 100% { transform: scaleY(1); }
                    95% { transform: scaleY(0.1); }
                }

                @keyframes cb-shadow {
                    0% { transform: scale(1); opacity: 0.25; }
                    50% { transform: scale(0.7); opacity: 0.15; }
                    100% { transform: scale(1); opacity: 0.25; }
                }
            `}</style>

            {/* Chat Panel */}
            {isOpen && (
                <div
                    className={`fixed z-50 shadow-2xl overflow-visible animate-in slide-in-from-bottom-5 fade-in duration-300 ${isMaximized
                        ? "inset-0 w-full h-full rounded-none m-0 bg-background/50 backdrop-blur-sm"
                        : "bottom-24 right-6 rounded-[18px]"
                        }`}
                    style={isMaximized ? {
                        transition: 'all 0.3s ease',
                    } : {
                        width: `${size.width}px`,
                        height: `${size.height}px`,
                        transition: isDragging.current ? 'none' : 'width 0.3s ease, height 0.3s ease',
                    }}
                >
                    {/* Resize Handle - Top Edge (height only) */}
                    {!isMaximized && (
                        <div
                            onMouseDown={(e) => handleResizeStart(e, 'top')}
                            className="absolute -top-1 left-4 right-4 h-2 z-[60] cursor-ns-resize"
                            title="Drag to resize height"
                        />
                    )}

                    {/* Resize Handle - Left Edge (width only) */}
                    {!isMaximized && (
                        <div
                            onMouseDown={(e) => handleResizeStart(e, 'left')}
                            className="absolute top-4 -left-1 w-2 bottom-4 z-[60] cursor-ew-resize"
                            title="Drag to resize width"
                        />
                    )}

                    {/* Resize Handle - Top Left Corner (both) */}
                    {!isMaximized && (
                        <div
                            onMouseDown={(e) => handleResizeStart(e, 'corner')}
                            className="absolute -top-1 -left-1 w-4 h-4 z-[61] cursor-nwse-resize group"
                            title="Drag to resize"
                        >
                            <div className="absolute top-1 left-1 w-2.5 h-2.5 border-t-2 border-l-2 border-teal-500/50 dark:border-teal-400/50 rounded-tl-sm group-hover:border-teal-500 dark:group-hover:border-teal-400 transition-colors" />
                        </div>
                    )}



                    {/* Resize Handle - Bottom Edge */}
                    {!isMaximized && (
                        <div
                            onMouseDown={(e) => handleResizeStart(e, 'bottom')}
                            className="absolute -bottom-1 left-4 right-4 h-2 z-[60] cursor-ns-resize"
                        />
                    )}

                    {/* Resize Handle - Right Edge */}
                    {!isMaximized && (
                        <div
                            onMouseDown={(e) => handleResizeStart(e, 'right')}
                            className="absolute top-4 -right-1 w-2 bottom-4 z-[60] cursor-ew-resize"
                        />
                    )}

                    {/* Resize Handle - Bottom Left Corner */}
                    {!isMaximized && (
                        <div
                            onMouseDown={(e) => handleResizeStart(e, 'bottom-left')}
                            className="absolute -bottom-1 -left-1 w-5 h-5 z-[61] cursor-nesw-resize group"
                            title="Drag to resize"
                        >
                            {/* Diagonal grip lines */}
                            <svg className="absolute bottom-1 left-1 w-3 h-3 text-teal-500/50 dark:text-teal-400/50 group-hover:text-teal-500 dark:group-hover:text-teal-400 transition-colors" viewBox="0 0 12 12">
                                <line x1="0" y1="0" x2="12" y2="12" stroke="currentColor" strokeWidth="1.5" />
                                <line x1="0" y1="4" x2="8" y2="12" stroke="currentColor" strokeWidth="1.5" />
                                <line x1="0" y1="8" x2="4" y2="12" stroke="currentColor" strokeWidth="1.5" />
                            </svg>
                        </div>
                    )}

                    <div className="w-full h-full overflow-hidden rounded-[18px]">
                        <AiChat
                            initialModuleName={moduleName}
                            isFloating={true}
                            shouldRestoreSession={shouldRestoreSession}
                            extraHeaderButtons={
                                <TooltipProvider delayDuration={300}>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); toggleMaximize(); }}
                                                className="p-1.5 rounded-xl bg-teal-900/10 dark:bg-teal-100/10 hover:bg-[#018790] dark:hover:bg-teal-100/20 hover:text-[#d6ecec] dark:hover:text-teal-100 backdrop-blur-md border border-[#018790] dark:border-teal-100/10 text-[#018790] dark:text-teal-100 shadow-sm transition-all duration-300 hover:scale-105 active:scale-95"
                                            >
                                                {isMaximized ? (
                                                    <svg
                                                        xmlns="http://www.w3.org/2000/svg"
                                                        width="20"
                                                        height="20"
                                                        viewBox="0 0 24 24"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        strokeWidth="2.5"
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        className="w-4 h-4"
                                                    >
                                                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                                                        <line x1="21" y1="3" x2="10" y2="14" />
                                                        <polyline points="10 9 10 14 15 14" />
                                                    </svg>
                                                ) : (
                                                    <ExternalLink className="w-4 h-4" strokeWidth={2.5} />
                                                )}
                                            </button>
                                        </TooltipTrigger>
                                        <TooltipContent side="bottom" className="bg-[#018790] text-white border-0 rounded-lg shadow-lg text-xs px-2.5 py-1.5">
                                            Open in Full Screen
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            }
                        />
                    </div>
                </div>
            )}

            {/* Clickable Robot Button Area */}
            <div
                className={`fixed bottom-6 right-6 z-50 flex flex-col items-center justify-center ${isOpen && isMaximized ? 'hidden' : ''}`}
                onClick={() => setIsOpen(!isOpen)}
                role="button"
                aria-label="Open AI Chat"
            >
                {isOpen ? (
                    // When open, show a close button with matching gradient style
                    <div className="w-14 h-14 rounded-3xl flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer text-white" style={{ backgroundColor: '#018790' }}>
                        <X className="w-7 h-7" strokeWidth={2.5} />
                    </div>
                ) : (
                    // When closed, show the CSS Robot inside a circular frame
                    <div
                        className="relative flex items-center justify-center w-14 h-14 bg-[#018790] dark:bg-[#016b73] rounded-full shadow-lg border-2 border-[#01a8a8] dark:border-[#018790] overflow-hidden hover:scale-110 transition-transform duration-300 cursor-pointer"
                        style={{ boxShadow: theme === 'dark' ? '0 4px 12px rgba(1, 135, 144, 0.6), inset 0 0 10px rgba(255,255,255,0.15)' : '0 4px 16px rgba(1, 135, 144, 0.5), inset 0 0 12px rgba(255,255,255,0.2)' }}
                    >
                        {/* Scale down the entire robot to fit the frame */}
                        <div className="transform scale-[0.45] translate-y-1">
                            <div className="cb-container">
                                <div className="cb-robot">
                                    <div className="cb-head">
                                        <div className="cb-visor">
                                            <span className="cb-eye" />
                                            <span className="cb-eye" />
                                        </div>
                                    </div>

                                    <div className="cb-arm-left" />
                                    <div className="cb-arm-right" />

                                    <div className="cb-body" />
                                    <div className="cb-shadow" />
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
};

export default FloatingChatButton;