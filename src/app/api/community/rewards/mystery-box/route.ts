// ===================================================================
//  POST /api/community/rewards/mystery-box
//  يفتح الصندوق الغامض، يُرجع المكافأة
//  GET — يُرجع أهلية فتح الصندوق
// ===================================================================

import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { canOpenMysteryBox, openMysteryBox } from "@/lib/rewards-engine";
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
    const eligibility = await canOpenMysteryBox(user.id);
    return NextResponse.json({ success: true, ...eligibility });
  } catch (err) {
    console.error("[GET /api/community/rewards/mystery-box]:", err);
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

    const eligibility = await canOpenMysteryBox(user.id);
    if (!eligibility.eligible) {
      return NextResponse.json(
        { error: eligibility.reason ?? "غير مؤهّل لفتح الصندوق" },
        { status: 400 }
      );
    }

    const reward = await openMysteryBox(user.id);

    // تسجيل نشاط علني
    await db.userActivity.create({
      data: {
        userId: user.id,
        type: "BADGE_EARNED",
        description: `فتح الصندوق الغامض — ${reward.label}`,
        metadata: JSON.stringify({ reward: reward.type, value: reward.value }),
        isPublic: true,
      },
    });

    // إشعار ذكي
    await sendSmartNotification({
      userId: user.id,
      type: "MYSTERY_BOX",
      title: `${reward.emoji} الصندوق الغامض`,
      body: reward.label,
      icon: reward.emoji,
    });

    return NextResponse.json({ success: true, reward });
  } catch (err) {
    console.error("[POST /api/community/rewards/mystery-box]:", err);
    return NextResponse.json(
      { error: "تعذّر فتح الصندوق الغامض" },
      { status: 500 }
    );
  }
}
