// ===================================================================
//  صفحة صندوق المعروف — قلب المنصة
//  /community/fund
//  Server Component يجمع البيانات العامة + يمرّرها لـ FundTabs (client)
// ===================================================================

import { redirect } from "next/navigation";
import {
  subMonths,
  format,
  startOfMonth,
} from "date-fns";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  Home as HomeIcon,
  ChevronLeft,
  Heart,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ZelligeDivider } from "@/components/shared/zellige-divider";
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
  return (
    <div className="container mx-auto max-w-6xl px-4 py-8 space-y-6">
      {/* رأس الصفحة */}
      <section className="space-y-3">
        <div className="flex items-center gap-2 text-sm">
          <Link
            href="/community"
            className="flex items-center gap-1 text-muted-foreground hover:text-primary transition-colors"
          >
            <ChevronLeft className="size-4" />
            <span>المجتمع</span>
          </Link>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-heading text-3xl font-bold text-foreground flex items-center gap-2">
              <Heart className="size-7 text-primary" />
              صندوق المعروف الرقمي
            </h1>
            <p className="mt-1 text-sm text-muted-foreground max-w-2xl">
              صندوق تضامني رقمي بديل عن صندوق الأفراح والأتراح التقليدي.
              شفافية كاملة، سرّية تامة للمستفيدين، وموافقة لجنة نزاهة للطلبات
              الكبيرة.
            </p>
          </div>
          {authed ? (
            <Badge
              variant="outline"
              className="bg-secondary/5 text-secondary border-secondary/30"
            >
              <HomeIcon className="size-3.5" />
              مسجّل كعضو
            </Badge>
          ) : (
            <Button asChild size="lg" className="h-11">
              <Link href="/login?callbackUrl=/community/fund">
                سجّل الدخول للمساهمة
              </Link>
            </Button>
          )}
        </div>
      </section>

      <ZelligeDivider variant="diamond" />

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
