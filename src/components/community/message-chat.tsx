"use client";
import * as React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, MessageCircle } from "lucide-react";
import { toast } from "sonner";

interface Partner { id: string; name: string; lastMessage: string; createdAt: string }

export function MessageChat({ conversations, currentUserId }: { conversations: Partner[]; currentUserId: string }) {
  const [activeId, setActiveId] = React.useState<string | null>(conversations[0]?.id ?? null);
  const [messages, setMessages] = React.useState<{ id: string; content: string; senderId: string; createdAt: string }[]>([]);
  const [input, setInput] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (!activeId) return;
    setLoading(true);
    fetch(`/api/community/messages?userId=${activeId}`).then(r => r.json()).then(d => {
      setMessages(d?.messages ?? []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [activeId]);

  const send = async () => {
    if (!input.trim() || !activeId) return;
    setInput("");
    try {
      await fetch("/api/community/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receiverId: activeId, content: input }),
      });
      setMessages(p => [...p, { id: Date.now().toString(), content: input, senderId: currentUserId, createdAt: new Date().toISOString() }]);
    } catch { toast.error("فشل الإرسال"); }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-4 h-[70vh]">
      <div className="border border-border rounded-lg overflow-hidden">
        <ScrollArea className="h-full">
          {conversations.map(p => (
            <button key={p.id} onClick={() => setActiveId(p.id)} className={`w-full text-start p-3 border-b border-border hover:bg-muted/50 transition-colors ${activeId === p.id ? "bg-primary/10" : ""}`}>
              <p className="font-medium text-sm">{p.name}</p>
              <p className="text-xs text-muted-foreground truncate">{p.lastMessage}</p>
            </button>
          ))}
        </ScrollArea>
      </div>
      <div className="border border-border rounded-lg flex flex-col">
        {activeId ? (
          <>
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-3">
                {messages.map(m => (
                  <div key={m.id} className={`flex ${m.senderId === currentUserId ? "justify-start" : "justify-end"}`}>
                    <div className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${m.senderId === currentUserId ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                      {m.content}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
            <div className="border-t border-border p-3 flex gap-2">
              <Input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && send()} placeholder="اكتب رسالة..." className="flex-1" />
              <Button size="icon" onClick={send} disabled={!input.trim()}><Send className="size-4" /></Button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <MessageCircle className="size-8 mb-2" />
            <p>اختر محادثة</p>
          </div>
        )}
      </div>
    </div>
  );
}
