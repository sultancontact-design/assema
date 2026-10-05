"use client";

import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Plus, MapPin, Phone, Coins, X, Send, Loader2, Search, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";

interface LostFoundItem {
  id: string;
  userId: string;
  type: "lost" | "found";
  title: string;
  description: string | null;
  category: string;
  location: string | null;
  regionName: string | null;
  provinceName: string | null;
  imageUrl: string | null;
  contactInfo: string | null;
  reward: number | null;
  status: string;
  createdAt: string;
}

interface Props {
  initialItems: LostFoundItem[];
  loggedIn: boolean;
  userId: string | null;
}

const CATEGORIES = [
  { key: "all", label: "الكل" },
  { key: "pets", label: "حيوانات" },
  { key: "documents", label: "وثائق" },
  { key: "electronics", label: "إلكترونيات" },
  { key: "keys", label: "مفاتيح" },
  { key: "other", label: "أخرى" },
];

function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 60_000) return "الآن";
  if (diff < 3_600_000) return Math.floor(diff / 60_000) + " د";
  if (diff < 86_400_000) return Math.floor(diff / 3_600_000) + " س";
  return Math.floor(diff / 86_400_000) + " ي";
}

export function LostFoundClient({ initialItems, loggedIn, userId }: Props) {
  const [tab, setTab] = useState<"lost" | "found">("lost");
  const [category, setCategory] = useState("all");
  const [query, setQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    type: "lost" as "lost" | "found",
    title: "",
    description: "",
    category: "other",
    location: "",
    regionName: "",
    contactInfo: "",
    reward: "",
    imageUrl: "",
  });

  const filtered = useMemo(() => {
    let list = initialItems.filter(i => i.type === tab);
    if (category !== "all") list = list.filter(i => i.category === category);
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(i =>
        i.title.toLowerCase().includes(q) ||
        (i.description?.toLowerCase().includes(q)) ||
        (i.location?.toLowerCase().includes(q))
      );
    }
    return list;
  }, [initialItems, tab, category, query]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.title.length < 5) { toast.error("العنوان قصير"); return; }
    setSubmitting(true);
    try {
      const r = await fetch("/api/lostfound", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, reward: form.reward ? parseFloat(form.reward) : 0 }),
      });
      if (!r.ok) throw new Error("failed");
      toast.success("تم نشر الإعلان");
      setForm({ type: "lost", title: "", description: "", category: "other", location: "", regionName: "", contactInfo: "", reward: "", imageUrl: "" });
      setShowForm(false);
      setTimeout(() => window.location.reload(), 1500);
    } catch (e) {
      toast.error("فشل النشر");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      {/* Tabs */}
      <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
        <TabsList className="w-full md:w-auto">
          <TabsTrigger value="lost" className="flex-1 gap-1"><Search className="h-3.5 w-3.5" /> ضائع</TabsTrigger>
          <TabsTrigger value="found" className="flex-1 gap-1"><HandHeart className="h-3.5 w-3.5" /> موجود</TabsTrigger>
        </TabsList>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 mt-4 mb-3">
          {CATEGORIES.map((c) => (
            <button key={c.key} onClick={() => setCategory(c.key)} className={`text-xs px-3 py-1 rounded-full border transition-colors ${category === c.key ? "bg-teal-700 text-white border-teal-700" : "bg-background hover:bg-muted border-muted-foreground/30"}`}>{c.label}</button>
          ))}
          <div className="relative flex-1 min-w-[150px]">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input type="text" placeholder="بحث..." value={query} onChange={(e) => setQuery(e.target.value)} className="w-full pr-10 pl-3 py-1.5 rounded-full border border-input bg-background text-sm" />
          </div>
          <Button onClick={() => { if (!loggedIn) { toast.info("سجّل دخول"); return; } setForm(f => ({...f, type: tab})); setShowForm(true); }} size="sm" className="gap-2">
            <Plus className="h-4 w-4" /> أضف
          </Button>
        </div>

        {/* Form */}
        {showForm && (
          <Card className="mb-4 border-rose-300/60 bg-rose-50/30 dark:bg-rose-950/10">
            <CardContent className="p-4">
              <form onSubmit={handleSubmit} className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">{form.type === "lost" ? "إعلان عن ضائع" : "إعلان عن موجود"}</h3>
                  <button type="button" onClick={() => setShowForm(false)}><X className="h-4 w-4 text-muted-foreground" /></button>
                </div>
                <input type="text" placeholder="عنوان (مثلاً: ضاعت قطة رمادية)" value={form.title} onChange={(e) => setForm({...form, title: e.target.value})} className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm" required />
                <textarea placeholder="وصف تفصيلي" value={form.description} onChange={(e) => setForm({...form, description: e.target.value})} rows={2} className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm" />
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  <select value={form.category} onChange={(e) => setForm({...form, category: e.target.value})} className="px-2 py-2 rounded-md border border-input bg-background text-sm">
                    <option value="other">أخرى</option>
                    <option value="pets">حيوانات</option>
                    <option value="documents">وثائق</option>
                    <option value="electronics">إلكترونيات</option>
                    <option value="keys">مفاتيح</option>
                  </select>
                  <input type="text" placeholder="الموقع" value={form.location} onChange={(e) => setForm({...form, location: e.target.value})} className="px-2 py-2 rounded-md border border-input bg-background text-sm" />
                  <input type="text" placeholder="الجهة" value={form.regionName} onChange={(e) => setForm({...form, regionName: e.target.value})} className="px-2 py-2 rounded-md border border-input bg-background text-sm" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input type="text" placeholder="معلومات التواصل" value={form.contactInfo} onChange={(e) => setForm({...form, contactInfo: e.target.value})} className="px-3 py-2 rounded-md border border-input bg-background text-sm" />
                  {form.type === "lost" && <input type="number" min="0" placeholder="مكافأة (درهم)" value={form.reward} onChange={(e) => setForm({...form, reward: e.target.value})} className="px-3 py-2 rounded-md border border-input bg-background text-sm" />}
                </div>
                <Button type="submit" disabled={submitting} className="gap-2">
                  {submitting ? <><Loader2 className="h-4 w-4 animate-spin" /> جاري</> : <><Send className="h-4 w-4" /> نشر</>}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Items */}
        <TabsContent value={tab}>
          {filtered.length === 0 ? (
            <Card><CardContent className="p-8 text-center text-muted-foreground">لا توجد إعلانات</CardContent></Card>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {filtered.map((item) => (
                <Card key={item.id} className={`hover:border-teal-400 transition-colors ${item.type === "lost" ? "border-rose-300/40" : "border-emerald-300/40"}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className={`h-12 w-12 rounded-lg flex items-center justify-center shrink-0 ${item.type === "lost" ? "bg-rose-100 dark:bg-rose-900/30" : "bg-emerald-100 dark:bg-emerald-900/30"}`}>
                        {item.type === "lost" ? <Search className="h-6 w-6 text-rose-600" /> : <HandHeart className="h-6 w-6 text-emerald-600" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm leading-tight">{item.title}</h3>
                        <div className="flex flex-wrap items-center gap-1 mt-1">
                          <Badge variant="outline" className="text-[10px]">{item.category}</Badge>
                          {item.reward && item.reward > 0 && (
                            <Badge variant="outline" className="text-[10px] bg-amber-50 dark:bg-amber-950/30">
                              <Coins className="h-3 w-3" /> {item.reward} درهم
                            </Badge>
                          )}
                        </div>
                        {item.description && <p className="text-xs text-muted-foreground line-clamp-2 mt-1.5">{item.description}</p>}
                        <div className="flex flex-wrap items-center gap-2 text-[10px] text-muted-foreground mt-2">
                          {item.location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {item.location}</span>}
                          {item.contactInfo && <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {item.contactInfo}</span>}
                          <span>· {formatRelative(item.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function HandHeart(props: any) {
  return <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 21C11 21 4 16.5 4 10.5C4 7.5 6.5 5 9.5 5C11.4 5 12.5 6 13 7C13.5 6 14.6 5 16.5 5C19.5 5 22 7.5 22 10.5C22 16.5 13 21 13 21H11Z"/></svg>;
}
