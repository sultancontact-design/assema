"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowUp, ArrowDown, Pin, ExternalLink, Plus, Search,
  Github, Flame, Newspaper, Wrench, GraduationCap, Flag, TrendingUp,
} from "lucide-react";
import { toast } from "sonner";

interface Resource {
  id: string;
  title: string;
  url: string;
  description: string | null;
  category: string;
  tags: string | null;
  submittedBy: string | null;
  sourcePlatform: string | null;
  upvotes: number;
  downvotes: number;
  pinned: boolean;
  isVerified: boolean;
  publishedAt: string | null;
  regionName: string | null;
}

// Categories defined client-side so we can pass Lucide icon components safely
const CATEGORIES = [
  { key: "all", label: "الكل", icon: Flame, color: "text-teal-700" },
  { key: "github", label: "GitHub", icon: Github, color: "text-slate-700" },
  { key: "producthunt", label: "Tools (PH)", icon: TrendingUp, color: "text-amber-600" },
  { key: "hackernews", label: "Show HN", icon: Flame, color: "text-orange-600" },
  { key: "article", label: "مقالات", icon: Newspaper, color: "text-emerald-600" },
  { key: "course", label: "دورات", icon: GraduationCap, color: "text-indigo-600" },
  { key: "tool", label: "أدوات", icon: Wrench, color: "text-rose-600" },
  { key: "morocco", label: "رسمي مغربي", icon: Flag, color: "text-red-600" },
];

interface Props {
  resources: Resource[];
  loggedIn: boolean;
  userId: string | null;
  userName: string | null;
}

export function ResourcesClient({ resources, loggedIn, userId, userName }: Props) {
  const [activeCategory, setActiveCategory] = useState("all");
  const [query, setQuery] = useState("");
  const [votes, setVotes] = useState<Record<string, { up: number; down: number; myVote: number | null }>>(() => {
    const init: Record<string, { up: number; down: number; myVote: number | null }> = {};
    for (const r of resources) {
      init[r.id] = { up: r.upvotes, down: r.downvotes, myVote: null };
    }
    return init;
  });
  const [showSubmit, setShowSubmit] = useState(false);

  // Submit form state
  const [form, setForm] = useState({ title: "", url: "", description: "", category: "general", tags: "" });
  const [submitting, setSubmitting] = useState(false);

  const filtered = useMemo(() => {
    let list = resources;
    if (activeCategory !== "all") {
      list = list.filter((r) => r.category === activeCategory);
    }
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter((r) =>
        r.title.toLowerCase().includes(q) ||
        (r.description?.toLowerCase().includes(q)) ||
        (r.tags?.toLowerCase().includes(q))
      );
    }
    return list;
  }, [resources, activeCategory, query]);

  async function vote(resourceId: string, vote: number) {
    if (!loggedIn) {
      toast.info("سجّل دخول للتصويت");
      return;
    }
    // Optimistic UI
    setVotes((prev) => {
      const cur = prev[resourceId] ?? { up: 0, down: 0, myVote: null };
      let newUp = cur.up, newDown = cur.down;
      if (cur.myVote === vote) {
        // Undo
        if (vote === 1) newUp -= 1;
        else newDown -= 1;
        vote = 0;
      } else if (cur.myVote === null) {
        if (vote === 1) newUp += 1;
        else newDown += 1;
      } else {
        // Switch
        if (vote === 1) { newUp += 1; newDown -= 1; }
        else { newDown += 1; newUp -= 1; }
      }
      return { ...prev, [resourceId]: { up: newUp, down: newDown, myVote: vote === 0 ? null : vote } };
    });

    try {
      const r = await fetch("/api/resources/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resourceId, vote, userId, voterName: userName }),
      });
      if (!r.ok) throw new Error("vote failed");
    } catch (e) {
      toast.error("فشل التصويت. حاول مجدداً");
      // Roll back
      setVotes((prev) => {
        const cur = prev[resourceId] ?? { up: 0, down: 0, myVote: null };
        return { ...prev, [resourceId]: { up: cur.up, down: cur.down, myVote: null } };
      });
    }
  }

  async function submitResource(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title || !form.url) {
      toast.error("العنوان والرابط مطلوبان");
      return;
    }
    setSubmitting(true);
    try {
      const r = await fetch("/api/resources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, submittedById: userId, submittedBy: userName }),
      });
      if (r.status === 409) {
        toast.error("هذا الرابط موجود بالفعل");
        return;
      }
      if (!r.ok) throw new Error("submit failed");
      toast.success("شكراً! سيظهر رابطك بعد المراجعة");
      setForm({ title: "", url: "", description: "", category: "general", tags: "" });
      setShowSubmit(false);
    } catch (e) {
      toast.error("فشل الإرسال. حاول مجدداً");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      {/* Category filter */}
      <div className="flex flex-wrap gap-2 mb-6">
        {CATEGORIES.map((c) => {
          const Icon = c.icon;
          const active = activeCategory === c.key;
          return (
            <button
              key={c.key}
              onClick={() => setActiveCategory(c.key)}
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm transition-colors ${
                active
                  ? "bg-teal-700 text-white border-teal-700"
                  : "bg-background hover:bg-muted border-muted-foreground/20"
              }`}
            >
              <Icon className={`h-4 w-4 ${active ? "text-white" : c.color}`} />
              {c.label}
            </button>
          );
        })}
      </div>

      {/* Search + Submit */}
      <div className="flex flex-col md:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="بحث في الموارد..."
            className="w-full pl-10 pr-4 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/40"
          />
        </div>
        <Button onClick={() => setShowSubmit(!showSubmit)} variant={showSubmit ? "secondary" : "outline"} className="gap-2">
          <Plus className="h-4 w-4" />
          أضف مورد
        </Button>
      </div>

      {/* Submit form */}
      {showSubmit && (
        <Card className="mb-6 border-teal-300 bg-teal-50/30 dark:bg-teal-950/10">
          <CardContent className="p-5">
            <form onSubmit={submitResource} className="space-y-3">
              <div className="grid md:grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="العنوان"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="px-3 py-2 rounded-md border border-input bg-background text-sm"
                />
                <input
                  type="url"
                  placeholder="https://..."
                  value={form.url}
                  onChange={(e) => setForm({ ...form, url: e.target.value })}
                  className="px-3 py-2 rounded-md border border-input bg-background text-sm"
                />
              </div>
              <textarea
                placeholder="وصف قصير..."
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm"
              />
              <div className="grid md:grid-cols-2 gap-3">
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="px-3 py-2 rounded-md border border-input bg-background text-sm"
                >
                  <option value="general">عام</option>
                  <option value="github">GitHub</option>
                  <option value="producthunt">Product Hunt</option>
                  <option value="hackernews">Hacker News</option>
                  <option value="article">مقال</option>
                  <option value="course">دورة</option>
                  <option value="tool">أداة</option>
                  <option value="morocco">رسمي مغربي</option>
                </select>
                <input
                  type="text"
                  placeholder="tags (مفصولة بفواصل)"
                  value={form.tags}
                  onChange={(e) => setForm({ ...form, tags: e.target.value })}
                  className="px-3 py-2 rounded-md border border-input bg-background text-sm"
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={submitting} className="gap-2">
                  {submitting ? "جاري الإرسال..." : "أرسل"}
                </Button>
                <Button type="button" variant="ghost" onClick={() => setShowSubmit(false)}>
                  إلغاء
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Resources list */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              لا توجد موارد في هذا التصنيف
            </CardContent>
          </Card>
        ) : (
          filtered.map((r) => {
            const v = votes[r.id] ?? { up: r.upvotes, down: r.downvotes, myVote: null };
            const hostname = (() => {
              try { return new URL(r.url).hostname.replace("www.", ""); } catch { return r.url; }
            })();
            return (
              <Card key={r.id} className={`hover:border-teal-300 transition-colors ${r.pinned ? "border-amber-300 bg-amber-50/30 dark:bg-amber-950/10" : ""}`}>
                <div className="flex items-start gap-3 p-4">
                  {/* Vote column */}
                  <div className="flex flex-col items-center gap-1 min-w-[48px]">
                    <button
                      onClick={() => vote(r.id, 1)}
                      className={`p-1 rounded hover:bg-teal-100 dark:hover:bg-teal-900/30 ${v.myVote === 1 ? "text-teal-700 dark:text-teal-300" : "text-muted-foreground"}`}
                      aria-label="Upvote"
                    >
                      <ArrowUp className="h-5 w-5" />
                    </button>
                    <span className={`text-sm font-semibold ${v.myVote === 1 ? "text-teal-700 dark:text-teal-300" : ""}`}>
                      {v.up - v.down}
                    </span>
                    <button
                      onClick={() => vote(r.id, -1)}
                      className={`p-1 rounded hover:bg-rose-100 dark:hover:bg-rose-900/30 ${v.myVote === -1 ? "text-rose-700 dark:text-rose-300" : "text-muted-foreground"}`}
                      aria-label="Downvote"
                    >
                      <ArrowDown className="h-5 w-5" />
                    </button>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      {r.pinned && (
                        <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-300 text-[10px] px-2 py-0">
                          <Pin className="h-3 w-3" />
                          مثبّت
                        </Badge>
                      )}
                      {r.isVerified && (
                        <Badge variant="outline" className="text-[10px] px-2 py-0 bg-emerald-100 text-emerald-700 border-emerald-300">
                          مؤكد
                        </Badge>
                      )}
                      <Badge variant="outline" className="text-[10px] px-2 py-0">
                        {r.category}
                      </Badge>
                      <a
                        href={r.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-semibold hover:text-teal-700 dark:hover:text-teal-300 transition-colors inline-flex items-center gap-1"
                      >
                        {r.title}
                        <ExternalLink className="h-3 w-3 inline" />
                      </a>
                      <span className="text-xs text-muted-foreground">({hostname})</span>
                    </div>
                    {r.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{r.description}</p>
                    )}
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      {r.tags?.split(",").slice(0, 4).map((t) => (
                        <span key={t} className="px-2 py-0.5 rounded bg-muted">
                          {t.trim()}
                        </span>
                      ))}
                      {r.regionName && <span className="text-teal-700 dark:text-teal-300">· {r.regionName}</span>}
                      <span>· بواسطة {r.submittedBy || "مجهول"}</span>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
