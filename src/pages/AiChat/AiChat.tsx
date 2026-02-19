import * as React from "react";
import { useState, useRef, useEffect, memo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Bot, Loader2, ChevronRight, Copy, Check, Info, Minimize2, Plus, ArrowLeft } from 'lucide-react';
import CssRobot from "@/components/CssRobot";
import "./AIchat.css";
import { useUser } from "@/hooks/use-user";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { Textarea } from "@/components/ui/textarea";

// API Base URL (via Nginx proxy)
const API_BASE_URL = "http://10.80.4.84:8090/chatbot";

type ConversationStep = 'department' | 'module' | 'lesson' | 'chapter' | 'qa';

interface Department {
    id: string;
    name: string;
    label: string;
    value: string;
}

interface Module {
    id: string;
    name: string;
    description: string;
    label: string;
    value: string;
}

interface Lesson {
    id: string;
    name: string;
    description: string;
    order: number;
    label: string;
    value: string;
}

interface Chapter {
    id: string;
    name: string;
    description: string;
    label: string;
    value: string;
}

interface Message {
    id: string;
    text: string;
    sender: 'user' | 'ai';
    timestamp: Date;
}

interface ChatContext {
    department?: Department;
    module?: Module;
    lesson?: Lesson;
    chapter?: Chapter;
}

const formatMessageText = (text: string) => {
    const formatInline = (str: string, lineIndex: number) => {
        const parts: React.ReactNode[] = [];
        let currentIndex = 0;
        const regex = /(\*\*.*?\*\*|\[Source:.*?\])/g;
        let match;

        while ((match = regex.exec(str)) !== null) {
            if (match.index > currentIndex) {
                parts.push(str.substring(currentIndex, match.index));
            }
            const matchedText = match[0];
            if (matchedText.startsWith('**') && matchedText.endsWith('**')) {
                parts.push(<strong key={`${lineIndex}-${match.index}`}>{matchedText.slice(2, -2)}</strong>);
            } else if (matchedText.startsWith('[Source:')) {
                parts.push(<em key={`${lineIndex}-${match.index}`} className="text-xs opacity-80">{matchedText}</em>);
            }
            currentIndex = match.index + matchedText.length;
        }
        if (currentIndex < str.length) {
            parts.push(str.substring(currentIndex));
        }
        return parts.length > 0 ? parts : str;
    };

    const formattedText = text.replace(/([^\n])\s*(###)/g, '$1\n$2');

    const lines = formattedText.split('\n');
    return lines.map((line, index) => {
        const trimmed = line.trim();
        if (trimmed.startsWith('###')) {
            const headingText = line.replace(/^###\s*/, '');
            return (
                <h3 key={index} className="messageHeading">
                    {formatInline(headingText, index)}
                </h3>
            );
        }

        if (trimmed === '') {
            return <div key={index} className="messageSpacer" />;
        }

        return (
            <div key={index} className="messageParagraph">
                {formatInline(line, index)}
            </div>
        );
    });
};

const MessageBubble = memo(({ message, onCopy, copiedId }: { message: Message, onCopy: (text: string, id: string) => void, copiedId: string | null }) => {
    return (
        <div className={`flex w-full ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex flex-col max-w-[80%] ${message.sender === 'user' ? 'items-end' : 'items-start'}`}>
                {message.sender === 'ai' && (
                    <span className="text-[10px] text-muted-foreground mb-1 px-1">
                        AI • {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                )}
                {message.sender === 'user' && (
                    <span className="text-[10px] text-muted-foreground mb-1 px-1">
                        You • {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                )}
                <div className="relative mb-2">
                    <div className={`chat-bubble ${message.sender === 'user' ? 'chat-bubble-user' : 'chat-bubble-ai'}`}>
                        <div className="text-sm leading-relaxed break-words whitespace-pre-wrap">
                            {formatMessageText(message.text)}
                        </div>
                    </div>
                </div>
                {message.sender === 'ai' && (
                    <div className="flex items-center gap-1 mt-1 px-1">
                        <button
                            onClick={() => onCopy(message.text, message.id)}
                            className="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                        >
                            {copiedId === message.id ? (
                                <Check className="h-3.5 w-3.5" />
                            ) : (
                                <Copy className="h-3.5 w-3.5" />
                            )}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
});
MessageBubble.displayName = "MessageBubble";

const AiChat = ({ initialModuleName, initialChatId, sidebarControl, isFloating = false, onMinimize, extraHeaderButtons, shouldRestoreSession = false }: { initialModuleName?: string; initialChatId?: string; sidebarControl?: React.ReactNode; isFloating?: boolean; onMinimize?: () => void; extraHeaderButtons?: React.ReactNode; shouldRestoreSession?: boolean }) => {
    const { user, isLoading: isUserLoading } = useUser();
    const scrollRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Conversation state
    const [currentStep, setCurrentStep] = useState<ConversationStep>('department');
    const [context, setContext] = useState<ChatContext>({});

    // Dropdown expansion state

    // Data state
    const [departments, setDepartments] = useState<Department[]>([]);
    const [modules, setModules] = useState<Module[]>([]);
    const [lessons, setLessons] = useState<Lesson[]>([]);
    const [chapters, setChapters] = useState<Chapter[]>([]);

    // Chat state (for Q&A mode)
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [chatId, setChatId] = useState<string | null>(null);

    // Fetch user departments on mount
    useEffect(() => {
        // Wait for user to be loaded before fetching departments
        if (!isUserLoading) {
            fetchUserDepartments();
        }
    }, [isUserLoading]);

    // Initial Context Resolution
    const resolveModuleContext = async (moduleName: string) => {
        console.log("AiChat: Resolving context for module:", moduleName);
        try {
            setIsLoading(true);
            const response = await fetch(`/api/method/novel_lms.novel_lms.api.ai_chat_helper.get_module_context?module_id=${moduleName}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            console.log("AiChat: API Response status:", response.status);

            if (!response.ok) {
                console.error("Failed to fetch module context");
                return;
            }

            const data = await response.json();
            console.log("AiChat: API Data:", data);
            const result = data.message;

            if (result && result.department && result.module) {
                // If backend identified a current lesson (user is viewing it or it's in progress)
                if (result.current_lesson) {
                    setContext({
                        department: result.department,
                        module: result.module,
                        lesson: result.current_lesson
                    });
                    // Skip to QA immediately
                    setCurrentStep('qa');
                    // Set a context-aware greeting
                    setMessages([{
                        id: '1',
                        text: `Hi ${user?.full_name || user?.name || 'Learner'}! I see you're currently working on the module "${result.module.name}". How can I help you with it?`,
                        sender: 'ai',
                        timestamp: new Date()
                    }]);
                } else {
                    // Fallback to Lesson Selection if no specific lesson is active
                    setContext({
                        department: result.department,
                        module: result.module
                    });
                    await fetchModuleLessons(result.module.id);
                    setCurrentStep('lesson');
                }
            }
        } catch (error) {
            console.error('Error resolving module context:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // Initial Context Resolution & Persistence
    useEffect(() => {
        const STORAGE_KEY = 'novel_lms_ai_chat_state';

        // Helper to load state
        const loadState = () => {
            try {
                const stored = localStorage.getItem(STORAGE_KEY);
                if (stored) {
                    const parsed = JSON.parse(stored);
                    const isRecent = (Date.now() - parsed.timestamp) < 60 * 60 * 1000; // 1 hour expiration

                    // Only restore if valid and recent
                    if (isRecent) {
                        return parsed; // restoration successful
                    }
                }
            } catch (e) {
                console.error("Failed to load chat state", e);
            }
            return null;
        };

        const loadChatFromId = async (id: string) => {
            setIsLoading(true);
            try {
                const response = await fetch(`/api/method/novel_lms.novel_lms.api.Chat.get_chat?chat_id=${id}`);
                const data = await response.json();
                const chat = data.message;

                if (chat) {
                    // Reconstruct Messages
                    const loadedMessages: Message[] = [];

                    // Add context-aware greeting as first message if needed, or rely on history
                    // For now let's just use the history

                    if (chat.query_responses && Array.isArray(chat.query_responses)) {
                        chat.query_responses.forEach((qr: any, idx: number) => {
                            loadedMessages.push({
                                id: `q-${idx}`,
                                text: qr.context,
                                sender: 'user',
                                timestamp: new Date(qr.time_stamp || qr.modified)
                            });
                            loadedMessages.push({
                                id: `r-${idx}`,
                                text: qr.response,
                                sender: 'ai',
                                timestamp: new Date(qr.time_stamp || qr.modified) // or add small offset?
                            });
                        });
                    }

                    setMessages(loadedMessages);
                    setChatId(chat.name);

                    // Reconstruct Context
                    const newContext: ChatContext = {};
                    if (chat.department) newContext.department = { id: chat.department, name: chat.department, label: chat.department, value: chat.department };
                    if (chat.module) newContext.module = { id: chat.module, name: chat.module, description: '', label: chat.module, value: chat.module };
                    if (chat.lesson) newContext.lesson = { id: chat.lesson, name: chat.lesson, description: '', order: 0, label: chat.lesson, value: chat.lesson };
                    if (chat.chapter) newContext.chapter = { id: chat.chapter, name: chat.chapter, description: '', label: chat.chapter, value: chat.chapter };

                    setContext(newContext);
                    setCurrentStep('qa');
                }
            } catch (e) {
                console.error("Failed to load chat history", e);
            } finally {
                setIsLoading(false);
            }
        };

        // If no initial module is changing our context, try to restore
        // This runs on mount or user load
        if (!isUserLoading) {
            let restored = false;

            // Priority 0: Forced restore
            if (shouldRestoreSession) {
                const restoredState = loadState();
                if (restoredState) {
                    if (restoredState.context) setContext(restoredState.context);
                    if (restoredState.currentStep) setCurrentStep(restoredState.currentStep);
                    if (restoredState.messages) {
                        const restoredMessages = restoredState.messages.map((m: any) => ({
                            ...m,
                            timestamp: new Date(m.timestamp)
                        }));
                        setMessages(restoredMessages);
                    }
                    if (restoredState.chatId) setChatId(restoredState.chatId);

                    if (restoredState.chatId) setChatId(restoredState.chatId);
                    if (restoredState.inputValue) setInputValue(restoredState.inputValue);

                    // Restore hierarchies so 'Back' navigation works
                    // We fetch all levels that we have context for
                    if (restoredState.context?.department) {
                        fetchDepartmentModules(restoredState.context.department.id);
                    }
                    if (restoredState.context?.module) {
                        fetchModuleLessons(restoredState.context.module.id);
                    }
                    if (restoredState.context?.lesson) {
                        fetchLessonChapters(restoredState.context.lesson.id);
                    }
                    restored = true;
                }
            }

            if (!restored) {
                // Priority 1: Load specific chat ID if requested
                if (initialChatId) {
                    loadChatFromId(initialChatId);
                }
                // Priority 2: explicitly passed module (e.g. from learner page) overwrites context
                else if (initialModuleName) {
                    resolveModuleContext(initialModuleName);
                } else {
                    // Priority 3: Restore previous session if available
                    const restoredState = loadState();

                    if (restoredState) {
                        if (restoredState.context) setContext(restoredState.context);
                        if (restoredState.currentStep) setCurrentStep(restoredState.currentStep);
                        if (restoredState.messages) {
                            const restoredMessages = restoredState.messages.map((m: any) => ({
                                ...m,
                                timestamp: new Date(m.timestamp)
                            }));
                            setMessages(restoredMessages);
                        }
                        if (restoredState.chatId) setChatId(restoredState.chatId);

                        if (restoredState.chatId) setChatId(restoredState.chatId);
                        if (restoredState.inputValue) setInputValue(restoredState.inputValue);

                        // Restore hierarchies so 'Back' navigation works
                        if (restoredState.context?.department) {
                            fetchDepartmentModules(restoredState.context.department.id);
                        }
                        if (restoredState.context?.module) {
                            fetchModuleLessons(restoredState.context.module.id);
                        }
                        if (restoredState.context?.lesson) {
                            fetchLessonChapters(restoredState.context.lesson.id);
                        }
                    } else {
                        // Default / clean slate if persistence didn't work
                        // (State is already default via useState)
                    }
                }
            }
        }
    }, [initialModuleName, initialChatId, isUserLoading, shouldRestoreSession]);

    // Save state whenever it changes
    // Save state whenever it changes (Debounced)
    // Save state helper
    const saveState = () => {
        const STORAGE_KEY = 'novel_lms_ai_chat_state';

        // Don't save empty states that would overwrite useful history
        if (currentStep === 'department' && messages.length === 0 && !context.department && !inputValue) {
            return;
        }

        const stateToSave = {
            timestamp: Date.now(),
            context,
            currentStep,
            messages,
            chatId,
            inputValue // Save typing state
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
    };

    // Save state whenever it changes (Debounced)
    useEffect(() => {
        const saveHandler = setTimeout(() => {
            saveState();
        }, 500); // 500ms debounce

        return () => clearTimeout(saveHandler);
    }, [context, currentStep, messages, inputValue, chatId]);



    // Auto-scroll to bottom when messages change
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages, currentStep]);

    // Auto-focus input when in QA mode and not loading
    useEffect(() => {
        if (currentStep === 'qa' && !isLoading) {
            // Short timeout to ensure DOM is ready and transitions are settled
            const timer = setTimeout(() => {
                textareaRef.current?.focus();
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [currentStep, isLoading]);

    const fetchUserDepartments = async () => {
        try {
            setIsLoading(true);
            const response = await fetch('/api/method/novel_lms.novel_lms.api.ai_chat_helper.get_user_departments', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error('Failed to fetch departments');
            }

            const data = await response.json();
            // const allOption: Department = { id: 'all', name: 'All Departments', label: 'All Departments', value: 'all' };
            setDepartments([...(data.message || [])]);
        } catch (error) {
            console.error('Error fetching departments:', error);
            // const allOption: Department = { id: 'all', name: 'All Departments', label: 'All Departments', value: 'all' };
            setDepartments([]);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchDepartmentModules = async (departmentId: string) => {
        try {
            setIsLoading(true);
            const response = await fetch(`/api/method/novel_lms.novel_lms.api.ai_chat_helper.get_department_modules?department_id=${departmentId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error('Failed to fetch modules');
            }

            const data = await response.json();
            const allOption: Module = { id: 'all', name: 'All Modules', description: '', label: 'All Modules', value: 'all' };
            const filteredModules = (data.message || []).filter((m: Module) =>
                !m.name.toLowerCase().includes('test') && !m.name.toLowerCase().includes('quiz')
            );
            setModules([allOption, ...filteredModules]);
        } catch (error) {
            console.error('Error fetching modules:', error);
            setModules([]);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchModuleLessons = async (moduleId: string) => {
        try {
            setIsLoading(true);
            const response = await fetch(`/api/method/novel_lms.novel_lms.api.ai_chat_helper.get_module_lessons?module_id=${moduleId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error('Failed to fetch lessons');
            }

            const data = await response.json();
            const allOption: Lesson = { id: 'all', name: 'All Lessons', description: '', order: 0, label: 'All Lessons', value: 'all' };
            const filteredLessons = (data.message || []).filter((l: Lesson) =>
                !l.name.toLowerCase().includes('test') && !l.name.toLowerCase().includes('quiz')
            );
            setLessons([allOption, ...filteredLessons]);
        } catch (error) {
            console.error('Error fetching lessons:', error);
            setLessons([]);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchLessonChapters = async (lessonId: string): Promise<Chapter[]> => {
        try {
            setIsLoading(true);
            const response = await fetch(`/api/method/novel_lms.novel_lms.api.ai_chat_helper.get_lesson_chapters?lesson_id=${lessonId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error('Failed to fetch chapters');
            }

            const data = await response.json();
            const fetchedChapters: Chapter[] = data.message || [];

            const allOption: Chapter = { id: 'all', name: 'All Chapters', description: '', label: 'All Chapters', value: 'all' };
            const finalChapters = [allOption, ...fetchedChapters];
            setChapters(finalChapters);
            return finalChapters;
        } catch (error) {
            console.error('Error fetching chapters:', error);
            setChapters([]);
            return [];
        } finally {
            setIsLoading(false);
        }
    };

    const handleDepartmentSelect = async (dept: Department) => {
        setContext({ department: dept });
        // setIsDepartmentExpanded(false); // REMOVED

        if (dept.id === 'all') {
            setCurrentStep('qa');
            setMessages([{
                id: '1',
                text: `Hi ${user?.full_name || user?.name || 'Learner'}! How can I help you today?`,
                sender: 'ai',
                timestamp: new Date()
            }]);
        } else {
            await fetchDepartmentModules(dept.id);
            setCurrentStep('module');
            // setIsModuleExpanded(false); // REMOVED
        }
    };

    const handleModuleSelect = async (mod: Module) => {
        setContext(prev => ({ ...prev, module: mod }));

        if (mod.id === 'all') {
            setCurrentStep('qa');
            setMessages([{
                id: '1',
                text: `Hi ${user?.full_name || user?.name || 'Learner'}! I see you're exploring the "${context.department?.name}" department. How can I help you with it?`,
                sender: 'ai',
                timestamp: new Date()
            }]);
        } else {
            await fetchModuleLessons(mod.id);
            setCurrentStep('lesson');
        }
    };

    const handleLessonSelect = async (lesson: Lesson) => {
        setContext(prev => ({ ...prev, lesson }));

        if (lesson.id === 'all') {
            setCurrentStep('qa');
            const lessonContextName = "this module";

            setMessages([{
                id: '1',
                text: `Hi ${user?.full_name || user?.name || 'Learner'}! I see you're currently working on ${lessonContextName}. How can I help you with it?`,
                sender: 'ai',
                timestamp: new Date()
            }]);
        } else {
            const fetchedChapters = await fetchLessonChapters(lesson.id);
            if (fetchedChapters.length > 0) {
                setCurrentStep('chapter');
            } else {
                // No chapters, define greeting and go to QA
                setCurrentStep('qa');
                setMessages([{
                    id: '1',
                    text: `Hi ${user?.full_name || user?.name || 'Learner'}! I see you're currently working on the lesson "${lesson.name}". How can I help you with it?`,
                    sender: 'ai',
                    timestamp: new Date()
                }]);
            }
        }
    };

    const handleChapterSelect = (chapter: Chapter) => {
        setContext(prev => ({ ...prev, chapter }));
        setCurrentStep('qa');

        const contextName = chapter.id === 'all'
            ? `the lesson "${context.lesson?.name}"`
            : `the chapter "${chapter.name}"`;

        setMessages([{
            id: '1',
            text: `Hi ${user?.full_name || user?.name || 'Learner'}! I see you're currently working on ${contextName}. How can I help you with it?`,
            sender: 'ai',
            timestamp: new Date()
        }]);
    };

    const sendQueryToAPI = async (query: string): Promise<string> => {
        const response = await fetch(`${API_BASE_URL}/query`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                department: context.department?.name || '',
                module: context.module?.name || '',
                lesson: context.lesson?.name || '',
                chapter: context.chapter?.name || '',
                query: query,
            }),
        });

        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();
        return data.response;
    };

    const createChatSession = async (): Promise<string | null> => {
        try {
            const response = await fetch('/api/method/novel_lms.novel_lms.api.Chat.create_chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    department: context.department?.id !== 'all' ? context.department?.id : undefined,
                    module: context.module?.id !== 'all' ? context.module?.id : undefined,
                    lesson: context.lesson?.id !== 'all' ? context.lesson?.id : undefined,
                    chapter: context.chapter?.id !== 'all' ? context.chapter?.id : undefined
                })
            });
            const data = await response.json();
            if (data.message?.status === 'success') {
                return data.message.chat_id;
            }
        } catch (error) {
            console.error("Failed to create chat session:", error);
        }
        return null;
    };

    const saveQueryResponse = async (cId: string, query: string, responseVal: string) => {
        try {
            await fetch('/api/method/novel_lms.novel_lms.api.Chat.add_query_response', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: cId,
                    query: query,
                    response: responseVal
                })
            });
        } catch (error) {
            console.error("Failed to save query response:", error);
        }
    };

    const handleSendMessage = async () => {
        if (!inputValue.trim() || isLoading) return;

        const userQuery = inputValue.trim();
        const newMessage: Message = {
            id: Date.now().toString(),
            text: userQuery,
            sender: 'user',
            timestamp: new Date()
        };

        setMessages(prev => [...prev, newMessage]);
        setInputValue("");

        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
        }

        setIsLoading(true);
        try {
            const aiResponseText = await sendQueryToAPI(userQuery);

            // Handle persistence
            let currentChatId = chatId;
            if (!currentChatId) {
                currentChatId = await createChatSession();
                if (currentChatId) setChatId(currentChatId);
            }

            if (currentChatId) {
                // Don't await this to keep UI snappy
                saveQueryResponse(currentChatId, userQuery, aiResponseText);
            }

            const aiResponse: Message = {
                id: (Date.now() + 1).toString(),
                text: aiResponseText,
                sender: 'ai',
                timestamp: new Date()
            };
            setMessages(prev => [...prev, aiResponse]);
        } catch (error) {
            console.error('API Error:', error);
            const errorMessage: Message = {
                id: (Date.now() + 1).toString(),
                text: "Sorry, I encountered an error while processing your request. Please try again.",
                sender: 'ai',
                timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const handleCopy = useCallback(async (text: string, id: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedId(id);
            setTimeout(() => setCopiedId(null), 2000);
        } catch (err) {
            console.error("Copy failed:", err);
            // Fallback for older browsers or if api is denied
            try {
                const textArea = document.createElement("textarea");
                textArea.value = text;
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
                setCopiedId(id);
                setTimeout(() => setCopiedId(null), 2000);
            } catch (fallbackErr) {
                console.error("Fallback copy failed:", fallbackErr);
            }
        }
    }, []);

    const handleReset = () => {
        // Clear state
        setContext({});
        setCurrentStep('department');
        setMessages([]);
        setInputValue("");
        setChatId(null);

        // Clear localStorage
        localStorage.removeItem('novel_lms_ai_chat_state');

        // Refetch departments if needed (though they should be loaded)
        if (departments.length === 0) {
            fetchUserDepartments();
        }
    };


    const handleBack = () => {
        if (currentStep === 'module') {
            setCurrentStep('department');
            setContext(prev => ({ ...prev, module: undefined }));
        } else if (currentStep === 'lesson') {
            setCurrentStep('module');
            setContext(prev => ({ ...prev, lesson: undefined }));
        } else if (currentStep === 'chapter') {
            setCurrentStep('lesson');
            setContext(prev => ({ ...prev, chapter: undefined }));
        } else if (currentStep === 'qa') {
            setCurrentStep('chapter');
            setContext(prev => ({ ...prev, chapter: undefined }));
            setMessages([]);
        }
    };



    const renderGreeting = (): React.ReactNode => {
        switch (currentStep) {
            case 'department':
            case 'department':
                return (
                    <div className="greeting-wrapper">
                        <div className="greeting-card">

                            {/* Card Header Content */}
                            <div className="greeting-content">
                                {/* Header - clickable */}
                                <div className="greeting-header">
                                    <div className="greeting-header-inner">
                                        <div className="greeting-title-wrapper">
                                            <div className="greeting-title-row">
                                                <div className="bot-icon-wrapper">
                                                    <Bot className="w-5 h-5" />
                                                </div>
                                                <h3 className="greeting-title">
                                                    Hi {user?.full_name || 'there'}!
                                                </h3>
                                            </div>
                                            <p className="greeting-subtitle">
                                                Please select department to start conversation
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Dropdown Options - Always Show */}
                                <div className="options-container">
                                    {isLoading ? (
                                        <div className="state-container">
                                            <Loader2 className="spinner" />
                                        </div>
                                    ) : departments.length === 0 ? (
                                        <div className="empty-message">
                                            No departments assigned to you yet.
                                        </div>
                                    ) : (
                                        <div className="options-list">
                                            {departments.map((dept) => (
                                                <button
                                                    key={dept.id}
                                                    onClick={() => handleDepartmentSelect(dept)}
                                                    className="option-button group"
                                                >
                                                    <span>{dept.name}</span>
                                                    <ChevronRight className="option-icon" />
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                );

            case 'module':
            case 'module':
                return (
                    <div className="greeting-wrapper">
                        <div className="greeting-card">

                            {/* Content */}
                            <div className="greeting-content">
                                {/* Header - clickable */}
                                <div className="greeting-header">
                                    <div className="greeting-header-inner">
                                        <div className="greeting-title-wrapper">
                                            <div className="greeting-title-row">
                                                <div className="bot-icon-wrapper">
                                                    <Bot className="w-5 h-5" />
                                                </div>
                                                <h3 className="greeting-title">
                                                    Hi I'm your {context.department?.name} Assistant!
                                                </h3>
                                            </div>
                                            <p className="greeting-subtitle">
                                                Please select Module to start conversation
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Dropdown Options - Always Show */}
                                <div className="options-container">
                                    {isLoading ? (
                                        <div className="state-container">
                                            <Loader2 className="spinner" />
                                        </div>
                                    ) : modules.length === 0 ? (
                                        <div className="empty-message">
                                            No modules available in this department.
                                        </div>
                                    ) : (
                                        <div className="options-list">
                                            {modules.map((mod) => (
                                                <button
                                                    key={mod.id}
                                                    onClick={() => handleModuleSelect(mod)}
                                                    className="option-button group"
                                                >
                                                    <span>{mod.name}</span>
                                                    <ChevronRight className="option-icon" />
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                );

            case 'lesson':
                return (
                    <div className="greeting-wrapper">
                        <div className="greeting-card">

                            {/* Content */}
                            <div className="greeting-content">
                                {/* Header */}
                                <div className="greeting-header">
                                    <div className="greeting-header-inner">
                                        <div className="greeting-title-wrapper">
                                            <div className="greeting-title-row">
                                                <div className="bot-icon-wrapper">
                                                    <Bot className="w-5 h-5" />
                                                </div>
                                                <h3 className="greeting-title">
                                                    Great! 👍
                                                </h3>
                                            </div>
                                            <p className="greeting-subtitle">
                                                Select a Lesson under {context.module?.name} to explore.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Dropdown Options - Always Show */}
                                <div className="options-container">
                                    {isLoading ? (
                                        <div className="state-container">
                                            <Loader2 className="spinner" />
                                        </div>
                                    ) : lessons.length === 0 ? (
                                        <div className="empty-message">
                                            No lessons available in this module.
                                        </div>
                                    ) : (
                                        <div className="options-list">
                                            {lessons.map((lesson) => (
                                                <button
                                                    key={lesson.id}
                                                    onClick={() => handleLessonSelect(lesson)}
                                                    className="option-button group"
                                                >
                                                    <span>{lesson.name}</span>
                                                    <ChevronRight className="option-icon" />
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                );

            case 'chapter':
                return (
                    <div className="greeting-wrapper">
                        <div className="greeting-card">

                            {/* Content */}
                            <div className="greeting-content">
                                {/* Header */}
                                <div className="greeting-header">
                                    <div className="greeting-header-inner">
                                        <div className="greeting-title-wrapper">
                                            <div className="greeting-title-row">
                                                <div className="bot-icon-wrapper">
                                                    <Bot className="w-5 h-5" />
                                                </div>
                                                <h3 className="greeting-title">
                                                    Okay! 👍
                                                </h3>
                                            </div>
                                            <p className="greeting-subtitle">
                                                Select a Chapter in {context.lesson?.name} to explore.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Dropdown Options - Always Show */}
                                <div className="options-container">
                                    {isLoading ? (
                                        <div className="state-container">
                                            <Loader2 className="spinner" />
                                        </div>
                                    ) : chapters.length === 0 ? (
                                        <div className="empty-message">
                                            No chapters available.
                                        </div>
                                    ) : (
                                        <div className="options-list">
                                            {chapters.map((chapter) => (
                                                <button
                                                    key={chapter.id}
                                                    onClick={() => handleChapterSelect(chapter)}
                                                    className="option-button group"
                                                >
                                                    <span>{chapter.name}</span>
                                                    <ChevronRight className="option-icon" />
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                );

            case 'qa':
                return null;
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-1rem)] w-full overflow-hidden">
            <Card className={`relative flex flex-col h-full w-full shadow-2xl overflow-hidden border-0 ${isFloating ? 'rounded-[30px]' : 'rounded-none'} bg-background`}>
                {/* Custom Glass Header - Absolutely positioned, never scrolls */}
                <div className="ai-chat-header">
                    {sidebarControl}

                    {/* Back Button */}
                    {currentStep !== 'department' && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleBack}
                            className="-ml-1 w-8 h-8 rounded-full text-teal-800 dark:text-teal-200 hover:bg-teal-100/30 dark:hover:bg-teal-800/20"
                            title="Go Back"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                    )}
                    <div className="relative shrink-0">
                        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center text-white font-bold text-lg shadow-md overflow-hidden">
                            <div className="transform scale-[0.3] translate-y-1">
                                <CssRobot />
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-col min-w-0 flex-1 justify-center">
                        <h3 className="text-sm font-bold text-teal-900 dark:text-teal-50 leading-none mb-0.5" title="NIA">
                            NIA
                        </h3>
                        <span className="nia-subtitle">
                            Novel Intelligent Assistant
                        </span>
                        <TooltipProvider delayDuration={100}>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <span className="text-[10px] text-white font-medium leading-tight truncate cursor-help drop-shadow-sm">
                                        {[
                                            context.department?.name,
                                            context.module?.name,
                                            context.lesson?.name,
                                            context.chapter?.name
                                        ].filter(Boolean).join(' • ') || 'Ready to help'}
                                    </span>
                                </TooltipTrigger>
                                <TooltipContent
                                    side="bottom"
                                    align="start"
                                    className="bg-white/90 dark:bg-teal-950/90 backdrop-blur-md border border-teal-200 dark:border-teal-800 text-teal-900 dark:text-teal-50 shadow-xl p-3 rounded-xl max-w-xs"
                                >
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 pb-1 border-b border-teal-100 dark:border-teal-800">
                                            <Info className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                                            <span className="text-[11px] font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400">Current Context</span>
                                        </div>
                                        <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 text-[11px]">
                                            {context.department && (
                                                <>
                                                    <span className="text-teal-500/70 dark:text-teal-400/50 font-medium">Dept:</span>
                                                    <span className="font-semibold">{context.department.name}</span>
                                                </>
                                            )}
                                            {context.module && (
                                                <>
                                                    <span className="text-teal-500/70 dark:text-teal-400/50 font-medium">Module:</span>
                                                    <span className="font-semibold">{context.module.name}</span>
                                                </>
                                            )}
                                            {context.lesson && (
                                                <>
                                                    <span className="text-teal-500/70 dark:text-teal-400/50 font-medium">Lesson:</span>
                                                    <span className="font-semibold">{context.lesson.name}</span>
                                                </>
                                            )}
                                            {context.chapter && (
                                                <>
                                                    <span className="text-teal-500/70 dark:text-teal-400/50 font-medium">Chapter:</span>
                                                    <span className="font-semibold">{context.chapter.name}</span>
                                                </>
                                            )}
                                            {!context.department && (
                                                <span className="col-span-2 text-teal-500/70 italic">Please select a department to start.</span>
                                            )}
                                        </div>
                                    </div>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>

                    {/* New Chat / Reset Button */}
                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleReset}
                            className="p-1.5 rounded-xl bg-teal-900/10 dark:bg-teal-100/10 hover:bg-teal-900/20 dark:hover:bg-teal-100/20 backdrop-blur-md border border-teal-900/10 dark:border-teal-100/10 text-teal-100 dark:text-teal-100 shadow-sm transition-all duration-300 hover:scale-105 active:scale-95 h-auto w-auto"
                            title="Start New Chat"
                        >
                            <Plus className="w-4 h-4" strokeWidth={2.5} />
                        </Button>
                        {extraHeaderButtons}

                        {onMinimize && (
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                    saveState();
                                    onMinimize();
                                }}
                                className="p-1.5 rounded-xl bg-teal-900/10 dark:bg-teal-100/10 hover:bg-teal-900/20 dark:hover:bg-teal-100/20 backdrop-blur-md border border-teal-900/10 dark:border-teal-100/10 text-teal-100 dark:text-teal-100 shadow-sm transition-all duration-300 hover:scale-105 active:scale-95 h-auto w-auto"
                                title="Minimize / Close Window"
                            >
                                <Minimize2 className="w-4 h-4" strokeWidth={2.5} />
                            </Button>
                        )}
                    </div>

                </div>

                {/* Content area with top padding to account for fixed header */}
                {/* Content area with top padding to account for fixed header */}
                <CardContent className="flex-1 p-0 overflow-hidden relative pt-[85px]">
                    <ScrollArea className="h-full">
                        <div className="flex flex-col gap-2 p-3 min-h-full">
                            {renderGreeting()}

                            {currentStep === 'qa' && messages.length > 0 && (
                                <>
                                    {messages.map((message) => (
                                        <MessageBubble
                                            key={message.id}
                                            message={message}
                                            onCopy={handleCopy}
                                            copiedId={copiedId}
                                        />
                                    ))}
                                    {isLoading && (
                                        <div className="flex w-full justify-start">
                                            <div className="flex flex-col items-start">
                                                <span className="text-[10px] text-muted-foreground mb-1 px-1">
                                                    AI • typing...
                                                </span>
                                                <div className="px-4 py-2 rounded-2xl shadow-sm bg-muted/50 border border-border rounded-tl-md">
                                                    <div className="flex items-center gap-2">
                                                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                                        <span className="text-sm text-muted-foreground">Thinking...</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                            <div ref={scrollRef} />
                        </div>
                    </ScrollArea>
                </CardContent>

                {
                    currentStep === 'qa' && (
                        <CardFooter className="p-2 bg-transparent">
                            <div className="relative w-full">
                                {/* Input Container */}
                                <div className="relative flex w-full items-end gap-2 bg-white/60 dark:bg-white/5 backdrop-blur-xl border border-white/50 dark:border-white/10 rounded-xl p-2 shadow-md z-10 transition-all duration-300 hover:bg-white/80 dark:hover:bg-white/10 hover:border-white/70 dark:hover:border-white/20 focus-within:bg-white/95 dark:focus-within:bg-black/60 focus-within:border-teal-400/50 dark:focus-within:border-teal-500/50">
                                    <Textarea
                                        ref={textareaRef}
                                        placeholder="Type your message here..."
                                        value={inputValue}
                                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setInputValue(e.target.value)}
                                        onKeyDown={handleKeyPress}
                                        rows={1}
                                        className="flex-1 bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-teal-900 dark:text-white placeholder:text-teal-700/30 dark:placeholder:text-white/30 resize-none min-h-[34px] max-h-[80px] overflow-y-auto py-2 text-sm [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none'] shadow-none"
                                        disabled={isLoading}
                                        style={{ height: 'auto' }}
                                        onInput={(e: React.FormEvent<HTMLTextAreaElement>) => {
                                            const target = e.currentTarget;
                                            target.style.height = 'auto';
                                            target.style.height = Math.min(target.scrollHeight, 80) + 'px';
                                        }}
                                    />
                                    <Button
                                        onClick={handleSendMessage}
                                        size="icon"
                                        disabled={isLoading || !inputValue.trim()}
                                        className={`h-8 w-8 rounded-lg shrink-0 transition-all duration-300 ${!inputValue.trim()
                                            ? 'bg-teal-600/20 text-teal-700/60 cursor-not-allowed hover:bg-teal-600/20'
                                            : 'bg-teal-600 text-white hover:bg-teal-700 shadow-md hover:scale-105 active:scale-95'
                                            }`}
                                    >
                                        {isLoading ? (
                                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                        ) : (
                                            <Send className="h-3.5 w-3.5 ml-0.5" />
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </CardFooter>
                    )
                }
            </Card >
        </div >
    );
};

export default AiChat;
