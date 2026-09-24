"use client";

import * as React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ThumbsUp, Eye, Plus, Heart } from "lucide-react";
import { toast } from "sonner";

interface AdviceItem {
  id: string; title: string; content: string; category: string;
  likes: number; views: number; createdAt: string;
}

export function AdviceList({ advice, categories, currentUserId }: { advice: AdviceItem[]; categories: { value: string; label: string }[]; currentUserId: string }) {
  const [search, setSearch] = React.useState("");
  const [activeCat, setActiveCat] = React.useState("ALL");
  const [showForm, setShowForm] = React.useState(false);
  const [title, setTitle] = React.useState("");
  const [content, setContent] = React.useState("");
  const [category, setCategory] = React.useState("FAMILY");
  const [submitting, setSubmitting] = React.useState(false);

  const filtered = advice.filter(a => {
    const matchCat = activeCat === "ALL" || a.category === activeCat;
    const matchSearch = !search || a.title.includes(search) || a.content.includes(search);
    return matchCat && matchSearch;
  });

  const submit = async () => {
    if (!title.trim() || !content.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/community/advice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content, category }),
      });
      if (res.ok) {
        toast.success("تم نشر النصيحة");
        setShowForm(false); setTitle(""); setContent("");
        setTimeout(() => window.location.reload(), 1000);
      } else { toast.error("فشل النشر"); }
    } catch { toast.error("خطأ"); }
    setSubmitting(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="ابحث..." className="flex-1 h-11" />
        <Button onClick={() => setShowForm(!showForm)} className="h-11"><Plus className="size-4" /> شارك نصيحة</Button>
      </div>

      {showForm && (
        <Card><CardContent className="p-4 space-y-3">
          <div><Label>العنوان</Label><Input value={title} onChange={e => setTitle(e.target.value)} className="mt-1" placeholder="عنوان النصيحة" /></div>
          <div><Label>المحتوى</Label><Textarea value={content} onChange={e => setContent(e.target.value)} className="mt-1 min-h-24" placeholder="اكتب نصيحتك..." /></div>
          <div><Label>الفئة</Label>
            <select value={category} onChange={e => setCategory(e.target.value)} className="mt-1 block w-full rounded-md border border-border bg-background px-3 py-2 text-sm">
              {categories.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
          <Button onClick={submit} disabled={submitting} className="h-11">{submitting ? "جارٍ..." : "انشر"}</Button>
        </CardContent></Card>
      )}

      <div className="flex flex-wrap gap-2">
        <button onClick={() => setActiveCat("ALL")} className={`px-3 py-1.5 rounded-md text-sm ${activeCat === "ALL" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>الكل</button>
        {categories.map(c => (
          <button key={c.value} onClick={() => setActiveCat(c.value)} className={`px-3 py-1.5 rounded-md text-sm ${activeCat === c.value ? "bg-primary text-primary-foreground" : "bg-muted"}`}>{c.label}</button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground"><Heart className="size-8 mx-auto mb-2" /><p>لا توجد نصائح بعد — كن أول من يشارك!</p></div>
      ) : (
        <div className="space-y-3">
          {filtered.map(a => (
            <Card key={a.id} className="lift-on-hover">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-heading font-bold">{a.title}</h3>
                  <Badge variant="secondary">{categories.find(c => c.value === a.category)?.label ?? a.category}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-3">{a.content}</p>
                <div className="flex gap-3 mt-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><ThumbsUp className="size-3" /> {a.likes}</span>
                  <span className="flex items-center gap-1"><Eye className="size-3" /> {a.views}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
