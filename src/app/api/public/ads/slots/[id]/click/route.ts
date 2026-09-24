// ===================================================================
//  /api/public/ads/slots/[id]/click — تسجيل نقرة على مساحة إعلانية
//  - POST: يُزيّد عدّاد النقرات (clicks) للمساحة المُحدَّدة
//  - بدون مصادقة (النقرة من أي زائر)
// ===================================================================

import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json(
        { error: "معرّف المساحة مطلوب" },
        { status: 400 }
      );
    }

    const existing = await db.adSlot.findUnique({
      where: { id },
      select: { id: true, isActive: true },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "المساحة غير موجودة" },
        { status: 404 }
      );
    }
    if (!existing.isActive) {
      return NextResponse.json(
        { error: "المساحة غير نشطة" },
        { status: 410 }
      );
    }

    await db.adSlot.update({
      where: { id },
      data: { clicks: { increment: 1 } },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[POST /api/public/ads/slots/[id]/click]:", err);
    return NextResponse.json(
      { error: "تعذّر تسجيل النقرة" },
      { status: 500 }
    );
  }
}
