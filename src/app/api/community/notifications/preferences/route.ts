// ===================================================================
//  PUT /api/community/notifications/preferences
//  تحديث تفضيلات الإشعارات (opt-in/opt-out، ساعات الهدوء، الحدّ اليومي)
// ===================================================================

import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

interface PreferenceUpdate {
  streakAlerts?: boolean;
  mysteryBoxAlerts?: boolean;
  socialAlerts?: boolean;
  urgencyAlerts?: boolean;
  rewardAlerts?: boolean;
  challengeAlerts?: boolean;
  lossAlerts?: boolean;
  achievementAlerts?: boolean;
  recommendationAlerts?: boolean;
  welcomeBackAlerts?: boolean;
  quietHoursStart?: number;
  quietHoursEnd?: number;
  dailyLimit?: number;
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "يجب تسجيل الدخول" },
        { status: 401 }
      );
    }

    const body = (await request.json().catch(() => null)) as
      | PreferenceUpdate
      | null;

    if (!body) {
      return NextResponse.json({ error: "الجسم غير صالح" }, { status: 400 });
    }

    // التحقّق من النطاقات
    const quietStart = body.quietHoursStart ?? 22;
    const quietEnd = body.quietHoursEnd ?? 7;
    if (quietStart < 0 || quietStart > 23 || quietEnd < 0 || quietEnd > 23) {
      return NextResponse.json(
        { error: "ساعات الهدوء بين 0 و23" },
        { status: 400 }
      );
    }
    const limit = body.dailyLimit ?? 5;
    if (limit < 0 || limit > 50) {
      return NextResponse.json(
        { error: "الحدّ اليومي بين 0 و50" },
        { status: 400 }
      );
    }

    const data = {
      streakAlerts: body.streakAlerts ?? true,
      mysteryBoxAlerts: body.mysteryBoxAlerts ?? true,
      socialAlerts: body.socialAlerts ?? true,
      urgencyAlerts: body.urgencyAlerts ?? true,
      rewardAlerts: body.rewardAlerts ?? true,
      challengeAlerts: body.challengeAlerts ?? true,
      lossAlerts: body.lossAlerts ?? true,
      achievementAlerts: body.achievementAlerts ?? true,
      recommendationAlerts: body.recommendationAlerts ?? true,
      welcomeBackAlerts: body.welcomeBackAlerts ?? true,
      quietHoursStart: quietStart,
      quietHoursEnd: quietEnd,
      dailyLimit: limit,
    };

    const updated = await db.notificationPreference.upsert({
      where: { userId: user.id },
      update: data,
      create: { userId: user.id, ...data },
    });

    return NextResponse.json({ success: true, preferences: updated });
  } catch (err) {
    console.error("[PUT /api/community/notifications/preferences]:", err);
    return NextResponse.json(
      { error: "تعذّر تحديث التفضيلات" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "يجب تسجيل الدخول" },
        { status: 401 }
      );
    }

    const prefs = await db.notificationPreference.upsert({
      where: { userId: user.id },
      update: {},
      create: { userId: user.id },
    });

    return NextResponse.json({ success: true, preferences: prefs });
  } catch (err) {
    console.error("[GET /api/community/notifications/preferences]:", err);
    return NextResponse.json(
      { error: "تعذّر جلب التفضيلات" },
      { status: 500 }
    );
  }
}
