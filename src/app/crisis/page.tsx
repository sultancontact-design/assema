// v71.0 Section 11 — Disaster Response Module page
import { db } from "@/lib/db";
import { PageHero } from "@/components/community/page-hero";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Droplets, Utensils, Pill, Tent, Shirt, Wrench, Users2, MapPin, CheckCircle2 } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

const RESOURCE_META: Record<string, { label: string; icon: any; color: string }> = {
  water: { label: "ماء", icon: Droplets, color: "text-blue-700 dark:text-blue-300" },
  food: { label: "طعام", icon: Utensils, color: "text-amber-700 dark:text-amber-300" },
  medical: { label: "مستلزمات طبية", icon: Pill, color: "text-rose-700 dark:text-rose-300" },
  shelter: { label: "مآوى", icon: Tent, color: "text-emerald-700 dark:text-emerald-300" },
  clothing: { label: "ملابس", icon: Shirt, color: "text-violet-700 dark:text-violet-300" },
  fuel: { label: "وقود", icon: Wrench, color: "text-slate-700 dark:text-slate-300" },
  tools: { label: "أدوات", icon: Wrench, color: "text-teal-700 dark:text-teal-300" },
};

const ROLE_LABELS: Record<string, string> = {
  medic: "طبيب/ممرض",
  driver: "سائق",
  translator: "مترجم",
  coordinator: "منسّق",
  logistics: "لوجستي",
  search_rescue: "بحث وإنقاذ",
};

const SEVERITY_LABELS: Record<string, { label: string; color: string }> = {
  low: { label: "منخفض", color: "text-slate-700 dark:text-slate-300" },
  moderate: { label: "متوسط", color: "text-amber-700 dark:text-amber-300" },
  high: { label: "عالٍ", color: "text-orange-700 dark:text-orange-300" },
  critical: { label: "حرج", color: "text-rose-700 dark:text-rose-300" },
};

function progressPercent(fulfilled: number, total: number) {
  if (total === 0) return 0;
  return Math.round((fulfilled / total) * 100);
}

export default async function CrisisPage() {
  const crises = await db.crisis.findMany({
    where: { isActive: true },
    take: 10,
    orderBy: [{ severity: "desc" }, { startedAt: "desc" }],
    include: {
      region: { select: { nameAr: true, name: true, slug: true } },
      resourceNeeds: { orderBy: [{ isFulfilled: "asc" }, { urgency: "desc" }] },
      volunteerSlots: { orderBy: [{ isFilled: "asc" }, { role: "asc" }] },
    },
  });

  const stats = {
    total: crises.length,
    critical: crises.filter((c) => c.severity === "critical").length,
    affected: crises.reduce((s, c) => s + (c.affectedPeople ?? 0), 0),
    unfilledNeeds: crises.reduce(
      (s, c) => s + c.resourceNeeds.filter((n) => !n.isFulfilled).length, 0
    ),
    volunteerSlotsOpen: crises.reduce(
      (s, c) => s + c.volunteerSlots.filter((v) => !v.isFilled).length, 0
    ),
  };

  return (
    <div className="min-h-screen bg-background">
      <PageHero
        eyebrow="v71.0 — الاستجابة للأزمات"
        title="وحدة الأزمات"
        subtitle="تنسيق الطوارئ: متطوعون + احتياجات + مفقودون — بأسلوب Ushahidi + Sahana"
      />

      <section className="container mx-auto max-w-7xl px-4 py-12">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
          <Card><CardContent className="p-4 text-center"><AlertTriangle className="h-5 w-5 mx-auto mb-1 text-rose-700" /><p className="text-xl font-bold">{stats.total}</p><p className="text-[10px] text-muted-foreground">أزمات نشطة</p></CardContent></Card>
          <Card><CardContent className="p-4 text-center"><AlertTriangle className="h-5 w-5 mx-auto mb-1 text-orange-700" /><p className="text-xl font-bold">{stats.critical}</p><p className="text-[10px] text-muted-foreground">حرجة</p></CardContent></Card>
          <Card><CardContent className="p-4 text-center"><Users2 className="h-5 w-5 mx-auto mb-1 text-amber-700" /><p className="text-xl font-bold">{stats.affected.toLocaleString("ar-MA")}</p><p className="text-[10px] text-muted-foreground">متأثرون</p></CardContent></Card>
          <Card><CardContent className="p-4 text-center"><Droplets className="h-5 w-5 mx-auto mb-1 text-blue-700" /><p className="text-xl font-bold">{stats.unfilledNeeds}</p><p className="text-[10px] text-muted-foreground">احتياجات غير ملبّاة</p></CardContent></Card>
          <Card><CardContent className="p-4 text-center"><Users2 className="h-5 w-5 mx-auto mb-1 text-emerald-700" /><p className="text-xl font-bold">{stats.volunteerSlotsOpen}</p><p className="text-[10px] text-muted-foreground">متطوعون مطلوبون</p></CardContent></Card>
        </div>

        {/* SOS banner */}
        <Card className="mb-8 border-rose-400 bg-rose-50/30 dark:bg-rose-950/10">
          <CardContent className="p-6 flex items-center gap-4 flex-wrap">
            <div className="h-12 w-12 rounded-full bg-rose-700 text-white flex items-center justify-center shrink-0">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div className="flex-1 min-w-[200px]">
              <h2 className="font-bold text-lg">إشارة SOS طارئة؟</h2>
              <p className="text-sm text-muted-foreground">اضغط مطولاً على زر FAB أسفل الشاشة لمدة 3 ثواني للتشغيل. سيُطلب منك تأكيد صوتي قصير لمنع البلاغات الكاذبة.</p>
            </div>
            <Button variant="destructive" size="sm">تفعيل SOS</Button>
          </CardContent>
        </Card>

        {/* Crises */}
        <div className="space-y-6">
          {crises.map((crisis) => (
            <Card key={crisis.id} className={crisis.severity === "critical" ? "border-rose-400" : ""}>
              <CardContent className="p-6">
                {/* Crisis header */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <Badge variant="outline" className={`text-xs ${SEVERITY_LABELS[crisis.severity]?.color ?? ""}`}>
                        {SEVERITY_LABELS[crisis.severity]?.label ?? crisis.severity}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {crisis.crisisType === "earthquake" ? "زلزال" : crisis.crisisType === "flood" ? "فيضان" : crisis.crisisType === "fire" ? "حريق" : crisis.crisisType}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {crisis.status === "active" ? "نشطة" : crisis.status === "contained" ? "محواة" : crisis.status === "resolved" ? "مُحلولة" : crisis.status}
                      </Badge>
                      {crisis.isVerified && (
                        <Badge variant="outline" className="text-xs bg-emerald-50 text-emerald-700 border-emerald-300">مصدر مؤكّد</Badge>
                      )}
                    </div>
                    <h2 className="text-xl font-bold">{crisis.title}</h2>
                    {crisis.description && <p className="text-sm text-muted-foreground mt-1">{crisis.description}</p>}
                  </div>
                  {crisis.region && (
                    <div className="text-xs text-muted-foreground flex items-center gap-1 shrink-0">
                      <MapPin className="h-3 w-3" />
                      {crisis.region.nameAr || crisis.region.name}
                    </div>
                  )}
                </div>

                {/* Affected stats */}
                <div className="grid grid-cols-2 gap-2 mb-4">
                  <div className="bg-amber-50 dark:bg-amber-950/20 p-2 rounded text-center">
                    <p className="text-[10px] text-muted-foreground">متأثرون</p>
                    <p className="font-bold text-amber-700 dark:text-amber-300">{(crisis.affectedPeople ?? 0).toLocaleString("ar-MA")}</p>
                  </div>
                  <div className="bg-rose-50 dark:bg-rose-950/20 p-2 rounded text-center">
                    <p className="text-[10px] text-muted-foreground">وفيات</p>
                    <p className="font-bold text-rose-700 dark:text-rose-300">{crisis.casualties ?? 0}</p>
                  </div>
                </div>

                {/* Resource needs */}
                {crisis.resourceNeeds.length > 0 && (
                  <div className="mb-4">
                    <h3 className="text-sm font-semibold mb-2">الاحتياجات الإنسانية</h3>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      {crisis.resourceNeeds.map((n) => {
                        const meta = RESOURCE_META[n.category];
                        const Icon = meta?.icon ?? Wrench;
                        const pct = progressPercent(n.quantityFulfilled, n.quantityNeeded);
                        return (
                          <div key={n.id} className={`p-3 rounded border ${n.isFulfilled ? "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-300" : "bg-muted/30 border-border"}`}>
                            <div className="flex items-center gap-2 mb-1">
                              <Icon className={`h-4 w-4 ${meta?.color ?? ""}`} />
                              <span className="text-sm font-medium">{meta?.label ?? n.category}</span>
                              {n.isFulfilled && <CheckCircle2 className="h-3 w-3 text-emerald-600 mr-auto" />}
                            </div>
                            <div className="text-xs text-muted-foreground mb-1">
                              {n.quantityFulfilled}/{n.quantityNeeded} {n.unit}
                            </div>
                            <div className="h-1.5 bg-muted rounded overflow-hidden">
                              <div className="h-full bg-teal-600" style={{ width: `${pct}%` }} />
                            </div>
                            {n.urgency === "critical" && !n.isFulfilled && (
                              <span className="text-[10px] text-rose-700 mt-1 block">عاجل جداً</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Volunteer slots */}
                {crisis.volunteerSlots.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold mb-2">متطوعون مطلوبون</h3>
                    <div className="flex flex-wrap gap-2">
                      {crisis.volunteerSlots.map((s) => {
                        const pct = progressPercent(s.slotsFilled, s.slotsNeeded);
                        return (
                          <div key={s.id} className={`px-3 py-2 rounded border text-xs ${s.isFilled ? "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-300" : "bg-muted/30 border-border"}`}>
                            <p className="font-semibold">{ROLE_LABELS[s.role] ?? s.role}</p>
                            <p className="text-muted-foreground">{s.slotsFilled}/{s.slotsNeeded} متطوع</p>
                            <div className="h-1 bg-muted rounded overflow-hidden mt-1">
                              <div className="h-full bg-emerald-600" style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-8">
          <Button asChild variant="outline"><Link href="/">العودة للرئيسية</Link></Button>
        </div>
      </section>
    </div>
  );
}
