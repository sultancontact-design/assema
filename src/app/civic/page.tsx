// v71.0 Section 8 — Civic Reporting page
import { db } from "@/lib/db";
import { PageHero } from "@/components/community/page-hero";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CivicReportsClient } from "@/components/civic/civic-reports-client";
import { AlertTriangle, CheckCircle2, Clock, MapPin, Flag } from "lucide-react";

export const dynamic = "force-dynamic";

const CATEGORY_LABELS: Record<string, string> = {
  pothole: "حفرة بطريق",
  lighting: "إنارة معطلة",
  waste: "نفايات",
  water: "مياه/صرف",
  road: "طريق/رصيف",
  park: "حديقة",
  other: "أخرى",
};

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  submitted: { label: "مُرسل", color: "bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-300" },
  verified: { label: "مُوثّق", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" },
  assigned: { label: "مُحال", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300" },
  in_progress: { label: "قيد المعالجة", color: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300" },
  resolved: { label: "مُحلول", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300" },
  rejected: { label: "مرفوض", color: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300" },
};

const PRIORITY_LABELS: Record<string, string> = {
  low: "منخفض",
  normal: "عادي",
  high: "عالٍ",
  critical: "حرج",
};

export default async function CivicPage() {
  const reports = await db.civicReport.findMany({
    where: { isActive: true },
    take: 50,
    orderBy: [{ priority: "desc" }, { publishedAt: "desc" }],
    include: { region: { select: { nameAr: true, name: true, slug: true } } },
  });

  // Serialize for client
  const serialized = reports.map((r) => ({
    ...r,
    publishedAt: r.publishedAt?.toISOString() ?? null,
    createdAt: r.createdAt?.toISOString() ?? null,
    updatedAt: r.updatedAt?.toISOString() ?? null,
    assignedAt: r.assignedAt?.toISOString() ?? null,
    resolvedAt: r.resolvedAt?.toISOString() ?? null,
  }));

  const stats = {
    total: reports.length,
    critical: reports.filter((r) => r.priority === "critical").length,
    resolved: reports.filter((r) => r.status === "resolved").length,
    pending: reports.filter((r) => ["submitted", "verified", "assigned", "in_progress"].includes(r.status)).length,
  };

  return (
    <div className="min-h-screen bg-background">
      <PageHero
        eyebrow="v71.0 — الموطنة"
        title="التبليغ المدني"
        subtitle="بلّغ عن مشاكل البنية التحتية وتابعها حتى الحل — بأسلوب FixMyStreet"
      />

      <section className="container mx-auto max-w-6xl px-4 py-12">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card><CardContent className="p-5 text-center"><AlertTriangle className="h-6 w-6 mx-auto mb-1 text-rose-700" /><p className="text-2xl font-bold">{stats.total}</p><p className="text-xs text-muted-foreground">إجمالي البلاغات</p></CardContent></Card>
          <Card><CardContent className="p-5 text-center"><Flag className="h-6 w-6 mx-auto mb-1 text-amber-700" /><p className="text-2xl font-bold">{stats.critical}</p><p className="text-xs text-muted-foreground">بلاغات حرجة</p></CardContent></Card>
          <Card><CardContent className="p-5 text-center"><Clock className="h-6 w-6 mx-auto mb-1 text-blue-700" /><p className="text-2xl font-bold">{stats.pending}</p><p className="text-xs text-muted-foreground">قيد المعالجة</p></CardContent></Card>
          <Card><CardContent className="p-5 text-center"><CheckCircle2 className="h-6 w-6 mx-auto mb-1 text-emerald-700" /><p className="text-2xl font-bold">{stats.resolved}</p><p className="text-xs text-muted-foreground">مُحلولة</p></CardContent></Card>
        </div>

        {/* Client-side filterable list */}
        <CivicReportsClient
          reports={serialized}
          categoryLabels={CATEGORY_LABELS}
          statusLabels={STATUS_LABELS}
          priorityLabels={PRIORITY_LABELS}
        />
      </section>
    </div>
  );
}
