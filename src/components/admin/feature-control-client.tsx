"use client";
import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Flag, RefreshCw, Search, Power, Eye, EyeOff, Wrench, Clock, AlertCircle, CheckCircle2 } from "lucide-react";

interface FFlag { id: string; key: string; nameAr: string; description?: string | null; category?: string | null; status: string; message?: string | null; }

const STATUS_CONFIG = [
  { value: "ACTIVE", label: "نشط", color: "bg-emerald-100 text-emerald-800", icon: CheckCircle2 },
  { value: "HIDDEN", label: "مخفي", color: "bg-amber-100 text-amber-800", icon: EyeOff },
  { value: "MAINTENANCE", label: "صيانة", color: "bg-orange-100 text-orange-800", icon: Wrench },
  { value: "COMING_SOON", label: "قريباً", color: "bg-blue-100 text-blue-800", icon: Clock },
  { value: "DISABLED", label: "معطّل", color: "bg-red-100 text-red-800", icon: AlertCircle },
];

const CATEGORIES = [
  { value: "HOME", label: "الرئيسية" }, { value: "FUND", label: "الصندوق" },
  { value: "EVENTS", label: "الفعاليات" }, { value: "SERVICES", label: "الخدمات" },
  { value: "PRICES", label: "الأسعار" }, { value: "BLOG", label: "المدوّنة" },
  { value: "COMMUNITY", label: "المجتمع" }, { value: "STORE", label: "المتجر" },
  { value: "MAP", label: "الخريطة" }, { value: "ADMIN", label: "الأدمن" },
  { value: "SECURITY", label: "الأمان" }, { value: "NOTIFICATIONS", label: "الإشعارات" },
];

export function FeatureControlClient({ initialFlags }: { initialFlags: FFlag[] }) {
  const [flags, setFlags] = React.useState<FFlag[]>(initialFlags);
  const [search, setSearch] = React.useState("");
  const [catFilter, setCatFilter] = React.useState("ALL");
  const [statusFilter, setStatusFilter] = React.useState("ALL");
  const [loading, setLoading] = React.useState(false);
  const [updating, setUpdating] = React.useState<string | null>(null);

  const refresh = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/feature-flags", { cache: "no-store" });
      if (res.ok) { const d = await res.json(); setFlags(d.flags); toast.success("تم التحديث"); }
    } catch { toast.error("فشل"); }
    setLoading(false);
  };

  const filtered = flags.filter(f => {
    if (catFilter !== "ALL" && (f.category ?? "UNCAT") !== catFilter) return false;
    if (statusFilter !== "ALL" && f.status !== statusFilter) return false;
    if (search && !f.key.toLowerCase().includes(search.toLowerCase()) && !f.nameAr.includes(search)) return false;
    return true;
  });

  const grouped: Record<string, FFlag[]> = {};
  for (const f of filtered) {
    const cat = f.category ?? "UNCAT";
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(f);
  }
  const orderedCats = [...CATEGORIES.map(c => c.value), "UNCAT"].filter(c => grouped[c]?.length);

  const changeStatus = async (id: string, newStatus: string) => {
    setUpdating(id);
    try {
      const res = await fetch(`/api/admin/feature-flags/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) { toast.error("فشل"); setUpdating(null); return; }
      const d = await res.json();
      setFlags(prev => prev.map(f => f.id === id ? d.flag : f));
      toast.success(`تم التغيير إلى: ${STATUS_CONFIG.find(s => s.value === newStatus)?.label ?? newStatus}`);
    } catch { toast.error("فشل الاتصال"); }
    setUpdating(null);
  };

  const activeCount = flags.filter(f => f.status === "ACTIVE").length;
  const nonActiveCount = flags.length - activeCount;

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <header className="mb-6 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold flex items-center gap-2">
            <Flag className="size-7 text-primary" />
            <span>مركز التحكم في الأقسام</span>
          </h1>
          <p className="text-sm text-muted-foreground">
            {flags.length} قسم · {activeCount} نشط · {nonActiveCount} غير نشط
          </p>
        </div>
        <Button variant="outline" onClick={refresh} disabled={loading}>
          <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />
          <span>تحديث</span>
        </Button>
      </header>

      {/* Quick stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-4">
        {STATUS_CONFIG.map(s => {
          const count = flags.filter(f => f.status === s.value).length;
          const Icon = s.icon;
          return (
            <Card key={s.value}>
              <CardContent className="p-3 text-center">
                <Icon className="size-4 mx-auto mb-1" />
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="font-heading text-lg font-bold">{count}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Filters */}
      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="relative">
              <Search className="absolute top-1/2 -translate-y-1/2 start-3 size-4 text-muted-foreground" />
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="ابحث..." className="ps-9 h-11" />
            </div>
            <select value={catFilter} onChange={e => setCatFilter(e.target.value)} className="h-11 rounded-md border border-input bg-background px-3 text-sm">
              <option value="ALL">كل الفئات</option>
              {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label} ({flags.filter(f => (f.category ?? "") === c.value).length})</option>)}
            </select>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="h-11 rounded-md border border-input bg-background px-3 text-sm">
              <option value="ALL">كل الحالات</option>
              {STATUS_CONFIG.map(s => <option key={s.value} value={s.value}>{s.label} ({flags.filter(f => f.status === s.value).length})</option>)}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Flags grouped by category */}
      {loading ? (
        <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-lg" />)}</div>
      ) : (
        <div className="space-y-6">
          {orderedCats.map(cat => {
            const catInfo = CATEGORIES.find(c => c.value === cat);
            const catFlags = grouped[cat] ?? [];
            const catActive = catFlags.filter(f => f.status === "ACTIVE").length;
            return (
              <section key={cat} className="space-y-2">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <h3 className="font-heading text-lg font-bold flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">{catInfo?.label ?? cat}</Badge>
                    <span className="text-sm text-muted-foreground font-normal">{catFlags.length} قسم · {catActive} نشط</span>
                  </h3>
                </div>
                <div className="space-y-2">
                  {catFlags.map(f => {
                    const status = STATUS_CONFIG.find(s => s.value === f.status);
                    const Icon = status?.icon ?? Flag;
                    return (
                      <Card key={f.id} className={f.status !== "ACTIVE" ? "border-amber-200 dark:border-amber-900/40" : ""}>
                        <CardContent className="p-3">
                          <div className="flex items-start justify-between gap-3 flex-wrap">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap mb-1">
                                <code className="font-mono text-xs bg-muted px-2 py-0.5 rounded" dir="ltr">{f.key}</code>
                                <Badge className={`${status?.color ?? "bg-muted"} text-[10px]`}><Icon className="size-3" /> {status?.label ?? f.status}</Badge>
                              </div>
                              <h4 className="font-bold text-sm">{f.nameAr}</h4>
                              {f.description && <p className="text-xs text-muted-foreground mt-0.5">{f.description}</p>}
                              {f.message && <p className="text-xs text-amber-700 dark:text-amber-300 mt-1 italic">"{f.message}"</p>}
                            </div>
                            <div className="flex gap-1 flex-shrink-0">
                              {f.status !== "ACTIVE" && (
                                <Button size="sm" variant="outline" className="h-8 text-xs" disabled={updating === f.id} onClick={() => changeStatus(f.id, "ACTIVE")}>
                                  <Power className="size-3" /> تشغيل
                                </Button>
                              )}
                              {f.status === "ACTIVE" && (
                                <Button size="sm" variant="outline" className="h-8 text-xs text-amber-600" disabled={updating === f.id} onClick={() => changeStatus(f.id, "MAINTENANCE")}>
                                  <Wrench className="size-3" /> صيانة
                                </Button>
                              )}
                              {f.status === "ACTIVE" && (
                                <Button size="sm" variant="outline" className="h-8 text-xs text-blue-600" disabled={updating === f.id} onClick={() => changeStatus(f.id, "COMING_SOON")}>
                                  <Clock className="size-3" /> قريباً
                                </Button>
                              )}
                              {f.status === "ACTIVE" && (
                                <Button size="sm" variant="outline" className="h-8 text-xs text-red-600" disabled={updating === f.id} onClick={() => changeStatus(f.id, "DISABLED")}>
                                  <AlertCircle className="size-3" /> توقيف
                                </Button>
                              )}
                              {f.status !== "ACTIVE" && (
                                <Button size="sm" variant="outline" className="h-8 text-xs text-muted-foreground" disabled={updating === f.id} onClick={() => changeStatus(f.id, "HIDDEN")}>
                                  <EyeOff className="size-3" /> إخفاء
                                </Button>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
