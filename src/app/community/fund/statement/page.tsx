// ===================================================================
//  صفحة كشف حساب الأسرة — /community/fund/statement
//  Server Component يعرض بيانات الأسرة + المعاملات + الرسم البياني
//  يُمرّر البيانات لـ FundStatementClient للتفاعل (الرسم، فلتر السنة)
// ===================================================================

import { redirect } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Heart, FileText, Users, Wallet } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { ZelligeDivider } from "@/components/shared/zellige-divider";
import {
  FundStatementClient,
  type StatementClientProps,
} from "@/components/community/fund-statement-client";

export const dynamic = "force-dynamic";

interface RawContribution {
  id: string;
  amount: number;
  status: string;
  receiptNumber: string | null;
  month: string;
  year: number;
  createdAt: Date;
  note: string | null;
}

interface RawDisbursement {
  id: string;
  amountDisbursed: number | null;
  status: string;
  anonymousCode: string | null;
  title: string;
  disbursedAt: Date | null;
  type: string;
}

export default async function FundStatementPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?callbackUrl=/community/fund/statement");
  }
  if (!user.familyId) {
    redirect("/community/fund?error=no_family");
  }

  const familyId = user.familyId;
  const family = await db.family.findUnique({
    where: { id: familyId },
    select: {
      id: true,
      familyName: true,
      headOfFamilyId: true,
      memberCount: true,
      economicStatus: true,
    },
  });
  if (!family) {
    redirect("/community/fund?error=family_not_found");
  }

  let headName = "—";
  if (family.headOfFamilyId) {
    const head = await db.user.findUnique({
      where: { id: family.headOfFamilyId },
      select: { fullName: true },
    });
    headName = head?.fullName ?? "—";
  }

  // سنوات متاحة للفلتر
  const years = await db.contribution.findMany({
    where: { familyId },
    distinct: ["year"],
    select: { year: true },
    orderBy: { year: "desc" },
  });
  const availableYears = years.map((y) => y.year);

  // كل المساهمات
  const contributions = (await db.contribution.findMany({
    where: { familyId },
    select: {
      id: true,
      amount: true,
      status: true,
      receiptNumber: true,
      month: true,
      year: true,
      createdAt: true,
      note: true,
    },
    orderBy: { createdAt: "asc" },
  })) as RawContribution[];

  // الصرف
  const disbursements = (await db.fundRequest.findMany({
    where: {
      familyId,
      status: { in: ["DISBURSED", "COMPLETED"] },
      amountDisbursed: { gt: 0 },
    },
    select: {
      id: true,
      amountDisbursed: true,
      status: true,
      anonymousCode: true,
      title: true,
      disbursedAt: true,
      type: true,
    },
    orderBy: { disbursedAt: "asc" },
  })) as RawDisbursement[];

  // دمج المعاملات
  type Union = {
    date: Date;
    type: "مساهمة" | "صرف";
    reference: string;
    description: string;
    amount: number;
  };
  const merged: Union[] = [];
  for (const c of contributions) {
    if (c.status !== "CONFIRMED") continue;
    merged.push({
      date: c.createdAt,
      type: "مساهمة",
      reference: c.receiptNumber ?? "—",
      description: `مساهمة شهر ${c.month}`,
      amount: c.amount,
    });
  }
  for (const d of disbursements) {
    merged.push({
      date: d.disbursedAt ?? new Date(0),
      type: "صرف",
      reference: d.anonymousCode ?? "—",
      description: `صرف طلب — ${d.title}`,
      amount: d.amountDisbursed ?? 0,
    });
  }
  merged.sort((a, b) => a.date.getTime() - b.date.getTime());

  const transactions: StatementClientProps["transactions"] = [];
  let runningBalance = 0;
  for (const t of merged) {
    if (t.type === "مساهمة") {
      runningBalance += t.amount;
      transactions.push({
        date: t.date.toISOString(),
        type: "مساهمة",
        reference: t.reference,
        description: t.description,
        debit: 0,
        credit: t.amount,
        balance: runningBalance,
      });
    } else {
      runningBalance -= t.amount;
      transactions.push({
        date: t.date.toISOString(),
        type: "صرف",
        reference: t.reference,
        description: t.description,
        debit: t.amount,
        credit: 0,
        balance: runningBalance,
      });
    }
  }

  const totalContributions = contributions
    .filter((c) => c.status === "CONFIRMED")
    .reduce((s, c) => s + c.amount, 0);
  const totalDisbursed = disbursements.reduce(
    (s, d) => s + (d.amountDisbursed ?? 0),
    0
  );
  const balance = totalContributions - totalDisbursed;

  // السلسلة الشهرية: 12 شهراً
  const now = new Date();
  const monthlySeries: StatementClientProps["monthlySeries"] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
    const cAgg = await db.contribution.aggregate({
      where: {
        familyId,
        status: "CONFIRMED",
        createdAt: { lte: monthEnd },
      },
      _sum: { amount: true },
    });
    const dAgg = await db.fundRequest.aggregate({
      where: {
        familyId,
        status: { in: ["DISBURSED", "COMPLETED"] },
        disbursedAt: { lte: monthEnd },
      },
      _sum: { amountDisbursed: true },
    });
    const cumBalance = (cAgg._sum.amount ?? 0) - (dAgg._sum.amount ?? 0);
    const monthLabel = new Intl.DateTimeFormat("ar-MA", {
      month: "short",
      year: "2-digit",
    }).format(d);
    monthlySeries.push({
      month: monthLabel,
      balance: cumBalance,
      contributions: cAgg._sum.amount ?? 0,
      disbursed: dAgg._sum.amountDisbursed ?? 0,
    });
  }

  const props: StatementClientProps = {
    family: {
      familyName: family.familyName,
      headOfFamily: headName,
      memberCount: family.memberCount,
      economicStatus: family.economicStatus,
    },
    availableYears,
    summary: {
      totalContributions,
      totalDisbursed,
      balance,
      transactionsCount: transactions.length,
    },
    transactions,
    monthlySeries,
  };

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8 space-y-6">
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
              <FileText className="size-7 text-primary" />
              كشف حساب الأسرة
            </h1>
            <p className="mt-1 text-sm text-muted-foreground max-w-2xl">
              عرض شامل لكل مساهمات أسرة {family.familyName} والصرف الذي استفادت
              منه من الصندوق، مع الرصيد الجاري والتطوّر الشهري.
            </p>
          </div>
          <Badge variant="outline" className="bg-secondary/5">
            <Heart className="size-3.5" />
            سرّي و خاص بأسرتك
          </Badge>
        </div>
      </section>

      <ZelligeDivider variant="diamond" />

      {/* بطاقات معلومات الأسرة */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-border bg-card p-4 warm-shadow">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
            <Users className="size-4" />
            اسم العائلة
          </div>
          <p className="text-lg font-bold text-foreground">{family.familyName}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 warm-shadow">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
            <Users className="size-4" />
            رب الأسرة
          </div>
          <p className="text-lg font-bold text-foreground">{headName}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 warm-shadow">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
            <Users className="size-4" />
            عدد الأفراد
          </div>
          <p className="text-lg font-bold text-foreground">
            {family.memberCount} أفراد
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 warm-shadow">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
            <Wallet className="size-4" />
            الحالة الاقتصادية
          </div>
          <p className="text-lg font-bold text-foreground">
            {family.economicStatus}
          </p>
        </div>
      </section>

      <ZelligeDivider variant="minimal" />

      {/* المكوّن التفاعلي */}
      <FundStatementClient {...props} />
    </div>
  );
}
