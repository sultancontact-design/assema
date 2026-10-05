"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Vote, X, Send, Loader2, BarChart3, MapPin } from "lucide-react";
import { toast } from "sonner";

interface Poll {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  category: string;
  options: string; // JSON array
  totalVotes: number;
  expiresAt: string | null;
  createdAt: string | null;
  isAnonymous: boolean;
  regionName: string | null;
}

interface Props {
  initialPolls: Poll[];
  loggedIn: boolean;
  userId: string | null;
}

const CATEGORIES = [
  { key: "all", label: "الكل" },
  { key: "politics", label: "سياسة" },
  { key: "sports", label: "رياضة" },
  { key: "community", label: "مجتمع" },
  { key: "tech", label: "تكنولوجيا" },
  { key: "culture", label: "ثقافة" },
  { key: "other", label: "أخرى" },
];

function formatRelative(iso: string | null): string {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 60_000) return "الآن";
  if (diff < 3_600_000) return Math.floor(diff / 60_000) + " د";
  if (diff < 86_400_000) return Math.floor(diff / 3_600_000) + " س";
  return Math.floor(diff / 86_400_000) + " ي";
}

export function PollsClient({ initialPolls, loggedIn, userId }: Props) {
  const [polls, setPolls] = useState(initialPolls);
  const [category, setCategory] = useState("all");
  const [votedIds, setVotedIds] = useState<Set<string>>(new Set());
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "general",
    options: ["", ""], // start with 2 options
    isAnonymous: false,
    regionName: "",
    duration: 24,
  });

  const filtered = useMemo(
    () => category === "all" ? polls : polls.filter((p) => p.category === category),
    [polls, category]
  );

  async function vote(pollId: string, optionId: string) {
    if (!loggedIn) {
      toast.info("سجّل دخول للتصويت");
      return;
    }
    if (votedIds.has(pollId)) {
      toast.info("لقد صوّت بالفعل على هذا الاستطلاع");
      return;
    }
    setVotedIds((prev) => new Set(prev).add(pollId));

    try {
      const r = await fetch("/api/polls/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pollId, optionId }),
      });
      if (r.status === 409) {
        toast.info("لقد صوّت بالفعل");
        return;
      }
      if (!r.ok) throw new Error("vote failed");
      const data = await r.json();
      // Update local state
      setPolls((prev) =>
        prev.map((p) =>
          p.id === pollId
            ? { ...p, options: JSON.stringify(data.poll.options), totalVotes: data.poll.totalVotes }
            : p
        )
      );
      toast.success("تم تسجيل صوتك");
    } catch (e) {
      setVotedIds((prev) => { const s = new Set(prev); s.delete(pollId); return s; });
      toast.error("فشل التصويت");
    }
  }

  async function submitPoll(e: React.FormEvent) {
    e.preventDefault();
    if (form.title.length < 5) { toast.error("العنوان قصير"); return; }
    if (form.options.filter(o => o.trim()).length < 2) { toast.error("يلزم خياران على الأقل"); return; }
    setSubmitting(true);
    try {
      const r = await fetch("/api/polls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, options: form.options.filter(o => o.trim()) }),
      });
      if (!r.ok) {
        const err = await r.json().catch(() => ({}));
        throw new Error(err.error ?? "submit failed");
      }
      toast.success("تم نشر الاستطلاع");
      setForm({ title: "", description: "", category: "general", options: ["", ""], isAnonymous: false, regionName: "", duration: 24 });
      setShowForm(false);
      setTimeout(() => window.location.reload(), 1500);
    } catch (e: any) {
      toast.error(e.message ?? "فشل");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      {/* Filter bar */}
      <div className="flex flex-wrap gap-2 mb-4">
        {CATEGORIES.map((c) => (
          <button
            key={c.key}
            onClick={() => setCategory(c.key)}
            className={`text-xs px-3 py-1 rounded-full border transition-colors ${
              category === c.key
                ? "bg-teal-700 text-white border-teal-700"
                : "bg-background hover:bg-muted border-muted-foreground/30"
            }`}
          >{c.label}</button>
        ))}
        <Button onClick={() => { if (!loggedIn) { toast.info("سجّل دخول"); return; } setShowForm(true); }} className="gap-2 mr-auto" size="sm">
          <Plus className="h-4 w-4" /> استطلاع جديد
        </Button>
      </div>

      {/* Submit form */}
      {showForm && (
        <Card className="mb-4 border-teal-300/60 bg-teal-50/30 dark:bg-teal-950/10">
          <CardContent className="p-4">
            <form onSubmit={submitPoll} className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">إنشاء استطلاع جديد</h3>
                <button type="button" onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
              </div>
              <input type="text" placeholder="عنوان الاستطلاع" value={form.title} onChange={(e) => setForm({...form, title: e.target.value})} className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm" required />
              <textarea placeholder="وصف (اختياري)" value={form.description} onChange={(e) => setForm({...form, description: e.target.value})} rows={2} className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm" />
              <div className="grid grid-cols-2 gap-2">
                <select value={form.category} onChange={(e) => setForm({...form, category: e.target.value})} className="px-2 py-2 rounded-md border border-input bg-background text-sm">
                  <option value="general">عام</option>
                  <option value="politics">سياسة</option>
                  <option value="sports">رياضة</option>
                  <option value="community">مجتمع</option>
                  <option value="tech">تكنولوجيا</option>
                  <option value="culture">ثقافة</option>
                  <option value="other">أخرى</option>
                </select>
                <input type="number" min="1" max="168" placeholder="مدة (ساعات)" value={form.duration} onChange={(e) => setForm({...form, duration: parseInt(e.target.value) || 24})} className="px-2 py-2 rounded-md border border-input bg-background text-sm" />
              </div>
              <div className="space-y-2">
                {form.options.map((opt, i) => (
                  <div key={i} className="flex gap-2">
                    <input type="text" placeholder={`خيار ${i+1}`} value={opt} onChange={(e) => { const o = [...form.options]; o[i] = e.target.value; setForm({...form, options: o}); }} className="flex-1 px-3 py-2 rounded-md border border-input bg-background text-sm" />
                    {form.options.length > 2 && (
                      <button type="button" onClick={() => setForm({...form, options: form.options.filter((_, j) => j !== i)})} className="text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 px-2 rounded"><X className="h-4 w-4" /></button>
                    )}
                  </div>
                ))}
                {form.options.length < 6 && (
                  <button type="button" onClick={() => setForm({...form, options: [...form.options, ""]})} className="text-xs text-teal-700 dark:text-teal-300 hover:underline">+ إضافة خيار</button>
                )}
              </div>
              <Button type="submit" disabled={submitting} className="gap-2">
                {submitting ? <><Loader2 className="h-4 w-4 animate-spin" /> جاري</> : <><Send className="h-4 w-4" /> نشر</>}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Polls list */}
      {filtered.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-muted-foreground">لا توجد استطلاعات في هذا التصنيف</CardContent></Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((poll) => {
            const options = JSON.parse(poll.options) as { id: string; text: string; votes: number }[];
            const total = poll.totalVotes || 1;
            return (
              <Card key={poll.id} className="hover:border-teal-400 transition-colors">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1">
                      <h3 className="font-bold text-lg">{poll.title}</h3>
                      {poll.description && <p className="text-xs text-muted-foreground mt-1">{poll.description}</p>}
                    </div>
                    <Badge variant="outline" className="text-[10px]">{poll.category}</Badge>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground mb-3">
                    <Vote className="h-3 w-3" /> {poll.totalVotes} صوت
                    {poll.regionName && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {poll.regionName}</span>}
                    <span>· {formatRelative(poll.createdAt)}</span>
                  </div>
                  <div className="space-y-2">
                    {options.map((opt) => {
                      const pct = ((opt.votes || 0) / total) * 100;
                      const voted = votedIds.has(poll.id);
                      return (
                        <button
                          key={opt.id}
                          onClick={() => vote(poll.id, opt.id)}
                          disabled={voted}
                          className="w-full text-right group"
                        >
                          <div className="relative overflow-hidden rounded-md border border-input bg-background hover:border-teal-400 transition-colors">
                            <div className="absolute inset-y-0 right-0 bg-teal-100 dark:bg-teal-950/40" style={{ width: `${pct}%` }} />
                            <div className="relative flex items-center justify-between px-3 py-2">
                              <span className="text-sm font-medium">{opt.text}</span>
                              <span className="text-xs text-muted-foreground">{opt.votes || 0} ({pct.toFixed(0)}%)</span>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
