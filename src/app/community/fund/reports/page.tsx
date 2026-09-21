// ===================================================================
//  صفحة تقارير الصندوق الدورية — /community/fund/reports
//  Server Component يجمع 4 فترات (يومي/أسبوعي/شهري/سنوي)
//  يُمرّر البيانات لـ FundReportsClient للتفاعل (تبويبات + رسوم + تصدير)
// ===================================================================

import { redirect } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, BarChart3, FileSpreadsheet } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { hasPermission } from "@/lib/roles";
import { db } from "@/lib/db";
import { ZelligeDivider } from "@/components/shared/zellige-divider";
import {
  FundReportsClient,
  type FundReportsClientProps,
} from "@/components/community/fund-reports-client";

export const dynamic = "force-dynamic";

interface RawContribution {
  id: string;
  amount: number;
  status: string;
  receiptNumber: string | null;
  method: string;
  createdAt: Date;
  user: { fullName: string } | null;
}

interface RawRequest {
  id: string;
  amountDisbursed: number | null;
  status: string;
  anonymousCode: string | null;
  type: string;
  title: string;
  disbursedAt: Date | null;
  user: { fullName: string } | null;
  reviewedById: string | null;
  disbursedById: string | null;
}

interface PeriodData {
  contributionsCount: number;
  contributionsAmount: number;
  requestsCount: number;
  disbursedAmount: number;
  balance: number;
  transactions: FundReportsClientProps["periods"]["daily"]["transactions"];
  monthlySeries: { month: string; contributions: number; disbursed: number }[];
}

async function buildPeriodData(
  districtId: string,
  from: Date,
  to: Date
): Promise<PeriodData> {
  const [contributions, fundRequests] = await Promise.all([
    db.contribution.findMany({
      where: {
        districtId,
        createdAt: { gte: from, lte: to },
      },
      include: { user: { select: { fullName: true } } },
      orderBy: { createdAt: "desc" },
      take: 500,
    }) as Promise<RawContribution[]>,
    db.fundRequest.findMany({
      where: {
        districtId,
        OR: [
          { createdAt: { gte: from, lte: to } },
          { disbursedAt: { gte: from, lte: to } },
        ],
      },
      include: {
        user: { select: { fullName: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 500,
    }) as Promise<RawRequest[]>,
  ]);

  // جلب أسماء المُصرِّفين دفعة واحدة (لا توجد علاقة)
  const disbursedByIds = Array.from(
    new Set(
      fundRequests
        .map((r) => r.disbursedById)
        .filter((id): id is string => !!id)
    )
  );
  const disbursers = disbursedByIds.length
    ? await db.user.findMany({
        where: { id: { in: disbursedByIds } },
        select: { id: true, fullName: true },
      })
    : [];
  const disbursersMap = new Map(disbursers.map((u) => [u.id, u.fullName]));

  const transactions: PeriodData["transactions"] = [];

  for (const c of contributions) {
    transactions.push({
      date: c.createdAt.toISOString(),
      type: "مساهمة",
      reference: c.receiptNumber ?? "—",
      amount: c.amount,
      status: c.status,
      by: c.user?.fullName ?? "—",
      isContribution: true,
    });
  }

  for (const r of fundRequests) {
    const isDisbursed =
      r.disbursedAt && r.disbursedAt >= from && r.disbursedAt <= to;
    const refDate = isDisbursed ? r.disbursedAt! : (r as unknown as { createdAt: Date }).createdAt;
    transactions.push({
      date: refDate.toISOString(),
      type: isDisbursed ? "صرف" : `طلب`,
      reference: r.anonymousCode ?? "—",
      amount: r.amountDisbursed ?? 0,
      status: r.status,
      by: isDisbursed
        ? (r.disbursedById ? (disbursersMap.get(r.disbursedById) ?? "—") : "—")
        : r.user?.fullName ?? "—",
      isContribution: false,
    });
  }

  // ترتيب زمني تنازلي
  transactions.sort((a, b) => (a.date < b.date ? 1 : -1));

  const confirmedContribs = contributions.filter((c) => c.status === "CONFIRMED");
  const contributionsAmount = confirmedContribs.reduce((s, c) => s + c.amount, 0);
  const disbursedRequests = fundRequests.filter(
    (r) => r.status === "DISBURSED" || r.status === "COMPLETED"
  );
  const disbursedAmount = disbursedRequests.reduce(
    (s, r) => s + (r.amountDisbursed ?? 0),
    0
  );
  const balance = contributionsAmount - disbursedAmount;

  // السلسلة الشهرية: آخر 12 شهراً قبل "to"
  const monthlySeries: PeriodData["monthlySeries"] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(to.getFullYear(), to.getMonth() - i, 1);
    const monthStart = new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0);
    const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
    const cAgg = await db.contribution.aggregate({
      where: {
        districtId,
        status: "CONFIRMED",
        createdAt: { gte: monthStart, lte: monthEnd },
      },
      _sum: { amount: true },
    });
    const dAgg = await db.fundRequest.aggregate({
      where: {
        districtId,
        status: { in: ["DISBURSED", "COMPLETED"] },
        disbursedAt: { gte: monthStart, lte: monthEnd },
      },
      _sum: { amountDisbursed: true },
    });
    const monthLabel = new Intl.DateTimeFormat("ar-MA", {
      month: "short",
      year: "2-digit",
    }).format(d);
    monthlySeries.push({
      month: monthLabel,
      contributions: cAgg._sum.amount ?? 0,
      disbursed: dAgg._sum.amountDisbursed ?? 0,
    });
  }

  return {
    contributionsCount: confirmedContribs.length,
    contributionsAmount,
    requestsCount: fundRequests.length,
    disbursedAmount,
    balance,
    transactions,
    monthlySeries,
  };
}

export default async function FundReportsPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?callbackUrl=/community/fund/reports");
  }
  if (
    !hasPermission(user.role, "fund.report.view") &&
    user.role !== "ETHICS_COMMITTEE"
  ) {
    redirect("/community/fund?error=forbidden");
  }

  const now = new Date();
  const districtId = user.districtId ?? "";

  // بناء الفترات الأربع
  const dailyFrom = new Date(now);
  dailyFrom.setHours(0, 0, 0, 0);

  const weeklyFrom = new Date(now);
  weeklyFrom.setDate(weeklyFrom.getDate() - 6);
  weeklyFrom.setHours(0, 0, 0, 0);

  const monthlyFrom = new Date(now);
  monthlyFrom.setDate(monthlyFrom.getDate() - 29);
  monthlyFrom.setHours(0, 0, 0, 0);

  const yearlyFrom = new Date(now);
  yearlyFrom.setFullYear(yearlyFrom.getFullYear() - 1);
  yearlyFrom.setHours(0, 0, 0, 0);

  const to = new Date(now);
  to.setHours(23, 59, 59, 999);

  const [daily, weekly, monthly, yearly] = await Promise.all([
    buildPeriodData(districtId, dailyFrom, to),
    buildPeriodData(districtId, weeklyFrom, to),
    buildPeriodData(districtId, monthlyFrom, to),
    buildPeriodData(districtId, yearlyFrom, to),
  ]);

  const district = await db.district.findUnique({
    where: { id: districtId },
    select: { name: true },
  });
  const organization = district?.name ?? "سيدي يوسف بن علي";

  const props: FundReportsClientProps = {
    organization,
    periods: { daily, weekly, monthly, yearly },
  };

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8 space-y-6">
      {/* رأس الصفحة */}
      <section className="space-y-3">
        <div className="flex items-center gap-2 text-sm">
          <Link
            href="/community/fund"
            className="flex items-center gap-1 text-muted-foreground hover:text-primary transition-colors"
          >
            <ChevronLeft className="size-4" />
            <span>صندوق المعروف</span>
          </Link>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-heading text-3xl font-bold text-foreground flex items-center gap-2">
              <BarChart3 className="size-7 text-primary" />
              تقارير الصندوق الدورية
            </h1>
            <p className="mt-1 text-sm text-muted-foreground max-w-2xl">
              تقارير شاملة يومية وأسبوعية وشهرية وسنوية عن المساهمات والصرف
              والرصيد. قابلة للتصدير PDF و CSV.
            </p>
          </div>
        </div>
      </section>

      <ZelligeDivider variant="diamond" />

      <FundReportsClient {...props} />
    </div>
  );
}
