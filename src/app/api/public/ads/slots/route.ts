// ===================================================================
//  /api/public/ads/slots — موضع إعلاني عمومي (بدون مصادقة)
//  - GET ?position=HEADER|SIDEBAR_TOP|SIDEBAR_BOTTOM|IN_FEED|FOOTER|LEFT|RIGHT
//  - يبحث عن AdSlot نشط ضمن فترة الصلاحية، بأعلى أولوية
//  - يُزيّد عدّاد الظهور (views) في كل استدعاء
//  - يُرجع بيانات المساحة (نوع + محتوى + رابط) للعرض من قبل AdPlacement
// ===================================================================

import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

const VALID_POSITIONS = new Set([
  "HEADER",
  "SIDEBAR_TOP",
  "SIDEBAR_BOTTOM",
  "IN_FEED",
  "FOOTER",
  "LEFT",
  "RIGHT",
]);

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const position = (url.searchParams.get("position") ?? "").toUpperCase();
    if (!position || !VALID_POSITIONS.has(position)) {
      return NextResponse.json(
        { error: "موضع إعلاني غير صالح" },
        { status: 400 }
      );
    }

    const now = new Date();
    // نختار أعلى أولوية، نشط، ضمن فترة الصلاحية
    const slot = await db.adSlot.findFirst({
      where: {
        position,
        isActive: true,
        OR: [
          { startDate: null, endDate: null },
          { startDate: { lte: now }, endDate: null },
          { startDate: null, endDate: { gte: now } },
          { startDate: { lte: now }, endDate: { gte: now } },
        ],
      },
      orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
      select: {
        id: true,
        name: true,
        position: true,
        type: true,
        content: true,
        imageUrl: true,
        linkUrl: true,
        width: true,
        height: true,
      },
    });

    if (!slot) {
      return NextResponse.json({ slot: null });
    }

    // زيادة عدّاد الظهور — مع تفادي الانتظار لو فشل
    db.adSlot
      .update({
        where: { id: slot.id },
        data: { views: { increment: 1 } },
      })
      .catch(() => {
        // تجاهل — لا نريد أن يفشل الطلب بسبب عدّاد
      });

    return NextResponse.json({ slot });
  } catch (err) {
    console.error("[GET /api/public/ads/slots]:", err);
    // نُرجع null بلا خطأ — العميل سيُظهر placeholder بكلتا الحالتين
    return NextResponse.json({ slot: null });
  }
}
