"use client";
import * as React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Plus, ThumbsUp, Lightbulb } from "lucide-react";
import { toast } from "sonner";

interface Init { id: string; title: string; description: string; category: string; status: string; votes: number; proposerName: string; createdAt: string }

const STATUS_LABELS: Record<string, string> = { proposed: "مقترحة", under_review: "قيد المراجعة", approved: "موافق عليها", rejected: "مرفوضة", in_progress: "قيد التنفيذ", completed: "مكتملة" };
const STATUS_COLORS: Record<string, string> = { proposed: "secondary", under_review: "default", approved: "default", rejected: "destructive", in_progress: "default", completed: "secondary" };

export function InitiativesList({ initiatives, currentUserId }: { initiatives: Init[]; currentUserId: string }) {
  const [showForm, setShowForm] = React.useState(false);
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [category, setCategory] = React.useState("SOCIAL");
  const [submitting, setSubmitting] = React.useState(false);
  const [voted, setVoted] = React.useState<Set<string>>(new Set());

  const submit = async () => {
    if (!title.trim() || !description.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/community/initiatives", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title, description, category }) });
      if (res.ok) { toast.success("تم اقتراح المبادرة"); setShowForm(false); setTitle(""); setDescription(""); setTimeout(() => window.location.reload(), 1000); }
    } catch { toast.error("فشل"); }
    setSubmitting(false);
  };

  const vote = async (id: string) => {
    if (voted.has(id)) return;
    setVoted(p => new Set(p).add(id));
    try {
      const res = await fetch(`/api/community/initiatives/${id}/vote`, { method: "POST" });
      if (res.ok) toast.success("تم التصويت"); else if (res.status === 409) toast.info("صوّتّ بالفعل");
    } catch { toast.error("فشل"); }
  };

  return (
    <div className="space-y-4">
      <Button onClick={() => setShowForm(!showForm)} className="h-11"><Plus className="size-4" /> اقترح مبادرة</Button>
      {showForm && (
        <Card><CardContent className="p-4 space-y-3">
          <div><Label>العنوان</Label><Input value={title} onChange={e => setTitle(e.target.value)} className="mt-1" placeholder="عنوان المبادرة" /></div>
          <div><Label>الوصف</Label><Textarea value={description} onChange={e => setDescription(e.target.value)} className="mt-1 min-h-24" placeholder="اشرح مبادرتك..." /></div>
          <div><Label>الفئة</Label><select value={category} onChange={e => setCategory(e.target.value)} className="mt-1 block w-full rounded-md border border-border bg-background px-3 py-2 text-sm"><option value="EDUCATION">تعليم</option><option value="HEALTH">صحة</option><option value="ENVIRONMENT">بيئة</option><option value="CULTURE">ثقافة</option><option value="SOCIAL">اجتماعي</option><option value="INFRASTRUCTURE">بنية تحتية</option></select></div>
          <Button onClick={submit} disabled={submitting} className="h-11">{submitting ? "جارٍ..." : "اقترح"}</Button>
        </CardContent></Card>
      )}
      {initiatives.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground"><Lightbulb className="size-8 mx-auto mb-2" /><p>لا توجد مبادرات بعد</p></div>
      ) : initiatives.map(i => (
        <Card key={i.id}>
          <CardHeader className="pb-2"><div className="flex items-center justify-between"><h3 className="font-heading font-bold text-foreground">{i.title}</h3><Badge variant={STATUS_COLORS[i.status] as any}>{STATUS_LABELS[i.status]}</Badge></div></CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground line-clamp-2">{i.description}</p>
            <div className="flex items-center justify-between mt-3">
              <div className="flex items-center gap-2 text-xs text-muted-foreground"><Badge variant="outline">{i.category}</Badge><span>بواسطة {i.proposerName}</span></div>
              <Button size="sm" variant="outline" onClick={() => vote(i.id)} disabled={voted.has(i.id)} className="h-9"><ThumbsUp className="size-3.5" /> {i.votes}</Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
