"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Plus, Clock, MapPin, X, Send, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface TimeOffer {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  category: string;
  hoursOffered: number;
  regionName: string | null;
  provinceName: string | null;
  communeName: string | null;
  status: string;
  createdAt: string | null;
}

interface TimeRequest {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  category: string;
  hoursNeeded: number;
  urgency: string;
  regionName: string | null;
  provinceName: string | null;
  communeName: string | null;
  status: string;
  createdAt: string | null;
}

interface Props {
  initialOffers: TimeOffer[];
  initialRequests: TimeRequest[];
  loggedIn: boolean;
  userId: string | null;
}

const CATEGORIES = [
  { key: "all", label: "الكل" },
  { key: "education", label: "تعليم" },
  { key: "tech", label: "تكنولوجيا" },
  { key: "health", label: "صحة" },
  { key: "craft", label: "حرف" },
  { key: "transport", label: "نقل" },
  { key: "other", label: "أخرى" },
];

const URGENCY_META: Record<string, { label: string; color: string }> = {
  low: { label: "منخفض", color: "bg-slate-100 text-slate-700" },
  normal: { label: "عادي", color: "bg-teal-100 text-teal-700" },
  high: { label: "مرتفع", color: "bg-amber-100 text-amber-700" },
  urgent: { label: "عاجل", color: "bg-red-100 text-red-700" },
};

function formatRelative(iso: string | null): string {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 60_000) return "الآن";
  if (diff < 3_600_000) return Math.floor(diff / 60_000) + " د";
  if (diff < 86_400_000) return Math.floor(diff / 3_600_000) + " س";
  return Math.floor(diff / 86_400_000) + " ي";
}

export function TimeBankClient({ initialOffers, initialRequests, loggedIn, userId }: Props) {
  const [tab, setTab] = useState<"offers" | "requests">("offers");
  const [category, setCategory] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    kind: "offer" as "offer" | "request",
    title: "",
    description: "",
    category: "general",
    hours: "1",
    urgency: "normal",
    regionName: "",
    provinceName: "",
  });

  const filteredOffers = useMemo(
    () =>
      category === "all"
        ? initialOffers
        : initialOffers.filter((o) => o.category === category),
    [initialOffers, category]
  );

  const filteredRequests = useMemo(
    () =>
      category === "all"
        ? initialRequests
        : initialRequests.filter((r) => r.category === category),
    [initialRequests, category]
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!loggedIn) {
      toast.info("سجّل دخول لإنشاء عرض/طلب");
      return;
    }
    if (form.title.length < 5) {
      toast.error("العنوان قصير جداً");
      return;
    }
    setSubmitting(true);
    try {
      const r = await fetch("/api/timebank", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!r.ok) {
        const err = await r.json().catch(() => ({}));
        throw new Error(err.error ?? "submit failed");
      }
      toast.success("تم إنشاء العرض بنجاح — سيظهر في القائمة");
      setForm({
        kind: "offer",
        title: "",
        description: "",
        category: "general",
        hours: "1",
        urgency: "normal",
        regionName: "",
        provinceName: "",
      });
      setShowForm(false);
      // Refresh page to show new entry
      setTimeout(() => window.location.reload(), 1500);
    } catch (e: any) {
      toast.error(e.message ?? "فشل الإرسال");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      {/* Header bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
        <Tabs value={tab} onValueChange={(v) => setTab(v as any)} className="w-full">
          <TabsList className="w-full md:w-auto">
            <TabsTrigger value="offers" className="flex-1 md:flex-none gap-1">
              <Plus className="h-3.5 w-3.5" />
              العروض ({initialOffers.length})
            </TabsTrigger>
            <TabsTrigger value="requests" className="flex-1 md:flex-none gap-1">
              <Clock className="h-3.5 w-3.5" />
              الطلبات ({initialRequests.length})
            </TabsTrigger>
          </TabsList>

          <div className="flex flex-wrap gap-1.5 mt-4 mb-3">
            {CATEGORIES.map((c) => (
              <button
                key={c.key}
                onClick={() => setCategory(c.key)}
                className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                  category === c.key
                    ? "bg-teal-700 text-white border-teal-700"
                    : "bg-background hover:bg-muted border-muted-foreground/30"
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>

          {/* New entry button */}
          <div className="mb-3">
            <Button
              onClick={() => {
                if (!loggedIn) {
                  toast.info("سجّل دخول أولاً");
                  return;
                }
                setShowForm(true);
                setForm((f) => ({ ...f, kind: tab === "offers" ? "offer" : "request" }));
              }}
              className="gap-2"
              size="sm"
            >
              <Plus className="h-4 w-4" />
              {tab === "offers" ? "قدّم عرضاً" : "اطلب مساعدة"}
            </Button>
          </div>

          {/* Form */}
          {showForm && (
            <Card className="mb-4 border-teal-300/60 bg-teal-50/30 dark:bg-teal-950/10">
              <CardContent className="p-4">
                <form onSubmit={handleSubmit} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">
                      {form.kind === "offer" ? "إنشاء عرض جديد" : "إنشاء طلب جديد"}
                    </h3>
                    <button
                      type="button"
                      onClick={() => setShowForm(false)}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <input
                    type="text"
                    placeholder="العنوان (مثلاً: أعطي دروساً في الفرنسية)"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm"
                    required
                  />
                  <textarea
                    placeholder="الوصف التفصيلي..."
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm"
                  />
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    <select
                      value={form.category}
                      onChange={(e) => setForm({ ...form, category: e.target.value })}
                      className="px-2 py-2 rounded-md border border-input bg-background text-sm"
                    >
                      <option value="general">عام</option>
                      <option value="education">تعليم</option>
                      <option value="tech">تكنولوجيا</option>
                      <option value="health">صحة</option>
                      <option value="craft">حرف</option>
                      <option value="transport">نقل</option>
                      <option value="other">أخرى</option>
                    </select>
                    <input
                      type="number"
                      step="0.25"
                      min="0.25"
                      max="40"
                      placeholder="عدد الساعات"
                      value={form.hours}
                      onChange={(e) => setForm({ ...form, hours: e.target.value })}
                      className="px-2 py-2 rounded-md border border-input bg-background text-sm"
                      required
                    />
                    {form.kind === "request" && (
                      <select
                        value={form.urgency}
                        onChange={(e) => setForm({ ...form, urgency: e.target.value })}
                        className="px-2 py-2 rounded-md border border-input bg-background text-sm"
                      >
                        <option value="low">منخفض</option>
                        <option value="normal">عادي</option>
                        <option value="high">مرتفع</option>
                        <option value="urgent">عاجل</option>
                      </select>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="الجهة (مثلاً: الدار البيضاء-سطات)"
                      value={form.regionName}
                      onChange={(e) => setForm({ ...form, regionName: e.target.value })}
                      className="px-3 py-2 rounded-md border border-input bg-background text-sm"
                    />
                    <input
                      type="text"
                      placeholder="الإقليم"
                      value={form.provinceName}
                      onChange={(e) => setForm({ ...form, provinceName: e.target.value })}
                      className="px-3 py-2 rounded-md border border-input bg-background text-sm"
                    />
                  </div>
                  <Button type="submit" disabled={submitting} className="gap-2">
                    {submitting ? (
                      <><Loader2 className="h-4 w-4 animate-spin" /> جاري الإرسال</>
                    ) : (
                      <><Send className="h-4 w-4" /> أرسل</>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Offers tab */}
          <TabsContent value="offers">
            {filteredOffers.length === 0 ? (
              <Card><CardContent className="p-8 text-center text-muted-foreground">
                لا توجد عروض في هذا التصنيف
              </CardContent></Card>
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {filteredOffers.map((o) => (
                  <Card key={o.id} className="hover:border-teal-400 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-2 mb-2">
                        <div className="h-9 w-9 rounded-full bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center text-teal-700 font-bold text-sm shrink-0">
                          {o.userId.charAt(o.userId.length - 1).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-sm leading-tight">{o.title}</h3>
                          <p className="text-[10px] text-muted-foreground">
                            بواسطة {o.userId.replace("demo-user-", "عضو-")} · {formatRelative(o.createdAt)}
                          </p>
                        </div>
                        <Badge variant="outline" className="text-[10px] bg-teal-50 dark:bg-teal-950/30">
                          <Clock className="h-3 w-3" /> {o.hoursOffered} س
                        </Badge>
                      </div>
                      {o.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{o.description}</p>
                      )}
                      <div className="flex flex-wrap items-center gap-1 text-[10px] text-muted-foreground">
                        <Badge variant="outline" className="text-[10px]">{o.category}</Badge>
                        {(o.provinceName || o.regionName) && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {o.provinceName || o.regionName}
                          </span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Requests tab */}
          <TabsContent value="requests">
            {filteredRequests.length === 0 ? (
              <Card><CardContent className="p-8 text-center text-muted-foreground">
                لا توجد طلبات في هذا التصنيف
              </CardContent></Card>
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {filteredRequests.map((r) => {
                  const urgency = URGENCY_META[r.urgency] ?? URGENCY_META.normal;
                  return (
                    <Card key={r.id} className={`hover:border-amber-400 transition-colors ${r.urgency === "urgent" ? "border-red-300/60" : ""}`}>
                      <CardContent className="p-4">
                        <div className="flex items-start gap-2 mb-2">
                          <div className="h-9 w-9 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-700 font-bold text-sm shrink-0">
                            {r.userId.charAt(r.userId.length - 1).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-sm leading-tight">{r.title}</h3>
                            <p className="text-[10px] text-muted-foreground">
                              بواسطة {r.userId.replace("demo-user-", "عضو-")} · {formatRelative(r.createdAt)}
                            </p>
                          </div>
                          <Badge className={`text-[10px] ${urgency.color} border-0`}>
                            {urgency.label}
                          </Badge>
                        </div>
                        {r.description && (
                          <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{r.description}</p>
                        )}
                        <div className="flex flex-wrap items-center gap-1 text-[10px] text-muted-foreground">
                          <Badge variant="outline" className="text-[10px]">{r.category}</Badge>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {r.hoursNeeded} ساعة
                          </span>
                          {(r.provinceName || r.regionName) && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {r.provinceName || r.regionName}
                            </span>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
