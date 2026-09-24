// ===================================================================
//  GET /api/admin/analytics
//  يُرجع لقطة كاملة من KPIs وبيانات الرسوم للوحة التحليلات
//  SUPER_ADMIN فقط
// ===================================================================

import { NextResponse } from "next/server";
import { getAnalyticsSnapshot } from "@/lib/admin-lib";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "غير مُصادَق" }, { status: 401 });
  }
  if (user.role !== "SUPER_ADMIN") {
    return NextResponse.json(
      { error: "هذا القسم يتطلب صلاحية مشرف عام" },
      { status: 403 }
    );
  }

  const snapshot = await getAnalyticsSnapshot();
  return NextResponse.json(snapshot);
}
