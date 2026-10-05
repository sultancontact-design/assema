"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Send, Bot, User, Loader2, Trash2, Volume2 } from "lucide-react";
import { toast } from "sonner";

interface Message {
  role: "user" | "assistant";
  content: string;
  ts: number;
}

interface Props {
  sampleQuestions: { q: string; tag: string }[];
}

export function AssistantChat({ sampleQuestions }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [audioLoading, setAudioLoading] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  async function send(text: string) {
    const msg = text.trim();
    if (!msg || loading) return;

    const userMsg: Message = { role: "user", content: msg, ts: Date.now() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      // Build history (last 12, excluding the just-added user msg)
      const history = messages.slice(-12).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const r = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg, history }),
      });

      if (!r.ok) {
        throw new Error("Network response not ok");
      }
      const data = await r.json();
      const aiMsg: Message = {
        role: "assistant",
        content: data.response ?? "عذراً، لم أتمكن من الرد.",
        ts: Date.now(),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (e: any) {
      toast.error("تعذّر الاتصال بالمساعد. حاول مجدداً");
      setMessages((prev) =>
        prev.filter((m) => m.ts !== userMsg.ts)
      );
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  }

  function clearChat() {
    setMessages([]);
    setInput("");
    toast.success("تم مسح المحادثة");
  }

  async function speak(msg: Message, idx: number) {
    if (audioLoading !== null) return;
    setAudioLoading(idx);
    try {
      // TTS endpoint takes text and returns audio/wav
      const r = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: msg.content.slice(0, 1000), voice: "tongtong" }),
      });
      if (!r.ok) throw new Error("TTS failed");
      const blob = await r.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audio.onended = () => URL.revokeObjectURL(url);
      audio.play().catch(() => toast.error("تعذّر تشغيل الصوت"));
    } catch (e) {
      toast.error("خدمة النطق غير متاحة حالياً");
    } finally {
      setAudioLoading(null);
    }
  }

  return (
    <Card className="border-teal-300/60 shadow-md">
      <CardHeader className="flex flex-row items-center justify-between bg-gradient-to-l from-teal-50/50 to-transparent dark:from-teal-950/20">
        <CardTitle className="flex items-center gap-2 text-base">
          <div className="h-9 w-9 rounded-full bg-teal-700 text-white flex items-center justify-center">
            <Bot className="h-5 w-5" />
          </div>
          <div>
            <span className="block">وَصَّال</span>
            <span className="text-xs font-normal text-muted-foreground">مساعد وَصَل الذكي</span>
          </div>
        </CardTitle>
        {messages.length > 0 && (
          <Button onClick={clearChat} variant="ghost" size="sm" className="gap-1">
            <Trash2 className="h-4 w-4" />
            مسح
          </Button>
        )}
      </CardHeader>
      <CardContent className="p-0">
        {/* Messages */}
        <div
          ref={scrollRef}
          className="h-[400px] overflow-y-auto p-4 space-y-4 bg-muted/20"
          aria-live="polite"
        >
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6">
              <div className="h-16 w-16 rounded-full bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center mb-3">
                <Bot className="h-8 w-8 text-teal-700 dark:text-teal-300" />
              </div>
              <h3 className="font-semibold mb-1">مرحباً، أنا وَصَّال</h3>
              <p className="text-sm text-muted-foreground mb-4 max-w-sm">
                اسألني أي سؤال عن المنصة، الجمعيات، التعاونيات، أو الإجراءات الإدارية المغربية.
              </p>
              <div className="flex flex-wrap gap-2 max-w-xl">
                {sampleQuestions.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => send(q.q)}
                    className="text-xs px-3 py-1.5 rounded-full border border-teal-300/60 bg-background hover:bg-teal-50 dark:hover:bg-teal-950/30 transition-colors flex items-center gap-1.5"
                  >
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                      {q.tag}
                    </Badge>
                    <span className="text-foreground">{q.q}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((m, i) => {
              const isUser = m.role === "user";
              return (
                <div
                  key={i}
                  className={`flex gap-2 ${isUser ? "flex-row-reverse" : "flex-row"}`}
                >
                  <div className={`h-8 w-8 rounded-full shrink-0 flex items-center justify-center text-white ${
                    isUser ? "bg-amber-600" : "bg-teal-700"
                  }`}>
                    {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                  </div>
                  <div className={`max-w-[80%] ${isUser ? "items-end" : "items-start"} flex flex-col gap-1`}>
                    <div className={`px-3 py-2 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                      isUser
                        ? "bg-amber-100 dark:bg-amber-900/30 text-amber-950 dark:text-amber-100 rounded-tr-sm"
                        : "bg-background border border-teal-200 dark:border-teal-900/50 rounded-tl-sm"
                    }`}>
                      {m.content}
                    </div>
                    {!isUser && (
                      <button
                        onClick={() => speak(m, i)}
                        disabled={audioLoading !== null}
                        className="text-xs text-muted-foreground hover:text-teal-700 dark:hover:text-teal-300 flex items-center gap-1 disabled:opacity-50"
                        aria-label="استمع للرد"
                      >
                        {audioLoading === i ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Volume2 className="h-3 w-3" />
                        )}
                        استمع
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
          {loading && (
            <div className="flex gap-2">
              <div className="h-8 w-8 rounded-full shrink-0 flex items-center justify-center bg-teal-700 text-white">
                <Bot className="h-4 w-4" />
              </div>
              <div className="px-3 py-2 rounded-2xl bg-background border border-teal-200 dark:border-teal-900/50 flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-teal-700" />
                <span className="text-sm text-muted-foreground">وَصَّال بيفكر...</span>
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="border-t border-border p-3 flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="اكتب سؤالك هنا... (Enter للإرسال)"
            rows={1}
            disabled={loading}
            className="flex-1 resize-none px-3 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/40 max-h-32"
            style={{ minHeight: "40px" }}
          />
          <Button
            onClick={() => send(input)}
            disabled={!input.trim() || loading}
            className="gap-2 shrink-0"
          >
            <Send className="h-4 w-4" />
            <span className="hidden sm:inline">إرسال</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
