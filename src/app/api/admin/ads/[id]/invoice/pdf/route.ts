// ===================================================================
//  POST /api/admin/ads/[id]/invoice/pdf — توليد فاتورة PDF (بديل POST)
//  نفس منطق GET /api/admin/ads/[id]/invoice لكن يدعم POST
//  مفيد للنماذج التي تحتاج لطريقة POST (للأزرار في النماذج)
// ===================================================================

import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { hasPermission } from "@/lib/roles";
import { db } from "@/lib/db";
import { renderToBuffer } from "@react-pdf/renderer";
import React from "react";
import { InvoicePdfDocument } from "@/lib/pdf/invoice-pdf";
import { generateInvoiceNumber } from "@/lib/ads-utils";

export const dynamic = "force-dynamic";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "غير مُصادَق" }, { status: 401 });
    }
    if (!hasPermission(user.role, "ad.view")) {
      return NextResponse.json({ error: "ممنوع" }, { status: 403 });
    }

    const { id } = await params;

    const ad = await db.ad.findUnique({ where: { id } });
    if (!ad) {
      return NextResponse.json({ error: "الإعلان غير موجود" }, { status: 404 });
    }
    if (ad.districtId !== user.districtId) {
      return NextResponse.json({ error: "خارج النطاق" }, { status: 403 });
    }

    const district = await db.district.findUnique({
      where: { id: ad.districtId },
      select: { name: true, city: true, region: true },
    });

    const organization = district?.name ?? "سيدي يوسف بن علي";
    const invoiceNumber = generateInvoiceNumber(ad);

    const pdfBuffer = await renderToBuffer(
      React.createElement(InvoicePdfDocument, {
        data: {
          ad: {
            id: ad.id,
            title: ad.title,
            advertiserName: ad.advertiserName,
            advertiserEmail: ad.advertiserEmail,
            advertiserPhone: ad.advertiserPhone,
            package: ad.package,
            placement: ad.placement,
            amountPaid: ad.amountPaid,
            startDate: ad.startDate,
            endDate: ad.endDate,
            createdAt: ad.createdAt,
          },
          invoiceNumber,
          organization,
          contact: {
            address: district ? `${district.city}، ${district.region}` : undefined,
            phone: "+212 5 24 00 00 00",
            email: "contact@syba-community.ma",
            ice: "0025000000000",
          },
        },
      })
    );

    return new NextResponse(pdfBuffer as unknown as BodyInit, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Length": String(pdfBuffer.length),
        "Content-Disposition": `inline; filename="invoice-${invoiceNumber}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("[POST /api/admin/ads/[id]/invoice/pdf]:", err);
    return NextResponse.json(
      { error: "حدث خطأ أثناء توليد الفاتورة" },
      { status: 500 }
    );
  }
}
