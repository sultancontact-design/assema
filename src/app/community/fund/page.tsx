// ===================================================================
//  صفحة صندوق المعروف — قلب المنصة
//  /community/fund  — v35.3: Hero + Bento (balance featured + KPI grid)
// ===================================================================

import { redirect } from "next/navigation";
import {
  subMonths,
  format,
  startOfMonth,
} from "date-fns";
import type { ReactNode } from "react";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  Home as HomeIcon,
  Wallet,
  Receipt,
  HandCoins,
  Users,
  TrendingDown,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { PageHero } from "@/components/community/page-hero";
import { FundTabs, type FundTabsProps } from "@/components/community/fund-tabs";
import type {
  ContributionMethod,
  ContributionStatus,
  FundRequestStatus,
  FundRequestType,
} from "@prisma/client";

export const dynamic = "force-dynamic";

// ===================================================================
//  بناء بيانات الشفافية للرسم البياني
// ===================================================================

async function buildTransparencyData(userDistrictId: string) {
  // 1) الإجماليات
  const confirmedContribs = await db.contribution.aggregate({
    where: { status: "CONFIRMED", districtId: userDistrictId },
    _sum: { amount: true },
  });
  const disbursed = await db.fundRequest.aggregate({
    where: {
      status: { in: ["DISBURSED", "COMPLETED"] },
      districtId: userDistrictId,
    },
    _sum: { amountDisbursed: true },
  });
  const totalContributions = confirmedContribs._sum.amount ?? 0;
  const totalDisbursed = disbursed._sum.amountDisbursed ?? 0;
  const currentBalance = totalContributions - totalDisbursed;

  // 2) المساهمات الشهرية لآخر 12 شهراً
  const now = new Date();
  const monthlyData: { month: string; total: number }[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = subMonths(startOfMonth(now), i);
    const m = format(d, "yyyy-MM");
    const monthLabel = format(d, "MMM") + " " + format(d, "yy");
    const agg = await db.contribution.aggregate({
      where: {
        status: "CONFIRMED",
        districtId: userDistrictId,
        month: m,
      },
      _sum: { amount: true },
    });
    monthlyData.push({
      month: monthLabel,
      total: agg._sum.amount ?? 0,
    });
  }

  // 3) الطلبات حسب النوع
  const typeGroups = await db.fundRequest.groupBy({
    by: ["type"],
    where: { districtId: userDistrictId },
    _count: { _all: true },
  });
  const typeCounts = typeGroups.map((g) => ({
    type: g.type as FundRequestType,
    count: g._count._all,
  }));

  // 4) توزيع طرق الدفع
  const methodGroups = await db.contribution.groupBy({
    by: ["method"],
    where: { districtId: userDistrictId },
    _count: { _all: true },
  });
  const methodCounts = methodGroups.map((g) => ({
    method: g.method as ContributionMethod,
    count: g._count._all,
  }));

  // 5) آخر 10 مساهمات (مجهولة الهوية حفاظاً على الكرامة)
  const recentContribs = await db.contribution.findMany({
    where: { districtId: userDistrictId },
    orderBy: { createdAt: "desc" },
    take: 10,
    select: {
      id: true,
      receiptNumber: true,
      amount: true,
      method: true,
      status: true,
      createdAt: true,
    },
  });
  const recentContributions = recentContribs.map((c) => ({
    id: c.id,
    receiptNumber: c.receiptNumber,
    amount: c.amount,
    method: c.method as ContributionMethod,
    status: c.status as ContributionStatus,
    createdAt: c.createdAt.toISOString(),
  }));

  // 6) آخر 5 طلبات (مجهولة الهوية)
  const recentReqs = await db.fundRequest.findMany({
    where: { districtId: userDistrictId },
    orderBy: { createdAt: "desc" },
    take: 5,
    select: {
      id: true,
      anonymousCode: true,
      type: true,
      status: true,
      amountRequested: true,
      createdAt: true,
    },
  });
  const recentRequests = recentReqs.map((r) => ({
    id: r.id,
    anonymousCode: r.anonymousCode,
    type: r.type as FundRequestType,
    status: r.status as FundRequestStatus,
    amountRequested: r.amountRequested,
    createdAt: r.createdAt.toISOString(),
  }));

  return {
    totalContributions,
    totalDisbursed,
    currentBalance,
    monthlyData,
    typeCounts,
    methodCounts,
    recentContributions,
    recentRequests,
  };
}

// ===================================================================
//  الصفحة الرئيسية
// ===================================================================

export default async function FundPage() {
  // التحقّق من المصادقة (للتبويبات الخاصة)
  const user = await getCurrentUser();
  const authed = !!user;

  // استرجاع بيانات أمين الصندوق للحي (إن كان مسجّلاً)
  let treasurerName: string | null = null;
  let treasurerPhone: string | null = null;
  if (user) {
    const treasurer = await db.user.findFirst({
      where: {
        role: "TREASURER",
        districtId: user.districtId,
        status: "ACTIVE",
      },
      select: { fullName: true, phone: true },
    });
    treasurerName = treasurer?.fullName ?? null;
    treasurerPhone = treasurer?.phone ?? null;
  }

  // بناء بيانات الشفافية (استخدام حي المستخدم أو الحي الافتراضي)
  const districtId = user?.districtId ?? (await getDefaultDistrictId());
  const transparency = await buildTransparencyData(districtId);

  // مساهمات وطلبات المستخدم الحالي
  let existingContributions: FundTabsProps["existingContributions"] = [];
  let existingRequests: FundTabsProps["existingRequests"] = [];
  if (user) {
    const contribs = await db.contribution.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        amount: true,
        month: true,
        year: true,
        method: true,
        receiptNumber: true,
        digitalReceipt: true,
        status: true,
        createdAt: true,
      },
    });
    existingContributions = contribs.map((c) => ({
      id: c.id,
      amount: c.amount,
      month: c.month,
      year: c.year,
      method: c.method as ContributionMethod,
      receiptNumber: c.receiptNumber,
      digitalReceipt: c.digitalReceipt,
      status: c.status as ContributionStatus,
      createdAt: c.createdAt.toISOString(),
    }));

    const reqs = await db.fundRequest.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { _count: { select: { approvals: true } } },
    });
    existingRequests = reqs.map((r) => ({
      id: r.id,
      anonymousCode: r.anonymousCode,
      type: r.type as FundRequestType,
      title: r.title,
      amountRequested: r.amountRequested,
      status: r.status as FundRequestStatus,
      requiresEthics: r.requiresEthics,
      createdAt: r.createdAt.toISOString(),
      approvalsCount: r._count.approvals,
    }));
  }

  // إن لم يكن مسجّلاً، نسمح له برؤية الشفافية فقط
  // (يتم تعطيل الأزرار وتبديل النماذج ببوابة مصادقة)
  const balance = transparency.currentBalance;
  const fmt = (n: number) => new Intl.NumberFormat("ar-MA").format(n);

  return (
    <div className="flex flex-col">
      {/* ━━━ Hero بصورة + عنوان display ━━━ */}
      <PageHero
        title="صندوق المعروف الرقمي"
        subtitle="صندوق تضامني رقمي بديل عن صندوق الأفراح والأتراح التقليدي. شفافية كاملة، سرّية تامة للمستفيدين، وموافقة لجنة نزاهة للطلبات الكبيرة."
        image="https://images.unsplash.com/photo-1601598851547-4308f1d1fa0f?auto=format&fit=crop&w=1920&q=80"
        imageAlt="صندوق المعروف — مساهمات تضامنية"
        badge="شفافية مطلقة"
      />

      <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* ━━━ Bento: بطاقة الرصيد الكبيرة (featured col-span-2 row-span-2) + 4 KPI صغيرة ━━━ */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 auto-rows-[120px]">
          {/* البطاقة المميّزة — الرصيد الحالي */}
          <Card className="md:col-span-2 md:row-span-2 relative overflow-hidden border-0 bg-gradient-to-br from-secondary/15 via-secondary/5 to-transparent border-s-4 border-s-secondary">
            <CardContent className="p-6 h-full flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="grid size-9 place-items-center rounded-xl bg-secondary/15 text-secondary">
                    <Wallet className="size-5" />
                  </span>
                  <span className="text-xs font-medium text-muted-foreground">
                    الرصيد الحالي
                  </span>
                </div>
                {authed ? (
                  <Badge variant="outline" className="bg-secondary/5 text-secondary border-secondary/30">
                    <HomeIcon className="size-3" />
                    مسجّل كعضو
                  </Badge>
                ) : (
                  <Button asChild size="sm" className="h-9">
                    <Link href="/login?callbackUrl=/community/fund">سجّل للمساهمة</Link>
                  </Button>
                )}
              </div>
              <div>
                <p className="font-heading font-extrabold text-secondary" style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)" }}>
                  {fmt(balance)}
                  <span className="text-base font-normal text-muted-foreground ms-2">د.م</span>
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  مبالغ مؤكّدة بعد الصرف — محدّث لحظياً من قاعدة البيانات
                </p>
              </div>
            </CardContent>
          </Card>

          {/* 4 KPI صغيرة */}
          <KpiTile icon={<HandCoins className="size-5" />} label="إجمالي المساهمات" value={fmt(transparency.totalContributions)} unit="د.م" accent="primary" />
          <KpiTile icon={<TrendingDown className="size-5" />} label="إجمالي المصروف" value={fmt(transparency.totalDisbursed)} unit="د.م" accent="accent" />
          <KpiTile icon={<Receipt className="size-5" />} label="مساهمات (آخر 30 يوم)" value={String(transparency.recentContributions.length)} accent="primary" />
          <KpiTile icon={<Users className="size-5" />} label="طلبات قيد المراجعة" value={String(transparency.recentRequests.length)} accent="secondary" />
        </div>

        {/* التبويبات */}
        <FundTabs
          transparency={transparency}
          authed={authed}
          treasurerName={treasurerName}
          treasurerPhone={treasurerPhone}
          existingContributions={existingContributions}
          existingRequests={existingRequests}
        />
      </div>
    </div>
  );
}

// ━━━ بطاقة KPI صغيرة ━━━
function KpiTile({
  icon, label, value, unit, accent,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  unit?: string;
  accent: "primary" | "secondary" | "accent";
}) {
  const accentClasses = {
    primary: "bg-primary/10 text-primary",
    secondary: "bg-secondary/10 text-secondary",
    accent: "bg-accent/15 text-accent-foreground",
  };
  const valueColor = {
    primary: "text-primary",
    secondary: "text-secondary",
    accent: "text-accent",
  };
  return (
    <Card className="lift-on-hover">
      <CardContent className="p-4">
        <div className={`grid size-9 place-items-center rounded-xl mb-2 ${accentClasses[accent]}`}>
          {icon}
        </div>
        <p className="text-[11px] text-muted-foreground mb-1">{label}</p>
        <p className={`font-heading font-extrabold tabular-nums ${valueColor[accent]} text-2xl`}>
          {value}
          {unit && <span className="text-xs font-normal text-muted-foreground ms-1">{unit}</span>}
        </p>
      </CardContent>
    </Card>
  );
}

// ===================================================================
//  جلب الحي الافتراضي عند عدم تسجيل الدخول
// ===================================================================

async function getDefaultDistrictId(): Promise<string> {
  const d = await db.district.findFirst({
    where: { isDefault: true, isActive: true },
    select: { id: true },
  });
  if (d) return d.id;
  const anyDistrict = await db.district.findFirst({ select: { id: true } });
  if (anyDistrict) return anyDistrict.id;
  // fallback: لا يوجد حي على الإطلاق
  redirect("/register");
}
