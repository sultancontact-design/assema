"use client";
import * as React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Label } from "@/components/ui/input";
import { MessageSquare, Plus, Eye } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

interface Disc { id: string; title: string; content: string; category: string; views: number; repliesCount: number; authorName: string; createdAt: string }

export function DiscussionsList({ discussions, currentUserId }: { discussions: Disc[]; currentUserId: string }) {
  const [showForm, setShowForm] = React.useState(false);
  const [title, setTitle] = React.useState("");
  const [content, setContent] = React.useState("");
  const [category, setCategory] = React.useState("general");
  const [submitting, setSubmitting] = React.useState(false);

  const submit = async () => {
    if (!title.trim() || !content.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/community/discussions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title, content, category }) });
      if (res.ok) { toast.success("تم إنشاء النقاش"); setShowForm(false); setTitle(""); setContent(""); setTimeout(() => window.location.reload(), 1000); }
    } catch { toast.error("فشل"); }
    setSubmitting(false);
  };

  return (
    <div className="space-y-4">
      <Button onClick={() => setShowForm(!showForm)} className="h-11"><Plus className="size-4" /> نقاش جديد</Button>
      {showForm && (
        <Card><CardContent className="p-4 space-y-3">
          <div><Label>العنوان</Label><Input value={title} onChange={e => setTitle(e.target.value)} className="mt-1" placeholder="موضوع النقاش" /></div>
          <div><Label>المحتوى</Label><Textarea value={content} onChange={e => setContent(e.target.value)} className="mt-1 min-h-24" placeholder="اكتب نقاشك..." /></div>
          <Button onClick={submit} disabled={submitting} className="h-11">{submitting ? "جارٍ..." : "نشر"}</Button>
        </CardContent></Card>
      )}
      {discussions.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground"><MessageSquare className="size-8 mx-auto mb-2" /><p>لا توجد نقاشات بعد</p></div>
      ) : discussions.map(d => (
        <Link href={`/community/discussions/${d.id}`} key={d.id}>
          <Card className="hover:border-primary/40 transition-colors cursor-pointer">
            <CardHeader className="pb-2"><div className="flex items-center justify-between"><h3 className="font-heading font-bold text-foreground">{d.title}</h3><Badge variant="secondary">{d.category}</Badge></div></CardHeader>
            <CardContent className="pt-0">
              <p className="text-sm text-muted-foreground line-clamp-2">{d.content}</p>
              <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                <span>بواسطة {d.authorName}</span><span>•</span><span>{d.repliesCount} رد</span><span>•</span><span className="flex items-center gap-1"><Eye className="size-3" />{d.views}</span>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
