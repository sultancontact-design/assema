// ===================================================================
//  API: /api/community/referral
//  GET  — يُرجع رمز الإحالة الحالي للمستخدم + إحصاءات
//  POST — يُنشئ رمز إحالة جديد للمستخدم (إن لم يكن لديه)
// ===================================================================

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import {
  generateReferralCode,
  getReferralStats,
} from "@/lib/referral-engine";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "يجب تسجيل الدخول للوصول لرمز الإحالة" },
        { status: 401 }
      );
    }

    const stats = await getReferralStats(user.id);

    return NextResponse.json({
      success: true,
      code: stats.code,
      stats: {
        totalReferrals: stats.totalReferrals,
        activeReferrals: stats.activeReferrals,
        pendingReferrals: stats.pendingReferrals,
        pointsEarned: stats.pointsEarned,
      },
    });
  } catch (err) {
    console.error("[GET /api/community/referral]:", err);
    return NextResponse.json(
      { error: "حدث خطأ أثناء جلب رمز الإحالة" },
      { status: 500 }
    );
  }
}

export async function POST() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "يجب تسجيل الدخول لإنشاء رمز إحالة" },
        { status: 401 }
      );
    }

    const code = await generateReferralCode(user.id);
    const stats = await getReferralStats(user.id);

    return NextResponse.json(
      {
        success: true,
        code,
        stats: {
          totalReferrals: stats.totalReferrals,
          activeReferrals: stats.activeReferrals,
          pendingReferrals: stats.pendingReferrals,
          pointsEarned: stats.pointsEarned,
        },
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("[POST /api/community/referral]:", err);
    return NextResponse.json(
      { error: "حدث خطأ أثناء توليد رمز الإحالة" },
      { status: 500 }
    );
  }
}
