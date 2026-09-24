// ===================================================================
//  POST /api/community/streak/check-in
//  - يُسجّل دخول اليوم، يحدّث السلسلة، ينشئ UserActivity،
//    وينشئ SmartNotification عند المحطات (7، 14، 30، 50، 100 يوم)
// ===================================================================

import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { checkInStreak } from "@/lib/streak-engine";
import { sendSmartNotification } from "@/lib/notification-engine";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(_request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "يجب تسجيل الدخول" },
        { status: 401 }
      );
    }

    const result = await checkInStreak(user.id);

    // إنشاء نشاط LOGIN (علني)
    if (!result.alreadyCheckedInToday) {
      await db.userActivity.create({
        data: {
          userId: user.id,
          type: "LOGIN",
          description: `سجّل الدخول — السلسلة الآن ${result.currentStreak} يوم`,
          metadata: JSON.stringify({
            streak: result.currentStreak,
            usedFreeze: result.usedFreeze,
            broken: result.streakBroken,
          }),
          isPublic: true,
        },
      });

      // إنشاء نشاط المحطة
      if (result.milestone) {
        await db.userActivity.create({
          data: {
            userId: user.id,
            type: "STREAK_MILESTONE",
            description: `بلغ سلسلة ${result.milestone} يوم! 🎉`,
            metadata: JSON.stringify({
              milestone: result.milestone,
              points: result.milestonePoints,
            }),
            isPublic: true,
          },
        });

        await sendSmartNotification({
          userId: user.id,
          type: "ACHIEVEMENT",
          title: `🎉 سلسلة ${result.milestone} يوم!`,
          body: `وصلت إلى ${result.milestone} يوم متتالٍ! ربحت ${result.milestonePoints} نقطة.`,
          actionUrl: "/community/hooks",
          icon: "🎉",
        });
      } else if (result.isNewRecord && result.currentStreak > 1) {
        await sendSmartNotification({
          userId: user.id,
          type: "ACHIEVEMENT",
          title: "🔥 رقم قياسي جديد!",
          body: `كسرت رقمك القياسي! سلسلتك الآن ${result.currentStreak} يوم.`,
          icon: "🔥",
        });
      }

      if (result.usedFreeze) {
        await sendSmartNotification({
          userId: user.id,
          type: "STREAK",
          title: "❄️ استُخدم freeze",
          body: "استُخدم freeze لحماية سلسلتك من الانكسار.",
          icon: "❄️",
        });
      }

      if (result.streakBroken) {
        await sendSmartNotification({
          userId: user.id,
          type: "LOSS",
          title: "💔 انكسرت سلسلتك",
          body: "لم تتمكن من تسجيل الدخول في الوقت المحدد ولم يكن لديك freeze. ابدأ سلسلة جديد اليوم!",
          icon: "💔",
        });
      }
    }

    return NextResponse.json({ success: true, ...result });
  } catch (err) {
    console.error("[POST /api/community/streak/check-in]:", err);
    return NextResponse.json(
      { error: "حدث خطأ أثناء تسجيل الدخول اليومي" },
      { status: 500 }
    );
  }
}

// GET — حالة السلسلة الحالية (للعرض فقط)
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "يجب تسجيل الدخول" },
        { status: 401 }
      );
    }

    const { getStreakStatus } = await import("@/lib/streak-engine");
    const status = await getStreakStatus(user.id);
    return NextResponse.json({ success: true, ...status });
  } catch (err) {
    console.error("[GET /api/community/streak/check-in]:", err);
    return NextResponse.json(
      { error: "تعذّر جلب حالة السلسلة" },
      { status: 500 }
    );
  }
}
