"use client";

import * as React from "react";
import { Heart, Reply, Trash2, Send, Loader2, Pin, MessageCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";

type Comment = {
  id: string; content: string; likes: number; isPinned: boolean; isFake: boolean;
  createdAt: string;
  user: { id: string; name: string; avatar?: string };
  replies: Comment[];
};

export function CommentsSection({ targetType, targetId, currentUserId }: { targetType: string; targetId: string; currentUserId?: string }) {
  const [comments, setComments] = React.useState<Comment[]>([]);
  const [total, setTotal] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [newComment, setNewComment] = React.useState("");
  const [posting, setPosting] = React.useState(false);
  const [replyingTo, setReplyingTo] = React.useState<string | null>(null);
  const [replyContent, setReplyContent] = React.useState("");

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/comments?targetType=${targetType}&targetId=${targetId}`);
      const d = await res.json();
      setComments(d.comments || []);
      setTotal(d.total || 0);
    } catch {} finally { setLoading(false); }
  };

  React.useEffect(() => { load(); }, [targetType, targetId]);

  const post = async (content: string, parentId?: string) => {
    if (!content.trim() || content.length < 2) return;
    setPosting(true);
    try {
      const res = await fetch("/api/comments", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetType, targetId, content, parentId }),
      });
      if (res.ok) { setNewComment(""); setReplyContent(""); setReplyingTo(null); load(); }
    } catch {} finally { setPosting(false); }
  };

  const like = async (id: string) => {
    setComments(prev => prev.map(c => c.id === id ? { ...c, likes: c.likes + 1 } : c));
    await fetch(`/api/comments/${id}/like`, { method: "POST" }).catch(() => {});
  };

  const del = async (id: string) => {
    if (!confirm("حذف التعليق؟")) return;
    await fetch(`/api/comments/${id}`, { method: "DELETE" });
    load();
  };

  const timeAgo = (date: string) => {
    const d = Date.now() - new Date(date).getTime();
    const m = Math.floor(d / 60000);
    if (m < 1) return "الآن";
    if (m < 60) return `قبل ${m} دقيقة`;
    const h = Math.floor(m / 60);
    if (h < 24) return `قبل ${h} ساعة`;
    return `قبل ${Math.floor(h / 24)} يوم`;
  };

  return (
    <div dir="rtl" className="space-y-3">
      {/* Input */}
      {currentUserId ? (
        <div className="flex gap-2">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="أضف تعليقاً..."
            rows={2}
            className="flex-1 p-2.5 border rounded-lg bg-background resize-none text-sm"
            maxLength={2000}
          />
          <Button onClick={() => post(newComment)} disabled={posting || newComment.length < 2} size="sm" className="self-end">
            {posting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </div>
      ) : (
        <div className="p-3 bg-muted rounded-lg text-center text-sm text-muted-foreground">
          <a href="/login" className="text-primary font-bold">سجّل الدخول</a> للتعليق
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-white" /></div>
      ) : comments.length === 0 ? (
        <p className="text-center text-white/60 text-sm py-4">لا توجد تعليقات بعد</p>
      ) : (
        <div className="space-y-3 max-h-[50vh] overflow-y-auto">
          <AnimatePresence>
            {comments.map((c) => (
              <motion.div key={c.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-2">
                <img
                  src={c.user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(c.user.name)}&background=FE2C55&color=fff&size=64`}
                  className="w-8 h-8 rounded-full flex-shrink-0"
                  alt=""
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-bold text-xs text-white">{c.user.name}</span>
                    {c.isFake && <span className="text-[8px] px-1.5 py-0.5 bg-amber-500/20 text-amber-400 rounded-full">مميز</span>}
                    {c.isPinned && <Pin className="w-2.5 h-2.5 text-primary" />}
                    <span className="text-[10px] text-white/40">{timeAgo(c.createdAt)}</span>
                  </div>
                  <p className="text-xs text-white/90 mb-1">{c.content}</p>
                  <div className="flex items-center gap-3">
                    <button onClick={() => like(c.id)} className="flex items-center gap-1 text-[10px] text-white/50 hover:text-red-400">
                      <Heart className="w-2.5 h-2.5" />{c.likes}
                    </button>
                    <button onClick={() => setReplyingTo(replyingTo === c.id ? null : c.id)} className="text-[10px] text-white/50 hover:text-primary">
                      <Reply className="w-2.5 h-2.5 inline" /> رد
                    </button>
                    {currentUserId && (
                      <button onClick={() => del(c.id)} className="text-[10px] text-white/50 hover:text-red-400">
                        <Trash2 className="w-2.5 h-2.5" />
                      </button>
                    )}
                  </div>
                  {replyingTo === c.id && (
                    <div className="mt-2 flex gap-1">
                      <textarea value={replyContent} onChange={(e) => setReplyContent(e.target.value)} placeholder="رد..." rows={1} className="flex-1 p-1.5 border rounded text-xs bg-background resize-none" />
                      <Button size="sm" onClick={() => post(replyContent, c.id)} disabled={posting || replyContent.length < 2}><Send className="w-3 h-3" /></Button>
                    </div>
                  )}
                  {c.replies && c.replies.length > 0 && (
                    <div className="mt-2 space-y-2 pe-2 border-e border-white/10">
                      {c.replies.map((r) => (
                        <div key={r.id} className="flex gap-1.5">
                          <img src={r.user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(r.user.name)}&background=8B5CF6&color=fff&size=64`} className="w-6 h-6 rounded-full flex-shrink-0" alt="" />
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-[10px] text-white">{r.user.name}</span>
                              <span className="text-[8px] text-white/40">{timeAgo(r.createdAt)}</span>
                            </div>
                            <p className="text-[10px] text-white/80">{r.content}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
      {total > 0 && <p className="text-center text-[10px] text-white/40">{total} تعليق</p>}
    </div>
  );
}
