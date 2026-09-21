// @ts-nocheck — @react-pdf/renderer types incompatible with React 19; runtime verified
// ===================================================================
//  GET /api/fund/receipt/[id]/pdf — توليد PDF للإيصال الرقمي لمساهمة
//  - يتسلّم id كـparam
//  - يتطلّب المصادقة (المالك فقط أو TREASURER/SUPER_ADMIN)
// ===================================================================

import { NextResponse, type NextRequest } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import React from "react";
import QRCode from "qrcode";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  FundReceiptPdfDocument,
  type FundReceiptPdfData,
} from "@/lib/pdf/fund-receipt-pdf";
import {
  CONTRIBUTION_METHOD_LABELS,
  CONTRIBUTION_STATUS_LABELS,
  formatDateTimeArabic,
} from "@/lib/constants";
import type { ContributionMethod, ContributionStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "غير مُصادَق" }, { status: 401 });
    }

    const { id } = await params;
    const contribution = await db.contribution.findUnique({
      where: { id },
      include: {
        user: { select: { fullName: true } },
        family: { select: { familyName: true } },
      },
    });

    if (!contribution) {
      return NextResponse.json(
        { error: "المساهمة غير موجودة" },
        { status: 404 }
      );
    }

    // التحقّق من الصلاحية: المالك أو أمين الصندوق أو مشرف عام
    const isOwner = contribution.userId === user.id;
    const isStaff =
      user.role === "TREASURER" || user.role === "SUPER_ADMIN";
    if (!isOwner && !isStaff) {
      return NextResponse.json(
        { error: "غير مصرّح لك بعرض هذا الإيصال" },
        { status: 403 }
      );
    }

    if (!contribution.receiptNumber || !contribution.digitalReceipt) {
      return NextResponse.json(
        { error: "هذه المساهمة لا تملك إيصالاً رقمياً بعد" },
        { status: 400 }
      );
    }

    // توليد رمز QR من digitalReceipt UUID
    let qrDataUrl = "";
    try {
      qrDataUrl = await QRCode.toDataURL(contribution.digitalReceipt, {
        width: 240,
        margin: 2,
        errorCorrectionLevel: "M",
      });
    } catch {
      // تجاهل — PDF سيعمل بدون QR
    }

    const district = await db.district.findFirst({
      where: { id: contribution.districtId },
      select: { name: true },
    });
    const organization = district?.name ?? "سيدي يوسف بن علي";

    // تسمية الشهر بالعربية
    const monthDate = new Date(contribution.year, parseInt(contribution.month.slice(5, 7), 10) - 1, 1);
    const monthLabel = new Intl.DateTimeFormat("ar-MA", { month: "long" }).format(monthDate);

    const data: FundReceiptPdfData = {
      organization,
      receiptNumber: contribution.receiptNumber,
      digitalReceipt: contribution.digitalReceipt,
      amount: contribution.amount,
      contributorName: contribution.user?.fullName ?? "—",
      familyName: contribution.family?.familyName ?? "—",
      methodLabel:
        CONTRIBUTION_METHOD_LABELS[contribution.method as ContributionMethod] ??
        contribution.method,
      monthLabel,
      year: contribution.year,
      statusLabel:
        CONTRIBUTION_STATUS_LABELS[contribution.status as ContributionStatus] ??
        contribution.status,
      createdAtLabel: formatDateTimeArabic(contribution.createdAt),
      qrDataUrl,
    };

    const pdfBuffer = await renderToBuffer(
      React.createElement(FundReceiptPdfDocument, { data })
    );

    const filename = `receipt-${contribution.receiptNumber}.pdf`;
    const asciiFilename = `receipt-${contribution.receiptNumber}.pdf`;

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
    console.error("[GET /api/fund/receipt/[id]/pdf]:", err);
    return NextResponse.json(
      { error: "حدث خطأ أثناء توليد الإيصال" },
      { status: 500 }
    );
  }
}
