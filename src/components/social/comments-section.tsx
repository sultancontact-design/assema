"use client";
import * as React from "react";
import { Heart, Reply, Trash2, Send, Loader2, Pin } from "lucide-react";
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
      setComments(d.comments || []); setTotal(d.total || 0);
    } catch {} finally { setLoading(false); }
  };

  React.useEffect(() => { load(); }, [targetType, targetId]);

  const post = async (content: string, parentId?: string) => {
    if (!content.trim() || content.length < 2) return;
    setPosting(true);
    try {
      const res = await fetch("/api/comments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ targetType, targetId, content, parentId }) });
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
    <section className="mt-8 border-t pt-6" dir="rtl">
      <h2 className="text-xl font-bold mb-4">التعليقات ({total})</h2>
      {currentUserId ? (
        <div className="flex gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-purple-600 flex-shrink-0" />
          <div className="flex-1">
            <textarea value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder="أضف تعليقاً..." rows={2} className="w-full p-3 border rounded-lg bg-background resize-none" maxLength={2000} />
            <div className="flex justify-between items-center mt-2">
              <span className="text-xs text-muted-foreground">{newComment.length}/2000</span>
              <Button onClick={() => post(newComment)} disabled={posting || newComment.length < 2} size="sm">{posting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} نشر</Button>
            </div>
          </div>
        </div>
      ) : (<div className="p-4 bg-muted rounded-lg text-center mb-6"><p className="text-sm text-muted-foreground"><a href="/login" className="text-primary font-bold">سجّل الدخول</a> للتعليق</p></div>)}
      {loading ? (<div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>)
      : comments.length === 0 ? (<p className="text-center text-muted-foreground py-8">لا توجد تعليقات بعد. كن أول من يعلق!</p>)
      : (<div className="space-y-4">
          <AnimatePresence>
            {comments.map((c) => (
              <motion.div key={c.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex gap-3">
                <img src={c.user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(c.user.name)}&background=FE2C55&color=fff`} className="w-10 h-10 rounded-full flex-shrink-0" alt="" />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-sm">{c.user.name}</span>
                    {c.isFake && <span className="text-[10px] px-2 py-0.5 bg-amber-500/20 text-amber-700 rounded-full">مميز</span>}
                    {c.isPinned && <Pin className="w-3 h-3 text-primary" />}
                    <span className="text-xs text-muted-foreground">{timeAgo(c.createdAt)}</span>
                  </div>
                  <p className="text-sm mb-2 whitespace-pre-wrap">{c.content}</p>
                  <div className="flex items-center gap-3 text-xs">
                    <button onClick={() => like(c.id)} className="flex items-center gap-1 text-muted-foreground hover:text-red-500"><Heart className="w-3 h-3" />{c.likes}</button>
                    <button onClick={() => setReplyingTo(replyingTo === c.id ? null : c.id)} className="flex items-center gap-1 text-muted-foreground hover:text-primary"><Reply className="w-3 h-3" />رد</button>
                    {(currentUserId === c.user.id || currentUserId) && <button onClick={() => del(c.id)} className="flex items-center gap-1 text-muted-foreground hover:text-destructive"><Trash2 className="w-3 h-3" /></button>}
                  </div>
                  {replyingTo === c.id && (
                    <div className="mt-3 flex gap-2">
                      <textarea value={replyContent} onChange={(e) => setReplyContent(e.target.value)} placeholder="اكتب رداً..." rows={2} className="flex-1 p-2 border rounded-lg text-sm bg-background resize-none" />
                      <Button size="sm" onClick={() => post(replyContent, c.id)} disabled={posting || replyContent.length < 2}><Send className="w-3 h-3" /></Button>
                    </div>
                  )}
                  {c.replies && c.replies.length > 0 && (
                    <div className="mt-3 space-y-3 pe-4 border-e-2 border-muted">
                      {c.replies.map((r) => (
                        <div key={r.id} className="flex gap-2">
                          <img src={r.user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(r.user.name)}&background=8B5CF6&color=fff`} className="w-7 h-7 rounded-full flex-shrink-0" alt="" />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1"><span className="font-bold text-xs">{r.user.name}</span><span className="text-xs text-muted-foreground">{timeAgo(r.createdAt)}</span></div>
                            <p className="text-xs">{r.content}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>)}
    </section>
  );
}
