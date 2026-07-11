
import { MessageSquare, Send, User, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useRef, useEffect } from "react";
import { useFrappePostCall } from "frappe-react-sdk";
import { toast } from "sonner";

export default function ChatPage() {
  const [messages, setMessages] = useState<{ role: 'user' | 'lumi', content: string }[]>([
    { role: 'lumi', content: "Hello! I am Lumi 1. How can I assist you with your department's knowledge today?" }
  ]);
  const [input, setInput] = useState("");
  const endOfMessagesRef = useRef<HTMLDivElement>(null);

  const { call: askLumi, loading: isAsking } = useFrappePostCall("novel_lms.lumi_backend.api.ask_lumi");

  const scrollToBottom = () => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = input.trim();
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setInput("");

    try {
      const response = await askLumi({ query: userMessage });
      // In the stub API it returns {"status": "success", "answer": "Stub answer"}
      const answer = response.message?.answer || response.answer || "Sorry, I couldn't process that request.";
      setMessages(prev => [...prev, { role: 'lumi', content: answer }]);
    } catch (error) {
      console.error(error);
      toast.error("Failed to communicate with Lumi.");
      setMessages(prev => [...prev, { role: 'lumi', content: "I'm having trouble connecting right now. Please try again later." }]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };
  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-4rem)] bg-background">
      <div className="p-6 border-b">
        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <MessageSquare className="w-6 h-6 text-primary" />
          Lumi 1 Chat
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Interact with your departmental knowledge base.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <div className="flex flex-col gap-4">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex items-start gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-primary/10 text-primary'
              }`}>
                {msg.role === 'user' ? <User className="w-4 h-4" /> : <MessageSquare className="w-4 h-4" />}
              </div>
              <div className={`p-4 rounded-2xl border shadow-sm max-w-[80%] ${
                msg.role === 'user' ? 'bg-primary text-primary-foreground rounded-tr-none' : 'bg-card rounded-tl-none prose dark:prose-invert max-w-none'
              }`}>
                {msg.role === 'user' ? (
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                ) : (
                  <div className="text-sm" dangerouslySetInnerHTML={{ __html: msg.content }} />
                )}
              </div>
            </div>
          ))}
          {isAsking && (
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-primary">
                <MessageSquare className="w-4 h-4" />
              </div>
              <div className="bg-card p-4 rounded-2xl rounded-tl-none border shadow-sm max-w-[80%] flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Lumi is thinking...</span>
              </div>
            </div>
          )}
          <div ref={endOfMessagesRef} />
        </div>
      </div>

      <div className="p-4 border-t bg-card/50">
        <div className="max-w-4xl mx-auto flex gap-2">
          <Input 
            placeholder="Ask Lumi..." 
            className="flex-1 bg-background"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isAsking}
          />
          <Button 
            className="shrink-0 rounded-full w-10 h-10 p-0 flex items-center justify-center"
            onClick={handleSend}
            disabled={!input.trim() || isAsking}
          >
            {isAsking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
}
