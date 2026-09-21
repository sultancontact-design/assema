// ===================================================================
//  صفحة نظرة عامة على قسم الإعلانات — /admin/ads
//  Server Component:
//  - جلب كل إعلانات الحي + حساب KPIs + سلاسل الرسوم
//  - تمرير البيانات لـ AdsKpiCards + AdsCharts
//  - جدول آخر 10 إعلانات (inline)
//  - قائمة بانتظار الموافقة (inline)
// ===================================================================

import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { hasPermission } from "@/lib/roles";
import { db } from "@/lib/db";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AD_PACKAGE_LABELS,
  AD_STATUS_LABELS,
  AD_PLACEMENT_LABELS,
  formatMAD,
  formatNumber,
  formatDateArabic,
} from "@/lib/constants";
import { AdsKpiCards, type AdsKpis } from "@/components/admin/ads/ads-kpi-cards";
import { AdsCharts, type AdsOverviewData } from "@/components/admin/ads/ads-charts";
import {
  buildMonthlyRevenueSeries,
  buildPackageRevenueSeries,
  buildStatusDistribution,
  computeCTR,
  computeRPM,
  toAdRow,
  type AdRow,
} from "@/lib/ads-utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertCircle,
  Clock,
  Megaphone,
  ArrowLeft,
} from "lucide-react";
import type { AdStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

const STATUS_BADGE_CLASS: Record<AdStatus, string> = {
  DRAFT: "border-border bg-muted text-muted-foreground",
  PENDING: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400",
  ACTIVE: "border-emerald-600/30 bg-emerald-600/10 text-emerald-700 dark:text-emerald-400",
  PAUSED: "border-orange-600/30 bg-orange-600/10 text-orange-700 dark:text-orange-400",
  EXPIRED: "border-zinc-500/30 bg-zinc-500/10 text-zinc-700 dark:text-zinc-400",
  REJECTED: "border-rose-600/30 bg-rose-600/10 text-rose-700 dark:text-rose-400",
};

export default async function AdminAdsOverviewPage() {
  const user = await getCurrentUser();
  if (!user) return null;
  if (!hasPermission(user.role, "ad.view")) return null;

  const ads = await db.ad.findMany({
    where: { districtId: user.districtId ?? "" },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  // ===================================================================
  //  حساب KPIs
  // ===================================================================

  const revenueAds = ads.filter(
    (a) => a.status === "ACTIVE" || a.status === "EXPIRED"
  );
  const totalRevenue = revenueAds.reduce((s, a) => s + a.amountPaid, 0);
  const activeCount = ads.filter((a) => a.status === "ACTIVE").length;
  const totalViews = ads.reduce((s, a) => s + a.views, 0);
  const totalClicks = ads.reduce((s, a) => s + a.clicks, 0);
  const ctr = computeCTR(totalViews, totalClicks);
  const rpm = computeRPM(totalRevenue, totalViews);

  const kpis: AdsKpis = {
    totalRevenue,
    activeCount,
    totalViews,
    totalClicks,
    ctr,
    rpm,
  };

  // ===================================================================
  //  سلاسل الرسوم البيانية
  // ===================================================================

  const overviewData: AdsOverviewData = {
    monthlyRevenue: buildMonthlyRevenueSeries(ads),
    packageRevenue: buildPackageRevenueSeries(ads),
    statusDistribution: buildStatusDistribution(ads),
  };

  // آخر 10 إعلانات
  const recent: AdRow[] = ads.slice(0, 10).map(toAdRow);

  // قائمة بانتظار الموافقة
  const pending: AdRow[] = ads
    .filter((a) => a.status === "PENDING")
    .slice(0, 5)
    .map(toAdRow);

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground md:text-3xl">
            إدارة الإعلانات
          </h1>
          <p className="text-sm text-muted-foreground">
            نظرة شاملة على الإيرادات الإعلانية وأداء الحملات النشطة.
          </p>
        </div>
        <Link
          href="/admin/ads/campaigns"
          className="inline-flex h-11 items-center gap-2 rounded-md bg-foreground px-4 text-sm font-medium text-background transition-opacity hover:opacity-90"
        >
          <Megaphone className="size-4" strokeWidth={1.5} />
          <span>إدارة الحملات</span>
          <ArrowLeft className="size-4" strokeWidth={1.5} />
        </Link>
      </header>

      <AdsKpiCards kpis={kpis} />

      <AdsCharts data={overviewData} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* آخر الإعلانات */}
        <Card className="border border-border bg-card lg:col-span-2">
          <CardHeader className="border-b border-border">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Clock className="size-4 text-accent" strokeWidth={1.5} />
              <span>آخر الإعلانات (10)</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto custom-scrollbar">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="text-start">العنوان</TableHead>
                    <TableHead className="text-start">المعلن</TableHead>
                    <TableHead className="text-start">الباقة</TableHead>
                    <TableHead className="text-start">المبلغ</TableHead>
                    <TableHead className="text-start">الحالة</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recent.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">
                        لا توجد إعلانات بعد
                      </TableCell>
                    </TableRow>
                  ) : (
                    recent.map((ad) => (
                      <TableRow key={ad.id}>
                        <TableCell className="font-medium text-foreground">
                          {ad.title}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {ad.advertiserName}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="border-accent/30 bg-accent/10 text-accent">
                            {AD_PACKAGE_LABELS[ad.package].label}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium text-foreground">
                          {formatMAD(ad.amountPaid)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={STATUS_BADGE_CLASS[ad.status]}>
                            {AD_STATUS_LABELS[ad.status]}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* بانتظار الموافقة */}
        <Card className="border border-border bg-card">
          <CardHeader className="border-b border-border">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-foreground">
              <AlertCircle className="size-4 text-accent" strokeWidth={1.5} />
              <span>بانتظار الموافقة</span>
              {pending.length > 0 && (
                <Badge variant="outline" className="ms-2 border-accent/30 bg-accent/10 text-accent">
                  {pending.length}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {pending.length === 0 ? (
              <p className="p-4 text-sm text-muted-foreground">
                لا توجد حملات بانتظار الموافقة.
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {pending.map((ad) => (
                  <li key={ad.id} className="flex flex-col gap-1 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium text-foreground">
                        {ad.title}
                      </span>
                      <Badge variant="outline" className="border-accent/30 bg-accent/10 text-accent">
                        {AD_PACKAGE_LABELS[ad.package].label}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
                      <span>{ad.advertiserName}</span>
                      <span>{AD_PLACEMENT_LABELS[ad.placement] ?? ad.placement}</span>
                      <span>{formatDateArabic(ad.startDate)}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <div className="border-t border-border p-3">
              <Link
                href="/admin/ads/campaigns?status=PENDING"
                className="inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-md bg-muted px-3 text-xs font-medium text-foreground transition-colors hover:bg-muted/70"
              >
                <span>عرض كل الحملات</span>
                <ArrowLeft className="size-3.5" strokeWidth={1.5} />
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
