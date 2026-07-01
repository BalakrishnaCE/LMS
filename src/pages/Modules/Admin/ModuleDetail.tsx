import { useState, useEffect, useRef } from "react";
import { useParams, useLocation } from "wouter";
import { useFrappeGetCall, useFrappePostCall, useFrappeGetDoc, useFrappeUpdateDoc } from "frappe-react-sdk";
import { LMS_API_BASE_URL } from "@/config/routes";
import { ModuleSidebar } from "@/pages/Modules/Learner/components/ModuleSidebar";
import { Button } from "@/components/ui/button";
import { ContentRenderer } from "@/pages/Modules/Learner/components/ContentRenderer";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

import { BookOpen, ArrowLeft, ArrowRight, ArrowDown, ArrowUp, Trash2, Bot, WandSparkles, X, Send, FileText, Plus } from "lucide-react";
import { toast } from "sonner";
import { uploadFileToFrappe } from "@/lib/uploadFileToFrappe";
import Lottie from "lottie-react";
import emptyAnimation from '@/assets/Empty.json';
import errorAnimation from '@/assets/Error.json';
import loadingAnimation from '@/assets/Loading.json';
import { ROUTES } from "@/config/routes";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";

// TypeScript interfaces
interface Content {
    name: string;
    content_type: string;
    content_reference: string;
    data?: any; // Content data already fetched by the API
    progress?: "Not Started" | "In Progress" | "Completed";
}

interface Chapter {
    name: string;
    title: string;
    contents: Content[];
    progress?: "Not Started" | "In Progress" | "Completed";
}

interface Lesson {
    name: string;
    lesson_name: string;
    chapters: Chapter[];
    progress?: "Not Started" | "In Progress" | "Completed";
}

interface Module {
    name: string;
    name1: string;
    description: string;
    lessons: Lesson[];
    image?: string;
}

// ─── AI Processing View Component ─────────────────────────────────────────────

function AiProcessingView() {
    const [progress, setProgress] = useState(0);
    const [scanPos, setScanPos] = useState(0);

    useEffect(() => {
        const scanTimer = setInterval(() => {
            setScanPos(prev => (prev >= 100 ? 0 : prev + 2));
        }, 50);

        const progressTimer = setInterval(() => {
            setProgress(prev => {
                if (prev >= 95) return prev;
                return Math.min(prev + Math.random() * 8 + 2, 95);
            });
        }, 280);

        return () => {
            clearInterval(scanTimer);
            clearInterval(progressTimer);
        };
    }, []);

    return (
        <div className="flex flex-col items-center justify-center gap-10 h-full py-20 min-h-[500px]">
            <style>{`
        @keyframes pulse-ring {
          0% { transform: scale(0.95); opacity: 0.7; }
          50% { transform: scale(1.08); opacity: 0.3; }
          100% { transform: scale(0.95); opacity: 0.7; }
        }
        @keyframes spin-gear {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes float-card {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        @keyframes data-stream {
          0% { opacity: 0; transform: translateX(-12px); }
          30% { opacity: 1; }
          70% { opacity: 1; }
          100% { opacity: 0; transform: translateX(12px); }
        }
      `}</style>

            {/* Document extraction card */}
            <div className="relative flex items-center justify-center">
                {/* Outer pulse ring */}
                <div
                    className="absolute rounded-3xl border-2 border-[#00c8b6]/30"
                    style={{
                        width: "180px",
                        height: "220px",
                        animation: "pulse-ring 2s ease-in-out infinite",
                    }}
                />
                {/* Main document card */}
                <div
                    className="relative flex flex-col items-center justify-center gap-3 w-40 h-48 rounded-2xl border-2 shadow-xl overflow-hidden bg-[#00c8b6]/5 border-[#00c8b6]/20 text-[#00c8b6]"
                    style={{ animation: "float-card 3s ease-in-out infinite" }}
                >
                    {/* Scanning line */}
                    <div
                        className="absolute left-0 right-0 h-0.5 bg-[#00c8b6]/60 z-10"
                        style={{
                            top: `${scanPos}%`,
                            boxShadow: "0 0 8px 2px rgba(0,200,182,0.4)",
                            transition: "top 30ms linear",
                        }}
                    />
                    {/* Lines of fake text to scan */}
                    <div className="w-full px-4 space-y-2 z-0">
                        {[80, 65, 80, 50, 75, 60].map((w, i) => (
                            <div
                                key={i}
                                className="h-1.5 rounded-full bg-current opacity-15"
                                style={{ width: `${w}%` }}
                            />
                        ))}
                    </div>

                    {/* File icon + label */}
                    <div className="absolute bottom-3 flex flex-col items-center gap-1 z-10">
                        <FileText className="w-6 h-6 opacity-70" />
                        <span className="text-[9px] font-bold tracking-widest uppercase opacity-60">
                            FILE
                        </span>
                    </div>
                </div>

                {/* Orbiting gear */}
                <div
                    className="absolute -bottom-3 -right-3 w-9 h-9 rounded-full bg-[#00c8b6]/10 border border-[#00c8b6]/20 flex items-center justify-center shadow"
                >
                    <svg
                        viewBox="0 0 24 24"
                        className="w-5 h-5 text-[#00c8b6]"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        style={{ animation: "spin-gear 3s linear infinite" }}
                    >
                        <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
                        <path d="M19.622 10.395l-1.097-2.65L20 6l-2-2-1.735 1.483-2.707-1.113L12.935 2h-1.954l-.632 2.401-2.645 1.115L6 4 4 6l1.453 1.789-1.08 2.657L2 11v2l2.401.655L5.516 16.3 4 18l2 2 1.791-1.46 2.606 1.072L11 22h2l.604-2.387 2.651-1.098C16.697 18.833 18 20 18 20l2-2-1.484-1.75 1.098-2.652 2.386-.62V11l-2.378-.605Z" />
                    </svg>
                </div>

                {/* Streaming data dots */}
                <div className="absolute -left-8 top-1/2 -translate-y-1/2 flex flex-col gap-2">
                    {[0, 0.3, 0.6].map((delay, i) => (
                        <div
                            key={i}
                            className="w-1.5 h-1.5 rounded-full bg-[#00c8b6]"
                            style={{
                                animation: `data-stream 1.4s ease-in-out ${delay}s infinite`,
                            }}
                        />
                    ))}
                </div>
                <div className="absolute -right-8 top-1/2 -translate-y-1/2 flex flex-col gap-2">
                    {[0.2, 0.5, 0.8].map((delay, i) => (
                        <div
                            key={i}
                            className="w-1.5 h-1.5 rounded-full bg-[#00c8b6]"
                            style={{
                                animation: `data-stream 1.4s ease-in-out ${delay}s infinite`,
                            }}
                        />
                    ))}
                </div>
            </div>

            {/* Label + progress */}
            <div className="flex flex-col items-center gap-3 w-full max-w-md">
                <p className="text-sm font-medium text-foreground text-center animate-pulse">Applying the changes...</p>
                <div className="w-full max-w-xs space-y-2">
                    <div className="h-2.5 w-full bg-muted rounded-full overflow-hidden">
                        <div
                            className="h-full bg-[#00c8b6] rounded-full transition-all duration-300 ease-out"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── AI Chat Sidebar Component ──────────────────────────────────────────────

function AiChatSidebar({ 
    isOpen, 
    onClose, 
    module, 
    onProcessingStart, 
    onProcessingComplete,
    isProcessingAiChanges,
    onRefreshModule
}: {
    isOpen: boolean;
    onClose: () => void;
    module: any;
    onProcessingStart: () => void;
    onProcessingComplete: () => void;
    isProcessingAiChanges?: boolean;
    onRefreshModule?: () => void;
}) {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [chatInput, setChatInput] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatingProgress, setGeneratingProgress] = useState("Luna is thinking...");
    const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
    const [chatMessages, setChatMessages] = useState<Array<{ 
        role: 'system' | 'user' | 'assistant', 
        text: string,
        files?: string[],
        requiresConfirmation?: boolean,
        status?: 'pending' | 'accepted' | 'rejected',
        proposedChanges?: any[]
    }>>([
        { role: 'system', text: "" }
    ]);

    const { call: startEnhancement } = useFrappePostCall("novel_lms.lms_ai_module_creation.api.generator.start_ai_enhancement");
    const { call: applyChanges } = useFrappePostCall("novel_lms.lms_ai_module_creation.api.generator.apply_ai_enhancements");

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [chatMessages, isOpen]);

    const handleSendMsg = async () => {
        if ((!chatInput.trim() && attachedFiles.length === 0) || isGenerating || isProcessingAiChanges) return;
        const userInput = chatInput.trim() || "Analyze the attached file and enhance the module accordingly.";
        const filesToUpload = [...attachedFiles];
        
        // Show files locally instantly using temporary object URLs
        const tempLocalUrls = filesToUpload.map(file => URL.createObjectURL(file));
        
        setChatInput("");
        setAttachedFiles([]);
        setIsGenerating(true);
        setGeneratingProgress("Preparing file uploads...");
        
        setChatMessages(prev => {
            const filtered = prev.filter(msg => msg.role !== 'system');
            return [...filtered, { role: 'user', text: userInput, files: tempLocalUrls }];
        });
        
        try {
            // Upload files sequentially
            const uploadedUrls: string[] = [];
            for (let i = 0; i < filesToUpload.length; i++) {
                setGeneratingProgress(`Uploading file ${i + 1} of ${filesToUpload.length}: ${filesToUpload[i].name}...`);
                try {
                    const fileUrl = await uploadFileToFrappe(filesToUpload[i]);
                    uploadedUrls.push(fileUrl);
                } catch (uploadErr) {
                    console.error("Failed to upload file:", filesToUpload[i].name, uploadErr);
                    toast.error(`Failed to upload ${filesToUpload[i].name}`);
                }
            }

            setGeneratingProgress("Waiting in queue...");
            
            const res = await startEnhancement({
                module_id: module.name,
                prompt: userInput,
                file_urls: uploadedUrls.length > 0 ? JSON.stringify(uploadedUrls) : undefined
            });
            
            if (res.message && res.message.success && res.message.job_id) {
                const jobId = res.message.job_id;
                
                // Poll status API
                const pollInterval = setInterval(async () => {
                    try {
                        const statusRes = await fetch(`${LMS_API_BASE_URL ? LMS_API_BASE_URL.replace(/\/$/, '') : ''}/api/method/novel_lms.lms_ai_module_creation.api.generator.get_status?ai_job_id=${jobId}`, {
                            method: "GET",
                            headers: {
                                "Accept": "application/json",
                            },
                            credentials: "include",
                        });
                        
                        if (!statusRes.ok) return;
                        
                        const statusResult = await statusRes.json();
                        const statusData = statusResult.message;
                        
                        if (!statusData) return;
                        
                        if (statusData.status === "finished") {
                            clearInterval(pollInterval);
                            setIsGenerating(false);
                            
                            const responseData = statusData.result;
                            if (responseData) {
                                const changes = responseData.changes || [];
                                const hasModifications = changes.some((c: any) => c.action !== "info");
                                
                                let replyText = responseData.explanation || "";
                                const infoChange = changes.find((c: any) => c.action === "info");
                                if (infoChange) {
                                    replyText += "\n\n" + infoChange.value;
                                }
                                
                                setChatMessages(prev => [...prev, {
                                    role: 'assistant',
                                    text: replyText || "I've processed your request.",
                                    requiresConfirmation: hasModifications,
                                    status: hasModifications ? 'pending' : undefined,
                                    proposedChanges: changes
                                }]);
                            }
                        } else if (statusData.status === "failed") {
                            clearInterval(pollInterval);
                            setIsGenerating(false);
                            setChatMessages(prev => [...prev, {
                                role: 'assistant',
                                text: `AI failed: ${statusData.error || "Unknown server error"}`
                            }]);
                        } else {
                            if (statusData.progress) {
                                setGeneratingProgress(statusData.progress);
                            }
                        }
                    } catch (pollErr) {
                        console.error("Polling error:", pollErr);
                        clearInterval(pollInterval);
                        setIsGenerating(false);
                        setChatMessages(prev => [...prev, {
                            role: 'assistant',
                            text: "Lost connection to the server while polling progress."
                        }]);
                    }
                }, 1500);
            } else {
                setIsGenerating(false);
                setChatMessages(prev => [...prev, {
                    role: 'assistant',
                    text: "Failed to initiate AI task on the server."
                }]);
            }
        } catch (err: any) {
            setIsGenerating(false);
            setChatMessages(prev => [...prev, {
                role: 'assistant',
                text: `Failed to connect: ${err.message || err}`
            }]);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (!isGenerating && !isProcessingAiChanges) {
                handleSendMsg();
            }
        }
    };

    const handleConfirmAction = async (index: number, action: 'accepted' | 'rejected') => {
        setChatMessages(prev => prev.map((msg, i) => {
            if (i === index) {
                return { ...msg, status: action };
            }
            return msg;
        }));

        if (action === 'accepted') {
            onProcessingStart();
            
            const targetMsg = chatMessages[index];
            const proposedChanges = targetMsg.proposedChanges || [];
            
            try {
                const res = await applyChanges({
                    module_id: module.name,
                    changes: JSON.stringify(proposedChanges)
                });
                
                onProcessingComplete();
                
                if (res.message?.success) {
                    setChatMessages(prev => [...prev, {
                        role: 'assistant',
                        text: "Changes have been successfully applied! You can review the updated module content in the main view."
                    }]);
                    if (onRefreshModule) {
                        onRefreshModule();
                    }
                } else {
                    setChatMessages(prev => [...prev, {
                        role: 'assistant',
                        text: `Failed to apply changes: ${res.message?.error || "Unknown error occurred"}`
                    }]);
                }
            } catch (err: any) {
                onProcessingComplete();
                setChatMessages(prev => [...prev, {
                    role: 'assistant',
                    text: `An error occurred while applying changes: ${err.message || err}`
                }]);
            }
        } else {
            setTimeout(() => {
                setChatMessages(prev => [...prev, {
                    role: 'assistant',
                    text: "Changes were rejected. Let me know what else you'd like to do."
                }]);
            }, 500);
        }
    };

    return (
        <div className={`bg-card border-l flex flex-col shadow-xl transition-all duration-300 ease-in-out sticky top-0 h-screen overflow-hidden flex-shrink-0 ${isOpen ? 'w-96 opacity-100' : 'w-0 opacity-0 border-none'}`}>
            {/* Chat Header */}
            <div className="flex items-center justify-between p-4 border-b bg-muted/30 whitespace-nowrap">
                <div className="flex items-center gap-2">
                    <WandSparkles className="w-5 h-5 text-[#00c8b6]" />
                    <h3 className="font-semibold text-foreground">AI Enhancement</h3>
                </div>
                <Button variant="ghost" size="icon" onClick={onClose}>
                    <X className="w-4 h-4" />
                </Button>
            </div>

            {/* Chat Messages */}
            <ScrollArea className="flex-1 w-full relative">
                <div className="p-4 space-y-4">
                {chatMessages.map((msg, idx) => (
                    <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                        <div className="text-xs text-muted-foreground mb-1">
                            {msg.role === 'user' ? 'You' : 'Luna'}
                        </div>
                        <div className={`p-3 rounded-xl max-w-[90%] text-sm ${msg.role === 'user' ? 'bg-[#00c8b6]/20 text-foreground' : 'bg-muted text-foreground'}`}>
                            {msg.role === 'system' ? (
                                <div className="space-y-4">
                                    <div className="flex items-start gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-background flex items-center justify-center flex-shrink-0 border border-border/50">
                                            <BookOpen className="w-5 h-5 text-[#00c8b6]" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-foreground">Luna's Generation Complete!</h4>
                                            <p className="text-xs text-muted-foreground leading-relaxed mt-1">
                                                Hi,I've successfully structured your course module with
                                            </p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 bg-background/50 rounded-lg p-3 text-center border border-border/50">
                                        <div>
                                            <div className="font-bold text-[#00c8b6] text-lg">{module?.lessons?.length || 0}</div>
                                            <div className="text-[9px] uppercase font-bold tracking-wider text-muted-foreground mt-1">Lessons</div>
                                        </div>
                                        <div className="border-l border-border/50">
                                            <div className="font-bold text-[#00c8b6] text-lg">{module?.lessons?.reduce((acc: number, l: any) => acc + (l.chapters?.length || 0), 0) || 0}</div>
                                            <div className="text-[9px] uppercase font-bold tracking-wider text-muted-foreground mt-1">Chapters</div>
                                        </div>
                                    </div>
                                    <p className="text-xs text-foreground font-bold leading-relaxed mt-1">
                                        Here you can Enhance the Module
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <div className="whitespace-pre-wrap">{msg.text}</div>
                                    {msg.files && msg.files.length > 0 && (
                                        <div className="flex flex-wrap gap-2 mt-2">
                                            {msg.files.map((fileUrl, fidx) => {
                                                const isBlob = fileUrl.startsWith('blob:');
                                                const fileName = isBlob ? `Attachment ${fidx + 1}` : (fileUrl.split('/').pop() || 'File');
                                                const isImg = isBlob || /\.(png|jpg|jpeg|webp|gif)$/i.test(fileUrl);
                                                return (
                                                    <div key={fidx} className="flex items-center gap-2 bg-background/50 rounded-lg p-1.5 border border-border/30 text-xs max-w-full">
                                                        {isImg ? (
                                                            <img src={fileUrl} alt="attachment" className="h-10 w-10 object-cover rounded border" />
                                                        ) : (
                                                            <FileText className="h-5 w-5 text-[#00c8b6]" />
                                                        )}
                                                        <span className="truncate text-[11px] font-medium text-foreground max-w-[120px]">{fileName}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            )}
                            {msg.role === 'assistant' && msg.requiresConfirmation && (
                                <div className="mt-3 flex items-center gap-2">
                                    <Button 
                                        size="sm" 
                                        className="bg-[#00c8b6] hover:bg-[#00c8b6]/90 text-black text-xs h-8"
                                        disabled={msg.status !== 'pending'}
                                        onClick={() => handleConfirmAction(idx, 'accepted')}
                                    >
                                        {msg.status === 'accepted' ? 'Proceeded' : 'Proceed'}
                                    </Button>
                                    <Button 
                                        size="sm" 
                                        variant="outline"
                                        className="text-xs h-8 border-destructive/20 hover:bg-destructive/10 text-destructive"
                                        disabled={msg.status !== 'pending'}
                                        onClick={() => handleConfirmAction(idx, 'rejected')}
                                    >
                                        {msg.status === 'rejected' ? 'Rejected' : 'Reject'}
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
                
                {isGenerating && (
                    <div className="flex flex-col items-start animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="text-xs text-muted-foreground mb-1">Luna</div>
                        <div className="flex items-center gap-2.5 p-3 rounded-xl bg-muted max-w-[90%] text-sm">
                            <div className="flex gap-1 shrink-0">
                                <span className="h-1.5 w-1.5 bg-[#00c8b6] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                <span className="h-1.5 w-1.5 bg-[#00c8b6] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                <span className="h-1.5 w-1.5 bg-[#00c8b6] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                            </div>
                            <span className="text-xs text-muted-foreground font-medium italic animate-pulse">{generatingProgress}</span>
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
                </div>
            </ScrollArea>

            {/* Chat Input */}
            <div className="p-4 border-t bg-muted/30">
                <div className="relative flex flex-col w-full bg-background border border-[#00c8b6]/30 rounded-xl transition-colors focus-within:ring-1 focus-within:ring-[#00c8b6] focus-within:border-[#00c8b6]">
                    
                    {/* Attachments Preview Area */}
                    {attachedFiles.length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-3 px-3 pb-0">
                            {attachedFiles.map((file, i) => (
                                <div key={i} className="relative group">
                                    <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center overflow-hidden border">
                                        {file.type.startsWith('image/') ? (
                                            <img src={URL.createObjectURL(file)} alt="attachment" className="h-full w-full object-cover" />
                                        ) : (
                                            <FileText className="h-6 w-6 text-muted-foreground" />
                                        )}
                                    </div>
                                    <button 
                                        className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                                        onClick={() => setAttachedFiles(prev => prev.filter((_, idx) => idx !== i))}
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="relative flex items-end w-full">
                        <input 
                            type="file" 
                            ref={fileInputRef}
                            className="hidden" 
                            accept="image/*,.pdf,.doc,.docx"
                            multiple
                            onChange={(e) => {
                                if (e.target.files && e.target.files.length > 0) {
                                    const newFiles = Array.from(e.target.files);
                                    setAttachedFiles(prev => [...prev, ...newFiles]);
                                    // Reset input so the same file can be selected again
                                    e.target.value = '';
                                }
                            }}
                        />
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute left-2 bottom-[6px] z-10 h-8 w-8 rounded-full bg-muted/50 hover:bg-muted text-muted-foreground transition-colors"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <Plus className="w-4 h-4" />
                        </Button>
                        <Textarea
                            ref={textareaRef}
                            value={chatInput}
                            onChange={(e) => setChatInput(e.target.value)}
                            placeholder="Type your message here..."
                            onKeyDown={handleKeyPress}
                            rows={1}
                            className="w-full bg-transparent border-0 pl-11 pr-12 py-3 text-sm focus-visible:ring-0 resize-none min-h-[44px] max-h-[120px] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none'] shadow-none"
                            onInput={(e) => {
                                const target = e.currentTarget;
                                target.style.height = 'auto';
                                target.style.height = Math.min(target.scrollHeight, 120) + 'px';
                            }}
                        />
                        <Button
                            size="icon"
                            className="absolute right-1 bottom-1 h-9 w-10 bg-transparent hover:bg-[#00c8b6]/20 text-[#00c8b6] disabled:opacity-50 disabled:cursor-not-allowed"
                            onClick={handleSendMsg}
                            disabled={(!chatInput.trim() && attachedFiles.length === 0) || isGenerating || isProcessingAiChanges}
                        >
                            <Send className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}


export default function AdminModuleDetail() {
    const params = useParams<{ moduleName: string }>();
    const [, setLocation] = useLocation();
    const moduleName = params.moduleName;
    const [isLoading, setIsLoading] = useState(true);
    const [module, setModule] = useState<Module | null>(null);
    const [currentLessonIdx, setCurrentLessonIdx] = useState(0);
    const [currentChapterIdx, setCurrentChapterIdx] = useState(0);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [showIngestConfirm, setShowIngestConfirm] = useState(false);
    const [isIngesting, setIsIngesting] = useState(false);
    const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
    const [isRemoving, setIsRemoving] = useState(false);

    // AI Chat State
    const [isAiChatOpen, setIsAiChatOpen] = useState(false);
    const [isProcessingAiChanges, setIsProcessingAiChanges] = useState(false);

    const { data: moduleDocData, mutate: mutateModuleDoc } = useFrappeGetDoc("LMS Module", moduleName || "");
    const { call: triggerIngestion } = useFrappePostCall("novel_lms.lms_ai_bot.api.api.start_module_ingestion_v2");
    const { call: triggerRemoval } = useFrappePostCall("novel_lms.lms_ai_bot.api.api.remove_module_from_ai");
    const { updateDoc } = useFrappeUpdateDoc();

    const handleIngestToAI = async () => {
        if (!moduleName) return;
        setIsIngesting(true);
        toast.loading("Scheduling Module AI Ingestion...", { id: "ingestion" });
        try {
            await triggerIngestion({ module_id: moduleName });
            toast.success("Successfully added for AI Ingestion", { id: "ingestion" });
            await updateDoc("LMS Module", moduleName, { is_injest: 1 }).catch(console.error);
            mutateModuleDoc();
        } catch (error: any) {
            console.error("AI Ingestion error:", error);
            toast.error(error.message || "Failed to trigger AI ingestion.", { id: "ingestion" });
        } finally {
            setIsIngesting(false);
            setShowIngestConfirm(false);
        }
    };

    const handleRemoveFromAI = async () => {
        if (!moduleName) return;
        setIsRemoving(true);
        toast.loading("Scheduling Module AI Removal...", { id: "removal" });
        try {
            await triggerRemoval({ module_id: moduleName });
            toast.success("Successfully scheduled for AI Removal", { id: "removal" });
            await updateDoc("LMS Module", moduleName, { is_injest: 0 }).catch(console.error);
            mutateModuleDoc();
        } catch (error: any) {
            console.error("AI Removal error:", error);
            toast.error(error.message || "Failed to trigger AI removal.", { id: "removal" });
        } finally {
            setIsRemoving(false);
            setShowRemoveConfirm(false);
        }
    };

    // Use get_module_with_details API for admin users instead of LearnerModuleData
    const { data: moduleDataResponse, error: moduleListError, isLoading: moduleDataLoading, mutate: mutateModuleDetails } = useFrappeGetCall<any>(
        'novel_lms.novel_lms.api.module_management.get_module_with_details', {
        module_id: moduleName
    }, {
        enabled: !!moduleName
    });

    // Reset module state when moduleName changes
    useEffect(() => {
        setModule(null);
        setCurrentLessonIdx(0);
        setCurrentChapterIdx(0);
        setIsLoading(true);
    }, [moduleName]);

    useEffect(() => {
        if (moduleDataResponse && !moduleDataLoading) {
            const response = moduleDataResponse as any;
            let moduleData = null;

            // Handle get_module_with_details response format
            // The API returns data in frappe.response["data"], which frappe-react-sdk wraps
            // Try multiple response paths
            let data = null;
            if (response?.message) {
                data = response.message;
            } else if (response?.data) {
                data = response.data;
            } else if (response?.lessons) {
                data = response;
            }

            // Process data if it exists - the API should return the correct module based on module_id parameter
            // But verify it matches the requested moduleName for safety
            if (data) {
                if (data.lessons && Array.isArray(data.lessons)) {
                    // Transform the response to match the expected Module interface
                    moduleData = {
                        name: data.id || moduleName,
                        name1: data.name || '',
                        description: data.description || '',
                        lessons: data.lessons.map((lesson: any) => ({
                            name: lesson.id || lesson.name,
                            lesson_name: lesson.lesson_name || lesson.name || lesson.title || '',
                            chapters: (lesson.chapters || []).map((chapter: any) => ({
                                name: chapter.id || chapter.name,
                                title: chapter.title || chapter.name || '',
                                contents: (chapter.contents || []).map((content: any) => ({
                                    name: content.id || content.name || content.content_reference,
                                    content_type: content.content_type || content.type,
                                    content_reference: content.content_reference || content.id || content.name,
                                    data: content.data || content
                                }))
                            }))
                        })),
                        image: data.image
                    };
                }
            }

            if (moduleData) {
                // console.log('AdminModuleDetail - Successfully parsed module data:', moduleData);
                setModule(moduleData);
                setIsLoading(false);
            } else {
                console.error('AdminModuleDetail - Could not parse module data. Response structure:', {
                    response,
                    hasMessage: !!response?.message,
                    hasData: !!response?.data,
                    hasLessons: !!response?.lessons,
                    messageLessons: response?.message?.lessons,
                    dataLessons: response?.data?.lessons,
                    moduleName,
                    dataId: data?.id,
                    dataName: data?.name
                });
                setIsLoading(false);
            }
        }
    }, [moduleDataResponse, moduleDataLoading, moduleName]);

    useEffect(() => {
        if (moduleDataResponse || moduleListError) {
            setIsLoading(false);
        }
    }, [moduleDataResponse, moduleListError]);

    // Handle module deletion
    const handleDeleteModule = async () => {
        if (!moduleName) return;

        setIsDeleting(true);
        try {
            // Use direct fetch with correct base URL to ensure it uses lms.noveloffice.org
            const apiBaseUrl = LMS_API_BASE_URL || '';
            const cleanBaseUrl = apiBaseUrl.replace(/\/$/, '');
            const apiUrl = cleanBaseUrl
                ? `${cleanBaseUrl}/api/method/novel_lms.novel_lms.api.module_management.delete_module_with_cascade`
                : `/api/method/novel_lms.novel_lms.api.module_management.delete_module_with_cascade`;

            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                    module_name: moduleName
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || errorData.exc || `HTTP error! status: ${response.status}`);
            }

            await response.json();

            toast.success("Module deleted successfully", {
                description: "All related data (lessons, chapters, contents, and progress) has been removed."
            });

            // Navigate back to modules list
            setLocation(ROUTES.MODULES);
        } catch (error: any) {
            console.error("Error deleting module:", error);

            // Extract error message from various possible error formats
            let errorMessage = "An error occurred while deleting the module.";
            if (error?.message) {
                errorMessage = error.message;
            } else if (error?.exc) {
                errorMessage = error.exc;
            } else if (typeof error === 'string') {
                errorMessage = error;
            } else if (error?.response?.message) {
                errorMessage = error.response.message;
            } else if (error?.exception) {
                errorMessage = error.exception;
            }

            toast.error("Failed to delete module", {
                description: errorMessage,
                duration: 5000
            });
        } finally {
            setIsDeleting(false);
            setShowDeleteDialog(false);
        }
    };

    // Loading state
    if (isLoading || moduleDataLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-full">
                <Lottie animationData={loadingAnimation} loop style={{ width: 120, height: 120 }} />
                <div className="mt-4 text-muted-foreground">Loading module details...</div>
            </div>
        );
    }

    // Error state
    if (moduleListError) {
        return (
            <div className="flex flex-col items-center justify-center h-full">
                <Lottie animationData={errorAnimation} loop style={{ width: 120, height: 120 }} />
                <div className="mt-4 text-red-500">Error loading module details.</div>
            </div>
        );
    }

    // Module not found
    if (!module) {
        return (
            <div className="flex flex-col items-center justify-center h-full">
                <Lottie animationData={emptyAnimation} loop style={{ width: 180, height: 180 }} />
                <div className="mt-4 text-muted-foreground">Module not found</div>
            </div>
        );
    }

    const currentLesson = module.lessons?.[currentLessonIdx];
    const currentChapter = currentLesson?.chapters?.[currentChapterIdx];
    const isFirst = currentLessonIdx === 0 && currentChapterIdx === 0;
    const isLast = currentLessonIdx === (module.lessons?.length ?? 0) - 1 &&
        currentChapterIdx === (currentLesson?.chapters?.length ?? 0) - 1;

    // Sidebar click handlers for admin
    const handleLessonClick = (lessonName: string) => {
        if (!module?.lessons?.length) return;
        const lessonIdx = module.lessons.findIndex(l => l.name === lessonName);
        if (lessonIdx !== -1) {
            setCurrentLessonIdx(lessonIdx);
            setCurrentChapterIdx(0);
        }
    };

    const handleChapterClick = (lessonName: string, chapterName: string) => {
        if (!module?.lessons?.length) return;
        const lessonIdx = module.lessons.findIndex(l => l.name === lessonName);
        if (lessonIdx !== -1) {
            const lesson = module.lessons[lessonIdx];
            const chapterIdx = lesson?.chapters?.findIndex(c => c.name === chapterName) ?? -1;
            if (chapterIdx !== -1) {
                setCurrentLessonIdx(lessonIdx);
                setCurrentChapterIdx(chapterIdx);
            }
        }
    };

    // UI-only navigation
    const handlePrevious = () => {
        if (!module?.lessons?.length) return;
        let lessonIdx = currentLessonIdx;
        let chapterIdx = currentChapterIdx;
        if (chapterIdx > 0) {
            chapterIdx -= 1;
        } else if (lessonIdx > 0) {
            lessonIdx -= 1;
            chapterIdx = module.lessons[lessonIdx].chapters.length - 1;
        }
        setCurrentLessonIdx(lessonIdx);
        setCurrentChapterIdx(chapterIdx);
    };

    const handleNext = () => {
        if (!module?.lessons?.length) return;
        let lessonIdx = currentLessonIdx;
        let chapterIdx = currentChapterIdx;
        const currentLesson = module.lessons[lessonIdx];
        if (chapterIdx < currentLesson.chapters.length - 1) {
            chapterIdx += 1;
        } else if (lessonIdx < module.lessons.length - 1) {
            lessonIdx += 1;
            chapterIdx = 0;
        }
        setCurrentLessonIdx(lessonIdx);
        setCurrentChapterIdx(chapterIdx);
    };

    // Main render
    return (
        <>
            <div className={`flex min-h-screen bg-muted w-full transition-all duration-300 ${isAiChatOpen ? 'gap-0' : 'gap-6'}`}>
                {/* Sidebar on the left */}
                <div className={`border-r flex-shrink-0 transition-all duration-300 overflow-hidden ${isAiChatOpen ? 'w-0 opacity-0' : 'w-80 opacity-100'}`}>
                    <ModuleSidebar
                        module={module}
                        progress={null}
                        started={true}
                        overallProgress={0}
                        onLessonClick={handleLessonClick}
                        onChapterClick={handleChapterClick}
                        currentLessonName={currentLesson?.name}
                        currentChapterName={currentChapter?.name}
                        mode='admin'
                        completionData={undefined}
                        isAccessible={() => true}
                    />
                </div>
                {/* Main Content */}
                <div className="flex-1 flex justify-center items-start p-8 min-w-0">
                    <div className="w-full rounded-xl shadow p-8 bg-card">
                        {isProcessingAiChanges ? (
                            <AiProcessingView />
                        ) : (
                            <div className="space-y-8">
                            {/* Admin Preview Indicator and Delete Button - Always Visible */}
                            <div className="flex items-center justify-between">
                                <div>
                                    {currentLesson && currentChapter ? (
                                        <>
                                            <h2 className="text-2xl font-bold mb-2">{currentLesson.lesson_name}</h2>
                                            <h3 className="text-xl font-semibold">{currentChapter.title}</h3>
                                        </>
                                    ) : (
                                        <div>
                                            <h2 className="text-2xl font-bold mb-2">{module.name1}</h2>
                                            <h3 className="text-xl font-semibold text-muted-foreground">
                                                {module.lessons?.length === 0
                                                    ? "No lessons or chapters yet"
                                                    : "Select a lesson and chapter to view content"}
                                            </h3>
                                        </div>
                                    )}
                                </div>
                                <div className="flex items-center gap-3">
                                    {!isAiChatOpen && (
                                        <div
                                            className="flex items-center gap-2 text-sm text-foreground bg-muted/50 px-4 py-2 rounded-md cursor-pointer hover:bg-muted/80 transition-colors border border-border"
                                            onClick={() => setIsAiChatOpen(true)}
                                        >
                                            <WandSparkles className="h-4 w-4" />
                                            <span>Enhance with AI</span>
                                        </div>
                                    )}
                                    {moduleDocData?.is_injest === 1 && (
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="outline"
                                            className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 flex items-center gap-2"
                                            onClick={() => setShowRemoveConfirm(true)}
                                            disabled={isRemoving}
                                        >
                                            <div className="flex flex-col items-center justify-center leading-none" style={{ height: '14px', gap: '-2px' }}>
                                                <Bot className={`${isRemoving ? "animate-spin" : ""}`} style={{ height: '10px', width: '10px' }} />
                                                <ArrowDown className="stroke-[3]" style={{ height: '6px', width: '6px', marginTop: '-2px' }} />
                                            </div>
                                            Remove from AI
                                        </Button>
                                    )}
                                    <Button
                                        type="button"
                                        size="sm"
                                        className="flex items-center gap-2"
                                        onClick={() => setShowIngestConfirm(true)}
                                        disabled={isIngesting}
                                    >
                                        <div className="flex flex-col items-center justify-center leading-none" style={{ height: '14px', gap: '-2px' }}>
                                            <Bot className={`${isIngesting ? "animate-pulse" : ""}`} style={{ height: '10px', width: '10px' }} />
                                            <ArrowUp className={`stroke-[3] ${isIngesting ? "animate-bounce" : ""}`} style={{ height: '6px', width: '6px', marginTop: '-2px' }} />
                                        </div>
                                        {moduleDocData?.is_injest === 1 ? "Re-ingest to AI" : "Ingest to AI"}
                                    </Button>
                                    <Button
                                        variant="destructive"
                                        size="sm"
                                        onClick={() => setShowDeleteDialog(true)}
                                        className="gap-2"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                        Delete Module
                                    </Button>
                                </div>
                            </div>

                            {/* Chapter Contents - Only show if lesson and chapter exist */}
                            {currentLesson && currentChapter && (
                                <>
                                    {currentChapter.contents && currentChapter.contents.length > 0 && (
                                        <div className="space-y-6">
                                            {currentChapter.contents.map((content) => (
                                                <ContentRenderer
                                                    key={content.name}
                                                    contentType={content.content_type}
                                                    contentReference={content.content_reference || content.name}
                                                    moduleId={module.name}
                                                    contentData={content.data}
                                                />
                                            ))}
                                        </div>
                                    )}

                                    {/* Navigation */}
                                    <div className="flex justify-between items-center mt-8 pt-6 border-t">
                                        <Button
                                            onClick={handlePrevious}
                                            disabled={isFirst}
                                            variant="outline"
                                            className="gap-2"
                                        >
                                            <ArrowLeft className="h-4 w-4" />
                                            Previous
                                        </Button>
                                        <div className="text-sm text-muted-foreground">
                                            Lesson {currentLessonIdx + 1} of {module.lessons.length} •
                                            Chapter {currentChapterIdx + 1} of {currentLesson.chapters.length}
                                        </div>
                                        <Button
                                            onClick={handleNext}
                                            disabled={isLast}
                                            className="gap-2"
                                        >
                                            Next
                                            <ArrowRight className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </>
                            )}
                        </div>
                        )}
                    </div>
                </div>

                {/* AI Chat Right Sidebar */}
                <AiChatSidebar 
                    isOpen={isAiChatOpen} 
                    onClose={() => setIsAiChatOpen(false)} 
                    module={module} 
                    onProcessingStart={() => setIsProcessingAiChanges(true)} 
                    onProcessingComplete={() => setIsProcessingAiChanges(false)}
                    isProcessingAiChanges={isProcessingAiChanges}
                    onRefreshModule={mutateModuleDetails}
                />
            </div>

            {/* Delete Confirmation Dialog */}
            <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Module</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete this module? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 space-y-2">
                            <p className="text-sm font-semibold text-destructive">Warning: This will permanently delete:</p>
                            <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                                <li>All lessons and chapters</li>
                                <li>All content (Quiz, Question Answer, Text, Image, Video, etc.)</li>
                                <li>All progress tracking records (if published)</li>
                                <li>All learner assignments</li>
                            </ul>
                        </div>
                        <p className="text-sm text-muted-foreground mt-4">
                            Module: <span className="font-semibold">{module.name1 || moduleName}</span>
                        </p>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setShowDeleteDialog(false)}
                            disabled={isDeleting}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDeleteModule}
                            disabled={isDeleting}
                        >
                            {isDeleting ? "Deleting..." : "Delete Module"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* AI Ingestion Confirmation Dialog */}
            <Dialog open={showIngestConfirm} onOpenChange={setShowIngestConfirm}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Ingest to AI</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to ingest this module's content to the AI? This will update the AI knowledge base with the latest content.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setShowIngestConfirm(false)}
                            disabled={isIngesting}
                        >
                            No
                        </Button>
                        <Button
                            onClick={handleIngestToAI}
                            disabled={isIngesting}
                        >
                            Yes
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* AI Removal Confirmation Dialog */}
            <Dialog open={showRemoveConfirm} onOpenChange={setShowRemoveConfirm}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Remove from AI</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to remove this module's content from the AI? This will delete the module's data from the AI knowledge base.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setShowRemoveConfirm(false)}
                            disabled={isRemoving}
                        >
                            No
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleRemoveFromAI}
                            disabled={isRemoving}
                        >
                            Yes
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
