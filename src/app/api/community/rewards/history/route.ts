// ===================================================================
//  GET /api/community/rewards/history
//  آخر 20 مكافأة للمستخدم الحالي
// ===================================================================

import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getRewardHistory } from "@/lib/rewards-engine";

export const dynamic = "force-dynamic";

export async function GET(_request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "يجب تسجيل الدخول" },
        { status: 401 }
      );
    }

    const history = await getRewardHistory(user.id, 20);
    return NextResponse.json({ success: true, history });
  } catch (err) {
    console.error("[GET /api/community/rewards/history]:", err);
    return NextResponse.json(
      { error: "تعذّر جلب السجلّ" },
      { status: 500 }
    );
  }
}
