
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Bot, Copy, Check, /* RotateCcw, */ Pencil, X, Loader2 } from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useUser } from "@/hooks/use-user";

interface Department {
    apiKey: string;      // API key to send to backend
    displayName: string; // Display name for UI
}

// Static list of departments with API keys and display names
const STATIC_DEPARTMENTS: Department[] = [
    { apiKey: "hr_recruitment", displayName: "HR Recruitment" },
    { apiKey: "hr_operations", displayName: "HR Operations" },
    { apiKey: "hr_head", displayName: "HR Head" },
];

// API Base URL (via Nginx proxy)
const API_BASE_URL = "/chatbot";

interface Message {
    id: string;
    text: string;
    sender: 'user' | 'ai';
    timestamp: Date;
}

// Helper function to parse and render markdown-style bold text (**text**) and large text (##text##)
const renderFormattedText = (text: string): React.ReactNode => {
    // Split by **text** and ##text## patterns while capturing the content
    const parts = text.split(/(\*\*[^*]+\*\*|##[^#]+##)/g);

    return parts.map((part, index) => {
        if (part.startsWith('**') && part.endsWith('**')) {
            const content = part.slice(2, -2);
            return <strong key={index} className="font-bold text-[0.925rem]">{content}</strong>;
        }
        if (part.startsWith('##') && part.endsWith('##')) {
            const content = part.slice(2, -2);
            return <span key={index} className="font-bold text-xl block leading-tight">{content}</span>;
        }
        return <span key={index}>{part}</span>;
    });
};

const AiChat = () => {
    const { user } = useUser();
    const scrollRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState("");
    const [selectedDepartment, setSelectedDepartment] = useState<string>("");
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editText, setEditText] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    // Handle department change - clear chat history
    const handleDepartmentChange = (departmentKey: string) => {
        setSelectedDepartment(departmentKey);
        // Clear chat history and show welcome message for new department
        const dept = STATIC_DEPARTMENTS.find(d => d.apiKey === departmentKey);
        setMessages([
            {
                id: Date.now().toString(),
                text: `Hello! I'm your AI assistant for ${dept?.displayName || 'this department'}. How can I help you today?`,
                sender: 'ai',
                timestamp: new Date()
            }
        ]);
    };

    // Build conversation history in prompt format
    const buildConversationHistory = (currentMessages: Message[], newQuery: string): string => {
        // Filter for actual user/AI conversation (skip initial welcome message if it's the only AI message)
        const userMessages = currentMessages.filter(m => m.sender === 'user');

        // If this is the first user message, just return the new query
        if (userMessages.length === 0) {
            return newQuery;
        }

        // Build conversation history in prompt format
        let conversationHistory = '';

        // Skip the first welcome message from AI (it's auto-generated)
        const conversationStart = currentMessages.findIndex(m => m.sender === 'user');
        if (conversationStart === -1) {
            return newQuery;
        }

        // Build history from the first user message onwards
        for (let i = conversationStart; i < currentMessages.length; i++) {
            const msg = currentMessages[i];
            if (msg.sender === 'user') {
                conversationHistory += `User: ${msg.text}\n`;
            } else if (msg.sender === 'ai') {
                conversationHistory += `Assistant: ${msg.text}\n`;
            }
        }

        // Add the new query
        conversationHistory += `User: ${newQuery}`;

        return conversationHistory;
    };

    // Send query to backend API
    const sendQueryToAPI = async (query: string, department: string, currentMessages: Message[]): Promise<string> => {
        // Check if this is the 2nd message or more (by counting existing user messages)
        const existingUserMessages = currentMessages.filter(m => m.sender === 'user');
        const formattedQuery = existingUserMessages.length >= 1
            ? buildConversationHistory(currentMessages, query)
            : query;

        const response = await fetch(`${API_BASE_URL}/query`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                department: department,
                query: formattedQuery,
            }),
        });

        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();
        return data.response;
    };

    const handleSendMessage = async () => {
        if (!inputValue.trim() || isLoading) return;

        if (!selectedDepartment) {
            const errorMessage: Message = {
                id: Date.now().toString(),
                text: "Please select a department first.",
                sender: 'ai',
                timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMessage]);
            return;
        }

        const userQuery = inputValue.trim();
        const newMessage: Message = {
            id: Date.now().toString(),
            text: userQuery,
            sender: 'user',
            timestamp: new Date()
        };

        setMessages(prev => [...prev, newMessage]);
        setInputValue("");

        // Reset textarea height
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
        }

        // Call the API
        setIsLoading(true);
        try {
            // Pass current messages (excluding the new one) to use as history
            const aiResponseText = await sendQueryToAPI(userQuery, selectedDepartment, messages);
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

    // Auto-scroll to bottom when messages change
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages]);

    const handleCopyLogger = async (text: string, id: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedId(id);
            setTimeout(() => setCopiedId(null), 2000);
        } catch (err) {
            // Fallback for non-HTTPS environments
            const textArea = document.createElement("textarea");
            textArea.value = text;
            textArea.style.position = "fixed";
            textArea.style.left = "-9999px";
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            try {
                document.execCommand("copy");
                setCopiedId(id);
                setTimeout(() => setCopiedId(null), 2000);
            } catch (fallbackErr) {
                console.error("Copy failed:", fallbackErr);
            }
            document.body.removeChild(textArea);
        }
    };

    // TODO: Implement regenerate feature later
    // const handleRegenerate = (messageId: string) => {
    //     // Implementation will be added later
    // };

    const handleStartEdit = (message: Message) => {
        setEditingId(message.id);
        setEditText(message.text);
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setEditText("");
    };

    const handleSaveEdit = async (messageId: string) => {
        if (!editText.trim() || isLoading) return;

        // Find the index of the message being edited
        const messageIndex = messages.findIndex(m => m.id === messageId);
        if (messageIndex === -1) return;

        const editedQuery = editText.trim();

        // Update the message and remove all messages after it
        setMessages(prev => {
            const updated = prev.map(m =>
                m.id === messageId
                    ? { ...m, text: editedQuery }
                    : m
            );
            return updated.slice(0, messageIndex + 1);
        });

        // Clear edit state
        setEditingId(null);
        setEditText("");

        // Call the API with the edited message
        setIsLoading(true);
        try {
            // Get history messages only (exclude the edited one and future ones)
            const historyMessages = messages.slice(0, messageIndex);
            const aiResponseText = await sendQueryToAPI(editedQuery, selectedDepartment, historyMessages);
            const aiResponse: Message = {
                id: Date.now().toString(),
                text: aiResponseText,
                sender: 'ai',
                timestamp: new Date()
            };
            setMessages(prev => [...prev, aiResponse]);
        } catch (error) {
            console.error('API Error:', error);
            const errorMessage: Message = {
                id: Date.now().toString(),
                text: "Sorry, I encountered an error while processing your request. Please try again.",
                sender: 'ai',
                timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-4rem)] px-4 py-2 w-full gap-2">

            <div className="w-full max-w-xs space-y-1">
                <Label htmlFor="department-select">Department</Label>
                <Select value={selectedDepartment} onValueChange={handleDepartmentChange}>
                    <SelectTrigger id="department-select" className="w-full bg-background border-input">
                        <SelectValue placeholder="Select a Department" />
                    </SelectTrigger>
                    <SelectContent>
                        {STATIC_DEPARTMENTS.map((dept) => (
                            <SelectItem key={dept.apiKey} value={dept.apiKey} className="cursor-pointer">
                                {dept.displayName}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <Card className="flex flex-col flex-1 shadow-lg overflow-hidden border border-border bg-background">
                <CardHeader className="border-b border-border bg-background py-1.5 px-3">
                    <CardTitle className="flex items-center gap-2 text-base text-card-foreground">
                        <Bot className="h-4 w-4 text-primary" />
                        AI Assistant {selectedDepartment && <span className="text-muted-foreground text-sm font-normal">- {STATIC_DEPARTMENTS.find(d => d.apiKey === selectedDepartment)?.displayName}</span>}
                    </CardTitle>
                </CardHeader>

                <CardContent className="flex-1 p-0 overflow-hidden relative">
                    <ScrollArea className="h-full">
                        <div className="flex flex-col gap-3 p-3 min-h-full">
                            {messages.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full flex-1 mt-20 space-y-4 text-center opacity-90">
                                    <div className="p-4 bg-primary/10 rounded-full mb-2">
                                        <Bot className="h-12 w-12 text-primary animate-pulse" />
                                    </div>
                                    <h2 className="text-3xl font-bold tracking-tight text-foreground">
                                        Hi {user?.full_name || 'there'}!
                                    </h2>
                                    <p className="text-muted-foreground text-lg max-w-md">
                                        Please select a department for AI Assistance
                                    </p>
                                </div>
                            ) : (
                                <>
                                    {messages.map((message) => (
                                        <div
                                            key={message.id}
                                            className={`flex w-full ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                                        >
                                            <div
                                                className={`flex flex-col group min-w-0 ${message.sender === 'user' && editingId === message.id
                                                    ? 'max-w-[60%] w-[60%]'
                                                    : 'max-w-[80-%]'
                                                    } ${message.sender === 'user' ? 'items-end' : 'items-start'}`}
                                            >
                                                {message.sender === 'ai' && (
                                                    <span className="text-[11px] text-muted-foreground mb-1 px-1 select-none">
                                                        AI Assistant <span className="mx-1">•</span> {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                )}
                                                {message.sender === 'user' && (
                                                    <span className="text-[11px] text-muted-foreground mb-1 px-1 select-none">
                                                        {user?.full_name || 'You'} <span className="mx-1">•</span> {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                )}
                                                {message.sender === 'user' && editingId === message.id ? (
                                                    /* Edit mode for user message */
                                                    <div className="w-full">
                                                        <textarea
                                                            value={editText}
                                                            onChange={(e) => setEditText(e.target.value)}
                                                            className="w-full px-4 py-2 rounded-xl border border-primary bg-background text-foreground text-sm resize-none min-h-[60px] focus:outline-none focus:ring-2 focus:ring-ring"
                                                            rows={3}
                                                            autoFocus
                                                        />
                                                        <div className="flex items-center gap-2 mt-2 justify-end">
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                onClick={handleCancelEdit}
                                                                className="h-7 px-2"
                                                                disabled={isLoading}
                                                            >
                                                                <X className="h-3.5 w-3.5 mr-1" />
                                                                Cancel
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                onClick={() => handleSaveEdit(message.id)}
                                                                className="h-7 px-3"
                                                                disabled={isLoading}
                                                            >
                                                                {isLoading ? (
                                                                    <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                                                                ) : (
                                                                    <Send className="h-3.5 w-3.5 mr-1" />
                                                                )}
                                                                Send
                                                            </Button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    /* Normal display mode */
                                                    <div
                                                        className={`px-4 py-2 rounded-2xl shadow-sm backdrop-blur-sm relative ${message.sender === 'user'
                                                            ? 'bg-primary text-primary-foreground rounded-tr-md'
                                                            : 'bg-muted/50 text-foreground border border-border rounded-tl-md'
                                                            }`}
                                                    >
                                                        <p className="text-sm leading-relaxed break-words whitespace-pre-wrap">
                                                            {message.sender === 'ai' ? renderFormattedText(message.text) : message.text}
                                                        </p>
                                                    </div>
                                                )}
                                                {message.sender === 'ai' ? (
                                                    <div className="flex items-center gap-1 mt-1 px-1">
                                                        <button
                                                            onClick={() => handleCopyLogger(message.text, message.id)}
                                                            className="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                                                            title="Copy"
                                                        >
                                                            {copiedId === message.id ? (
                                                                <Check className="h-3.5 w-3.5" />
                                                            ) : (
                                                                <Copy className="h-3.5 w-3.5" />
                                                            )}
                                                        </button>
                                                        {/* TODO: Implement regenerate feature later
                                                <button
                                                    onClick={() => handleRegenerate(message.id)}
                                                    className="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                                                    title="Regenerate"
                                                >
                                                    <RotateCcw className="h-3.5 w-3.5" />
                                                </button>
                                                */}
                                                    </div>
                                                ) : editingId !== message.id && (
                                                    <div className="flex items-center gap-1 mt-1 px-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button
                                                            onClick={() => handleCopyLogger(message.text, message.id)}
                                                            className="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                                                            title="Copy"
                                                        >
                                                            {copiedId === message.id ? (
                                                                <Check className="h-3.5 w-3.5" />
                                                            ) : (
                                                                <Copy className="h-3.5 w-3.5" />
                                                            )}
                                                        </button>
                                                        <button
                                                            onClick={() => handleStartEdit(message)}
                                                            className="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                                                            title="Edit"
                                                        >
                                                            <Pencil className="h-3.5 w-3.5" />
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                    {/* Loading indicator */}
                                    {isLoading && (
                                        <div className="flex w-full justify-start">
                                            <div className="flex flex-col items-start">
                                                <span className="text-[11px] text-muted-foreground mb-1 px-1 select-none">
                                                    AI Assistant <span className="mx-1">•</span> typing...
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
                                    <div ref={scrollRef} />
                                </>
                            )}
                        </div>
                    </ScrollArea>
                </CardContent>

                <CardFooter className="p-2 border-t border-border bg-muted/10">
                    <div className="flex w-full items-end gap-2 bg-background border border-input rounded-lg px-3 py-1 shadow-sm focus-within:ring-2 focus-within:ring-ring">
                        <textarea
                            ref={textareaRef}
                            placeholder="Type your message..."
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={handleKeyPress}
                            rows={1}
                            className="flex-1 border-0 focus:outline-none focus:ring-0 bg-transparent py-1 text-foreground placeholder:text-muted-foreground resize-none min-h-[24px] max-h-[120px] overflow-y-auto break-words"
                            disabled={!selectedDepartment || isLoading}
                            style={{ height: 'auto' }}
                            onInput={(e) => {
                                const target = e.target as HTMLTextAreaElement;
                                target.style.height = 'auto';
                                target.style.height = Math.min(target.scrollHeight, 120) + 'px';
                            }}
                        />
                        <Button
                            onClick={handleSendMessage}
                            size="icon"
                            disabled={!selectedDepartment || isLoading}
                            className="h-8 w-8 rounded-full shrink-0"
                        >
                            {isLoading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Send className="h-4 w-4" />
                            )}
                        </Button>
                    </div>
                </CardFooter>
            </Card >
        </div >
    );
};

export default AiChat;
