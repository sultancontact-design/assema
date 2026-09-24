// ===================================================================
//  صفحة مساحات الإعلان — /admin/ads/slots
//  Server Component — SUPER_ADMIN فقط
//  - جدول كل AdSlots: name, position, type, status, views, clicks, CTR
//  - زر "إنشاء مساحة" → نافذة مع Form (name, position, type, content, ...)
//  - تعديل + حذف لكل صف (داخل نافذة التعديل)
//  - ترتيب حسب الأولوية (priority)
// ===================================================================

import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Megaphone,
  Plus,
  ArrowRight,
  Eye,
  MousePointerClick,
  TrendingUp,
} from "lucide-react";
import {
  PositionBadge,
  TypeBadge,
  type AdSlotRow,
} from "@/components/admin/ads/ad-slot-form-dialog";
import CreateSlotButton from "./create-trigger";
import EditSlotButton from "./edit-trigger";
import { formatDateArabic, formatNumber } from "@/lib/constants";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "مساحات الإعلان",
  description: "إدارة المساحات الإعلانية السبعة: الترويسة، الشريط الجانبي، التذييل، إلخ.",
};

function computeCTR(views: number, clicks: number): number {
  if (views <= 0) return 0;
  return Math.round((clicks / views) * 1000) / 10;
}

export default async function AdminAdSlotsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?callbackUrl=/admin/ads/slots");
  if (user.role !== "SUPER_ADMIN") redirect("/community");

  const slots = await db.adSlot.findMany({
    orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
    take: 200,
  });

  const rows: AdSlotRow[] = slots.map((s) => ({
    id: s.id,
    name: s.name,
    position: s.position,
    type: s.type,
    content: s.content,
    imageUrl: s.imageUrl,
    linkUrl: s.linkUrl,
    width: s.width,
    height: s.height,
    isActive: s.isActive,
    startDate: s.startDate?.toISOString() ?? null,
    endDate: s.endDate?.toISOString() ?? null,
    priority: s.priority,
    views: s.views,
    clicks: s.clicks,
    createdAt: s.createdAt.toISOString(),
  }));

  const totalViews = rows.reduce((s, r) => s + r.views, 0);
  const totalClicks = rows.reduce((s, r) => s + r.clicks, 0);
  const activeCount = rows.filter((r) => r.isActive).length;
  const overallCTR = computeCTR(totalViews, totalClicks);

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-1 text-sm text-muted-foreground mb-1">
            <Link
              href="/admin/ads"
              className="hover:text-primary transition-colors"
            >
              الإعلانات
            </Link>
            <span className="mx-1">/</span>
            <span>المساحات</span>
          </div>
          <h1 className="font-heading text-2xl font-bold text-foreground md:text-3xl">
            مساحات الإعلان
          </h1>
          <p className="text-sm text-muted-foreground max-w-2xl">
            إدارة 7 مواضع إعلانية: الترويسة، الشريط الجانبي (علوي/سفلي)، داخل
            التدفق، التذييل، يسار، يمين. يُقدَّم الموضع ذو الأولوية الأعلى
            ضمن كل موضع.
          </p>
        </div>
        <CreateSlotButton />
      </header>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <KPI
          label="إجمالي المساحات"
          value={formatNumber(rows.length)}
          icon={<Megaphone className="size-5 text-primary" />}
        />
        <KPI
          label="المساحات النشطة"
          value={formatNumber(activeCount)}
          icon={<Plus className="size-5 text-secondary" />}
        />
        <KPI
          label="إجمالي الظهور"
          value={formatNumber(totalViews)}
          icon={<Eye className="size-5 text-accent" />}
        />
        <KPI
          label="معدّل النقر CTR"
          value={`${overallCTR}%`}
          icon={<TrendingUp className="size-5 text-primary" />}
        />
      </div>

      <Card className="border border-border bg-card">
        <CardHeader className="border-b border-border flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-sm font-medium text-foreground">
            <Megaphone className="size-4 text-accent" />
            <span>المساحات ({rows.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto custom-scrollbar max-h-[60vh]">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-start">الاسم</TableHead>
                  <TableHead className="text-start">الموضع</TableHead>
                  <TableHead className="text-start">النوع</TableHead>
                  <TableHead className="text-start">الحالة</TableHead>
                  <TableHead className="text-start">الأولوية</TableHead>
                  <TableHead className="text-start">الظهور</TableHead>
                  <TableHead className="text-start">النقرات</TableHead>
                  <TableHead className="text-start">CTR</TableHead>
                  <TableHead className="text-start">الفترة</TableHead>
                  <TableHead className="text-start"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={10}
                      className="text-center text-muted-foreground py-10"
                    >
                      لا توجد مساحات إعلانية بعد — أنشئ أوّل مساحة.
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium text-foreground">
                        <div className="flex items-center gap-2">
                          <MousePointerClick className="size-3.5 text-muted-foreground" />
                          <span>{r.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <PositionBadge value={r.position} />
                      </TableCell>
                      <TableCell>
                        <TypeBadge value={r.type} />
                      </TableCell>
                      <TableCell>
                        {r.isActive ? (
                          <Badge
                            variant="outline"
                            className="border-emerald-600/30 bg-emerald-600/10 text-emerald-700 dark:text-emerald-400"
                          >
                            نشط
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="border-zinc-500/30 bg-zinc-500/10 text-zinc-700 dark:text-zinc-400"
                          >
                            معطّل
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-center font-mono text-xs">
                        {r.priority}
                      </TableCell>
                      <TableCell className="text-center">
                        {formatNumber(r.views)}
                      </TableCell>
                      <TableCell className="text-center">
                        {formatNumber(r.clicks)}
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="font-semibold text-primary">
                          {computeCTR(r.views, r.clicks)}%
                        </span>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {r.startDate || r.endDate ? (
                          <span dir="ltr">
                            {r.startDate
                              ? formatDateArabic(new Date(r.startDate))
                              : "—"}
                            {" ← "}
                            {r.endDate
                              ? formatDateArabic(new Date(r.endDate))
                              : "∞"}
                          </span>
                        ) : (
                          <span>دائم</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <EditSlotButton slot={r} />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <div className="text-xs text-muted-foreground">
        <ArrowRight className="inline size-3 ms-1" />
        المساحات تُعرض في: الترويسة، الشريط الجانبي (علوي/سفلي)، داخل التدفق،
        التذييل، يسار، يمين.
      </div>
    </div>
  );
}

// ─────────── KPI helpers ───────────
function KPI({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <Card className="border border-border bg-card">
      <CardContent className="p-4">
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-muted/60 p-1.5">{icon}</div>
          <div className="min-w-0">
            <p className="truncate text-[11px] text-muted-foreground">{label}</p>
            <p className="font-heading text-lg font-bold text-foreground">{value}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
