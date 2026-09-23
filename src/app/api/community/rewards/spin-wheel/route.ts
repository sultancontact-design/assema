// ===================================================================
//  POST /api/community/rewards/spin-wheel
//  يُدير العجلة، يُرجع المقطع الفائز + المكافأة
//  GET — يُرجع أهلية الدوران + المقطع الحالي
// ===================================================================

import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { canSpinWheel, spinWheel, SPIN_SEGMENTS } from "@/lib/rewards-engine";
import { sendSmartNotification } from "@/lib/notification-engine";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "يجب تسجيل الدخول" },
        { status: 401 }
      );
    }
    const eligibility = await canSpinWheel(user.id);
    return NextResponse.json({
      success: true,
      segments: SPIN_SEGMENTS,
      ...eligibility,
    });
  } catch (err) {
    console.error("[GET /api/community/rewards/spin-wheel]:", err);
    return NextResponse.json({ error: "تعذّر الفحص" }, { status: 500 });
  }
}

export async function POST(_request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "يجب تسجيل الدخول" },
        { status: 401 }
      );
    }

    const eligibility = await canSpinWheel(user.id);
    if (!eligibility.eligible) {
      return NextResponse.json(
        { error: eligibility.reason ?? "غير مؤهّل للدوران" },
        { status: 400 }
      );
    }

    const result = await spinWheel(user.id);

    // تسجيل نشاط
    await db.userActivity.create({
      data: {
        userId: user.id,
        type: "BADGE_EARNED",
        description: `أدار العجلة — حصل على ${result.segment.label}`,
        metadata: JSON.stringify({
          segment: result.segmentIndex,
          value: result.segment.value,
        }),
        isPublic: true,
      },
    });

    await sendSmartNotification({
      userId: user.id,
      type: "REWARD",
      title: `${result.segment.emoji} عجلة المكافآت`,
      body: `حصلت على ${result.segment.label}!`,
      icon: result.segment.emoji,
    });

    return NextResponse.json({ success: true, ...result });
  } catch (err) {
    console.error("[POST /api/community/rewards/spin-wheel]:", err);
    const message = err instanceof Error ? err.message : "تعذّر الدوران";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
