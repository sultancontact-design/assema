// @ts-nocheck — @react-pdf/renderer types incompatible with React 19; runtime verified
// ===================================================================
//  GET /api/fund/statement/pdf — توليد PDF كشف حساب الأسرة للمستخدم الحالي
//  - يتسلّم ?year=YYYY (اختياري) لفلترة سنة محددة
//  - يتطلّب المصادقة + ربط الأسرة
// ===================================================================

import { NextResponse, type NextRequest } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import React from "react";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  FundStatementPdfDocument,
  type FundStatementPdfData,
  type StatementTransaction,
  type StatementMonthlyPoint,
} from "@/lib/pdf/fund-statement-pdf";
import { formatDateTimeArabic } from "@/lib/constants";

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

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "غير مُصادَق" }, { status: 401 });
    }
    if (!user.familyId) {
      return NextResponse.json(
        { error: "حسابك غير مربوط بأسرة. تواصل مع الإدارة" },
        { status: 400 }
      );
    }

    const familyId = user.familyId;
    const family = await db.family.findUnique({
      where: { id: familyId },
      select: {
        familyName: true,
        headOfFamilyId: true,
        memberCount: true,
        economicStatus: true,
      },
    });

    if (!family) {
      return NextResponse.json(
        { error: "الأسرة غير موجودة" },
        { status: 404 }
      );
    }

    let headName = "—";
    if (family.headOfFamilyId) {
      const head = await db.user.findUnique({
        where: { id: family.headOfFamilyId },
        select: { fullName: true },
      });
      headName = head?.fullName ?? "—";
    }

    const url = new URL(request.url);
    const yearParam = url.searchParams.get("year");
    let yearFilter: number | undefined;
    if (yearParam && /^\d{4}$/.test(yearParam)) {
      yearFilter = parseInt(yearParam, 10);
    }

    // المساهمات
    const contributions = (await db.contribution.findMany({
      where: {
        familyId,
        ...(yearFilter ? { year: yearFilter } : {}),
      },
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

    // الصرف للأسرة (الطلبات المصروفة/المكتملة)
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

    // دمج المعاملات في قائمة موحّدة مرتّبة زمنياً
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
      const ref = d.anonymousCode ?? "—";
      const amt = d.amountDisbursed ?? 0;
      const dt = d.disbursedAt ?? new Date(0);
      merged.push({
        date: dt,
        type: "صرف",
        reference: ref,
        description: `صرف طلب — ${d.title}`,
        amount: amt,
      });
    }
    merged.sort((a, b) => a.date.getTime() - b.date.getTime());

    const transactions: StatementTransaction[] = [];
    let runningBalance = 0;
    for (const t of merged) {
      if (t.type === "مساهمة") {
        runningBalance += t.amount;
        transactions.push({
          date: formatDateTimeArabic(t.date),
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
          date: formatDateTimeArabic(t.date),
          type: "صرف",
          reference: t.reference,
          description: t.description,
          debit: t.amount,
          credit: 0,
          balance: runningBalance,
        });
      }
    }

    // الإجماليات
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
    const monthlySeries: StatementMonthlyPoint[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      // تجاهل إذا خارج نطاق الفلتر
      if (yearFilter && d.getFullYear() !== yearFilter) continue;
      const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
      const cAggUntil = await db.contribution.aggregate({
        where: {
          familyId,
          status: "CONFIRMED",
          createdAt: { lte: monthEnd },
        },
        _sum: { amount: true },
      });
      const dAggUntil = await db.fundRequest.aggregate({
        where: {
          familyId,
          status: { in: ["DISBURSED", "COMPLETED"] },
          disbursedAt: { lte: monthEnd },
        },
        _sum: { amountDisbursed: true },
      });
      const cumBalance =
        (cAggUntil._sum?.amount ?? 0) - (dAggUntil._sum?.amountDisbursed ?? 0);
      const monthLabel = new Intl.DateTimeFormat("ar-MA", {
        month: "short",
        year: "2-digit",
      }).format(d);
      monthlySeries.push({
        month: monthLabel,
        balance: cumBalance,
      });
    }

    const district = await db.district.findFirst({
      where: { id: user.districtId ?? "" },
      select: { name: true },
    });
    const organization = district?.name ?? "سيدي يوسف بن علي";

    const periodLabel = yearFilter
      ? `سنة ${yearFilter}`
      : "كل الفترات (منذ التأسيس)";

    const data: FundStatementPdfData = {
      organization,
      generatedAt: formatDateTimeArabic(new Date()),
      periodLabel,
      family: {
        familyName: family.familyName,
        headOfFamily: headName,
        memberCount: family.memberCount,
        economicStatus: family.economicStatus,
      },
      summary: {
        totalContributions,
        totalDisbursed,
        balance,
        transactionsCount: transactions.length,
      },
      transactions,
      monthlySeries,
    };

    // @ts-expect-error — @react-pdf/renderer type mismatch with React 19 (runtime works)
    const pdfBuffer = await renderToBuffer(
      React.createElement(FundStatementPdfDocument, { data })
    );

    const filename = `statement-${family.familyName.replace(/\s/g, "-")}-${yearFilter ?? "all"}.pdf`;
    const asciiFilename = `statement-family-${yearFilter ?? "all"}.pdf`;

    return new NextResponse(pdfBuffer as unknown as BodyInit, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Length": String(pdfBuffer.length),
        "Content-Disposition": `attachment; filename="${asciiFilename}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("[GET /api/fund/statement/pdf]:", err);
    return NextResponse.json(
      { error: "حدث خطأ أثناء توليد كشف الحساب" },
      { status: 500 }
    );
  }
}
